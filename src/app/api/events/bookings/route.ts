import { type NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getStateValue } from "@/lib/databaseState";
import crypto from "crypto";

async function ensureTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS event_bookings (
      id                VARCHAR(40)  NOT NULL PRIMARY KEY,
      event_id          INT          NOT NULL,
      event_title       VARCHAR(255) NOT NULL,
      member_id         INT          DEFAULT NULL,
      member_name       VARCHAR(200) NOT NULL,
      membership_number VARCHAR(30)  DEFAULT NULL,
      email             VARCHAR(200) NOT NULL,
      phone             VARCHAR(30)  DEFAULT NULL,
      qty               INT          NOT NULL DEFAULT 1,
      unit_price        DECIMAL(10,2) NOT NULL DEFAULT 0,
      total_price       DECIMAL(10,2) NOT NULL DEFAULT 0,
      currency          CHAR(3)      NOT NULL DEFAULT 'GHS',
      payment_method    VARCHAR(40)  DEFAULT NULL,
      payment_ref       VARCHAR(100) DEFAULT NULL,
      payment_status    ENUM('Free','Pending','Paid','Failed','Refunded') NOT NULL DEFAULT 'Pending',
      status            ENUM('Pending','Confirmed','Cancelled','Attended','No-Show') NOT NULL DEFAULT 'Pending',
      special_request   TEXT,
      admin_note        TEXT,
      confirmation_sent TINYINT(1)   NOT NULL DEFAULT 0,
      check_in_time     DATETIME     DEFAULT NULL,
      booked_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      confirmed_at      DATETIME     DEFAULT NULL,
      updated_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_event   (event_id),
      INDEX idx_member  (member_id),
      INDEX idx_status  (status),
      INDEX idx_booked  (booked_at DESC)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

async function sendBookingEmail(booking: any, event: any, settings: any) {
  const smtpHost = process.env.SMTP_HOST || settings?.smtpHost;
  const smtpUser = process.env.SMTP_USER || settings?.smtpUser;
  const smtpPass = process.env.SMTP_PASS || settings?.smtpPass;
  const fromName = settings?.newsletterFromName || "Arsenal SC Ghana";
  const fromEmail = settings?.newsletterFromEmail || smtpUser;
  const siteName = settings?.siteName || "Arsenal Supporters Club Ghana";

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.log(`[EventBooking] Email not sent (no SMTP): ${booking.email}`);
    return;
  }

  try {
    const nodemailer = (await import("nodemailer")).default;
    const transporter = nodemailer.createTransport({
      host: smtpHost, port: parseInt(settings?.smtpPort || "587"),
      secure: false, auth: { user: smtpUser, pass: smtpPass },
    });

    const dateStr = event?.date
      ? new Date(event.date).toLocaleDateString("en-GB", { weekday:"long", day:"numeric", month:"long", year:"numeric" })
      : "TBC";

    // Email to booker
    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: booking.email,
      subject: `Event Booking Confirmed — ${booking.event_title}`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#0F0D13;color:#fff;border-radius:8px;overflow:hidden">
          <div style="background:#EF0107;padding:20px 24px;text-align:center">
            <h1 style="margin:0;font-size:20px;letter-spacing:2px;font-weight:900">${siteName.toUpperCase()}</h1>
            <p style="margin:4px 0 0;font-size:12px;opacity:0.8">Event Booking Confirmation</p>
          </div>
          <div style="padding:28px 24px">
            <h2 style="margin:0 0 16px;font-size:18px;font-weight:900">${booking.event_title}</h2>
            <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px">
              <tr><td style="padding:6px 0;color:rgba(255,255,255,0.5);width:40%">Booking ID</td><td style="padding:6px 0;font-weight:700;color:#C6A84B">${booking.id}</td></tr>
              <tr><td style="padding:6px 0;color:rgba(255,255,255,0.5)">Name</td><td style="padding:6px 0">${booking.member_name}</td></tr>
              <tr><td style="padding:6px 0;color:rgba(255,255,255,0.5)">Date</td><td style="padding:6px 0">${dateStr}</td></tr>
              <tr><td style="padding:6px 0;color:rgba(255,255,255,0.5)">Venue</td><td style="padding:6px 0">${event?.venue || "TBC"}</td></tr>
              <tr><td style="padding:6px 0;color:rgba(255,255,255,0.5)">Qty</td><td style="padding:6px 0">${booking.qty} ticket${booking.qty > 1 ? "s" : ""}</td></tr>
              <tr><td style="padding:6px 0;color:rgba(255,255,255,0.5)">Total</td><td style="padding:6px 0;font-weight:700">${booking.total_price > 0 ? `${booking.currency} ${booking.total_price}` : "Free"}</td></tr>
              <tr><td style="padding:6px 0;color:rgba(255,255,255,0.5)">Status</td><td style="padding:6px 0;color:#10B981;font-weight:700">${booking.status}</td></tr>
            </table>
            <p style="font-size:12px;color:rgba(255,255,255,0.45);margin-top:16px">Keep this email as your booking reference. You may be asked to show this at the event.</p>
          </div>
          <div style="padding:14px 24px;background:#1C1829;text-align:center;font-size:11px;color:rgba(255,255,255,0.3)">
            ${siteName} &copy; ${new Date().getFullYear()}
          </div>
        </div>
      `,
    });

    // Notification to admin
    const adminEmail = settings?.email || settings?.contactEmail || fromEmail;
    if (adminEmail && adminEmail !== booking.email) {
      await transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: adminEmail,
        subject: `New Event Booking — ${booking.event_title}`,
        html: `<p><strong>New booking received</strong><br>
          ID: ${booking.id}<br>Name: ${booking.member_name}<br>Email: ${booking.email}<br>
          Event: ${booking.event_title}<br>Qty: ${booking.qty}<br>Status: ${booking.status}</p>`,
      }).catch(() => {});
    }

    // Mark confirmation sent
    await query("UPDATE event_bookings SET confirmation_sent = 1 WHERE id = ?", [booking.id]).catch(() => {});
  } catch (err) {
    console.error("[EventBooking] Email error:", err);
  }
}

// GET — list bookings (all or by eventId/memberId)
export async function GET(req: NextRequest) {
  try {
    await ensureTable();
    const { searchParams } = new URL(req.url);
    const eventId  = searchParams.get("eventId");
    const memberId = searchParams.get("memberId");
    const status   = searchParams.get("status");
    const limit    = Math.min(Number(searchParams.get("limit") || "200"), 500);

    let sql = "SELECT * FROM event_bookings WHERE 1=1";
    const vals: any[] = [];
    if (eventId)  { sql += " AND event_id = ?";  vals.push(eventId); }
    if (memberId) { sql += " AND member_id = ?"; vals.push(memberId); }
    if (status)   { sql += " AND status = ?";    vals.push(status); }
    sql += ` ORDER BY booked_at DESC LIMIT ${limit}`;

    const rows = await query(sql, vals) as any[];

    // Stats
    const stats = await query(
      "SELECT status, COUNT(*) as count FROM event_bookings GROUP BY status"
    ) as any[];

    return NextResponse.json({ bookings: rows, stats });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 503 });
  }
}

// POST — create booking
export async function POST(req: NextRequest) {
  try {
    await ensureTable();
    const body = await req.json();
    const {
      eventId, eventTitle, memberId, memberName, membershipNumber,
      email, phone, qty = 1, unitPrice = 0, currency = "GHS",
      paymentMethod, paymentRef, specialRequest,
    } = body;

    if (!eventId || !memberName || !email) {
      return NextResponse.json({ error: "eventId, memberName, email required" }, { status: 400 });
    }

    // Check event capacity
    const events = await getStateValue<any[]>("events", []);
    const event = events.find(e => String(e.id) === String(eventId));
    if (event && event.capacity > 0) {
      const existingCount = await query(
        "SELECT COALESCE(SUM(qty),0) as total FROM event_bookings WHERE event_id = ? AND status NOT IN ('Cancelled')",
        [eventId]
      ) as any[];
      const booked = Number(existingCount[0]?.total || 0);
      if (booked + qty > event.capacity) {
        return NextResponse.json({ error: `Only ${event.capacity - booked} spots remaining`, full: true }, { status: 409 });
      }
    }

    // Check duplicate booking
    if (memberId) {
      const dup = await query(
        "SELECT id FROM event_bookings WHERE event_id = ? AND member_id = ? AND status NOT IN ('Cancelled')",
        [eventId, memberId]
      ) as any[];
      if (dup.length > 0) {
        return NextResponse.json({ error: "You have already booked this event", alreadyBooked: true }, { status: 409 });
      }
    }

    const bookingId = "EVT-" + crypto.randomBytes(5).toString("hex").toUpperCase();
    const totalPrice = qty * unitPrice;
    const isFree = unitPrice === 0;

    await query(
      `INSERT INTO event_bookings
        (id, event_id, event_title, member_id, member_name, membership_number,
         email, phone, qty, unit_price, total_price, currency,
         payment_method, payment_ref, payment_status, status, special_request)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [bookingId, eventId, eventTitle || event?.title || "Event", memberId || null, memberName,
       membershipNumber || null, email, phone || null, qty, unitPrice, totalPrice, currency,
       paymentMethod || null, paymentRef || null,
       isFree ? "Free" : "Pending",
       isFree ? "Confirmed" : "Pending",
       specialRequest || null]
    );

    // Create admin notification
    await query(
      "INSERT INTO admin_notifications (title, message, type, link_href) VALUES (?,?,?,?)",
      [`New Event Booking`, `${memberName} booked ${qty} ticket${qty>1?"s":""} for ${eventTitle || event?.title}`, "success", "/admin/events"]
    ).catch(() => {});

    // Send confirmation email
    const settings = await getStateValue<any>("settings", {});
    const booking = { id: bookingId, event_id: eventId, event_title: eventTitle || event?.title, member_name: memberName, email, qty, total_price: totalPrice, currency, status: isFree ? "Confirmed" : "Pending", confirmation_sent: 0 };
    sendBookingEmail(booking, event, settings); // fire-and-forget

    return NextResponse.json({ success: true, bookingId, status: isFree ? "Confirmed" : "Pending" }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 503 });
  }
}

