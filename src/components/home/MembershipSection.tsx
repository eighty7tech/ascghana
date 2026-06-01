"use client";
import Link from "next/link";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";

interface Plan {
  id: number; name: string; slug: string; price: number; renewal_price: number;
  benefits: string[] | string; color: string; icon: string;
  is_popular: boolean; is_family: boolean; description?: string;
}
interface Props { plans: Plan[] }

const TIER_ICONS: Record<string, string> = {
  Bronze: "fa-solid fa-medal", Silver: "fa-solid fa-shield",
  Gold: "fa-solid fa-star", Platinum: "fa-solid fa-trophy", Abusua: "fa-solid fa-people-roof",
};

const BENEFITS = [
  { icon: "fa-solid fa-ticket",           text: "Emirates Stadium ticket requests" },
  { icon: "fa-solid fa-tv",               text: "Official watch party access" },
  { icon: "fa-solid fa-id-card",          text: "Digital membership card & QR code" },
  { icon: "fa-solid fa-tag",              text: "Exclusive member discounts on merch" },
  { icon: "fa-solid fa-people-group",     text: "Members-only community forum" },
  { icon: "fa-solid fa-trophy",           text: "Voting rights at AGM" },
  { icon: "fa-solid fa-calendar-days",    text: "Priority event booking" },
  { icon: "fa-solid fa-newspaper",        text: "Club newsletter & updates" },
];

