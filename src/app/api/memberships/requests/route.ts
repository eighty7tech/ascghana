import { type NextRequest, NextResponse } from "next/server";
import { getStateValue, setStateValue } from "@/lib/databaseState";
import { getMemberSession, getAdminSession, isAdminRole } from "@/lib/sessionAuth";
import { getCurrentSeason, getRenewalFee, isRenewalWindow, getRenewalDueDate } from "@/lib/membershipUtils";
import { upsertMembershipRequest, refreshMemberAuthSessions } from "@/lib/membershipRequestsDb";
import { query } from "@/lib/db";
import { logAdminActivity, logMemberActivity } from "@/lib/activityLog";
import { notifyMember } from "@/lib/memberNotifications";

export type MembershipRequest = {
  id: string;
  memberId: number;
  memberName: string;
  membershipNumber: string;
  email: string;
  phone: string;
  branch: string;
  currentTier: string;
  requestedTier: string;
  requestType: "renew" | "upgrade" | "downgrade";
  amount: number;
  season: string;
  renewalWindow: boolean;
  status: "Pending" | "Approved" | "Declined";
  notes?: string;
  adminNotes?: string;
  submittedAt: string;
  processedAt?: string;
  processedBy?: string;
  memberDetails?: {
    status: string;
    joinDate: string;
    renewalDue: string;
    address?: string;
    whatsapp?: string;
    role?: string;
  };
};

type MemberRecord = {
  id: number;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  address?: string;
  membershipNumber: string;
  tier: string;
  branch: string;
  status: string;
  renewalDue?: string;
  joined?: string;
  role?: string;
};

type TierRecord = {
  name: string;
  price: number;
  renewalPrice: number;
};

async function loadRequests(): Promise<MembershipRequest[]> {
  return getStateValue<MembershipRequest[]>("membershipRequests", []);
}

async function saveRequests(requests: MembershipRequest[]) {
  await setStateValue("membershipRequests", requests);
}

async function notifyAdmin(title: string, message: string, linkHref: string) {
  try {
    await query(
      "INSERT INTO admin_notifications (title, message, type, link_href) VALUES (?, ?, 'warning', ?)",
      [title, message, linkHref]
    );
  } catch {
    /* table may not exist yet */
  }
}

function calcAmount(
  requestType: string,
  currentTier: string,
  requestedTier: string,
  tiers: TierRecord[]
): number {
  const target = tiers.find(t => t.name === requestedTier);
  const renewalFee = getRenewalFee();
  if (requestType === "renew") return renewalFee;
  if (requestType === "upgrade") {
    const from = tiers.find(t => t.name === currentTier);
    return Math.max(0, (target?.price || 0) - (from?.price || 0)) || target?.price || renewalFee;
  }
  return target?.renewalPrice || target?.price || renewalFee;
}

function buildMemberDetails(member: MemberRecord) {
  return {
    status: member.status,
    joinDate: member.joined || "",
    renewalDue: member.renewalDue || "",
    address: member.address || "",
    whatsapp: member.whatsapp || member.phone || "",
    role: member.role || "member",
  };
}

