import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { query, queryOne } from "@/lib/db";
import { logAdminActivity, logMemberActivity } from "@/lib/activityLog";
import { notifyMember } from "@/lib/memberNotifications";

const SESSION_COOKIE = "asc_session";
function hashToken(t: string) { return require("crypto").createHash("sha256").update(t).digest("hex"); }

async function ensureTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS member_deletion_requests (
      id INT AUTO_INCREMENT PRIMARY KEY,
      member_id INT NOT NULL,
      member_name VARCHAR(200) NOT NULL,
      membership_number VARCHAR(30) NOT NULL,
      reason TEXT,
      status ENUM('Pending','Approved','Declined') NOT NULL DEFAULT 'Pending',
      admin_note TEXT,
      requested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      processed_at DATETIME DEFAULT NULL,
      processed_by VARCHAR(100) DEFAULT NULL,
      INDEX idx_status (status),
      INDEX idx_member (member_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

// GET: list all deletion requests (admin)
export async function GET() {
  try {
    await ensureTable();
    const rows = await query(
      "SELECT * FROM member_deletion_requests ORDER BY requested_at DESC"
    ) as any[];
    return NextResponse.json({ requests: rows });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 503 });
  }
}

// POST: member submits a deletion request
export async function POST(req: NextRequest) {
  try {
    await ensureTable();
    const token = (await cookies()).get(SESSION_COOKIE)?.value;
    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const sessionRow = await queryOne(
      "SELECT user_json FROM auth_sessions WHERE token_hash = ? AND expires_at > NOW()",
      [hashToken(token)]
    ) as { user_json: string } | null;
    if (!sessionRow) return NextResponse.json({ error: "Session expired" }, { status: 401 });

    const user = JSON.parse(sessionRow.user_json);
    const { reason } = await req.json();

    // Check for existing pending request
    const existing = await queryOne(
      "SELECT id FROM member_deletion_requests WHERE member_id = ? AND status = 'Pending'",
      [user.id]
    ) as any;
    if (existing) {
      return NextResponse.json({ error: "You already have a pending deletion request" }, { status: 409 });
    }

    await query(
      "INSERT INTO member_deletion_requests (member_id, member_name, membership_number, reason) VALUES (?, ?, ?, ?)",
      [user.id, user.name, user.membershipNumber, reason || null]
    );

    return NextResponse.json({ success: true, message: "Deletion request submitted. Admin will process it shortly." });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 503 });
  }
}

// PATCH: admin processes a deletion request
export async function PATCH(req: NextRequest) {
  try {
    await ensureTable();
    const { id, status, adminNote, adminUsername } = await req.json();
    if (!id || !status) return NextResponse.json({ error: "id and status required" }, { status: 400 });

    const row = (await queryOne(
      "SELECT member_id, member_name, membership_number FROM member_deletion_requests WHERE id = ?",
      [id]
    )) as { member_id: number; member_name: string; membership_number: string } | null;

    await query(
      "UPDATE member_deletion_requests SET status = ?, admin_note = ?, processed_at = NOW(), processed_by = ? WHERE id = ?",
      [status, adminNote || null, adminUsername || "admin", id]
    );

    if (row?.member_id) {
      const detail = `${row.member_name} (#${row.membership_number}) · ${status}`;
      await logAdminActivity(adminUsername || "admin", "deletion_request_processed", detail);
      await logMemberActivity(row.member_id, "deletion_request_processed", detail);
      await notifyMember(
        row.member_id,
        status === "Approved" ? "Account Deletion Approved" : "Account Deletion Declined",
        status === "Approved"
          ? "Your account deletion request has been approved by admin."
          : `Your account deletion request was declined.${adminNote ? ` ${adminNote}` : ""}`,
        {
          type: status === "Approved" ? "warning" : "info",
          icon: "fa-solid fa-user-xmark",
          category: "account",
          linkHref: "/members/profile",
        }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 503 });
  }
}
