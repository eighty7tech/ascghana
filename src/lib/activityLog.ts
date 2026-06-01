import { query } from "@/lib/db";
import { tableExists } from "@/lib/dbSchemaFix";

export async function logMemberActivity(
  memberId: number,
  action: string,
  detail?: string,
  meta?: { ipAddress?: string; userAgent?: string }
): Promise<void> {
  if (!(await tableExists("member_activity_log"))) return;
  try {
    await query(
      `INSERT INTO member_activity_log (member_id, action, detail, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?)`,
      [memberId, action, detail || null, meta?.ipAddress || null, meta?.userAgent || null]
    );
  } catch {
    /* non-fatal */
  }
}

export async function logAdminActivity(
  username: string,
  action: string,
  detail?: string,
  meta?: { ipAddress?: string; userAgent?: string; actorName?: string }
): Promise<void> {
  if (!(await tableExists("admin_activity_log"))) return;
  try {
    await query(
      `INSERT INTO admin_activity_log (username, actor_name, action, detail, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        username,
        meta?.actorName || username,
        action,
        detail || null,
        meta?.ipAddress || null,
        meta?.userAgent || null,
      ]
    );
  } catch {
    /* non-fatal */
  }
}
