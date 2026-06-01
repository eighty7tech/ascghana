"use client";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";

interface Props {
  totalMembers: number;
  branches: number;
  upcomingEvents: number;
  communityProjects: number;
}

export default function StatsGrid({ totalMembers, branches, upcomingEvents, communityProjects }: Props) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });

  const STATS = [
    {
      value: totalMembers > 0 ? `${totalMembers.toLocaleString()}+` : "2,400+",
      label: "Total Members",
      icon: "fa-solid fa-users",
      color: "#EF0107",
      href: "/membership",
      desc: "Registered Gooners across Ghana",
    },
    {
      value: branches > 0 ? String(branches) : "10+",
      label: "Registered Branches",
      icon: "fa-solid fa-map-location-dot",
      color: "#C6A84B",
      href: "/supporters-groups",
      desc: "Regional supporters groups",
    },
    {
      value: upcomingEvents > 0 ? String(upcomingEvents) : "12+",
      label: "Upcoming Events",
      icon: "fa-solid fa-calendar-days",
      color: "#3B82F6",
      href: "/events",
      desc: "Watch parties & club events",
    },
    {
      value: communityProjects > 0 ? String(communityProjects) : "8+",
      label: "Community Projects",
      icon: "fa-solid fa-hand-holding-heart",
      color: "#10B981",
      href: "/community",
      desc: "Active community initiatives",
    },
  ];

  return (
    <section ref={ref} className="section-sm"
      style={{
        background: "linear-gradient(135deg, #0A0508 0%, #120A0A 50%, #0A0508 100%)",
        borderTop: "1px solid rgba(239,1,7,0.15)",
        borderBottom: "1px solid rgba(239,1,7,0.15)",
      }}>
      {/* Subtle pattern */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: "repeating-linear-gradient(45deg, rgba(239,1,7,0.02) 0, rgba(239,1,7,0.02) 1px, transparent 0, transparent 50%)",
        backgroundSize: "12px 12px",
      }} />
      <div className="container relative">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map((s, i) => (
            <motion.div key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}>
              <Link href={s.href}
                className="group block p-6 rounded text-center transition-all duration-300"
                style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${s.color}20` }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = `${s.color}08`;
                  (e.currentTarget as HTMLElement).style.borderColor = `${s.color}40`;
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)";
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 12px 32px ${s.color}15`;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)";
                  (e.currentTarget as HTMLElement).style.borderColor = `${s.color}20`;
                  (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                }}>
                <div className="w-12 h-12 rounded mx-auto mb-3 flex items-center justify-center transition-transform group-hover:scale-110"
                  style={{ background: `${s.color}15`, border: `1px solid ${s.color}25` }}>
                  <i className={`${s.icon} text-xl`} style={{ color: s.color }} />
                </div>
                <p className="text-3xl font-black mb-1" style={{ fontFamily: "var(--font-display)", color: s.color }}>
                  {s.value}
                </p>
                <p className="text-xs font-bold uppercase tracking-widest mb-1"
                  style={{ color: "rgba(255,255,255,0.7)", fontFamily: "var(--font-heading)" }}>
                  {s.label}
                </p>
                <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)", fontFamily: "var(--font-body)" }}>
                  {s.desc}
                </p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
