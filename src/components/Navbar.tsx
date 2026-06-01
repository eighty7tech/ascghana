"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useCart } from "@/context/CartContext";

const NAV = [
  { label: "Home",       href: "/" },
  { label: "About",      href: "/about",
    sub: [
      { label: "About Us",         href: "/about",              icon: "fa-solid fa-shield-halved" },
      { label: "Executive Committee", href: "/about/exco",      icon: "fa-solid fa-users" },
      { label: "History",          href: "/history",            icon: "fa-solid fa-book-open" },
      { label: "Supporters Groups",href: "/supporters-groups",  icon: "fa-solid fa-people-group" },
    ]
  },
  { label: "Membership", href: "/membership",
    sub: [
      { label: "Join Now",         href: "/membership/apply",   icon: "fa-solid fa-id-card" },
      { label: "Membership Plans", href: "/membership",         icon: "fa-solid fa-crown" },
      { label: "Renew",            href: "/membership/renew",   icon: "fa-solid fa-rotate" },
    ]
  },
  { label: "Matches",    href: "/match-viewings",
    sub: [
      { label: "Match Viewings",   href: "/match-viewings",     icon: "fa-solid fa-tv" },
      { label: "Fixtures",         href: "/season-stats",       icon: "fa-solid fa-futbol" },
      { label: "Ticket Requests",  href: "/members/tickets",    icon: "fa-solid fa-ticket" },
    ]
  },
  { label: "Events",     href: "/events" },
  { label: "News",       href: "/news" },
  { label: "Community",  href: "/community",
    sub: [
      { label: "Projects",         href: "/community",          icon: "fa-solid fa-hand-holding-heart" },
      { label: "Gallery",          href: "/gallery",            icon: "fa-solid fa-images" },
      { label: "Fan Wall",         href: "/fan-wall",           icon: "fa-solid fa-fire-flame-curved" },
      { label: "Donate",           href: "/members/donate",     icon: "fa-solid fa-heart" },
    ]
  },
  { label: "Shop",       href: "/shop" },
  { label: "Contact",    href: "/contact" },
];

