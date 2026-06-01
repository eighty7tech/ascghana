import { type NextRequest, NextResponse } from "next/server";
import {
  createRegistrationApplication,
  getApplicationByRef,
  markRegistrationPaid,
} from "@/lib/registrationDb";
import { getStateValue } from "@/lib/databaseState";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      tier,
      amount,
      email,
      firstName,
      lastName,
      phone,
      formData = {},
      paymentGateway,
      paymentRef,
      manualPayment,
    } = body;

    if (!tier || !email || !firstName || !lastName) {
      return NextResponse.json({ error: "tier, email, firstName, lastName required" }, { status: 400 });
    }

    const settings = await getStateValue<Record<string, unknown>>("settings", {});
    const requirePayment = settings.registrationRequirePayment !== false;

    if (requirePayment && manualPayment && !paymentRef?.trim()) {
      return NextResponse.json({ error: "Payment reference required" }, { status: 400 });
    }

    const tiers = await getStateValue<{ name: string; price: number }[]>("tiers", []);
    const tierRow = tiers.find((t) => t.name === tier);
    const payAmount = Number(amount) || tierRow?.price || 0;

    const { id, applicationRef } = await createRegistrationApplication({
      tier,
      amount: payAmount,
      email,
      firstName,
      lastName,
      phone,
      formData,
      paymentGateway,
      paymentRef: paymentRef?.trim(),
      manualPayment: !!manualPayment,
    });

    return NextResponse.json({
      success: true,
      applicationId: id,
      applicationRef,
      status: manualPayment && paymentRef ? "pending_review" : "awaiting_payment",
      amount: payAmount,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Registration failed" },
      { status: 500 }
    );
  }
}

/** Complete payment after gateway redirect */
export async function PATCH(req: NextRequest) {
  try {
    const { ref, gateway, amount } = await req.json();
    if (!ref || !gateway) {
      return NextResponse.json({ error: "ref and gateway required" }, { status: 400 });
    }
    const app = await markRegistrationPaid(ref, gateway, amount);
    if (!app) return NextResponse.json({ error: "Application not found" }, { status: 404 });
    return NextResponse.json({ success: true, application: app });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Update failed" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const ref = new URL(req.url).searchParams.get("ref");
  if (!ref) return NextResponse.json({ error: "ref required" }, { status: 400 });
  const app = await getApplicationByRef(ref);
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ application: app });
}
