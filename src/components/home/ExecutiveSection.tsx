"use client";
import Link from "next/link";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";

interface Executive {
  id: number; name: string; photo?: string; bio?: string;
  position: string; sort_order: number;
}
interface Props { executives: Executive[] }

function initials(name: string) {
  return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
}

const COLORS = ["#EF0107","#C6A84B","#3B82F6","#10B981","#8B5CF6","#F59E0B","#EC4899","#06B6D4"];

export default function ExecutiveSection({ executives }: Props) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.08 });

  const president = executives.find(e => e.position.toLowerCase().includes("president") && !e.position.toLowerCase().includes("vice"));
  const rest = executives.filter(e => e.id !== president?.id).slice(0, 6);

  return (
    <section ref={ref} className="section"
      style={{ background: "linear-gradient(135deg, #0A0508 0%, #0C1C3D 50%, #0A0508 100%)", borderTop: "1px solid rgba(239,1,7,0.15)" }}>
      {/* Pattern */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: "repeating-linear-gradient(-55deg, rgba(239,1,7,0.02) 0px, rgba(239,1,7,0.02) 1px, transparent 1px, transparent 60px)",
      }} />

      <div className="container relative">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          className="flex items-end justify-between mb-12 flex-wrap gap-4">
          <div>
            <span className="section-label mb-3">Leadership</span>
            <h2 className="text-3xl md:text-4xl font-black text-white"
              style={{ fontFamily: "var(--font-display)" }}>
              EXECUTIVE COMMITTEE
            </h2>
            <p className="text-sm mt-2" style={{ color: "rgba(255,255,255,0.5)" }}>
              The dedicated leaders driving ASC Ghana forward
            </p>
          </div>
          <Link href="/about/exco" className="btn-arsenal-outline text-xs px-5" style={{ height: 38 }}>
            <i className="fa-solid fa-users" />Full Committee
          </Link>
        </motion.div>

        {/* President spotlight */}
        {president && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="mb-10 p-6 rounded overflow-hidden relative"
            style={{ background: "rgba(239,1,7,0.06)", border: "1px solid rgba(239,1,7,0.2)" }}>
            <div className="absolute top-0 right-0 w-64 h-64 pointer-events-none opacity-10"
              style={{ background: "radial-gradient(circle at top right, var(--red), transparent 70%)" }} />
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative">
              {/* Avatar */}
              <div className="flex-shrink-0">
                {president.photo ? (
                  <img src={president.photo} alt={president.name}
                    className="w-24 h-24 rounded-full object-cover"
                    style={{ border: "3px solid var(--red)", boxShadow: "0 0 24px rgba(239,1,7,0.3)" }} />
                ) : (
                  <div className="w-24 h-24 rounded-full flex items-center justify-center text-2xl font-black"
                    style={{ background: "rgba(239,1,7,0.15)", border: "3px solid var(--red)", color: "var(--red)", fontFamily: "var(--font-display)" }}>
                    {initials(president.name)}
                  </div>
                )}
              </div>
              {/* Info */}
              <div className="flex-1 text-center sm:text-left">
                <span className="badge badge-red mb-2">
                  <i className="fa-solid fa-crown text-[9px]" />{president.position}
                </span>
                <h3 className="text-2xl font-black text-white mb-2" style={{ fontFamily: "var(--font-display)" }}>
                  {president.name}
                </h3>
                {president.bio && (
                  <p className="text-sm leading-relaxed line-clamp-3"
                    style={{ color: "rgba(255,255,255,0.6)", fontFamily: "var(--font-body)" }}>
                    {president.bio}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Rest of committee */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {(rest.length ? rest : Array.from({ length: 6 }, (_, i) => ({
            id: i + 1, name: `Executive ${i + 1}`, position: "Committee Member", sort_order: i,
          }))).map((exec, i) => (
            <motion.div key={exec.id}
              initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 + i * 0.07 }}>
              <Link href="/about/exco"
                className="group block text-center p-4 rounded transition-all duration-200"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)";
                  (e.currentTarget as HTMLElement).style.borderColor = `${COLORS[i % COLORS.length]}40`;
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)";
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                }}>
                {exec.photo ? (
                  <img src={exec.photo} alt={exec.name}
                    className="w-16 h-16 rounded-full object-cover mx-auto mb-3"
                    style={{ border: `2px solid ${COLORS[i % COLORS.length]}40` }} />
                ) : (
                  <div className="w-16 h-16 rounded-full flex items-center justify-center text-lg font-black mx-auto mb-3"
                    style={{
                      background: `${COLORS[i % COLORS.length]}15`,
                      border: `2px solid ${COLORS[i % COLORS.length]}30`,
                      color: COLORS[i % COLORS.length],
                      fontFamily: "var(--font-heading)",
                    }}>
                    {initials(exec.name)}
                  </div>
                )}
                <p className="text-xs font-black text-white leading-snug mb-0.5"
                  style={{ fontFamily: "var(--font-heading)" }}>{exec.name}</p>
                <p className="text-[10px]" style={{ color: COLORS[i % COLORS.length], fontFamily: "var(--font-heading)" }}>
                  {exec.position}
                </p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
