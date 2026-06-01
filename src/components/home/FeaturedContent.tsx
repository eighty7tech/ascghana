"use client";
import Link from "next/link";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";

interface NewsItem {
  id: number; title: string; slug: string; excerpt?: string;
  category?: string; author?: string; image?: string; published_at?: string; views?: number;
}
interface EventItem {
  id: number; title: string; slug: string; date: string; time?: string;
  venue?: string; category?: string; image?: string; capacity?: number;
  booked?: number; is_free?: boolean; member_price?: number; non_member_price?: number;
  short_description?: string;
}
interface MatchItem {
  id: number; match_title: string; competition?: string; match_date: string;
  kickoff_time?: string; venue: string; capacity?: number; rsvp_count?: number;
  is_free?: boolean; entry_fee?: number; image?: string;
}
interface Props { news: NewsItem[]; events: EventItem[]; matchViewings: MatchItem[] }

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

const CAT_COLORS: Record<string, string> = {
  "Watch Party": "#EF0107", "Meeting": "#3B82F6", "Charity": "#10B981",
  "Gala": "#C6A84B", "Training": "#8B5CF6", "Social": "#F59E0B",
};

export default function FeaturedContent({ news, events, matchViewings }: Props) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.05 });

  return (
    <section ref={ref} className="section" style={{ background: "var(--bg)" }}>
      <div className="container">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          className="flex items-center justify-between mb-10 flex-wrap gap-4">
          <div>
            <span className="section-label mb-2">What's Happening</span>
            <h2 className="text-3xl font-black" style={{ fontFamily: "var(--font-display)", color: "var(--text)" }}>
              LATEST FROM ASC GHANA
            </h2>
          </div>
        </motion.div>

        {/* 3-column grid */}
        <div className="grid lg:grid-cols-3 gap-6">

          {/* ── Column 1: Latest News ── */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.6 }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2"
                style={{ fontFamily: "var(--font-heading)", color: "var(--text)" }}>
                <i className="fa-solid fa-newspaper text-xs" style={{ color: "var(--red)" }} />Latest News
              </h3>
              <Link href="/news" className="text-[11px] font-bold uppercase tracking-wider transition-colors hover:text-white"
                style={{ color: "var(--red)", fontFamily: "var(--font-heading)" }}>
                All News <i className="fa-solid fa-arrow-right ml-1 text-[9px]" />
              </Link>
            </div>

            <div className="space-y-3">
              {news.length === 0 ? (
                <div className="card p-8 text-center" style={{ color: "var(--text-3)" }}>
                  <i className="fa-solid fa-newspaper text-3xl mb-2 block opacity-20" />
                  <p className="text-sm">No news yet</p>
                </div>
              ) : news.map((item, i) => (
                <motion.article key={item.id}
                  initial={{ opacity: 0, y: 10 }} animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: i * 0.08 }}>
                  <Link href={`/news/${item.slug}`}
                    className="group flex gap-3 p-3 rounded transition-all duration-200 card"
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(239,1,7,0.3)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}>
                    {/* Thumbnail */}
                    <div className="w-20 h-16 flex-shrink-0 rounded overflow-hidden">
                      {item.image ? (
                        <img src={item.image} alt={item.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"
                          style={{ background: "rgba(239,1,7,0.08)" }}>
                          <i className="fa-solid fa-newspaper text-lg opacity-20" style={{ color: "var(--red)" }} />
                        </div>
                      )}
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {item.category && (
                        <span className="text-[9px] font-black uppercase tracking-widest"
                          style={{ color: "var(--red)", fontFamily: "var(--font-heading)" }}>
                          {item.category}
                        </span>
                      )}
                      <h4 className="text-xs font-bold leading-snug line-clamp-2 mt-0.5 group-hover:text-red-500 transition-colors"
                        style={{ color: "var(--text)", fontFamily: "var(--font-heading)" }}>
                        {item.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1 text-[10px]" style={{ color: "var(--text-3)" }}>
                        {item.published_at && <span>{timeAgo(item.published_at)}</span>}
                        {item.views != null && item.views > 0 && <span>· {item.views} views</span>}
                      </div>
                    </div>
                  </Link>
                </motion.article>
              ))}
            </div>
          </motion.div>

          {/* ── Column 2: Upcoming Events ── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.1 }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2"
                style={{ fontFamily: "var(--font-heading)", color: "var(--text)" }}>
                <i className="fa-solid fa-calendar-days text-xs" style={{ color: "#C6A84B" }} />Upcoming Events
              </h3>
              <Link href="/events" className="text-[11px] font-bold uppercase tracking-wider transition-colors"
                style={{ color: "var(--red)", fontFamily: "var(--font-heading)" }}>
                All Events <i className="fa-solid fa-arrow-right ml-1 text-[9px]" />
              </Link>
            </div>

            <div className="space-y-3">
              {events.length === 0 ? (
                <div className="card p-8 text-center" style={{ color: "var(--text-3)" }}>
                  <i className="fa-solid fa-calendar-xmark text-3xl mb-2 block opacity-20" />
                  <p className="text-sm">No upcoming events</p>
                </div>
              ) : events.map((ev, i) => {
                const color = CAT_COLORS[ev.category || ""] || "#EF0107";
                const dateObj = new Date(ev.date);
                const day   = dateObj.toLocaleDateString("en-GB", { day: "2-digit" });
                const month = dateObj.toLocaleDateString("en-GB", { month: "short" }).toUpperCase();
                const pct   = ev.capacity ? Math.min(100, ((ev.booked || 0) / ev.capacity) * 100) : 0;
                return (
                  <motion.div key={ev.id}
                    initial={{ opacity: 0, y: 10 }} animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: i * 0.08 }}>
                    <Link href={`/events`}
                      className="group flex gap-3 p-3 rounded card transition-all duration-200"
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${color}40`; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}>
                      {/* Date block */}
                      <div className="flex-shrink-0 w-12 flex flex-col items-center justify-center rounded py-2"
                        style={{ background: `${color}12`, border: `1px solid ${color}20` }}>
                        <span className="text-lg font-black leading-none" style={{ color, fontFamily: "var(--font-display)" }}>{day}</span>
                        <span className="text-[9px] font-bold" style={{ color, fontFamily: "var(--font-heading)" }}>{month}</span>
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="text-xs font-bold leading-snug line-clamp-1 group-hover:text-red-500 transition-colors"
                            style={{ color: "var(--text)", fontFamily: "var(--font-heading)" }}>
                            {ev.title}
                          </h4>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0"
                            style={{ background: `${color}12`, color, fontFamily: "var(--font-heading)" }}>
                            {ev.category}
                          </span>
                        </div>
                        {ev.venue && (
                          <p className="text-[10px] mt-0.5 flex items-center gap-1" style={{ color: "var(--text-3)" }}>
                            <i className="fa-solid fa-location-dot text-[9px]" style={{ color }} />
                            <span className="truncate">{ev.venue}</span>
                          </p>
                        )}
                        {ev.capacity != null && ev.capacity > 0 && (
                          <div className="mt-1.5">
                            <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct >= 90 ? "#EF0107" : color }} />
                            </div>
                            <span className="text-[9px]" style={{ color: "var(--text-3)" }}>
                              {Math.max(0, (ev.capacity || 0) - (ev.booked || 0))} spots left
                            </span>
                          </div>
                        )}
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* ── Column 3: Match Viewings ── */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.6, delay: 0.2 }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2"
                style={{ fontFamily: "var(--font-heading)", color: "var(--text)" }}>
                <i className="fa-solid fa-tv text-xs" style={{ color: "#3B82F6" }} />Match Viewings
              </h3>
              <Link href="/match-viewings" className="text-[11px] font-bold uppercase tracking-wider transition-colors"
                style={{ color: "var(--red)", fontFamily: "var(--font-heading)" }}>
                All Venues <i className="fa-solid fa-arrow-right ml-1 text-[9px]" />
              </Link>
            </div>

            <div className="space-y-3">
              {matchViewings.length === 0 ? (
                <div className="card p-8 text-center" style={{ color: "var(--text-3)" }}>
                  <i className="fa-solid fa-tv text-3xl mb-2 block opacity-20" />
                  <p className="text-sm">No viewings scheduled</p>
                </div>
              ) : matchViewings.map((mv, i) => {
                const matchDate = new Date(mv.match_date);
                return (
                  <motion.div key={mv.id}
                    initial={{ opacity: 0, y: 10 }} animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: i * 0.08 }}>
                    <Link href="/match-viewings"
                      className="group block p-3 rounded card transition-all duration-200"
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(59,130,246,0.4)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="text-xs font-bold leading-snug group-hover:text-blue-400 transition-colors"
                          style={{ color: "var(--text)", fontFamily: "var(--font-heading)" }}>
                          {mv.match_title}
                        </h4>
                        {mv.competition && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0"
                            style={{ background: "rgba(59,130,246,0.1)", color: "#3B82F6", fontFamily: "var(--font-heading)" }}>
                            {mv.competition}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[10px]" style={{ color: "var(--text-3)" }}>
                        <span><i className="fa-solid fa-calendar mr-1" />
                          {matchDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                          {mv.kickoff_time && ` · ${mv.kickoff_time}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-[10px]" style={{ color: "var(--text-3)" }}>
                        <i className="fa-solid fa-location-dot text-[9px]" style={{ color: "#3B82F6" }} />
                        <span className="truncate">{mv.venue}</span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] font-bold"
                          style={{ color: mv.is_free ? "#10B981" : "var(--gold)", fontFamily: "var(--font-heading)" }}>
                          {mv.is_free ? "FREE ENTRY" : `GH₵${mv.entry_fee}`}
                        </span>
                        {mv.rsvp_count != null && mv.rsvp_count > 0 && (
                          <span className="text-[10px]" style={{ color: "var(--text-3)" }}>
                            {mv.rsvp_count} RSVPs
                          </span>
                        )}
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
