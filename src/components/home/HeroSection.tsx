"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";

interface Slide {
  id: number; title: string; subtitle: string; description: string;
  cta: string; ctaLink: string; bg: string; imageUrl?: string;
}
interface Stat { label: string; value: string }
interface Props {
  slides: Slide[];
  stats: Stat[];
  siteName: string;
  tagline: string;
  memberCount: number;
}

const DEFAULT_SLIDES: Slide[] = [
  {
    id: 1, title: "WE ARE THE GHANA GOONERS",
    subtitle: "Official Arsenal Supporters Club Ghana",
    description: "Formed in 2003. Officially approved by Arsenal FC in 2008. Join 2,400+ passionate Gunners across all regions of Ghana.",
    cta: "Join The Family", ctaLink: "/membership/apply",
    bg: "from-red-950 via-[#0A0508] to-red-900",
  },
  {
    id: 2, title: "VICTORIA CONCORDIA CRESCIT",
    subtitle: "Victory Through Harmony — Ghana Chapter",
    description: "Together as one community, we celebrate Arsenal's victories and stand strong in challenging times. One club, one family.",
    cta: "Our Story", ctaLink: "/about",
    bg: "from-[#0A0508] via-red-950 to-[#0C1C3D]",
  },
  {
    id: 3, title: "MATCHDAY IN GHANA",
    subtitle: "Watch Arsenal Live With Fellow Gooners",
    description: "Experience the thrill of every Arsenal match at our official watch parties across Ghana. Big screens, great atmosphere.",
    cta: "Find a Viewing", ctaLink: "/match-viewings",
    bg: "from-[#0C1C3D] via-[#0A0508] to-red-950",
  },
];

