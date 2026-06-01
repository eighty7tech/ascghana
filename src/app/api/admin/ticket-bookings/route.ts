import { type NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getStateValue, setStateValue } from "@/lib/databaseState";
import crypto from "crypto";

async function ensureTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS ticket_bookings (
      id VARCHAR(40) PRIMARY KEY,
      ticket_request_id VARCHAR(30) DEFAULT NULL,
      match_ticket_id VARCHAR(30) NOT NULL,
      member_id INT NOT NULL,
      member_name VARCHAR(200) NOT NULL,
      membership_number VARCHAR(30) NOT NULL,
      tier VARCHAR(40) NOT NULL,
      qty INT NOT NULL DEFAULT 1,
      unit_price DECIMAL(10,2) DEFAULT 0,
      total_price DECIMAL(10,2) DEFAULT 0,
      currency CHAR(3) DEFAULT 'GHS',
      payment_method VARCHAR(40) DEFAULT NULL,
      payment_ref VARCHAR(100) DEFAULT NULL,
      payment_status ENUM('Pending','Paid','Failed','Refunded') NOT NULL DEFAULT 'Pending',
      status ENUM('Pending','Confirmed','Cancelled','Used') NOT NULL DEFAULT 'Pending',
      special_request TEXT,
      admin_note TEXT,
      booked_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      confirmed_at DATETIME DEFAULT NULL,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_member (member_id),
      INDEX idx_match_ticket (match_ticket_id),
      INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

// GET: all bookings (admin) or filter by matchTicketId
export async function GET(req: NextRequest) {
  try {
    await ensureTable();
    const { searchParams } = new URL(req.url);
    const matchTicketId = searchParams.get("matchTicketId");
    const memberId = searchParams.get("memberId");

    let sql = "SELECT * FROM ticket_bookings WHERE 1=1";
    const vals: any[] = [];
    if (matchTicketId) { sql += " AND match_ticket_id = ?"; vals.push(matchTicketId); }
    if (memberId) { sql += " AND member_id = ?"; vals.push(memberId); }
    sql += " ORDER BY booked_at DESC";

    const rows = await query(sql, vals) as any[];
    return NextResponse.json({ bookings: rows });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 503 });
  }
}

// POST: create a booking and decrement ticket count
export async function POST(req: NextRequest) {
  try {
    await ensureTable();
    const body = await req.json();
    const {
      matchTicketId, memberId, memberName, membershipNumber, tier,
      qty = 1, unitPrice = 0, currency = "GHS",
      paymentMethod, paymentRef, specialRequest, ticketRequestId,
    } = body;

    if (!matchTicketId || !memberId) {
      return NextResponse.json({ error: "matchTicketId and memberId required" }, { status: 400 });
    }

    // Get current match tickets from state and decrement
    const matchTickets = await getStateValue<any[]>("matchTickets", []);
    const mtIdx = matchTickets.findIndex((t: any) => t.id === matchTicketId);
    if (mtIdx === -1) return NextResponse.json({ error: "Match ticket not found" }, { status: 404 });

    const mt = matchTickets[mtIdx];
    const available = mt.ticketsAvailable ?? mt.tickets_available ?? 0;
    if (available < qty) {
      return NextResponse.json({ error: `Only ${available} tickets available` }, { status: 409 });
    }

    // Decrement in state
    const updatedMT = { ...mt, ticketsAvailable: available - qty };
    if (available - qty === 0) updatedMT.status = "Sold Out";
    const updatedMTs = [...matchTickets];
    updatedMTs[mtIdx] = updatedMT;
    await setStateValue("matchTickets", updatedMTs);

    // Save booking
    const bookingId = "BK" + crypto.randomBytes(8).toString("hex").toUpperCase();
    const totalPrice = qty * unitPrice;

    await query(
      `INSERT INTO ticket_bookings
         (id, ticket_request_id, match_ticket_id, member_id, member_name, membership_number,
          tier, qty, unit_price, total_price, currency, payment_method, payment_ref, special_request)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [bookingId, ticketRequestId || null, matchTicketId, memberId, memberName, membershipNumber,
       tier, qty, unitPrice, totalPrice, currency, paymentMethod || null, paymentRef || null, specialRequest || null]
    );

    return NextResponse.json({ success: true, bookingId, updatedTicket: updatedMT });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 503 });
  }
}

// PATCH: update booking status
export async function PATCH(req: NextRequest) {
  try {
    await ensureTable();
    const { id, status, paymentStatus, adminNote } = await req.json();
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const fields: string[] = [];
    const vals: any[] = [];
    if (status) { fields.push("status = ?"); vals.push(status); }
    if (paymentStatus) { fields.push("payment_status = ?"); vals.push(paymentStatus); }
    if (adminNote !== undefined) { fields.push("admin_note = ?"); vals.push(adminNote); }
    if (status === "Confirmed") { fields.push("confirmed_at = NOW()"); }
    if (!fields.length) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

    vals.push(id);
    await query(`UPDATE ticket_bookings SET ${fields.join(", ")} WHERE id = ?`, vals);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 503 });
  }
}