export default function MembershipSection({ plans }: Props) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.08 });

  const parseBenefits = (b: string[] | string): string[] => {
    if (Array.isArray(b)) return b;
    try { return JSON.parse(b); } catch { return []; }
  };

  return (
    <section ref={ref} className="section"
      style={{ background: "var(--bg-alt)", borderTop: "1px solid var(--border)" }}>
      <div className="container">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-12">
          <span className="section-label mb-3 justify-center">Membership</span>
          <h2 className="text-4xl md:text-5xl font-black mb-4"
            style={{ fontFamily: "var(--font-display)", color: "var(--text)" }}>
            JOIN THE GHANA GOONERS
          </h2>
          <p className="text-sm max-w-xl mx-auto" style={{ color: "var(--text-2)", fontFamily: "var(--font-body)" }}>
            One-time membership fee. Renew every 2 seasons. Choose the tier that fits you and unlock exclusive benefits.
          </p>
        </motion.div>

        {/* 2-col layout */}
        <div className="grid lg:grid-cols-2 gap-10 items-start">

          {/* LEFT — Benefits */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.6 }}>
            <h3 className="text-xl font-black mb-6" style={{ fontFamily: "var(--font-display)", color: "var(--text)" }}>
              MEMBER BENEFITS
            </h3>
            <div className="grid sm:grid-cols-2 gap-3 mb-8">
              {BENEFITS.map((b, i) => (
                <motion.div key={b.text}
                  initial={{ opacity: 0, y: 8 }} animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.1 + i * 0.06 }}
                  className="flex items-center gap-3 p-3 rounded"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                  <div className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(239,1,7,0.08)" }}>
                    <i className={`${b.icon} text-sm`} style={{ color: "var(--red)" }} />
                  </div>
                  <span className="text-xs font-medium" style={{ color: "var(--text-2)", fontFamily: "var(--font-body)" }}>
                    {b.text}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* Founded badges */}
            <div className="flex gap-4 flex-wrap">
              {[
                { label: "Founded", value: "2003", color: "var(--red)" },
                { label: "Arsenal Approved", value: "2008", color: "var(--gold)" },
                { label: "Members", value: "2,400+", color: "#3B82F6" },
                { label: "Regions", value: "10+", color: "#10B981" },
              ].map(b => (
                <div key={b.label} className="text-center px-4 py-3 rounded"
                  style={{ background: "var(--bg-card)", border: `1px solid ${b.color}20` }}>
                  <p className="text-xl font-black" style={{ fontFamily: "var(--font-display)", color: b.color }}>{b.value}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-3)", fontFamily: "var(--font-heading)" }}>{b.label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* RIGHT — Tier cards */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.6, delay: 0.1 }}>
            <h3 className="text-xl font-black mb-6" style={{ fontFamily: "var(--font-display)", color: "var(--text)" }}>
              MEMBERSHIP PLANS
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              {(plans.length ? plans : [
                { id:1, name:"Bronze",   slug:"bronze",   price:150, renewal_price:100, color:"#CD7F32", icon:"fa-solid fa-medal",       is_popular:false, is_family:false, benefits:["Member ID card","Watch party access","Newsletter","Voting rights"] },
                { id:2, name:"Silver",   slug:"silver",   price:300, renewal_price:200, color:"#A8A9AD", icon:"fa-solid fa-shield",      is_popular:false, is_family:false, benefits:["All Bronze benefits","Ticket requests","Priority booking"] },
                { id:3, name:"Gold",     slug:"gold",     price:500, renewal_price:350, color:"#C6A84B", icon:"fa-solid fa-star",        is_popular:true,  is_family:false, benefits:["All Silver benefits","10% discount","VIP access"] },
                { id:4, name:"Platinum", slug:"platinum", price:1000,renewal_price:700, color:"#E8E8E8", icon:"fa-solid fa-trophy",      is_popular:false, is_family:false, benefits:["All Gold benefits","VIP seating","Dedicated liaison"] },
                { id:5, name:"Abusua",   slug:"abusua",   price:800, renewal_price:500, color:"#2ECC71", icon:"fa-solid fa-people-roof", is_popular:false, is_family:true,  benefits:["Family package","Up to 5 members","All Gold benefits"] },
              ] as Plan[]).map((plan, i) => (
                <motion.div key={plan.id}
                  initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.2 + i * 0.08 }}>
                  <Link href="/membership/apply"
                    className="group block rounded overflow-hidden text-center transition-all duration-300 relative"
                    style={{
                      background: "var(--bg-card)",
                      border: `1px solid ${plan.color}25`,
                      transform: plan.is_popular ? "scale(1.04)" : "scale(1)",
                      boxShadow: plan.is_popular ? `0 0 24px ${plan.color}20` : "none",
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.transform = "translateY(-5px) scale(1.02)";
                      (e.currentTarget as HTMLElement).style.borderColor = `${plan.color}60`;
                      (e.currentTarget as HTMLElement).style.boxShadow = `0 16px 40px ${plan.color}20`;
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.transform = plan.is_popular ? "scale(1.04)" : "scale(1)";
                      (e.currentTarget as HTMLElement).style.borderColor = `${plan.color}25`;
                      (e.currentTarget as HTMLElement).style.boxShadow = plan.is_popular ? `0 0 24px ${plan.color}20` : "none";
                    }}>
                    {plan.is_popular && (
                      <div className="text-[9px] font-black uppercase tracking-widest py-1"
                        style={{ background: "var(--red)", color: "#fff", fontFamily: "var(--font-heading)" }}>
                        <i className="fa-solid fa-fire mr-1" />Popular
                      </div>
                    )}
                    <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg, transparent, ${plan.color}, transparent)` }} />
                    <div className={`p-4 ${plan.is_popular ? "pt-3" : "pt-4"}`}>
                      <div className="w-10 h-10 mx-auto mb-2 flex items-center justify-center rounded"
                        style={{ background: `${plan.color}15`, border: `1px solid ${plan.color}25` }}>
                        <i className={`${TIER_ICONS[plan.name] || plan.icon} text-lg`} style={{ color: plan.color }} />
                      </div>
                      <p className="text-xs font-black uppercase tracking-wider mb-1"
                        style={{ color: plan.color, fontFamily: "var(--font-heading)" }}>{plan.name}</p>
                      {plan.is_family && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded inline-block mb-1"
                          style={{ background: `${plan.color}15`, color: plan.color }}>Family</span>
                      )}
                      <p className="text-xl font-black" style={{ fontFamily: "var(--font-display)", color: "var(--text)" }}>
                        GH₵{plan.price.toLocaleString()}
                      </p>
                      <p className="text-[9px] mb-3" style={{ color: "var(--text-3)" }}>one-time</p>
                      <ul className="text-left space-y-1 mb-3">
                        {parseBenefits(plan.benefits).slice(0, 3).map((b, j) => (
                          <li key={j} className="flex items-start gap-1.5 text-[10px]" style={{ color: "var(--text-2)" }}>
                            <i className="fa-solid fa-check text-[8px] mt-0.5 flex-shrink-0" style={{ color: plan.color }} />{b}
                          </li>
                        ))}
                      </ul>
                      <div className="py-1.5 text-[10px] font-black uppercase tracking-wider rounded"
                        style={{
                          background: plan.is_popular ? "var(--red)" : `${plan.color}15`,
                          color: plan.is_popular ? "#fff" : plan.color,
                          fontFamily: "var(--font-heading)",
                        }}>
                        Select
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            <div className="flex gap-3 flex-wrap">
              <Link href="/membership/apply" className="btn-arsenal flex-1 justify-center">
                <i className="fa-solid fa-user-plus" />Join Now
              </Link>
              <Link href="/membership" className="btn-arsenal-outline flex-1 justify-center">
                <i className="fa-solid fa-info-circle" />View All Plans
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
