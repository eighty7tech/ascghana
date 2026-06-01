"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import toast from "react-hot-toast";

export default function CartPage() {
  const router = useRouter();
  const { settings } = useApp();
  const { isLoggedIn, isMember } = useAuth();
  const { items, updateQty, removeItem, clearCart, total, count } = useCart();
  const MEMBER_DISCOUNT = parseInt((settings as any).memberDiscountPct || "10") / 100;

  if (items.length === 0) return (
    <main style={{ background: "var(--bg-primary)" }}>
      <Navbar />
      <div className="pt-40 pb-20 max-w-3xl mx-auto px-6 text-center">
        <i className="fa-solid fa-cart-shopping text-6xl mb-6 block opacity-20" style={{ color: "var(--text-primary)" }} />
        <h1 className="text-3xl font-black mb-3" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>YOUR CART IS EMPTY</h1>
        <p className="mb-8" style={{ color: "var(--text-muted)" }}>Browse our shop and add items to get started.</p>
        <Link href="/shop" className="btn-arsenal px-8 py-3 inline-flex items-center gap-2">
          <i className="fa-solid fa-bag-shopping" />Browse Shop
        </Link>
      </div>
      <Footer />
    </main>
  );

  return (
    <main style={{ background: "var(--bg-primary)" }}>
      <Navbar />

      {/* Header */}
      <section className="pt-36 pb-8" style={{ background: "linear-gradient(135deg,var(--bg-primary),var(--bg-secondary))" }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm mb-3 text-xs font-bold uppercase tracking-widest"
            style={{ background: "rgba(239,1,7,0.1)", border: "1px solid rgba(239,1,7,0.25)", color: "var(--color-red)", fontFamily: "var(--font-heading)" }}>
            <i className="fa-solid fa-cart-shopping" />Shopping Cart
          </div>
          <h1 className="text-4xl font-black" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
            YOUR CART <span className="text-2xl font-bold opacity-50">({count} items)</span>
          </h1>
        </div>
      </section>

      <section className="pb-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-[1fr_360px] gap-8">
            {/* Items */}
            <div className="space-y-3">
              {items.map(item => (
                <div key={`${item.id}-${item.size || ""}`}
                  className="flex gap-4 p-4 rounded-sm"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
                  {/* Product icon/image */}
                  <div className="w-20 h-20 rounded-sm flex items-center justify-center flex-shrink-0 text-3xl"
                    style={{ background: item.color || "rgba(239,1,7,0.1)" }}>
                    {item.image
                      ? <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-sm" />
                      : <i className={item.icon || "fa-solid fa-shirt"} style={{ color: "white" }} />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate" style={{ color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}>{item.name}</p>
                    {item.size && <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Size: {item.size}</p>}
                    {isMember && item.memberDiscount && (
                      <p className="text-xs mt-0.5" style={{ color: "#10B981" }}>
                        <i className="fa-solid fa-tag mr-1" />{Math.round(MEMBER_DISCOUNT * 100)}% member discount applied
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-3">
                      {/* Qty */}
                      <div className="flex items-center gap-2 rounded-sm overflow-hidden" style={{ border: "1px solid var(--border-color)" }}>
                        <button onClick={() => updateQty(item.id, item.size, item.qty - 1)}
                          className="w-8 h-8 flex items-center justify-center transition-colors hover:bg-white/10"
                          style={{ color: "var(--text-muted)" }}>
                          <i className="fa-solid fa-minus text-xs" />
                        </button>
                        <span className="w-8 text-center text-sm font-bold" style={{ color: "var(--text-primary)" }}>{item.qty}</span>
                        <button onClick={() => updateQty(item.id, item.size, item.qty + 1)}
                          className="w-8 h-8 flex items-center justify-center transition-colors hover:bg-white/10"
                          style={{ color: "var(--text-muted)" }}>
                          <i className="fa-solid fa-plus text-xs" />
                        </button>
                      </div>
                      <button onClick={() => { removeItem(item.id, item.size); toast.success("Item removed"); }}
                        className="text-xs transition-colors hover:text-red-400"
                        style={{ color: "var(--text-muted)" }}>
                        <i className="fa-solid fa-trash mr-1" />Remove
                      </button>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    {item.origPrice !== item.price && (
                      <p className="text-xs line-through" style={{ color: "var(--text-muted)" }}>
                        GH₵{(item.origPrice * item.qty).toLocaleString()}
                      </p>
                    )}
                    <p className="font-black text-lg" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
                      GH₵{(item.price * item.qty).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}

              <div className="flex justify-between items-center pt-2">
                <Link href="/shop" className="text-sm flex items-center gap-1.5 transition-colors hover:text-white" style={{ color: "var(--text-muted)" }}>
                  <i className="fa-solid fa-arrow-left text-xs" />Continue Shopping
                </Link>
                <button onClick={() => { clearCart(); toast.success("Cart cleared"); }}
                  className="text-sm transition-colors hover:text-red-400"
                  style={{ color: "var(--text-muted)" }}>
                  <i className="fa-solid fa-trash mr-1" />Clear Cart
                </button>
              </div>
            </div>

            {/* Summary */}
            <div className="lg:sticky lg:top-6 h-fit">
              <div className="rounded-sm p-6 space-y-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
                <h2 className="text-lg font-black" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>ORDER SUMMARY</h2>

                <div className="space-y-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                  <div className="flex justify-between">
                    <span>Subtotal ({count} items)</span>
                    <span>GH₵{total.toLocaleString()}</span>
                  </div>
                  {isMember && (
                    <div className="flex justify-between" style={{ color: "#10B981" }}>
                      <span><i className="fa-solid fa-crown mr-1" />Member discount</span>
                      <span>Applied ✓</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs" style={{ color: "var(--text-muted)" }}>
                    <span>Shipping</span>
                    <span>Calculated at checkout</span>
                  </div>
                </div>

                <div className="border-t pt-4" style={{ borderColor: "var(--border-color)" }}>
                  <div className="flex justify-between items-center">
                    <span className="font-bold" style={{ color: "var(--text-primary)" }}>Total</span>
                    <span className="text-2xl font-black" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
                      GH₵{total.toLocaleString()}
                    </span>
                  </div>
                </div>

                <button onClick={() => router.push("/shop/checkout")}
                  className="btn-arsenal w-full py-3.5 text-base flex items-center justify-center gap-2">
                  <i className="fa-solid fa-lock text-sm" />Proceed to Checkout
                </button>

                {!isLoggedIn && (
                  <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
                    <Link href="/auth/login" className="underline" style={{ color: "var(--color-red)" }}>Sign in</Link> for member pricing
                  </p>
                )}

                {/* Accepted payments */}
                <div className="flex items-center justify-center gap-2 pt-2 flex-wrap">
                  {["fa-cc-visa","fa-cc-mastercard"].map(i => (
                    <i key={i} className={`fab ${i} text-2xl`} style={{ color: "var(--text-muted)" }} />
                  ))}
                  <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: "#00C3F720", color: "#00C3F7", fontFamily: "var(--font-heading)" }}>Paystack</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: "#FFCC0020", color: "#FFCC00", fontFamily: "var(--font-heading)" }}>MoMo</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
