import { type NextRequest, NextResponse } from "next/server";
import { getStateValue } from "@/lib/databaseState";
import crypto from "crypto";

// ── Paystack ──────────────────────────────────────────────────────────────────
async function initiatePaystack(params: {
  email: string; amountKobo: number; ref: string;
  metadata: Record<string, any>; callbackUrl: string; secretKey: string;
}) {
  const res = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: params.email,
      amount: params.amountKobo,
      reference: params.ref,
      callback_url: params.callbackUrl,
      metadata: params.metadata,
    }),
  });
  const data = await res.json();
  if (!data.status) throw new Error(data.message || "Paystack init failed");
  return { authUrl: data.data.authorization_url, ref: data.data.reference };
}

// ── Flutterwave ────────────────────────────────────────────────────────────────
async function initiateFlutterwave(params: {
  email: string; amount: number; currency: string; ref: string;
  name: string; phone: string; redirectUrl: string; description: string;
  publicKey: string; secretKey: string;
}) {
  const res = await fetch("https://api.flutterwave.com/v3/payments", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      tx_ref: params.ref,
      amount: params.amount,
      currency: params.currency,
      redirect_url: params.redirectUrl,
      customer: { email: params.email, phonenumber: params.phone, name: params.name },
      payment_options: "card,mobilemoney,ussd",
      meta: { source: "Arsenal SC Ghana" },
      customizations: {
        title: "Arsenal SC Ghana",
        description: params.description,
        logo: "https://arsenalghana.com/images/logo/logo.png",
      },
    }),
  });
  const data = await res.json();
  if (data.status !== "success") throw new Error(data.message || "Flutterwave init failed");
  return { authUrl: data.data.link, ref: params.ref };
}

// POST /api/payment/initiate
export async function POST(req: NextRequest) {
  try {
    const {
      gateway, email, amount, currency = "GHS",
      name, phone, ref: providedRef,
      metadata = {}, description = "Arsenal SC Ghana Payment",
      callbackPath = "/membership/register/success",
    } = await req.json();

    if (!gateway || !email || !amount) {
      return NextResponse.json({ error: "gateway, email, amount required" }, { status: 400 });
    }

    const settings = await getStateValue<any>("settings", {});
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
    const ref = providedRef || `ASCGH-${Date.now()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
    const callbackUrl = `${baseUrl}${callbackPath}?ref=${ref}&gateway=${gateway}`;

    if (gateway === "paystack") {
      const secretKey = process.env.PAYSTACK_SECRET_KEY || settings.paystackSecretKey;
      if (!secretKey) return NextResponse.json({ error: "Paystack secret key not configured. Go to Settings → Payments." }, { status: 400 });

      // Paystack expects amount in kobo (smallest unit) for GHS: 1 GHS = 100 pesewas
      const amountPesewas = Math.round(amount * 100);
      const result = await initiatePaystack({
        email, amountKobo: amountPesewas, ref,
        metadata: { ...metadata, name, phone },
        callbackUrl,
        secretKey,
      });
      return NextResponse.json({ success: true, authUrl: result.authUrl, ref: result.ref, gateway: "paystack" });

    } else if (gateway === "flutterwave") {
      const secretKey = process.env.FLUTTERWAVE_SECRET_KEY || settings.flutterwaveSecretKey;
      const publicKey = process.env.FLUTTERWAVE_PUBLIC_KEY || settings.flutterwavePublicKey;
      if (!secretKey) return NextResponse.json({ error: "Flutterwave secret key not configured. Go to Settings → Payments." }, { status: 400 });

      const result = await initiateFlutterwave({
        email, amount, currency, ref, name: name || email,
        phone: phone || "", redirectUrl: callbackUrl,
        description, publicKey: publicKey || "", secretKey,
      });
      return NextResponse.json({ success: true, authUrl: result.authUrl, ref: result.ref, gateway: "flutterwave" });

    } else {
      return NextResponse.json({ error: `Gateway '${gateway}' does not support redirect payments. Use manual reference.` }, { status: 400 });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Payment initiation failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