// PATCH — update booking status
export async function PATCH(req: NextRequest) {
  try {
    await ensureTable();
    const { id, status, paymentStatus, adminNote, checkIn } = await req.json();
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const fields: string[] = [];
    const vals: any[] = [];

    if (status)        { fields.push("status = ?");         vals.push(status); }
    if (paymentStatus) { fields.push("payment_status = ?"); vals.push(paymentStatus); }
    if (adminNote !== undefined) { fields.push("admin_note = ?"); vals.push(adminNote); }
    if (status === "Confirmed") fields.push("confirmed_at = NOW()");
    if (checkIn) fields.push("check_in_time = NOW()");

    if (!fields.length) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

    vals.push(id);
    await query(`UPDATE event_bookings SET ${fields.join(", ")} WHERE id = ?`, vals);

    // If confirming, send email
    if (status === "Confirmed") {
      const rows = await query("SELECT * FROM event_bookings WHERE id = ?", [id]) as any[];
      if (rows[0]) {
        const settings = await getStateValue<any>("settings", {});
        const events = await getStateValue<any[]>("events", []);
        const event = events.find(e => String(e.id) === String(rows[0].event_id));
        sendBookingEmail(rows[0], event, settings); // fire-and-forget
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 503 });
  }
}

// DELETE — cancel/delete booking
export async function DELETE(req: NextRequest) {
  try {
    await ensureTable();
    const { id, hardDelete } = await req.json();
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    if (hardDelete) {
      await query("DELETE FROM event_bookings WHERE id = ?", [id]);
    } else {
      await query("UPDATE event_bookings SET status = 'Cancelled' WHERE id = ?", [id]);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 503 });
  }
}
