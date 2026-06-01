import { type NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

async function ensureTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS event_attendance (
      id INT AUTO_INCREMENT PRIMARY KEY,
      event_id INT NOT NULL,
      member_id INT NOT NULL,
      member_name VARCHAR(200) NOT NULL,
      membership_number VARCHAR(30) NOT NULL,
      tier VARCHAR(40) DEFAULT NULL,
      checked_in_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      checked_in_by VARCHAR(100) DEFAULT NULL,
      notes TEXT,
      UNIQUE KEY unique_event_member (event_id, member_id),
      INDEX idx_event (event_id),
      INDEX idx_member (member_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

export async function GET(req: NextRequest) {
  try {
    await ensureTable();
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId");
    const memberId = searchParams.get("memberId");

    let sql = "SELECT * FROM event_attendance WHERE 1=1";
    const vals: any[] = [];
    if (eventId) { sql += " AND event_id = ?"; vals.push(eventId); }
    if (memberId) { sql += " AND member_id = ?"; vals.push(memberId); }
    sql += " ORDER BY checked_in_at DESC";

    const rows = await query(sql, vals) as any[];

    // Get counts per event if no eventId filter
    if (!eventId) {
      const counts = await query(
        "SELECT event_id, COUNT(*) as count FROM event_attendance GROUP BY event_id"
      ) as any[];
      return NextResponse.json({ attendance: rows, counts });
    }

    return NextResponse.json({ attendance: rows });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureTable();
    const { eventId, memberId, memberName, membershipNumber, tier, checkedInBy, notes } = await req.json();

    if (!eventId || !memberId) {
      return NextResponse.json({ error: "eventId and memberId required" }, { status: 400 });
    }

    // Check if already checked in
    const existing = await query(
      "SELECT id FROM event_attendance WHERE event_id = ? AND member_id = ?",
      [eventId, memberId]
    ) as any[];

    if (existing.length > 0) {
      return NextResponse.json({ error: "Member already checked in to this event", alreadyCheckedIn: true }, { status: 409 });
    }

    await query(
      `INSERT INTO event_attendance (event_id, member_id, member_name, membership_number, tier, checked_in_by, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [eventId, memberId, memberName || "Unknown", membershipNumber || "", tier || null, checkedInBy || null, notes || null]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 503 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await ensureTable();
    const { eventId, memberId } = await req.json();
    if (!eventId || !memberId) return NextResponse.json({ error: "eventId and memberId required" }, { status: 400 });
    await query("DELETE FROM event_attendance WHERE event_id = ? AND member_id = ?", [eventId, memberId]);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 503 });
  }
}
