import crypto from "crypto";
import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { getStateValue } from "@/lib/databaseState";
import { checkPassword } from "@/lib/authPassword";
import { ensureSessionMetadataColumns } from "@/lib/dbSchemaFix";
import { getSessionMeta } from "@/lib/sessionMeta";
import { logAdminActivity } from "@/lib/activityLog";

const ADMIN_COOKIE = "asc_admin_session";

function getFallbackAccounts() {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  if (!username || !password) return [];
  return [
    {
      id: "env-1",
      username,
      name: "Super Admin",
      password,
      role: "superadmin" as const,
      isActive: true,
    },
  ];
}

async function ensureAdminSessionTable() {
  await ensureSessionMetadataColumns();
  await query(`
    CREATE TABLE IF NOT EXISTS admin_sessions (
      id          BIGINT AUTO_INCREMENT PRIMARY KEY,
      token_hash  VARCHAR(64)  NOT NULL UNIQUE,
      username    VARCHAR(100) NOT NULL,
      session_json LONGTEXT    NOT NULL,
      expires_at  DATETIME     NOT NULL,
      created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_token   (token_hash),
      INDEX idx_expires (expires_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function GET() {
  try {
    await ensureAdminSessionTable();
    const token = (await cookies()).get(ADMIN_COOKIE)?.value;
    if (!token) return NextResponse.json({ session: null });
    const row = await queryOne(
      "SELECT session_json FROM admin_sessions WHERE token_hash = ? AND expires_at > NOW()",
      [hashToken(token)]
    ) as { session_json: string } | null;
    return NextResponse.json({ session: row ? JSON.parse(row.session_json) : null });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Admin session lookup failed" }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureAdminSessionTable();
    const { username, password } = await req.json();
    const settings = await getStateValue<any>("settings", {});
    const directAccounts = await getStateValue<any[]>("adminAccounts", []);
    const accounts = Array.isArray(settings.adminAccounts) && settings.adminAccounts.length
      ? settings.adminAccounts
      : directAccounts.length ? directAccounts : getFallbackAccounts();

    const found = accounts.find((a: any) => a.username === username && a.isActive !== false);
    if (!found || !checkPassword(password, found.password)) {
      return NextResponse.json({ success: false, error: "Invalid username or password." }, { status: 401 });
    }

    const session = {
      id: found.id,
      username: found.username,
      name: found.name,
      role: found.role,
      loggedInAt: new Date().toISOString(),
    };
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 12);
    const meta = getSessionMeta(req);

    await query(
      `INSERT INTO admin_sessions (token_hash, username, session_json, expires_at, ip_address, user_agent, device_label, last_seen_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE session_json = VALUES(session_json), expires_at = VALUES(expires_at),
         ip_address = VALUES(ip_address), user_agent = VALUES(user_agent), device_label = VALUES(device_label), last_seen_at = NOW()`,
      [hashToken(token), username, JSON.stringify(session), expires, meta.ipAddress || null, meta.userAgent, meta.deviceLabel]
    );

    await logAdminActivity(username, "admin_login", `Signed in from ${meta.deviceLabel}`, {
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      actorName: found.name,
    });
    (await cookies()).set(ADMIN_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires,
    });

    return NextResponse.json({ success: true, session });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Admin login failed" }, { status: 503 });
  }
}

export async function DELETE() {
  try {
    await ensureAdminSessionTable();
    const token = (await cookies()).get(ADMIN_COOKIE)?.value;
    if (token) await query("DELETE FROM admin_sessions WHERE token_hash = ?", [hashToken(token)]);
    (await cookies()).delete(ADMIN_COOKIE);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Admin logout failed" }, { status: 503 });
  }
}
