import { type NextRequest, NextResponse } from "next/server";
import { getStateValue } from "@/lib/databaseState";
import { query } from "@/lib/db";
import { markRegistrationPaid } from "@/lib/registrationDb";

export async function POST(req: NextRequest) {
  try {
    const secretHash = req.headers.get("verif-hash") || req.headers.get("x-flutterwave-signature") || "";
    const settings = await getStateValue<any>("settings", {});
    const webhookHash = process.env.FLUTTERWAVE_WEBHOOK_HASH || settings.flutterwaveWebhookHash;

    // Verify webhook signature if configured
    if (webhookHash && secretHash !== webhookHash) {
      console.warn("[Flutterwave Webhook] Invalid hash");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = await req.json();
    const { event: eventType, data } = event;

    if (eventType === "charge.completed" && data.status === "successful") {
      const ref = data.tx_ref;
      const amount = data.amount;
      const email = data.customer?.email;

      console.log(`[Flutterwave Webhook] charge.completed ref=${ref} amount=${amount} email=${email}`);

      try {
        await query(
          "UPDATE event_bookings SET payment_status='Paid', status='Confirmed', confirmed_at=NOW() WHERE payment_ref=?",
          [ref]
        );
      } catch { /* ignore */ }

      try {
        await query(
          "UPDATE ticket_bookings SET payment_status='Paid', status='Confirmed', confirmed_at=NOW() WHERE payment_ref=?",
          [ref]
        );
      } catch { /* ignore */ }

      try {
        await query(
          "INSERT INTO admin_notifications (title, message, type, link_href) VALUES (?,?,?,?)",
          [`Payment Received (Flutterwave)`, `Ref: ${ref} · Amount: ${data.currency} ${amount} · ${email}`, "success", "/admin/analytics"]
        );
      } catch { /* ignore */ }

      try {
        await markRegistrationPaid(ref, "flutterwave", amount);
      } catch { /* ignore */ }
    }

    return NextResponse.json({ status: "success" });
  } catch (err) {
    console.error("[Flutterwave Webhook] Error:", err);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
