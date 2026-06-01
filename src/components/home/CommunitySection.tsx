"use client";
import Link from "next/link";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";

interface Project { id: number; title: string; slug: string; description?: string; image?: string; location?: string; status: string }
interface Donation { id: number; title: string; description?: string; goal: number; raised: number; currency: string; image?: string }
interface Props { projects: Project[]; donations: Donation[] }

export default function CommunitySection({ projects, donations }: Props) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.08 });

  return (
    <section ref={ref} className="section"
      style={{ background: "var(--bg-alt)", borderTop: "1px solid var(--border)" }}>
      <div className="container">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          className="flex items-end justify-between mb-10 flex-wrap gap-4">
          <div>
            <span className="section-label mb-3">Community</span>
            <h2 className="text-3xl md:text-4xl font-black" style={{ fontFamily: "var(--font-display)", color: "var(--text)" }}>
              COMMUNITY IMPACT
            </h2>
            <p className="text-sm mt-2" style={{ color: "var(--text-2)" }}>
              Beyond football — making a difference in Ghana
            </p>
          </div>
          <Link href="/community" className="btn-arsenal text-xs px-5" style={{ height: 38 }}>
            <i className="fa-solid fa-hand-holding-heart" />Get Involved
          </Link>
        </motion.div>

        {/* 3-column grid */}
        <div className="grid lg:grid-cols-3 gap-6">

          {/* Col 1 — Projects */}
          <motion.div initial={{ opacity: 0, x: -16 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.6 }}>
            <h3 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2"
              style={{ fontFamily: "var(--font-heading)", color: "var(--text)" }}>
              <i className="fa-solid fa-seedling text-xs" style={{ color: "#10B981" }} />Community Projects
            </h3>
            <div className="space-y-3">
              {(projects.length ? projects : [
                { id:1, title:"Youth Football Academy", slug:"youth-academy", description:"Training young Arsenal fans across Accra", location:"Accra", status:"Active", image:undefined },
                { id:2, title:"School Outreach Program", slug:"school-outreach", description:"Bringing Arsenal spirit to schools in Ghana", location:"Greater Accra", status:"Active", image:undefined },
                { id:3, title:"Community Health Drive", slug:"health-drive", description:"Free health screenings for members and families", location:"Kumasi", status:"Active", image:undefined },
              ]).map((p, i) => (
                <motion.div key={p.id}
                  initial={{ opacity: 0, y: 8 }} animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: i * 0.08 }}>
                  <Link href={`/community`}
                    className="group flex gap-3 card p-3 rounded transition-all duration-200"
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(16,185,129,0.4)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}>
                    <div className="w-12 h-12 flex-shrink-0 rounded overflow-hidden">
                      {p.image ? (
                        <img src={p.image} alt={p.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"
                          style={{ background: "rgba(16,185,129,0.08)" }}>
                          <i className="fa-solid fa-seedling text-lg opacity-40" style={{ color: "#10B981" }} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold leading-snug group-hover:text-emerald-500 transition-colors"
                        style={{ color: "var(--text)", fontFamily: "var(--font-heading)" }}>{p.title}</h4>
                      {p.description && (
                        <p className="text-[10px] mt-0.5 line-clamp-1" style={{ color: "var(--text-3)" }}>{p.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        {p.location && (
                          <span className="text-[9px]" style={{ color: "var(--text-3)" }}>
                            <i className="fa-solid fa-location-dot mr-0.5" style={{ color: "#10B981" }} />{p.location}
                          </span>
                        )}
                        <span className="badge badge-green text-[9px]">{p.status}</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Col 2 — Donations */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.1 }}>
            <h3 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2"
              style={{ fontFamily: "var(--font-heading)", color: "var(--text)" }}>
              <i className="fa-solid fa-heart text-xs" style={{ color: "var(--red)" }} />Donation Campaigns
            </h3>
            <div className="space-y-3">
              {(donations.length ? donations : [
                { id:1, title:"Arsenal Ghana Foundation Fund", description:"Supporting community development", goal:50000, raised:32000, currency:"GHS", image:undefined },
                { id:2, title:"Youth Development Program", description:"Funding youth football training", goal:20000, raised:14500, currency:"GHS", image:undefined },
                { id:3, title:"Emergency Relief Fund", description:"Supporting members in need", goal:10000, raised:7200, currency:"GHS", image:undefined },
              ]).map((d, i) => {
                const pct = Math.min(100, Math.round((d.raised / d.goal) * 100));
                return (
                  <motion.div key={d.id}
                    initial={{ opacity: 0, y: 8 }} animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: i * 0.08 }}>
                    <div className="card p-4 rounded">
                      <h4 className="text-xs font-bold mb-1" style={{ color: "var(--text)", fontFamily: "var(--font-heading)" }}>{d.title}</h4>
                      {d.description && <p className="text-[10px] mb-2" style={{ color: "var(--text-3)" }}>{d.description}</p>}
                      <div className="mb-1">
                        <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                          <div className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, background: pct >= 100 ? "#10B981" : "var(--red)" }} />
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[10px]">
                        <span style={{ color: "var(--text-2)" }}>
                          {d.currency === "GHS" ? "GH₵" : d.currency}{d.raised.toLocaleString()} raised
                        </span>
                        <span className="font-black" style={{ color: "var(--red)", fontFamily: "var(--font-display)" }}>{pct}%</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              <Link href="/members/donate"
                className="btn-arsenal w-full justify-center text-xs" style={{ height: 38 }}>
                <i className="fa-solid fa-heart" />Donate Now
              </Link>
            </div>
          </motion.div>

          {/* Col 3 — Volunteer */}
          <motion.div initial={{ opacity: 0, x: 16 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.6, delay: 0.2 }}>
            <h3 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2"
              style={{ fontFamily: "var(--font-heading)", color: "var(--text)" }}>
              <i className="fa-solid fa-hands-helping text-xs" style={{ color: "#8B5CF6" }} />Volunteer
            </h3>
            <div className="card p-6 rounded h-full flex flex-col"
              style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.06) 0%, rgba(239,1,7,0.04) 100%)", border: "1px solid rgba(139,92,246,0.15)" }}>
              <div className="w-14 h-14 rounded flex items-center justify-center mb-4"
                style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.2)" }}>
                <i className="fa-solid fa-hands-helping text-2xl" style={{ color: "#8B5CF6" }} />
              </div>
              <h4 className="text-lg font-black mb-2" style={{ fontFamily: "var(--font-display)", color: "var(--text)" }}>
                Make a Difference
              </h4>
              <p className="text-sm leading-relaxed mb-4 flex-1" style={{ color: "var(--text-2)", fontFamily: "var(--font-body)" }}>
                Join our volunteer team and help organise events, support community projects, and represent ASC Ghana at outreach programs across the country.
              </p>
              <div className="space-y-2 mb-5">
                {["Event organisation & setup","Community outreach programs","Social media & content creation","Membership support & onboarding"].map(item => (
                  <div key={item} className="flex items-center gap-2 text-xs" style={{ color: "var(--text-2)" }}>
                    <i className="fa-solid fa-check text-[10px]" style={{ color: "#8B5CF6" }} />{item}
                  </div>
                ))}
              </div>
              <Link href="/community"
                className="block text-center text-xs font-bold uppercase tracking-wider py-2.5 rounded transition-all"
                style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.25)", color: "#8B5CF6", fontFamily: "var(--font-heading)" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(139,92,246,0.2)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(139,92,246,0.12)"; }}>
                <i className="fa-solid fa-arrow-right mr-1.5" />Become a Volunteer
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
