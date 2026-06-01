import { query } from "@/lib/db";
import { tableExists } from "@/lib/dbSchemaFix";

export type MemberNotificationType = "info" | "success" | "warning" | "danger";

export async function ensureMemberNotificationsTable(): Promise<void> {
  await query(`
    CREATE TABLE IF NOT EXISTS member_notifications (
      id          BIGINT AUTO_INCREMENT PRIMARY KEY,
      member_id   BIGINT       NOT NULL,
      title       VARCHAR(200) NOT NULL,
      message     TEXT         NOT NULL,
      type        ENUM('info','success','warning','danger') NOT NULL DEFAULT 'info',
      icon        VARCHAR(80)  DEFAULT 'fa-solid fa-bell',
      category    VARCHAR(40)  DEFAULT 'system',
      is_read     TINYINT(1)   NOT NULL DEFAULT 0,
      link_href   VARCHAR(500) DEFAULT NULL,
      created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_member  (member_id),
      INDEX idx_read    (is_read),
      INDEX idx_created (created_at DESC)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

export async function notifyMember(
  memberId: number,
  title: string,
  message: string,
  opts?: {
    type?: MemberNotificationType;
    icon?: string;
    category?: string;
    linkHref?: string;
  }
): Promise<void> {
  try {
    await ensureMemberNotificationsTable();
    await query(
      `INSERT INTO member_notifications (member_id, title, message, type, icon, category, link_href)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        memberId,
        title,
        message,
        opts?.type || "info",
        opts?.icon || "fa-solid fa-bell",
        opts?.category || "system",
        opts?.linkHref || null,
      ]
    );
  } catch {
    /* non-fatal */
  }
}

export async function resolveMemberId(raw: string | number | undefined): Promise<number | null> {
  const n = Number(raw);
  if (Number.isFinite(n) && n > 0) return n;
  return null;
}
