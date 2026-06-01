import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { query } from "@/lib/db";
import { getAdminSession } from "@/lib/sessionAuth";
import { columnExists } from "@/lib/dbSchemaFix";

const ADMIN_COOKIE = "asc_admin_session";

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function GET() {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Admin access required" }, { status: 401 });

  const currentHash = hashToken((await cookies()).get(ADMIN_COOKIE)?.value || "");

  try {
    const hasMeta = await columnExists("admin_sessions", "device_label");
    const adminSessions = await query(
      hasMeta
        ? `SELECT id, token_hash AS tokenHash, username, session_json AS sessionJson,
                  device_label AS deviceLabel, ip_address AS ipAddress, user_agent AS userAgent,
                  last_seen_at AS lastSeenAt, expires_at AS expiresAt, created_at AS createdAt
           FROM admin_sessions WHERE expires_at > NOW() ORDER BY last_seen_at DESC, created_at DESC`
        : `SELECT id, token_hash AS tokenHash, username, session_json AS sessionJson,
                  expires_at AS expiresAt, created_at AS createdAt
           FROM admin_sessions WHERE expires_at > NOW() ORDER BY created_at DESC`,
      []
    );

    const memberHasMeta = await columnExists("auth_sessions", "device_label");
    const memberSessions = await query(
      memberHasMeta
        ? `SELECT s.id, s.token_hash AS tokenHash, s.member_id AS memberId, s.user_json AS userJson,
                  s.device_label AS deviceLabel, s.ip_address AS ipAddress, s.user_agent AS userAgent,
                  s.last_seen_at AS lastSeenAt, s.expires_at AS expiresAt, s.created_at AS createdAt
           FROM auth_sessions s WHERE s.expires_at > NOW() ORDER BY s.last_seen_at DESC LIMIT 100`
        : `SELECT s.id, s.token_hash AS tokenHash, s.member_id AS memberId, s.user_json AS userJson,
                  s.expires_at AS expiresAt, s.created_at AS createdAt
           FROM auth_sessions s WHERE s.expires_at > NOW() ORDER BY s.created_at DESC LIMIT 100`,
      []
    );

    const admins = (adminSessions as any[]).map(s => {
      let name = s.username;
      try {
        name = JSON.parse(s.sessionJson).name || name;
      } catch {
        /* ignore */
      }
      return {
        ...s,
        name,
        isCurrent: s.tokenHash === currentHash,
        type: "admin" as const,
      };
    });

    const members = (memberSessions as any[]).map(s => {
      let user: any = {};
      try {
        user = JSON.parse(s.userJson);
      } catch {
        /* ignore */
      }
      return {
        ...s,
        name: user.name || "Member",
        membershipNumber: user.membershipNumber,
        isCurrent: false,
        type: "member" as const,
      };
    });

    return NextResponse.json({ adminSessions: admins, memberSessions: members });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load sessions" },
      { status: 503 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Admin access required" }, { status: 401 });

  const { tokenHash, type } = await req.json();
  if (!tokenHash || !["admin", "member"].includes(type)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const table = type === "admin" ? "admin_sessions" : "auth_sessions";
  await query(`DELETE FROM ${table} WHERE token_hash = ?`, [tokenHash]);
  return NextResponse.json({ success: true });
}