export async function GET() {
  try {
    const admin = await getAdminSession();
    const member = admin ? null : await getMemberSession();
    if (!admin && !member) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const all = await loadRequests();
    if (admin && isAdminRole(admin.role)) {
      return NextResponse.json({ requests: all });
    }
    return NextResponse.json({
      requests: all.filter(r => r.memberId === member!.id),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load requests" },
      { status: 503 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getMemberSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const { requestedTier, requestType = "renew", notes } = body as {
      requestedTier: string;
      requestType?: "renew" | "upgrade" | "downgrade";
      notes?: string;
    };

    if (!requestedTier) {
      return NextResponse.json({ error: "Target tier is required" }, { status: 400 });
    }

    const members = await getStateValue<MemberRecord[]>("members", []);
    const member = members.find(m => m.id === session.id);
    if (!member) {
      return NextResponse.json({ error: "Member record not found" }, { status: 404 });
    }

    const tiers = await getStateValue<TierRecord[]>("tiers", []);
    const tierOrder = ["Bronze", "Abusua", "Silver", "Gold", "Platinum"];
    const currentIdx = tierOrder.indexOf(member.tier);
    const targetIdx = tierOrder.indexOf(requestedTier);

    if (targetIdx === -1) {
      return NextResponse.json({ error: "Invalid membership tier selected" }, { status: 400 });
    }

    let type: "renew" | "upgrade" | "downgrade" = requestType;
    if (requestedTier === member.tier) type = "renew";
    else if (targetIdx > currentIdx) type = "upgrade";
    else if (targetIdx < currentIdx) type = "downgrade";

    const season = getCurrentSeason();
    const amount = calcAmount(type, member.tier, requestedTier, tiers);
    const requests = await loadRequests();

    const pending = requests.find(
      r => r.memberId === member.id && r.status === "Pending"
    );
    if (pending) {
      return NextResponse.json(
        { error: "You already have a pending membership request awaiting admin approval." },
        { status: 409 }
      );
    }

    const memberDetails = buildMemberDetails(member);

    const newRequest: MembershipRequest = {
      id: `MR${Date.now()}`,
      memberId: member.id,
      memberName: member.name || `${member.firstName} ${member.lastName}`,
      membershipNumber: member.membershipNumber,
      email: member.email,
      phone: member.phone || session.phone || "",
      branch: member.branch,
      currentTier: member.tier,
      requestedTier,
      requestType: type,
      amount,
      season: season.label,
      renewalWindow: isRenewalWindow(),
      status: "Pending",
      notes: notes || "",
      submittedAt: new Date().toISOString(),
      memberDetails,
    };

    requests.unshift(newRequest);
    await saveRequests(requests);

    await upsertMembershipRequest({
      ...newRequest,
      memberDetails: memberDetails as Record<string, unknown>,
    });

    await notifyAdmin(
      `Membership ${type} request — ${member.membershipNumber}`,
      `${newRequest.memberName} (${member.tier} → ${requestedTier}) · GH₵${amount.toLocaleString()} · ${member.branch} · ${member.email}`,
      "/admin/membership-requests"
    );

    await notifyMember(
      member.id,
      "Membership Request Submitted",
      `Your ${type} request for ${requestedTier} tier has been received and is pending admin review.`,
      {
        type: "info",
        icon: "fa-solid fa-crown",
        category: "renewal",
        linkHref: "/members/membership",
      }
    );

    await logMemberActivity(
      member.id,
      "membership_request_submitted",
      `${type} · ${member.tier} → ${requestedTier} · GH₵${amount.toLocaleString()}`
    );

    return NextResponse.json({ success: true, request: newRequest });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to submit request" },
      { status: 503 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await getAdminSession();
    if (!admin || !isAdminRole(admin.role)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { id, status, adminNotes } = await req.json() as {
      id: string;
      status: "Approved" | "Declined";
      adminNotes?: string;
    };

    if (!id || !["Approved", "Declined"].includes(status)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const requests = await loadRequests();
    const idx = requests.findIndex(r => r.id === id);
    if (idx === -1) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const req_item = requests[idx];
    const processedAt = new Date().toISOString();
    requests[idx] = {
      ...req_item,
      status,
      adminNotes: adminNotes || req_item.adminNotes,
      processedAt,
      processedBy: admin.name || admin.username,
    };
    await saveRequests(requests);

    await upsertMembershipRequest({
      ...requests[idx],
      memberDetails: req_item.memberDetails as Record<string, unknown> | undefined,
    });

    if (status === "Approved") {
      const members = await getStateValue<MemberRecord[]>("members", []);
      const memberIdx = members.findIndex(m => m.id === req_item.memberId);
      const renewalDue = getRenewalDueDate();

      if (memberIdx !== -1) {
        members[memberIdx] = {
          ...members[memberIdx],
          tier: req_item.requestedTier,
          status: "Active",
          renewalDue,
        };
        await setStateValue("members", members);

        await refreshMemberAuthSessions(req_item.memberId, {
          tier: req_item.requestedTier,
          status: "Active",
          renewalDue,
          firstName: members[memberIdx].firstName,
          lastName: members[memberIdx].lastName,
          name: members[memberIdx].name,
        });
      }
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const actionDetail = `${req_item.memberName} · ${req_item.requestType} · ${req_item.currentTier} → ${req_item.requestedTier} · ${status}`;

    await logAdminActivity(admin.username, `membership_${status.toLowerCase()}`, actionDetail, {
      actorName: admin.name || admin.username,
      ipAddress: ip,
      userAgent: req.headers.get("user-agent") || undefined,
    });

    await logMemberActivity(req_item.memberId, `membership_${status.toLowerCase()}`, actionDetail, {
      ipAddress: ip,
      userAgent: req.headers.get("user-agent") || undefined,
    });

    await notifyMember(
      req_item.memberId,
      status === "Approved" ? "Membership Request Approved" : "Membership Request Declined",
      status === "Approved"
        ? `Your ${req_item.requestType} to ${req_item.requestedTier} has been approved. Your membership is now active.`
        : `Your ${req_item.requestType} request was declined.${adminNotes ? ` Note: ${adminNotes}` : ""}`,
      {
        type: status === "Approved" ? "success" : "warning",
        icon: "fa-solid fa-crown",
        category: "renewal",
        linkHref: "/members/membership",
      }
    );

    return NextResponse.json({ success: true, request: requests[idx] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process request" },
      { status: 503 }
    );
  }
}
