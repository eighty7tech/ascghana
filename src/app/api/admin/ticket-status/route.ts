import { type NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/sessionAuth";
import { logAdminActivity, logMemberActivity } from "@/lib/activityLog";
import { notifyMember, resolveMemberId } from "@/lib/memberNotifications";

export async function POST(req: NextRequest) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Admin access required" }, { status: 401 });

  try {
    const { memberId, status, match, membershipNumber, ticketId } = await req.json() as {
      memberId?: string | number;
      status: string;
      match?: string;
      membershipNumber?: string;
      ticketId?: string;
    };

    if (!status) return NextResponse.json({ error: "status required" }, { status: 400 });

    const mid = await resolveMemberId(memberId);
    const detail = `${match || "Match ticket"} · ${membershipNumber || ""} · ${status}${ticketId ? ` (#${ticketId})` : ""}`;
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();

    await logAdminActivity(admin.username, "ticket_status_change", detail, {
      actorName: admin.name,
      ipAddress: ip,
      userAgent: req.headers.get("user-agent") || undefined,
    });

    if (mid) {
      await logMemberActivity(mid, "ticket_status_change", detail, {
        ipAddress: ip,
        userAgent: req.headers.get("user-agent") || undefined,
      });

      const approved = status === "Approved" || status === "Partially Approved";
      const declined = status === "Declined";
      if (approved || declined) {
        await notifyMember(
          mid,
          approved ? "Ticket Request Update" : "Ticket Request Declined",
          approved
            ? `Your ticket request${match ? ` for ${match}` : ""} has been ${status.toLowerCase()}.`
            : `Your ticket request${match ? ` for ${match}` : ""} was declined.`,
          {
            type: approved ? "success" : "warning",
            icon: "fa-solid fa-ticket",
            category: "ticket",
            linkHref: "/members/tickets",
          }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to record ticket action" },
      { status: 503 }
    );
  }
}
