import { type NextRequest, NextResponse } from "next/server";
import { getStateValue } from "@/lib/databaseState";
import { query } from "@/lib/db";
import { markRegistrationPaid } from "@/lib/registrationDb";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-paystack-signature") || "";

    const settings = await getStateValue<any>("settings", {});
    const secretKey = process.env.PAYSTACK_SECRET_KEY || settings.paystackSecretKey;

    if (!secretKey) {
      return NextResponse.json({ error: "Paystack not configured" }, { status: 400 });
    }

    // Verify HMAC signature
    const hash = crypto.createHmac("sha512", secretKey).update(rawBody).digest("hex");
    if (hash !== signature) {
      console.warn("[Paystack Webhook] Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(rawBody);
    const { event: eventType, data } = event;

    if (eventType === "charge.success") {
      const ref = data.reference;
      const amount = data.amount / 100;
      const email = data.customer?.email;
      const metadata = data.metadata || {};

      console.log(`[Paystack Webhook] charge.success ref=${ref} amount=${amount} email=${email}`);

      // Update event booking if ref matches
      try {
        await query(
          "UPDATE event_bookings SET payment_status='Paid', status='Confirmed', confirmed_at=NOW() WHERE payment_ref=?",
          [ref]
        );
      } catch { /* ignore if table not ready */ }

      // Update ticket booking if ref matches
      try {
        await query(
          "UPDATE ticket_bookings SET payment_status='Paid', status='Confirmed', confirmed_at=NOW() WHERE payment_ref=?",
          [ref]
        );
      } catch { /* ignore if table not ready */ }

      // Create admin notification
      try {
        await query(
          "INSERT INTO admin_notifications (title, message, type, link_href) VALUES (?,?,?,?)",
          [`Payment Received (Paystack)`, `Ref: ${ref} · Amount: GHS ${amount} · ${email}`, "success", "/admin/analytics"]
        );
      } catch { /* ignore */ }

      // If this payment is for a membership registration, mark it paid
      try {
        await markRegistrationPaid(ref, "paystack", amount);
      } catch {
        /* ignore */
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[Paystack Webhook] Error:", err);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
