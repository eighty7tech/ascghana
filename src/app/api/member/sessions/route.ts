import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { query } from "@/lib/db";
import { getMemberSession } from "@/lib/sessionAuth";
import { columnExists } from "@/lib/dbSchemaFix";

const SESSION_COOKIE = "asc_session";

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function GET() {
  const member = await getMemberSession();
  if (!member) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const currentHash = hashToken((await cookies()).get(SESSION_COOKIE)?.value || "");

  try {
    const hasMeta = await columnExists("auth_sessions", "device_label");
    const rows = await query(
      hasMeta
        ? `SELECT id, token_hash AS tokenHash, device_label AS deviceLabel, ip_address AS ipAddress,
                  user_agent AS userAgent, last_seen_at AS lastSeenAt, expires_at AS expiresAt, created_at AS createdAt
           FROM auth_sessions WHERE member_id = ? AND expires_at > NOW()
           ORDER BY last_seen_at DESC, created_at DESC`
        : `SELECT id, token_hash AS tokenHash, expires_at AS expiresAt, created_at AS createdAt
           FROM auth_sessions WHERE member_id = ? AND expires_at > NOW() ORDER BY created_at DESC`,
      [member.id]
    );

    const sessions = (rows as any[]).map(s => ({
      ...s,
      isCurrent: s.tokenHash === currentHash,
    }));

    return NextResponse.json({ sessions });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load sessions" },
      { status: 503 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const member = await getMemberSession();
  if (!member) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { tokenHash } = await req.json();
  if (!tokenHash) return NextResponse.json({ error: "tokenHash required" }, { status: 400 });

  const currentHash = hashToken((await cookies()).get(SESSION_COOKIE)?.value || "");
  if (tokenHash === currentHash) {
    return NextResponse.json({ error: "Cannot revoke your current session from here. Use logout." }, { status: 400 });
  }

  await query(`DELETE FROM auth_sessions WHERE token_hash = ? AND member_id = ?`, [tokenHash, member.id]);
  return NextResponse.json({ success: true });
}
