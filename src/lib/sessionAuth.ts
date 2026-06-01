import crypto from "crypto";
import { cookies } from "next/headers";
import { queryOne } from "@/lib/db";

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export type MemberSession = {
  id: number;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  membershipNumber: string;
  tier: string;
  branch: string;
  status: string;
  role?: string;
};

export type AdminSession = {
  id: string;
  username: string;
  name: string;
  role: string;
};

export async function getMemberSession(): Promise<MemberSession | null> {
  try {
    const token = (await cookies()).get("asc_session")?.value;
    if (!token) return null;
    const row = (await queryOne(
      "SELECT user_json FROM auth_sessions WHERE token_hash = ? AND expires_at > NOW()",
      [hashToken(token)]
    )) as { user_json: string } | null;
    return row ? JSON.parse(row.user_json) : null;
  } catch {
    return null;
  }
}

export async function getAdminSession(): Promise<AdminSession | null> {
  try {
    const token = (await cookies()).get("asc_admin_session")?.value;
    if (!token) return null;
    const row = (await queryOne(
      "SELECT session_json FROM admin_sessions WHERE token_hash = ? AND expires_at > NOW()",
      [hashToken(token)]
    )) as { session_json: string } | null;
    return row ? JSON.parse(row.session_json) : null;
  } catch {
    return null;
  }
}

export function isAdminRole(role: string | undefined): boolean {
  return !!role && [
    "superadmin", "super_admin", "admin", "editor", "moderator",
    "ticket_manager", "membership_officer", "event_coordinator", "events_moderator",
  ].includes(role);
}

export function isSuperAdminRole(role: string | undefined): boolean {
  return role === "superadmin" || role === "super_admin";
}
