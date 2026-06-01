"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import { useApp, Product } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import toast from "react-hot-toast";

export default function ShopPage() {
  const router = useRouter();
  const { products, settings } = useApp();
  const { isLoggedIn, isMember } = useAuth();
  const { addItem, count: cartCount } = useCart();
  const [cat, setCat] = useState("All");
  const [viewProduct, setViewProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState("");

  const MEMBER_DISCOUNT = parseInt((settings as any).memberDiscountPct || "10") / 100 || 0.1;
  const cats = ["All", ...Array.from(new Set(products.map(p => p.category)))];
  const filtered = cat === "All"
    ? products.filter(p => p.inStock)
    : products.filter(p => p.category === cat && p.inStock);

  const discountedPrice = (price: number) =>
    isMember ? Math.round(price * (1 - MEMBER_DISCOUNT)) : price;

  const addToCart = (product: Product, size?: string) => {
    if (product.sizes.length > 0 && !size) { toast.error("Please select a size"); return; }
    addItem({
      id: product.id,
      name: product.name,
      price: discountedPrice(product.price),
      origPrice: product.price,
      size,
      icon: product.icon,
      color: product.color,
      image: product.image,
      memberDiscount: !!product.memberDiscount,
    });
    toast.success(
      isMember
        ? `Added — ${Math.round(MEMBER_DISCOUNT * 100)}% member discount applied!`
        : "Added to cart"
    );
    setViewProduct(null);
    setSelectedSize("");
  };

  /* ── Single product detail view ── */
  if (viewProduct) return (
    <main style={{ background: "var(--bg-primary)" }}>
      <Navbar />
      <div className="pt-32 pb-20 max-w-5xl mx-auto px-4 sm:px-6">
        <button
          onClick={() => { setViewProduct(null); setSelectedSize(""); }}
          className="flex items-center gap-2 text-sm mb-8 hover:gap-3 transition-all"
          style={{ color: "var(--text-muted)" }}>
          <i className="fa-solid fa-arrow-left text-xs" />Back to Shop
        </button>

        <div className="grid md:grid-cols-2 gap-10">
          {/* Product visual */}
          <div className="rounded-sm aspect-square flex items-center justify-center relative overflow-hidden"
            style={{ background: viewProduct.color }}>
            {viewProduct.image
              ? <img src={viewProduct.image} alt={viewProduct.name} className="w-full h-full object-cover" />
              : <i className={`${viewProduct.icon} text-8xl text-white/40`} />
            }
            {viewProduct.badge && (
              <span className="absolute top-4 left-4 text-xs px-3 py-1.5 font-bold rounded-sm"
                style={{ background: "rgba(198,168,75,0.9)", color: "#1A0A0A", fontFamily: "var(--font-heading)" }}>
                {viewProduct.badge}
              </span>
            )}
            {isMember && viewProduct.memberDiscount && (
              <span className="absolute top-4 right-4 text-xs px-3 py-1.5 font-bold rounded-sm"
                style={{ background: "rgba(16,185,129,0.9)", color: "white", fontFamily: "var(--font-heading)" }}>
                -{Math.round(MEMBER_DISCOUNT * 100)}% Member
              </span>
            )}
          </div>

          {/* Product details */}
          <div>
            <div className="inline-flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-sm"
              style={{ background: "rgba(239,1,7,0.1)", color: "var(--color-red)", fontFamily: "var(--font-heading)" }}>
              <button onClick={() => { setViewProduct(null); setCat(viewProduct.category); }}>
                {viewProduct.category}
              </button>
            </div>

            <h1 className="text-3xl font-black mb-2"
              style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
              {viewProduct.name}
            </h1>
            {viewProduct.description && (
              <p className="mb-4" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}>
                {viewProduct.description}
              </p>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-6">
              {isMember && viewProduct.memberDiscount ? (
                <>
                  <span className="text-3xl font-black" style={{ color: "#10B981", fontFamily: "var(--font-display)" }}>
                    GH₵{discountedPrice(viewProduct.price).toLocaleString()}
                  </span>
                  <span className="text-lg line-through" style={{ color: "var(--text-muted)" }}>
                    GH₵{viewProduct.price.toLocaleString()}
                  </span>
                  <span className="text-sm font-bold" style={{ color: "#10B981" }}>
                    Save GH₵{(viewProduct.price - discountedPrice(viewProduct.price)).toLocaleString()}
                  </span>
                </>
              ) : (
                <span className="text-3xl font-black"
                  style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
                  GH₵{viewProduct.price.toLocaleString()}
                </span>
              )}
            </div>

            {/* Sizes */}
            {viewProduct.sizes.length > 0 && (
              <div className="mb-6">
                <p className="text-xs font-bold uppercase tracking-wider mb-3"
                  style={{ color: "var(--text-muted)", fontFamily: "var(--font-heading)" }}>
                  Select Size
                </p>
                <div className="flex flex-wrap gap-2">
                  {viewProduct.sizes.map(s => (
                    <button key={s} onClick={() => setSelectedSize(s)}
                      className="px-4 py-2.5 text-sm font-bold rounded-sm transition-all"
                      style={{
                        background: selectedSize === s ? "var(--color-red)" : "var(--bg-card)",
                        color: selectedSize === s ? "white" : "var(--text-muted)",
                        border: `1px solid ${selectedSize === s ? "transparent" : "var(--border-color)"}`,
                        fontFamily: "var(--font-heading)",
                      }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>
              <i className="fa-solid fa-box mr-2 text-xs" style={{ color: "var(--color-gold)" }} />
              {viewProduct.stock} in stock
            </p>

            <button
              onClick={() => addToCart(viewProduct, selectedSize)}
              disabled={viewProduct.sizes.length > 0 && !selectedSize}
              className="w-full btn-arsenal py-4 text-base disabled:opacity-40">
              <i className="fa-solid fa-bag-shopping mr-2" />
              {viewProduct.sizes.length > 0 && !selectedSize
                ? "Select a Size First"
                : `Add to Cart — GH₵${discountedPrice(viewProduct.price).toLocaleString()}`}
            </button>

            {!isMember && viewProduct.memberDiscount && (
              <p className="text-sm mt-3 text-center" style={{ color: "var(--text-muted)" }}>
                <i className="fa-solid fa-tag mr-1 text-xs" style={{ color: "var(--color-gold)" }} />
                Members save {Math.round(MEMBER_DISCOUNT * 100)}% —{" "}
                <Link href="/auth/login" style={{ color: "var(--color-red)" }}>Login</Link> or{" "}
                <Link href="/membership/register" style={{ color: "var(--color-gold)" }}>Join</Link>
              </p>
            )}

            {/* View cart link */}
            {cartCount > 0 && (
              <Link href="/shop/cart"
                className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-sm text-sm font-bold transition-all hover:opacity-80"
                style={{ background: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-secondary)", fontFamily: "var(--font-heading)" }}>
                <i className="fa-solid fa-bag-shopping text-xs" />
                View Cart ({cartCount} item{cartCount !== 1 ? "s" : ""})
              </Link>
            )}
          </div>
        </div>

        {/* Related products */}
        {products.filter(p => p.id !== viewProduct.id && p.category === viewProduct.category && p.inStock).length > 0 && (
          <div className="mt-16 pt-8" style={{ borderTop: "1px solid var(--border-color)" }}>
            <h2 className="text-xl font-black mb-6"
              style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
              MORE IN {viewProduct.category.toUpperCase()}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {products
                .filter(p => p.id !== viewProduct.id && p.category === viewProduct.category && p.inStock)
                .slice(0, 4)
                .map(p => (
                  <button key={p.id}
                    onClick={() => { setViewProduct(p); setSelectedSize(""); window.scrollTo(0, 0); }}
                    className="product-card rounded-sm overflow-hidden text-left group">
                    <div className="h-28 flex items-center justify-center" style={{ background: p.color }}>
                      {p.image
                        ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                        : <i className={`${p.icon} text-3xl text-white/50`} />
                      }
                    </div>
                    <div className="p-3">
                      <p className="text-xs font-semibold line-clamp-1"
                        style={{ color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}>
                        {p.name}
                      </p>
                      <p className="text-xs mt-0.5 font-bold"
                        style={{ color: isMember && p.memberDiscount ? "#10B981" : "var(--text-secondary)" }}>
                        GH₵{discountedPrice(p.price).toLocaleString()}
                      </p>
                    </div>
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </main>
  );

  /* ── Main shop listing ── */
  return (
    <main style={{ background: "var(--bg-primary)" }}>
      <Navbar />
      <PageHeader pageSlug="shop" breadcrumbs={[{ label: "Shop" }]} />
      <div className="max-w-7xl mx-auto px-6 -mt-6 pb-4 text-center">
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {isMember
            ? <span style={{ color: "#10B981" }}>✓ {Math.round(MEMBER_DISCOUNT * 100)}% member discount applied automatically</span>
            : <>Members get {Math.round(MEMBER_DISCOUNT * 100)}% off.{" "}
                <Link href="/auth/login" style={{ color: "var(--color-gold)" }}>Login</Link> to unlock.</>
          }
        </p>
      </div>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">

          {/* Filters + cart button */}
          <div className="flex items-center justify-between flex-wrap gap-3 mb-8">
            <div className="flex gap-2 flex-wrap">
              {cats.map(c => (
                <button key={c} onClick={() => setCat(c)}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-sm transition-all"
                  style={{
                    background: cat === c ? "var(--color-red)" : "var(--bg-card)",
                    color: cat === c ? "white" : "var(--text-muted)",
                    border: `1px solid ${cat === c ? "transparent" : "var(--border-color)"}`,
                    fontFamily: "var(--font-heading)",
                  }}>
                  {c}
                </button>
              ))}
            </div>

            <Link href="/shop/cart"
              className="relative btn-arsenal px-4 py-2 text-sm flex items-center gap-2">
              <i className="fa-solid fa-bag-shopping" />
              Cart
              {cartCount > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-black"
                  style={{ background: "var(--color-gold)", color: "#1A0A0A" }}>
                  {cartCount}
                </span>
              )}
            </Link>
          </div>

          {/* Products grid */}
          {filtered.length === 0 ? (
            <div className="text-center py-20" style={{ color: "var(--text-muted)" }}>
              <i className="fa-solid fa-bag-shopping text-4xl mb-4 block opacity-20" />
              <p className="font-bold text-lg" style={{ fontFamily: "var(--font-heading)" }}>
                No products available
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filtered.map(product => (
                <div key={product.id}
                  className="product-card rounded-sm overflow-hidden group cursor-pointer"
                  onClick={() => { setViewProduct(product); setSelectedSize(""); window.scrollTo(0, 0); }}
                  role="button" tabIndex={0}
                  onKeyDown={e => e.key === "Enter" && setViewProduct(product)}
                  aria-label={`View ${product.name}`}>

                  <div className="h-36 flex items-center justify-center relative overflow-hidden"
                    style={{ background: product.color }}>
                    {product.image
                      ? <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      : <i className={`${product.icon} text-4xl text-white/50 group-hover:scale-110 transition-transform duration-300`} />
                    }
                    {product.badge && (
                      <span className="absolute top-2 left-2 text-[10px] px-2 py-0.5 font-bold rounded-sm"
                        style={{ background: "rgba(198,168,75,0.9)", color: "#1A0A0A", fontFamily: "var(--font-heading)" }}>
                        {product.badge}
                      </span>
                    )}
                    {isMember && product.memberDiscount && (
                      <span className="absolute top-2 right-2 text-[10px] px-1.5 py-0.5 font-bold rounded-sm"
                        style={{ background: "rgba(16,185,129,0.9)", color: "white" }}>
                        -{Math.round(MEMBER_DISCOUNT * 100)}%
                      </span>
                    )}
                  </div>

                  <div className="p-4">
                    <p className="text-xs mb-1" style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>
                      {product.category}
                    </p>
                    <p className="font-bold text-sm mb-2 line-clamp-2"
                      style={{ color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}>
                      {product.name}
                    </p>
                    <div className="flex items-center justify-between">
                      <div>
                        {isMember && product.memberDiscount ? (
                          <div>
                            <span className="font-black text-base"
                              style={{ color: "#10B981", fontFamily: "var(--font-display)" }}>
                              GH₵{discountedPrice(product.price).toLocaleString()}
                            </span>
                            <span className="text-xs line-through ml-1.5" style={{ color: "var(--text-muted)" }}>
                              GH₵{product.price.toLocaleString()}
                            </span>
                          </div>
                        ) : (
                          <span className="font-black text-base"
                            style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
                            GH₵{product.price.toLocaleString()}
                          </span>
                        )}
                      </div>
                      <div className="w-8 h-8 flex items-center justify-center rounded-sm opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ background: "rgba(239,1,7,0.15)", color: "var(--color-red)" }}>
                        <i className="fa-solid fa-eye text-xs" />
                      </div>
                    </div>
                    {product.sizes.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {product.sizes.map(s => (
                          <span key={s} className="text-[10px] px-1.5 py-0.5 rounded"
                            style={{ background: "var(--border-color)", color: "var(--text-muted)" }}>
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