export default function HeroSection({ slides, stats, siteName, tagline, memberCount }: Props) {
  const { isLoggedIn } = useAuth();
  const list = slides?.length ? slides : DEFAULT_SLIDES;
  const [current, setCurrent] = useState(0);
  const [progress, setProgress] = useState(0);
  const [auto, setAuto] = useState(true);
  const DURATION = 6000;

  const next = useCallback(() => {
    setCurrent(c => (c + 1) % list.length);
    setProgress(0);
  }, [list.length]);

  useEffect(() => {
    if (!auto) return;
    const id = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { next(); return 0; }
        return p + (100 / (DURATION / 50));
      });
    }, 50);
    return () => clearInterval(id);
  }, [auto, next]);

  const slide = list[current];

  return (
    <section className="relative w-full overflow-hidden" style={{ minHeight: "100vh" }}>
      {/* Background */}
      <AnimatePresence mode="wait">
        <motion.div key={current} className="absolute inset-0"
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: [0.23, 1, 0.32, 1] }}>
          {slide.imageUrl ? (
            <div className="absolute inset-0"
              style={{ backgroundImage: `url(${slide.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center top" }}>
              <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(10,5,8,0.85) 0%, rgba(10,5,8,0.5) 100%)" }} />
              <div className="absolute inset-0" style={{ background: "linear-gradient(0deg, rgba(10,5,8,0.98) 0%, transparent 60%)" }} />
            </div>
          ) : (
            <div className={`absolute inset-0 bg-gradient-to-br ${slide.bg}`}>
              <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 60% 50% at 30% 40%, rgba(239,1,7,0.2) 0%, transparent 70%)" }} />
              <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 40% 40% at 75% 60%, rgba(12,28,61,0.4) 0%, transparent 60%)" }} />
            </div>
          )}
          {/* Diagonal pattern */}
          <div className="absolute inset-0" style={{
            backgroundImage: "repeating-linear-gradient(-55deg, rgba(239,1,7,0.03) 0px, rgba(239,1,7,0.03) 1px, transparent 1px, transparent 60px)",
            opacity: 0.6,
          }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 40%, rgba(10,5,8,0.98) 100%)" }} />
        </motion.div>
      </AnimatePresence>

      {/* Corner glow */}
      <div className="absolute top-0 right-0 w-96 h-96 pointer-events-none opacity-15"
        style={{ background: "radial-gradient(circle at top right, var(--red), transparent 70%)" }} />
      <div className="absolute bottom-0 left-0 w-64 h-64 pointer-events-none opacity-10"
        style={{ background: "radial-gradient(circle at bottom left, var(--gold), transparent 70%)" }} />

      {/* Content */}
      <div className="relative z-10 container flex flex-col justify-center"
        style={{ minHeight: "100vh", paddingTop: 120, paddingBottom: 100 }}>
        <div className="max-w-3xl">
          <AnimatePresence mode="wait">
            <motion.div key={current}
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}>

              {/* Official badge */}
              <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2.5 px-4 py-2 mb-6 rounded"
                style={{ background: "rgba(239,1,7,0.12)", border: "1px solid rgba(239,1,7,0.3)", backdropFilter: "blur(12px)" }}>
                <i className="fa-solid fa-shield-halved text-xs" style={{ color: "var(--gold)" }} />
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--red)", fontFamily: "var(--font-heading)" }}>
                  Official Arsenal Supporters Club Ghana
                </span>
                <span className="live-dot" />
              </motion.div>

              {/* Title */}
              <h1 className="font-black text-white leading-none mb-4"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(2.4rem, 7vw, 5.5rem)",
                  letterSpacing: "-0.01em",
                  textShadow: "0 4px 24px rgba(0,0,0,0.5)",
                }}>
                {slide.title}
              </h1>

              {/* Subtitle */}
              <p className="text-lg font-bold mb-4"
                style={{ color: "var(--gold)", fontFamily: "var(--font-heading)", letterSpacing: "0.04em" }}>
                {slide.subtitle}
              </p>

              {/* Description */}
              <p className="text-base max-w-xl mb-8 leading-relaxed"
                style={{ color: "rgba(255,255,255,0.7)", fontFamily: "var(--font-body)" }}>
                {slide.description}
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap gap-3 mb-8">
                <Link href={slide.ctaLink} className="btn-arsenal">
                  <i className="fa-solid fa-user-plus" />{slide.cta}
                </Link>
                {!isLoggedIn ? (
                  <Link href="/auth/login"
                    className="flex items-center gap-2 px-6 text-sm font-bold uppercase tracking-wider transition-all rounded"
                    style={{
                      height: 44, border: "1px solid rgba(255,255,255,0.2)",
                      background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.85)",
                      fontFamily: "var(--font-heading)", backdropFilter: "blur(12px)",
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.14)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)"; }}>
                    <i className="fa-solid fa-right-to-bracket" />Member Login
                  </Link>
                ) : (
                  <Link href="/members/dashboard"
                    className="flex items-center gap-2 px-6 text-sm font-bold uppercase tracking-wider transition-all rounded"
                    style={{
                      height: 44, border: "1px solid rgba(198,168,75,0.35)",
                      background: "rgba(198,168,75,0.12)", color: "var(--gold)",
                      fontFamily: "var(--font-heading)", backdropFilter: "blur(12px)",
                    }}>
                    <i className="fa-solid fa-gauge" />My Dashboard
                  </Link>
                )}
              </div>

              {/* Social proof */}
              <div className="flex items-center gap-4 pt-5"
                style={{ borderTop: "1px solid rgba(255,255,255,0.12)" }}>
                <div className="flex -space-x-2">
                  {["#EF0107","#C6A84B","#3B82F6","#10B981"].map((c, i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-black"
                      style={{ background: c, borderColor: "rgba(10,5,8,0.8)", color: "#fff" }}>
                      {["K","A","M","E"][i]}
                    </div>
                  ))}
                </div>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>
                  <span className="font-black text-white">{memberCount > 0 ? `${memberCount.toLocaleString()}+` : "2,400+"}</span> members already joined
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Slide controls */}
        {list.length > 1 && (
          <div className="absolute bottom-10 left-6 flex flex-col gap-3">
            <div className="w-36 h-0.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
              <div className="h-full rounded-full transition-none" style={{ width: `${progress}%`, background: "var(--red)" }} />
            </div>
            <div className="flex gap-2 items-center">
              {list.map((_, i) => (
                <button key={i} onClick={() => { setCurrent(i); setAuto(false); setProgress(0); }}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: i === current ? 24 : 7, height: 7,
                    background: i === current ? "var(--red)" : "rgba(255,255,255,0.25)",
                    boxShadow: i === current ? "0 0 8px rgba(239,1,7,0.6)" : "none",
                  }} />
              ))}
              <button onClick={() => setAuto(a => !a)}
                className="ml-1 w-7 h-7 flex items-center justify-center rounded-full transition-all"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)" }}>
                <i className={`fa-solid ${auto ? "fa-pause" : "fa-play"} text-[9px]`} />
              </button>
            </div>
          </div>
        )}

        {/* Stats — bottom right */}
        {stats?.length > 0 && (
          <div className="absolute bottom-8 right-6 hidden md:grid grid-cols-2 gap-2">
            {stats.slice(0, 4).map((s, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="text-center px-4 py-3 rounded"
                style={{
                  background: "rgba(10,5,8,0.7)", backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderTop: i < 2 ? "2px solid rgba(239,1,7,0.5)" : "2px solid rgba(198,168,75,0.5)",
                }}>
                <p className="text-xl font-black text-white leading-none" style={{ fontFamily: "var(--font-display)" }}>{s.value}</p>
                <p className="text-[9px] mt-0.5 uppercase tracking-widest font-bold" style={{ color: "rgba(255,255,255,0.5)", fontFamily: "var(--font-heading)" }}>{s.label}</p>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Scroll indicator */}
      <motion.div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
        style={{ color: "rgba(255,255,255,0.3)" }}>
        <span className="text-[9px] uppercase tracking-widest" style={{ fontFamily: "var(--font-heading)" }}>Scroll</span>
        <motion.i className="fa-solid fa-chevron-down text-xs"
          animate={{ y: [0, 5, 0] }} transition={{ duration: 1.5, repeat: Infinity }} />
      </motion.div>
    </section>
  );
}
