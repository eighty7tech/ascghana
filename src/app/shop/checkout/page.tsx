"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import toast from "react-hot-toast";

type Step = "details" | "payment" | "confirm";
type PayMethod = "paystack" | "mtn" | "telecel" | "at" | "bank" | "cash";

declare global { interface Window { PaystackPop: any; } }

function StepBadge({ n, label, active, done }: { n: number; label: string; active: boolean; done: boolean }) {
  return (
    <div className={`flex items-center gap-2 ${active ? "" : "opacity-40"}`}>
      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
        style={{ background: done ? "#10B981" : active ? "var(--color-red)" : "rgba(255,255,255,0.1)", color: "white", fontFamily: "var(--font-heading)" }}>
        {done ? <i className="fa-solid fa-check text-[10px]" /> : n}
      </div>
      <span className="text-sm font-bold hidden sm:block" style={{ fontFamily: "var(--font-heading)", color: active ? "var(--text-primary)" : "var(--text-muted)" }}>{label}</span>
    </div>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const { settings } = useApp();
  const { user, isLoggedIn, isMember } = useAuth();
  const { items, total, count, clearCart } = useCart();
  const s = settings as any;

  const [step, setStep] = useState<Step>("details");
  const [processing, setProcessing] = useState(false);
  const [orderRef, setOrderRef] = useState("");

  // Customer details
  const [name,    setName]    = useState(user ? `${(user as any).firstName||""} ${(user as any).lastName||""}`.trim() : "");
  const [email,   setEmail]   = useState((user as any)?.email || "");
  const [phone,   setPhone]   = useState((user as any)?.phone || "");
  const [address, setAddress] = useState("");
  const [city,    setCity]    = useState("Accra");
  const [country, setCountry] = useState("Ghana");
  const [notes,   setNotes]   = useState("");

  // Payment
  const [payMethod, setPayMethod] = useState<PayMethod>(s.activeGateway || "paystack");
  const [momoNum,   setMomoNum]   = useState("");

  // Shipping
  const SHIPPING = 0; // Free or calculate
  const grandTotal = total + SHIPPING;

  useEffect(() => {
    if (items.length === 0 && step !== "confirm") router.replace("/shop/cart");
  }, [items, step]);

  const validateDetails = () => {
    if (!name.trim())  { toast.error("Full name is required"); return false; }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) { toast.error("Valid email required"); return false; }
    if (!phone.trim()) { toast.error("Phone number is required"); return false; }
    return true;
  };

  // Create order record first
  const createOrder = async () => {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: name, customerEmail: email, customerPhone: phone,
        memberId: isLoggedIn ? (user as any)?.id : null,
        items, subtotal: total, discount: 0, shipping: SHIPPING, total: grandTotal,
        currency: "GHS", paymentMethod: payMethod,
        shippingAddress: { address, city, country },
        notes,
      }),
    });
    const d = await res.json();
    if (!d.success) throw new Error(d.error || "Failed to create order");
    return d.orderRef as string;
  };

  // ── Paystack ──
  const payWithPaystack = async (ref: string) => {
    await new Promise<void>((resolve, reject) => {
      if (!window.PaystackPop) { reject(new Error("Paystack not loaded")); return; }
      const handler = window.PaystackPop.setup({
        key:    s.paystackPublicKey,
        email,
        amount: Math.round(grandTotal * 100), // pesewas
        currency: "GHS",
        ref,
        metadata: { orderRef: ref, name, phone },
        onSuccess: async (tx: any) => {
          await fetch("/api/orders", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderRef: ref, paymentRef: tx.reference, paymentStatus: "paid" }),
          });
          resolve();
        },
        onCancel: () => reject(new Error("Payment cancelled")),
      });
      handler.openIframe();
    });
  };

  // ── MoMo / Direct ──
  const payWithMomo = async (ref: string) => {
    const momoNumbers: Record<string, string> = {
      mtn: s.mtnNumber, telecel: s.telecelNumber, at: s.atNumber,
    };
    const num = momoNumbers[payMethod] || s.momoNumber || "";
    toast(`Send GH₵${grandTotal.toLocaleString()} to ${num}. Use "${ref}" as reference. We'll confirm payment within 2 hours.`, { duration: 8000 });
    await fetch("/api/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderRef: ref, paymentStatus: "pending" }),
    });
  };

  const handlePlaceOrder = async () => {
    if (!validateDetails()) return;
    setProcessing(true);
    try {
      const ref = await createOrder();
      setOrderRef(ref);

      if (payMethod === "paystack") {
        if (!s.paystackPublicKey) { toast.error("Paystack is not configured. Choose another payment method."); setProcessing(false); return; }
        // Load Paystack script
        if (!window.PaystackPop) {
          await new Promise<void>((res, rej) => {
            const sc = document.createElement("script");
            sc.src = "https://js.paystack.co/v1/inline.js";
            sc.onload = () => res(); sc.onerror = () => rej();
            document.head.appendChild(sc);
          });
        }
        await payWithPaystack(ref);
        toast.success("Payment successful!");
      } else if (["mtn","telecel","at"].includes(payMethod)) {
        await payWithMomo(ref);
      } else if (payMethod === "bank") {
        toast(`Please transfer GH₵${grandTotal.toLocaleString()} to:\nBank: ${s.bankName}\nAccount: ${s.bankAccount}\nName: ${s.bankAccountName}\nRef: ${ref}`, { duration: 10000 });
        await fetch("/api/orders", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderRef: ref, paymentStatus: "pending" }),
        });
      } else {
        toast(`Cash payment selected. Bring GH₵${grandTotal.toLocaleString()} in-person. Order ref: ${ref}`, { duration: 8000 });
        await fetch("/api/orders", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderRef: ref, paymentStatus: "pending" }),
        });
      }

      clearCart();
      setStep("confirm");
    } catch (e: any) {
      if (e.message !== "Payment cancelled") toast.error(e.message || "Order failed");
    } finally {
      setProcessing(false);
    }
  };

  // ── Confirmation ──
  if (step === "confirm") return (
    <main style={{ background: "var(--bg-primary)" }}>
      <Navbar />
      <div className="pt-40 pb-20 max-w-xl mx-auto px-6 text-center">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ background: "rgba(16,185,129,0.15)", border: "2px solid #10B981" }}>
          <i className="fa-solid fa-check text-3xl" style={{ color: "#10B981" }} />
        </div>
        <h1 className="text-3xl font-black mb-2" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>ORDER PLACED!</h1>
        <p className="mb-2" style={{ color: "var(--text-muted)" }}>Thank you, {name.split(" ")[0]}! Your order has been received.</p>
        <div className="inline-block px-5 py-2.5 rounded-sm mb-6 font-mono font-bold text-lg"
          style={{ background: "rgba(239,1,7,0.08)", border: "1px solid rgba(239,1,7,0.2)", color: "var(--color-red)" }}>
          {orderRef}
        </div>
        <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>
          A confirmation has been sent to <strong style={{ color: "var(--text-primary)" }}>{email}</strong>.
          Keep your order reference safe.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link href="/shop" className="btn-arsenal px-6 py-3 inline-flex items-center gap-2">
            <i className="fa-solid fa-bag-shopping" />Continue Shopping
          </Link>
          {isLoggedIn && (
            <Link href="/members/dashboard" className="px-6 py-3 rounded-sm inline-flex items-center gap-2 font-bold"
              style={{ background: "var(--border-color)", border: "1px solid var(--border-color)", color: "var(--text-secondary)", fontFamily: "var(--font-heading)" }}>
              <i className="fa-solid fa-user" />My Dashboard
            </Link>
          )}
        </div>
      </div>
      <Footer />
    </main>
  );

  const PAY_METHODS: { key: PayMethod; label: string; icon: string; color: string; desc: string }[] = [
    { key:"paystack", label:"Card / Paystack", icon:"fa-credit-card", color:"#00C3F7", desc:"Visa, Mastercard, Bank transfer via Paystack" },
    { key:"mtn",      label:"MTN MoMo",        icon:"fa-mobile-screen-button", color:"#FFCC00", desc:`Send to ${s.mtnNumber||"MTN number not configured"}` },
    { key:"telecel",  label:"Telecel Cash",     icon:"fa-mobile-screen-button", color:"#EF0107", desc:`Send to ${s.telecelNumber||"Telecel number not configured"}` },
    { key:"at",       label:"AirtelTigo Cash",  icon:"fa-mobile-screen-button", color:"#FF6B00", desc:`Send to ${s.atNumber||"AT number not configured"}` },
    { key:"bank",     label:"Bank Transfer",    icon:"fa-building-columns",     color:"#10B981", desc:`${s.bankName||"GCB Bank"} · ${s.bankAccount||"N/A"}` },
    { key:"cash",     label:"Cash / In-Person", icon:"fa-money-bill-wave",      color:"#6B7280", desc:"Pay at our office or any club event" },
  ];

  return (
    <main style={{ background: "var(--bg-primary)" }}>
      <Navbar />

      {/* Header */}
      <section className="pt-36 pb-8" style={{ background: "linear-gradient(135deg,var(--bg-primary),var(--bg-secondary))" }}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm mb-3 text-xs font-bold uppercase tracking-widest"
            style={{ background: "rgba(239,1,7,0.1)", border: "1px solid rgba(239,1,7,0.25)", color: "var(--color-red)", fontFamily: "var(--font-heading)" }}>
            <i className="fa-solid fa-lock" />Secure Checkout
          </div>
          <h1 className="text-4xl font-black mb-6" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>CHECKOUT</h1>
          {/* Steps */}
          <div className="flex items-center gap-4">
            <StepBadge n={1} label="Your Details" active={(step as string)==="details"} done={["payment","confirm"].includes(step)} />
            <div className="h-px flex-1 max-w-[60px]" style={{ background: "var(--border-color)" }} />
            <StepBadge n={2} label="Payment"      active={(step as string)==="payment"} done={(step as string)==="confirm"} />
            <div className="h-px flex-1 max-w-[60px]" style={{ background: "var(--border-color)" }} />
            <StepBadge n={3} label="Confirm"      active={(step as string)==="confirm"} done={false} />
          </div>
        </div>
      </section>

      <section className="pb-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid lg:grid-cols-[1fr_340px] gap-8">
            {/* Left column */}
            <div className="space-y-6">
              {/* ── Step 1: Details ── */}
              {step === "details" && (
                <div className="rounded-sm p-6 space-y-4" style={{ background:"var(--bg-card)", border:"1px solid var(--border-color)" }}>
                  <h2 className="text-lg font-black" style={{ fontFamily:"var(--font-display)", color:"var(--text-primary)" }}>YOUR DETAILS</h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color:"var(--text-muted)", fontFamily:"var(--font-heading)" }}>Full Name *</label>
                      <input value={name} onChange={e=>setName(e.target.value)} className="w-full px-3 py-2.5 rounded-sm text-sm"
                        style={{ background:"var(--border-subtle)", border:"1px solid var(--border-color)", color:"var(--text-primary)" }}
                        placeholder="John Mensah" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color:"var(--text-muted)", fontFamily:"var(--font-heading)" }}>Email *</label>
                      <input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full px-3 py-2.5 rounded-sm text-sm"
                        style={{ background:"var(--border-subtle)", border:"1px solid var(--border-color)", color:"var(--text-primary)" }}
                        placeholder="you@example.com" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color:"var(--text-muted)", fontFamily:"var(--font-heading)" }}>Phone / WhatsApp *</label>
                    <input value={phone} onChange={e=>setPhone(e.target.value)} className="w-full px-3 py-2.5 rounded-sm text-sm"
                      style={{ background:"var(--border-subtle)", border:"1px solid var(--border-color)", color:"var(--text-primary)" }}
                      placeholder="0241234567" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color:"var(--text-muted)", fontFamily:"var(--font-heading)" }}>Delivery Address</label>
                    <input value={address} onChange={e=>setAddress(e.target.value)} className="w-full px-3 py-2.5 rounded-sm text-sm"
                      style={{ background:"var(--border-subtle)", border:"1px solid var(--border-color)", color:"var(--text-primary)" }}
                      placeholder="Street address (for delivery)" />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color:"var(--text-muted)", fontFamily:"var(--font-heading)" }}>City</label>
                      <input value={city} onChange={e=>setCity(e.target.value)} className="w-full px-3 py-2.5 rounded-sm text-sm"
                        style={{ background:"var(--border-subtle)", border:"1px solid var(--border-color)", color:"var(--text-primary)" }} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color:"var(--text-muted)", fontFamily:"var(--font-heading)" }}>Country</label>
                      <input value={country} onChange={e=>setCountry(e.target.value)} className="w-full px-3 py-2.5 rounded-sm text-sm"
                        style={{ background:"var(--border-subtle)", border:"1px solid var(--border-color)", color:"var(--text-primary)" }} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color:"var(--text-muted)", fontFamily:"var(--font-heading)" }}>Order Notes (optional)</label>
                    <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={3} className="w-full px-3 py-2.5 rounded-sm text-sm resize-none"
                      style={{ background:"var(--border-subtle)", border:"1px solid var(--border-color)", color:"var(--text-primary)" }}
                      placeholder="Any special instructions…" />
                  </div>
                  <button onClick={() => { if (validateDetails()) setStep("payment"); }}
                    className="btn-arsenal w-full py-3.5 flex items-center justify-center gap-2 text-base">
                    Continue to Payment <i className="fa-solid fa-arrow-right" />
                  </button>
                </div>
              )}

              {/* ── Step 2: Payment ── */}
              {step === "payment" && (
                <div className="rounded-sm p-6 space-y-4" style={{ background:"var(--bg-card)", border:"1px solid var(--border-color)" }}>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setStep("details")} className="text-sm flex items-center gap-1.5 transition-colors hover:text-white" style={{ color:"var(--text-muted)" }}>
                      <i className="fa-solid fa-arrow-left text-xs" />Back
                    </button>
                    <h2 className="text-lg font-black" style={{ fontFamily:"var(--font-display)", color:"var(--text-primary)" }}>PAYMENT METHOD</h2>
                  </div>

                  <div className="space-y-2">
                    {PAY_METHODS.map(pm => (
                      <label key={pm.key} className="flex items-center gap-4 p-4 rounded-sm cursor-pointer transition-all"
                        style={{
                          background: payMethod===pm.key ? `${pm.color}0f` : "rgba(255,255,255,0.02)",
                          border: `1px solid ${payMethod===pm.key ? pm.color+"50" : "var(--border-color)"}`,
                        }}>
                        <input type="radio" name="paymethod" value={pm.key} checked={payMethod===pm.key}
                          onChange={() => setPayMethod(pm.key)} className="accent-red-500 mt-0.5" />
                        <div className="w-9 h-9 rounded-sm flex items-center justify-center flex-shrink-0"
                          style={{ background:`${pm.color}15` }}>
                          <i className={`fa-solid ${pm.icon} text-base`} style={{ color:pm.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm" style={{ color:"var(--text-primary)", fontFamily:"var(--font-heading)" }}>{pm.label}</p>
                          <p className="text-xs mt-0.5 truncate" style={{ color:"var(--text-muted)" }}>{pm.desc}</p>
                        </div>
                        {payMethod===pm.key && <i className="fa-solid fa-check text-sm flex-shrink-0" style={{ color:pm.color }} />}
                      </label>
                    ))}
                  </div>

                  {["mtn","telecel","at"].includes(payMethod) && (
                    <div className="p-4 rounded-sm" style={{ background:"rgba(255,193,7,0.06)", border:"1px solid rgba(255,193,7,0.2)" }}>
                      <p className="text-xs font-bold mb-2" style={{ color:"#FFCC00", fontFamily:"var(--font-heading)" }}>
                        <i className="fa-solid fa-info-circle mr-1" />HOW TO PAY VIA MOBILE MONEY
                      </p>
                      <ol className="text-xs space-y-1" style={{ color:"var(--text-muted)" }}>
                        <li>1. Click "Place Order" below to get your order reference</li>
                        <li>2. Dial {payMethod==="mtn"?"*170#":payMethod==="telecel"?"*110#":"*185#"} and send to the number shown</li>
                        <li>3. Use your <strong>order reference</strong> as the payment note</li>
                        <li>4. We'll confirm and fulfil your order within 2–4 hours</li>
                      </ol>
                    </div>
                  )}

                  {payMethod === "bank" && s.bankAccount && (
                    <div className="p-4 rounded-sm space-y-1.5 text-sm" style={{ background:"rgba(16,185,129,0.06)", border:"1px solid rgba(16,185,129,0.2)" }}>
                      <p className="font-bold text-xs uppercase tracking-wider mb-2" style={{ color:"#10B981", fontFamily:"var(--font-heading)" }}>Bank Transfer Details</p>
                      <p style={{ color:"var(--text-secondary)" }}>Bank: <strong style={{ color:"var(--text-primary)" }}>{s.bankName}</strong></p>
                      <p style={{ color:"var(--text-secondary)" }}>Account: <strong style={{ color:"var(--text-primary)" }}>{s.bankAccount}</strong></p>
                      <p style={{ color:"var(--text-secondary)" }}>Name: <strong style={{ color:"var(--text-primary)" }}>{s.bankAccountName}</strong></p>
                      <p className="text-xs mt-2" style={{ color:"var(--text-muted)" }}>Your order reference will be your payment reference</p>
                    </div>
                  )}

                  <button onClick={handlePlaceOrder} disabled={processing}
                    className="btn-arsenal w-full py-3.5 flex items-center justify-center gap-2 text-base disabled:opacity-60">
                    {processing
                      ? <><i className="fa-solid fa-spinner fa-spin" />Processing…</>
                      : <><i className="fa-solid fa-lock text-sm" />Place Order — GH₵{grandTotal.toLocaleString()}</>}
                  </button>
                  <p className="text-xs text-center" style={{ color:"var(--text-muted)" }}>
                    <i className="fa-solid fa-shield-halved mr-1" />Secure checkout. Your data is protected.
                  </p>
                </div>
              )}
            </div>

            {/* Right: Order summary */}
            <div className="lg:sticky lg:top-6 h-fit rounded-sm p-5 space-y-4" style={{ background:"var(--bg-card)", border:"1px solid var(--border-color)" }}>
              <h3 className="font-black text-sm uppercase tracking-wider" style={{ fontFamily:"var(--font-heading)", color:"var(--text-primary)" }}>
                Order Summary ({count} items)
              </h3>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {items.map(item => (
                  <div key={`${item.id}-${item.size||""}`} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-sm flex items-center justify-center flex-shrink-0 text-lg"
                      style={{ background: item.color||"rgba(239,1,7,0.1)" }}>
                      {item.image
                        ? <img src={item.image} className="w-full h-full object-cover rounded-sm" alt="" />
                        : <i className={item.icon||"fa-solid fa-shirt"} style={{ color:"white" }} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate" style={{ color:"var(--text-primary)" }}>{item.name}</p>
                      {item.size && <p className="text-[10px]" style={{ color:"var(--text-muted)" }}>Size: {item.size}</p>}
                      <p className="text-[10px]" style={{ color:"var(--text-muted)" }}>×{item.qty}</p>
                    </div>
                    <p className="text-sm font-bold flex-shrink-0" style={{ color:"var(--text-primary)" }}>GH₵{(item.price*item.qty).toLocaleString()}</p>
                  </div>
                ))}
              </div>
              <div className="border-t pt-3 space-y-1.5 text-sm" style={{ borderColor:"var(--border-color)" }}>
                <div className="flex justify-between" style={{ color:"var(--text-muted)" }}>
                  <span>Subtotal</span><span>GH₵{total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between" style={{ color:"var(--text-muted)" }}>
                  <span>Shipping</span><span>{SHIPPING ? `GH₵${SHIPPING}` : "Free"}</span>
                </div>
              </div>
              <div className="flex justify-between items-center font-black border-t pt-3" style={{ borderColor:"var(--border-color)" }}>
                <span style={{ color:"var(--text-primary)" }}>Total</span>
                <span className="text-xl" style={{ fontFamily:"var(--font-display)", color:"var(--text-primary)" }}>GH₵{grandTotal.toLocaleString()}</span>
              </div>
              {step !== "details" && (
                <div className="pt-2 text-xs space-y-1" style={{ color:"var(--text-muted)", borderTop:"1px solid var(--border-color)" }}>
                  <p><i className="fa-solid fa-user mr-1.5" />{name}</p>
                  <p><i className="fa-solid fa-envelope mr-1.5" />{email}</p>
                  <p><i className="fa-solid fa-phone mr-1.5" />{phone}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
