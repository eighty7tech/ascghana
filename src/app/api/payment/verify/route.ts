import { type NextRequest, NextResponse } from "next/server";
import { getStateValue } from "@/lib/databaseState";

async function verifyPaystack(ref: string, secretKey: string) {
  const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(ref)}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  });
  const data = await res.json();
  if (!data.status) throw new Error(data.message || "Verification failed");
  const tx = data.data;
  return {
    status: tx.status === "success" ? "success" : "failed",
    amount: tx.amount / 100, // back to GHS
    currency: tx.currency,
    email: tx.customer?.email,
    ref: tx.reference,
    paidAt: tx.paid_at,
    channel: tx.channel,
    metadata: tx.metadata,
  };
}

async function verifyFlutterwave(ref: string, secretKey: string) {
  const res = await fetch(`https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${encodeURIComponent(ref)}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  });
  const data = await res.json();
  if (data.status !== "success") throw new Error(data.message || "Verification failed");
  const tx = data.data;
  return {
    status: tx.status === "successful" ? "success" : "failed",
    amount: tx.amount,
    currency: tx.currency,
    email: tx.customer?.email,
    ref: tx.tx_ref,
    paidAt: tx.created_at,
    channel: tx.payment_type,
    metadata: tx.meta,
  };
}

// GET /api/payment/verify?ref=xxx&gateway=paystack
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ref = searchParams.get("ref");
    const gateway = searchParams.get("gateway");

    if (!ref || !gateway) {
      return NextResponse.json({ error: "ref and gateway required" }, { status: 400 });
    }

    const settings = await getStateValue<any>("settings", {});

    let result;
    if (gateway === "paystack") {
      const secretKey = process.env.PAYSTACK_SECRET_KEY || settings.paystackSecretKey;
      if (!secretKey) return NextResponse.json({ error: "Paystack not configured" }, { status: 400 });
      result = await verifyPaystack(ref, secretKey);
    } else if (gateway === "flutterwave") {
      const secretKey = process.env.FLUTTERWAVE_SECRET_KEY || settings.flutterwaveSecretKey;
      if (!secretKey) return NextResponse.json({ error: "Flutterwave not configured" }, { status: 400 });
      result = await verifyFlutterwave(ref, secretKey);
    } else {
      return NextResponse.json({ error: "Unsupported gateway" }, { status: 400 });
    }

    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Verification failed" }, { status: 502 });
  }
}
