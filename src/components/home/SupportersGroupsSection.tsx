"use client";
import Link from "next/link";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";

interface Group { id: number; name: string; slug: string; region: string; city?: string; logo_url?: string; member_count: number; founded_year?: string }
interface Props { groups: Group[] }

const REGION_COLORS: Record<string, string> = {
  "Greater Accra": "#EF0107", "Ashanti": "#C6A84B", "Western": "#3B82F6",
  "Eastern": "#10B981", "Central": "#8B5CF6", "Northern": "#F59E0B",
  "Volta": "#EC4899", "Brong-Ahafo": "#06B6D4",
};

export default function SupportersGroupsSection({ groups }: Props) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.08 });

  const list = groups.length ? groups : Array.from({ length: 8 }, (_, i) => ({
    id: i + 1, name: `${["Accra","Kumasi","Takoradi","Cape Coast","Tamale","Ho","Sunyani","Koforidua"][i]} Gooners`,
    slug: `group-${i + 1}`, region: ["Greater Accra","Ashanti","Western","Central","Northern","Volta","Brong-Ahafo","Eastern"][i],
    city: ["Accra","Kumasi","Takoradi","Cape Coast","Tamale","Ho","Sunyani","Koforidua"][i],
    logo_url: undefined, member_count: Math.floor(Math.random() * 300) + 50, founded_year: "2010",
  }));

  return (
    <section ref={ref} className="section"
      style={{ background: "var(--bg-alt)", borderTop: "1px solid var(--border)" }}>
      <div className="container">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          className="flex items-end justify-between mb-10 flex-wrap gap-4">
          <div>
            <span className="section-label mb-3">Supporters Groups</span>
            <h2 className="text-3xl md:text-4xl font-black" style={{ fontFamily: "var(--font-display)", color: "var(--text)" }}>
              REGIONAL CHAPTERS
            </h2>
            <p className="text-sm mt-2" style={{ color: "var(--text-2)" }}>
              Arsenal fans united across every region of Ghana
            </p>
          </div>
          <Link href="/supporters-groups" className="btn-arsenal text-xs px-5" style={{ height: 38 }}>
            <i className="fa-solid fa-people-group" />All Groups
          </Link>
        </motion.div>

        {/* Groups grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-8">
          {list.slice(0, 8).map((g, i) => {
            const color = REGION_COLORS[g.region] || "#EF0107";
            return (
              <motion.div key={g.id}
                initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.07 }}>
                <Link href="/supporters-groups"
                  className="group block card p-4 rounded text-center transition-all duration-200"
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = `${color}40`;
                    (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)";
                    (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 24px ${color}12`;
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                    (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "none";
                  }}>
                  {/* Logo / initials */}
                  {g.logo_url ? (
                    <img src={g.logo_url} alt={g.name} className="w-14 h-14 rounded-full object-cover mx-auto mb-3"
                      style={{ border: `2px solid ${color}30` }} />
                  ) : (
                    <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-black mx-auto mb-3"
                      style={{ background: `${color}12`, border: `2px solid ${color}25`, color, fontFamily: "var(--font-heading)" }}>
                      {g.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <p className="text-xs font-black leading-snug mb-0.5 group-hover:text-red-500 transition-colors"
                    style={{ color: "var(--text)", fontFamily: "var(--font-heading)" }}>{g.name}</p>
                  <p className="text-[10px] mb-1" style={{ color, fontFamily: "var(--font-heading)" }}>{g.region}</p>
                  <p className="text-[10px]" style={{ color: "var(--text-3)" }}>
                    <i className="fa-solid fa-users mr-1" />{g.member_count} members
                  </p>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* CTA */}
        <motion.div initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 0.5 }}
          className="text-center p-8 rounded"
          style={{ background: "linear-gradient(135deg, rgba(239,1,7,0.06) 0%, rgba(12,28,61,0.08) 100%)", border: "1px solid rgba(239,1,7,0.12)" }}>
          <i className="fa-solid fa-map-location-dot text-3xl mb-3 block" style={{ color: "var(--red)" }} />
          <h3 className="text-xl font-black mb-2" style={{ fontFamily: "var(--font-display)", color: "var(--text)" }}>
            Don't See Your Region?
          </h3>
          <p className="text-sm mb-4" style={{ color: "var(--text-2)" }}>
            Start a supporters group in your area and connect with Arsenal fans near you.
          </p>
          <Link href="/contact" className="btn-arsenal text-xs px-8" style={{ height: 40 }}>
            <i className="fa-solid fa-plus" />Start a Group
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
