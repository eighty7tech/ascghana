import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { ensureWatchPartyTable, awardPoints } from "@/lib/featureDb";

export async function GET(req: NextRequest) {
  await ensureWatchPartyTable();
  const url = new URL(req.url);
  const eventId  = url.searchParams.get("eventId");
  const memberId = url.searchParams.get("memberId");

  try {
    if (eventId && memberId) {
      // Check if member has RSVP'd
      const rsvp = await queryOne(
        `SELECT * FROM watch_party_rsvps WHERE event_id = ? AND member_id = ?`,
        [eventId, memberId]
      );
      return NextResponse.json({ success: true, rsvp: rsvp || null });
    }

    if (eventId) {
      // All RSVPs for an event (admin view)
      const rsvps = await query(
        `SELECT * FROM watch_party_rsvps WHERE event_id = ? ORDER BY created_at ASC`,
        [eventId]
      );
      const [{ total }] = await query(
        `SELECT SUM(1 + guests) as total FROM watch_party_rsvps WHERE event_id = ?`,
        [eventId]
      ) as any[];
      const [{ checked }] = await query(
        `SELECT COUNT(*) as checked FROM watch_party_rsvps WHERE event_id = ? AND checked_in = 1`,
        [eventId]
      ) as any[];
      return NextResponse.json({ success: true, rsvps, totalAttendees: total || 0, checkedIn: checked || 0 });
    }

    if (memberId) {
      // Member's upcoming RSVPs
      const rsvps = await query(
        `SELECT r.*, e.title as event_title, e.date as event_date, e.time as event_time, e.venue as event_venue
         FROM watch_party_rsvps r
         LEFT JOIN events e ON e.id = r.event_id
         WHERE r.member_id = ?
         ORDER BY r.created_at DESC LIMIT 20`,
        [memberId]
      );
      return NextResponse.json({ success: true, rsvps });
    }

    return NextResponse.json({ error: "eventId or memberId required" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  await ensureWatchPartyTable();
  try {
    const { eventId, memberId, memberName, memberNumber, guests, notes } = await req.json();
    if (!eventId || !memberId) return NextResponse.json({ error: "eventId and memberId required" }, { status: 400 });

    await query(
      `INSERT INTO watch_party_rsvps (event_id, member_id, member_name, member_number, guests, notes)
       VALUES (?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE guests = ?, notes = ?`,
      [eventId, memberId, memberName || "Member", memberNumber || "", guests || 0, notes || null, guests || 0, notes || null]
    );

    // Award points for RSVP
    await awardPoints(memberId, 5, "watch_party_rsvp", `RSVP'd for watch party (event ${eventId})`, String(eventId));

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  await ensureWatchPartyTable();
  try {
    const { rsvpId, memberId, eventId, action } = await req.json();

    if (action === "checkin") {
      // Check in a member
      await query(
        `UPDATE watch_party_rsvps SET checked_in = 1, checked_in_at = NOW() WHERE id = ? OR (event_id = ? AND member_id = ?)`,
        [rsvpId || 0, eventId || 0, memberId || 0]
      );
      // Award attendance points
      if (memberId) {
        await awardPoints(memberId, 10, "event_attendance", `Attended watch party (event ${eventId || rsvpId})`, String(eventId || rsvpId));
      }
      return NextResponse.json({ success: true });
    }

    if (action === "cancel") {
      await query(
        `DELETE FROM watch_party_rsvps WHERE event_id = ? AND member_id = ?`,
        [eventId, memberId]
      );
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
