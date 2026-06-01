import crypto from "crypto";
import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { getStateValue } from "@/lib/databaseState";
import { canLogin } from "@/lib/membershipUtils";
import { checkPassword } from "@/lib/authPassword";
import { ensureCoreAuthSchema, touchSessionLastSeen } from "@/lib/ensureAuthSessionSchema";
import { getSessionMeta } from "@/lib/sessionMeta";
import { logMemberActivity } from "@/lib/activityLog";

const SESSION_COOKIE = "asc_session";

type MemberRecord = {
  id: number;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  membershipNumber: string;
  tier: string;
  branch: string;
  status: "Active" | "Frozen" | "Expired" | "Pending Renewal" | "Inactive";
  role?: string;
  photo?: string;
  joined?: string;
  renewalDue?: string;
  password?: string;
};

const TIER_COLORS: Record<string, string> = {
  Platinum: "#E8E8E8",
  Gold: "#C6A84B",
  Silver: "#A8A9AD",
  Bronze: "#CD7F32",
  Abusua: "#2ECC71",
};

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function toLoggedUser(member: MemberRecord) {
  return {
    id: member.id,
    name: member.name,
    firstName: member.firstName,
    lastName: member.lastName,
    email: member.email,
    phone: member.phone || "",
    membershipNumber: member.membershipNumber,
    tier: member.tier,
    tierColor: TIER_COLORS[member.tier] || "#C6A84B",
    branch: member.branch,
    status: member.status || "Active",
    role: member.role || "member",
    photo: member.photo,
    joinDate: String(member.joined || "").replace(/\D/g, "").slice(0, 4) || String(new Date().getFullYear()),
    renewalDue: member.renewalDue || "",
    two_factor_enabled: (member as any).two_factor_enabled ?? 0,
  };
}

function mergeSessionWithMember(sessionUser: Record<string, unknown>, member: MemberRecord) {
  const tierColor = TIER_COLORS[member.tier] || sessionUser.tierColor || "#C6A84B";
  return {
    ...sessionUser,
    tier: member.tier,
    tierColor,
    status: member.status || sessionUser.status || "Active",
    renewalDue: member.renewalDue ?? sessionUser.renewalDue ?? "",
    firstName: member.firstName,
    lastName: member.lastName,
    name: member.name || `${member.firstName} ${member.lastName}`,
    branch: member.branch ?? sessionUser.branch,
    email: member.email ?? sessionUser.email,
    phone: member.phone ?? sessionUser.phone ?? "",
  };
}

export async function GET() {
  try {
    await ensureCoreAuthSchema();
    const token = (await cookies()).get(SESSION_COOKIE)?.value;
    if (!token) return NextResponse.json({ user: null });

    const tokenHash = hashToken(token);
    const row = await queryOne(
      "SELECT user_json FROM auth_sessions WHERE token_hash = ? AND expires_at > NOW()",
      [tokenHash]
    ) as { user_json: string } | null;

    if (!row) return NextResponse.json({ user: null });

    await touchSessionLastSeen("auth_sessions", tokenHash);

    let user = JSON.parse(row.user_json) as Record<string, unknown>;
    const members = await getStateValue<MemberRecord[]>("members", []);
    const member = members.find(m => m.id === user.id);
    if (member) {
      const merged = mergeSessionWithMember(user, member);
      if (JSON.stringify(merged) !== JSON.stringify(user)) {
        user = merged;
        await query("UPDATE auth_sessions SET user_json = ? WHERE token_hash = ?", [
          JSON.stringify(merged),
          tokenHash,
        ]);
      }
    }

    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Auth lookup failed" }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureCoreAuthSchema();
    const { memberNumber, password } = await req.json();
    const members = await getStateValue<MemberRecord[]>("members", []);
    const member = members.find(m => m.membershipNumber === memberNumber);

    if (!member) {
      return NextResponse.json({ success: false, error: "Membership number not found. Contact the admin to register." }, { status: 401 });
    }

    if (!checkPassword(password, member.password)) {
      return NextResponse.json({ success: false, error: "Incorrect password. Please try again." }, { status: 401 });
    }

    if (!canLogin(member.status || "Active")) {
      return NextResponse.json({ success: false, error: "Your account is inactive. Please contact the membership coordinator." }, { status: 403 });
    }

    const user = toLoggedUser(member);
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
    const meta = getSessionMeta(req);
    const tokenHash = hashToken(token);

    await query(
      `INSERT INTO auth_sessions (token_hash, member_id, user_json, expires_at, ip_address, user_agent, device_label, last_seen_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE member_id = VALUES(member_id), user_json = VALUES(user_json), expires_at = VALUES(expires_at),
         ip_address = VALUES(ip_address), user_agent = VALUES(user_agent), device_label = VALUES(device_label), last_seen_at = NOW()`,
      [tokenHash, member.id, JSON.stringify(user), expires, meta.ipAddress || null, meta.userAgent, meta.deviceLabel]
    );

    await logMemberActivity(member.id, "login", `Signed in from ${meta.deviceLabel}`, meta);

    (await cookies()).set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires,
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Login failed" }, { status: 503 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await ensureCoreAuthSchema();
    const token = (await cookies()).get(SESSION_COOKIE)?.value;
    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const tokenHash = hashToken(token);
    const row = await queryOne(
      "SELECT user_json FROM auth_sessions WHERE token_hash = ? AND expires_at > NOW()",
      [tokenHash]
    ) as { user_json: string } | null;
    if (!row) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const user = { ...JSON.parse(row.user_json), ...(await req.json()) };
    await query("UPDATE auth_sessions SET user_json = ? WHERE token_hash = ?", [JSON.stringify(user), tokenHash]);

    return NextResponse.json({ success: true, user });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Session update failed" }, { status: 503 });
  }
}

export async function DELETE() {
  try {
    await ensureCoreAuthSchema();
    const token = (await cookies()).get(SESSION_COOKIE)?.value;
    if (token) await query("DELETE FROM auth_sessions WHERE token_hash = ?", [hashToken(token)]);
    (await cookies()).delete(SESSION_COOKIE);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Logout failed" }, { status: 503 });
  }
}