export default function Navbar() {
  const { settings } = useApp();
  const { user, isLoggedIn, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { count: cartCount } = useCart();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDD, setActiveDD] = useState<string | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const ddTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const openDD = (label: string) => {
    if (ddTimer.current) clearTimeout(ddTimer.current);
    setActiveDD(label);
  };
  const closeDD = () => {
    ddTimer.current = setTimeout(() => setActiveDD(null), 120);
  };

  return (
    <>
      <a href="#main-content" className="skip-link">Skip to main content</a>

      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: scrolled
            ? "rgba(10,5,8,0.97)"
            : "linear-gradient(180deg, rgba(10,5,8,0.85) 0%, rgba(10,5,8,0.4) 100%)",
          backdropFilter: "blur(20px)",
          borderBottom: scrolled ? "1px solid rgba(239,1,7,0.2)" : "1px solid rgba(255,255,255,0.05)",
          boxShadow: scrolled ? "0 4px 24px rgba(0,0,0,0.4)" : "none",
        }}
      >
        {/* Top bar */}
        <div
          className="hidden md:block text-xs py-1.5 border-b"
          style={{ background: "rgba(239,1,7,0.08)", borderColor: "rgba(239,1,7,0.15)" }}
        >
          <div className="container flex items-center justify-between">
            <span style={{ color: "rgba(255,255,255,0.45)", fontFamily: "var(--font-heading)", letterSpacing: "0.1em" }}>
              <i className="fa-solid fa-shield-halved mr-1.5" style={{ color: "var(--gold)" }} />
              VICTORIA CONCORDIA CRESCIT — OFFICIAL ARSENAL SUPPORTERS CLUB GHANA
            </span>
            <div className="flex items-center gap-4">
              {settings.socialLinks?.filter((s: any) => s.url).slice(0, 4).map((s: any) => (
                <a key={s.platform} href={s.url} target="_blank" rel="noopener noreferrer"
                  className="transition-opacity hover:opacity-100"
                  style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>
                  <i className={s.icon || "fa-solid fa-globe"} />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Main nav */}
        <div className="container">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 flex-shrink-0">
              {settings.logoUrl ? (
                <img src={settings.logoUrl} alt="ASC Ghana" className="h-10 w-auto object-contain" />
              ) : (
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "var(--red)", boxShadow: "0 0 16px rgba(239,1,7,0.4)" }}>
                  <i className="fa-solid fa-shield-halved text-white text-lg" />
                </div>
              )}
              <div className="hidden sm:block">
                <p className="text-sm font-black text-white leading-none tracking-wide"
                  style={{ fontFamily: "var(--font-display)" }}>
                  {settings.siteName?.toUpperCase() || "ASC GHANA"}
                </p>
                <p className="text-[9px] leading-none mt-0.5 tracking-widest uppercase"
                  style={{ color: "var(--gold)", fontFamily: "var(--font-heading)" }}>
                  Official Supporters Club
                </p>
              </div>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-0.5">
              {NAV.map(item => (
                <div key={item.label} className="relative"
                  onMouseEnter={() => item.sub && openDD(item.label)}
                  onMouseLeave={() => item.sub && closeDD()}>
                  {item.sub ? (
                    <button
                      className="flex items-center gap-1 px-3 py-2 text-xs font-bold uppercase tracking-wider rounded transition-all"
                      style={{
                        fontFamily: "var(--font-heading)",
                        color: pathname === item.href || pathname.startsWith(item.href + "/")
                          ? "#fff" : "rgba(255,255,255,0.65)",
                        background: activeDD === item.label ? "rgba(239,1,7,0.12)" : "transparent",
                      }}
                    >
                      {item.label}
                      <i className={`fa-solid fa-chevron-down text-[8px] transition-transform ${activeDD === item.label ? "rotate-180" : ""}`} />
                    </button>
                  ) : (
                    <Link href={item.href}
                      className="flex items-center px-3 py-2 text-xs font-bold uppercase tracking-wider rounded transition-all"
                      style={{
                        fontFamily: "var(--font-heading)",
                        color: pathname === item.href ? "#fff" : "rgba(255,255,255,0.65)",
                        background: pathname === item.href ? "rgba(239,1,7,0.12)" : "transparent",
                      }}>
                      {item.label}
                    </Link>
                  )}

                  <AnimatePresence>
                    {item.sub && activeDD === item.label && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full left-0 min-w-[200px] rounded overflow-hidden shadow-2xl z-50"
                        style={{
                          background: "rgba(10,5,8,0.98)",
                          border: "1px solid rgba(239,1,7,0.25)",
                          borderTop: "2px solid var(--red)",
                          marginTop: 4,
                          backdropFilter: "blur(20px)",
                        }}
                        onMouseEnter={() => openDD(item.label)}
                        onMouseLeave={closeDD}
                      >
                        {item.sub.map(s => (
                          <Link key={s.href} href={s.href}
                            onClick={() => setActiveDD(null)}
                            className="flex items-center gap-3 px-4 py-2.5 text-xs transition-all"
                            style={{ color: "rgba(255,255,255,0.7)", fontFamily: "var(--font-body)" }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(239,1,7,0.1)"; (e.currentTarget as HTMLElement).style.color = "#fff"; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.7)"; }}
                          >
                            <i className={`${s.icon} text-[10px] w-3`} style={{ color: "var(--red)" }} />
                            {s.label}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              <button onClick={toggleTheme}
                className="hidden sm:flex w-8 h-8 items-center justify-center rounded transition-colors"
                style={{ color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.06)" }}>
                <i className={`fa-solid ${theme === "dark" ? "fa-sun" : "fa-moon"} text-xs`} />
              </button>

              <Link href="/shop/cart"
                className="relative hidden sm:flex w-8 h-8 items-center justify-center rounded transition-colors"
                style={{ color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.06)" }}>
                <i className="fa-solid fa-bag-shopping text-xs" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black"
                    style={{ background: "var(--red)", color: "#fff" }}>
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </Link>

              {isLoggedIn && user ? (
                <div className="hidden sm:flex items-center gap-2">
                  <Link href="/members/dashboard"
                    className="flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all"
                    style={{ background: "rgba(198,168,75,0.12)", border: "1px solid rgba(198,168,75,0.25)", color: "var(--gold)", fontFamily: "var(--font-heading)" }}>
                    <i className="fa-solid fa-gauge text-[10px]" />Dashboard
                  </Link>
                  <button onClick={logout}
                    className="w-8 h-8 flex items-center justify-center rounded transition-colors"
                    style={{ color: "rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.06)" }}>
                    <i className="fa-solid fa-right-from-bracket text-xs" />
                  </button>
                </div>
              ) : (
                <Link href="/auth/login"
                  className="hidden sm:flex btn-arsenal text-xs px-4"
                  style={{ height: 36 }}>
                  <i className="fa-solid fa-right-to-bracket" />Login
                </Link>
              )}

              {/* Mobile hamburger */}
              <button onClick={() => setMobileOpen(v => !v)}
                className="lg:hidden w-9 h-9 flex flex-col items-center justify-center gap-1.5 rounded"
                style={{ background: "rgba(255,255,255,0.06)" }}>
                {[0, 1, 2].map(i => (
                  <span key={i} className="block h-0.5 rounded-full transition-all duration-300"
                    style={{
                      width: 20, background: "rgba(255,255,255,0.8)",
                      transform: mobileOpen
                        ? i === 0 ? "rotate(45deg) translateY(8px)"
                        : i === 2 ? "rotate(-45deg) translateY(-8px)"
                        : "scaleX(0)"
                        : "none",
                      opacity: i === 1 && mobileOpen ? 0 : 1,
                    }} />
                ))}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)} />
            <motion.div
              className="fixed inset-y-0 left-0 z-50 w-72 flex flex-col lg:hidden overflow-hidden"
              style={{ background: "#0A0508" }}
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "rgba(239,1,7,0.15)" }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "var(--red)" }}>
                    <i className="fa-solid fa-shield-halved text-white text-sm" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-white" style={{ fontFamily: "var(--font-display)" }}>ASC GHANA</p>
                    <p className="text-[9px]" style={{ color: "var(--gold)", fontFamily: "var(--font-heading)" }}>Official Supporters Club</p>
                  </div>
                </div>
                <button onClick={() => setMobileOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded"
                  style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}>
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>

              {/* Nav links */}
              <div className="flex-1 overflow-y-auto py-3">
                {NAV.map(item => (
                  <div key={item.label}>
                    {item.sub ? (
                      <>
                        <button
                          onClick={() => setMobileExpanded(mobileExpanded === item.label ? null : item.label)}
                          className="w-full flex items-center justify-between px-5 py-3 text-sm font-bold uppercase tracking-wide"
                          style={{ color: "rgba(255,255,255,0.7)", fontFamily: "var(--font-heading)" }}>
                          {item.label}
                          <i className={`fa-solid fa-chevron-down text-[10px] transition-transform ${mobileExpanded === item.label ? "rotate-180" : ""}`} />
                        </button>
                        <AnimatePresence>
                          {mobileExpanded === item.label && (
                            <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                              className="overflow-hidden" style={{ background: "rgba(255,255,255,0.02)" }}>
                              {item.sub.map(s => (
                                <Link key={s.href} href={s.href}
                                  onClick={() => setMobileOpen(false)}
                                  className="flex items-center gap-3 pl-8 pr-5 py-2.5 text-sm"
                                  style={{ color: "rgba(255,255,255,0.55)", fontFamily: "var(--font-body)" }}>
                                  <i className={`${s.icon} text-[10px]`} style={{ color: "var(--red)" }} />
                                  {s.label}
                                </Link>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </>
                    ) : (
                      <Link href={item.href} onClick={() => setMobileOpen(false)}
                        className="flex items-center px-5 py-3 text-sm font-bold uppercase tracking-wide"
                        style={{ color: pathname === item.href ? "#fff" : "rgba(255,255,255,0.7)", fontFamily: "var(--font-heading)" }}>
                        {item.label}
                      </Link>
                    )}
                    <div style={{ height: 1, background: "rgba(255,255,255,0.04)", marginInline: 20 }} />
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="p-4 space-y-2 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                {isLoggedIn ? (
                  <Link href="/members/dashboard" onClick={() => setMobileOpen(false)}
                    className="btn-arsenal w-full text-center block text-xs" style={{ height: 40 }}>
                    <i className="fa-solid fa-gauge mr-1.5" />My Dashboard
                  </Link>
                ) : (
                  <>
                    <Link href="/auth/login" onClick={() => setMobileOpen(false)}
                      className="btn-arsenal w-full text-center block text-xs" style={{ height: 40 }}>
                      <i className="fa-solid fa-right-to-bracket mr-1.5" />Member Login
                    </Link>
                    <Link href="/membership/apply" onClick={() => setMobileOpen(false)}
                      className="btn-arsenal-outline w-full text-center block text-xs" style={{ height: 40 }}>
                      <i className="fa-solid fa-user-plus mr-1.5" />Join Now
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
