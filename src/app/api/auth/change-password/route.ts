import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { query, queryOne } from "@/lib/db";
import { getStateValue, setStateValue } from "@/lib/databaseState";

const SESSION_COOKIE = "asc_session";

function hashToken(token: string) {
  return require("crypto").createHash("sha256").update(token).digest("hex");
}

export async function POST(req: NextRequest) {
  try {
    const token = (await cookies()).get(SESSION_COOKIE)?.value;
    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const tokenHash = hashToken(token);
    const sessionRow = await queryOne(
      "SELECT user_json FROM auth_sessions WHERE token_hash = ? AND expires_at > NOW()",
      [tokenHash]
    ) as { user_json: string } | null;

    if (!sessionRow) return NextResponse.json({ error: "Session expired" }, { status: 401 });

    const sessionUser = JSON.parse(sessionRow.user_json);
    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Current and new password required" }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 });
    }

    // Get member from state
    const members = await getStateValue<any[]>("members", []);
    const memberIdx = members.findIndex((m: any) => m.id === sessionUser.id);

    if (memberIdx === -1) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const member = members[memberIdx];
    const storedPw = member.password || "";

    // Verify current password
    const pwOk = storedPw ? currentPassword === storedPw : currentPassword.length >= 8;
    if (!pwOk) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 403 });
    }

    // Update password
    const updatedMember = { ...member, password: newPassword };
    const updatedMembers = [...members];
    updatedMembers[memberIdx] = updatedMember;
    await setStateValue("members", updatedMembers);

    // Log activity
    try {
      await query(
        `INSERT INTO member_activity_log (member_id, action, detail) VALUES (?, 'change_password', 'Password changed via member portal')`,
        [sessionUser.id]
      );
    } catch { /* table may not exist yet */ }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 503 });
  }
}
