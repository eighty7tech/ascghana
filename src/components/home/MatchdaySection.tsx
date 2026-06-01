"use client";
import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";

interface Fixture {
  id: number; homeTeam: string; awayTeam: string; competition: string;
  homeTeamLogo?: string; awayTeamLogo?: string; date: string; time: string;
  venue: string; status: "upcoming" | "live" | "result";
  homeScore?: number; awayScore?: number; isActive: boolean;
  watchPartyVenue?: string; watchPartyTime?: string; ticketLink?: string;
}
interface MatchViewing {
  id: number; match_title: string; competition?: string; match_date: string;
  kickoff_time?: string; venue: string; capacity?: number; rsvp_count?: number;
  is_free?: boolean; entry_fee?: number;
}
interface Props { fixtures: Fixture[]; matchViewings: MatchViewing[]; nextMatch: any }

function useCountdown(dateStr: string, timeStr: string) {
  const [diff, setDiff] = useState(0);
  useEffect(() => {
    if (!dateStr) return;
    const target = new Date(`${dateStr}T${timeStr || "17:30"}:00`);
    const tick = () => setDiff(target.getTime() - Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [dateStr, timeStr]);
  const total = Math.max(0, diff);
  return {
    d: Math.floor(total / 86400000),
    h: Math.floor((total % 86400000) / 3600000),
    m: Math.floor((total % 3600000) / 60000),
    s: Math.floor((total % 60000) / 1000),
    ended: total <= 0,
  };
}

function pad(n: number) { return String(n).padStart(2, "0"); }

export default function MatchdaySection({ fixtures, matchViewings, nextMatch }: Props) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.08 });

  const activeFixtures = fixtures.filter(f => f.isActive !== false).slice(0, 4);
  const upcoming = activeFixtures.filter(f => f.status === "upcoming" || f.status === "live");
  const results  = activeFixtures.filter(f => f.status === "result");

  const countdownDate = nextMatch?.date || upcoming[0]?.date || "";
  const countdownTime = nextMatch?.time || upcoming[0]?.time || "17:30";
  const { d, h, m, s, ended } = useCountdown(countdownDate, countdownTime);

  const STATUS_CFG: Record<string, { label: string; color: string }> = {
    upcoming: { label: "Upcoming", color: "#3B82F6" },
    live:     { label: "LIVE",     color: "#10B981" },
    result:   { label: "FT",       color: "#C6A84B" },
  };

  return (
    <section ref={ref} className="section"
      style={{ background: "var(--bg)", borderTop: "1px solid var(--border)" }}>
      <div className="container">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          className="flex items-end justify-between mb-10 flex-wrap gap-4">
          <div>
            <span className="section-label mb-3">Matchday</span>
            <h2 className="text-3xl md:text-4xl font-black" style={{ fontFamily: "var(--font-display)", color: "var(--text)" }}>
              MATCHDAY EXPERIENCE
            </h2>
          </div>
          <Link href="/match-viewings" className="btn-arsenal text-xs px-5" style={{ height: 38 }}>
            <i className="fa-solid fa-tv" />Find a Viewing
          </Link>
        </motion.div>

        {/* 3-column grid */}
        <div className="grid lg:grid-cols-3 gap-6">

          {/* Col 1 — Fixtures */}
          <motion.div initial={{ opacity: 0, x: -16 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.6 }}>
            <h3 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2"
              style={{ fontFamily: "var(--font-heading)", color: "var(--text)" }}>
              <i className="fa-solid fa-futbol text-xs" style={{ color: "var(--red)" }} />Arsenal Fixtures
            </h3>
            <div className="space-y-2">
              {activeFixtures.length === 0 ? (
                <div className="card p-6 text-center" style={{ color: "var(--text-3)" }}>
                  <i className="fa-solid fa-futbol text-3xl mb-2 block opacity-20" />
                  <p className="text-sm">No fixtures added yet</p>
                </div>
              ) : activeFixtures.map((f, i) => {
                const cfg = STATUS_CFG[f.status] || STATUS_CFG.upcoming;
                const hasScore = f.status === "result" || f.status === "live";
                const dateStr = f.date ? new Date(f.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "";
                return (
                  <motion.div key={f.id}
                    initial={{ opacity: 0, x: -8 }} animate={inView ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: i * 0.07 }}
                    className="card p-3 rounded">
                    {/* Competition */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] font-bold uppercase tracking-widest"
                        style={{ color: "var(--text-3)", fontFamily: "var(--font-heading)" }}>{f.competition}</span>
                      <span className="text-[9px] font-black px-2 py-0.5 rounded-full"
                        style={{ background: `${cfg.color}15`, color: cfg.color, fontFamily: "var(--font-heading)" }}>
                        {f.status === "live" && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block mr-1" />}
                        {cfg.label}
                      </span>
                    </div>
                    {/* Teams */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 flex items-center justify-end gap-1.5">
                        <span className="text-xs font-black truncate" style={{ color: "var(--text)", fontFamily: "var(--font-heading)" }}>{f.homeTeam}</span>
                        {f.homeTeamLogo
                          ? <img src={f.homeTeamLogo} alt={f.homeTeam} className="w-6 h-6 object-contain flex-shrink-0" />
                          : <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black flex-shrink-0"
                              style={{ background: "rgba(239,1,7,0.15)", color: "var(--red)" }}>{f.homeTeam.slice(0,2)}</div>
                        }
                      </div>
                      <div className="flex-shrink-0 w-14 text-center">
                        {hasScore && f.homeScore != null
                          ? <span className="text-sm font-black" style={{ color: "var(--text)", fontFamily: "var(--font-display)" }}>{f.homeScore}–{f.awayScore ?? 0}</span>
                          : <div>
                              <div className="text-xs font-black" style={{ color: "var(--text-3)", fontFamily: "var(--font-display)" }}>{f.time?.slice(0,5) || "TBC"}</div>
                              <div className="text-[9px]" style={{ color: "var(--text-3)" }}>{dateStr}</div>
                            </div>
                        }
                      </div>
                      <div className="flex-1 flex items-center gap-1.5">
                        {f.awayTeamLogo
                          ? <img src={f.awayTeamLogo} alt={f.awayTeam} className="w-6 h-6 object-contain flex-shrink-0" />
                          : <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black flex-shrink-0"
                              style={{ background: "var(--bg-alt)", color: "var(--text-3)" }}>{f.awayTeam.slice(0,2)}</div>
                        }
                        <span className="text-xs font-black truncate" style={{ color: "var(--text)", fontFamily: "var(--font-heading)" }}>{f.awayTeam}</span>
                      </div>
                    </div>
                    {f.watchPartyVenue && (
                      <div className="mt-2 px-2 py-1 rounded text-center"
                        style={{ background: "rgba(198,168,75,0.08)", border: "1px solid rgba(198,168,75,0.15)" }}>
                        <p className="text-[9px] font-bold" style={{ color: "var(--gold)", fontFamily: "var(--font-heading)" }}>
                          <i className="fa-solid fa-tv mr-1" />WATCH PARTY · {f.watchPartyVenue}
                        </p>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Col 2 — Countdown */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.1 }}>
            <h3 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2"
              style={{ fontFamily: "var(--font-heading)", color: "var(--text)" }}>
              <i className="fa-solid fa-clock text-xs" style={{ color: "var(--gold)" }} />Next Match
            </h3>
            <div className="card p-6 rounded text-center"
              style={{ background: "linear-gradient(135deg, rgba(239,1,7,0.06) 0%, rgba(12,28,61,0.1) 100%)", border: "1px solid rgba(239,1,7,0.15)" }}>
              {countdownDate ? (
                <>
                  <div className="mb-4">
                    <p className="text-xs font-bold uppercase tracking-widest mb-1"
                      style={{ color: "var(--gold)", fontFamily: "var(--font-heading)" }}>
                      {nextMatch?.competition || upcoming[0]?.competition || "Premier League"}
                    </p>
                    <p className="text-lg font-black" style={{ fontFamily: "var(--font-display)", color: "var(--text)" }}>
                      {nextMatch?.homeTeam || "Arsenal"} <span style={{ color: "var(--red)" }}>vs</span> {nextMatch?.awayTeam || upcoming[0]?.awayTeam || "TBC"}
                    </p>
                    <p className="text-xs mt-1" style={{ color: "var(--text-3)" }}>
                      {new Date(countdownDate).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
                      {countdownTime && ` · ${countdownTime}`}
                    </p>
                  </div>
                  {ended ? (
                    <p className="text-xl font-black animate-pulse" style={{ color: "var(--red)", fontFamily: "var(--font-display)" }}>
                      <i className="fa-solid fa-futbol mr-2" />MATCH IS LIVE!
                    </p>
                  ) : (
                    <div className="flex items-center justify-center gap-3 mb-4">
                      {[{ v: d, l: "Days" }, { v: h, l: "Hrs" }, { v: m, l: "Min" }, { v: s, l: "Sec" }].map(({ v, l }) => (
                        <div key={l} className="flex flex-col items-center">
                          <div className="w-14 h-14 flex items-center justify-center rounded"
                            style={{ background: "rgba(239,1,7,0.1)", border: "1px solid rgba(239,1,7,0.2)" }}>
                            <span className="text-2xl font-black" style={{ fontFamily: "var(--font-display)", color: "var(--text)" }}>{pad(v)}</span>
                          </div>
                          <span className="text-[9px] font-bold mt-1 uppercase tracking-widest"
                            style={{ color: "var(--text-3)", fontFamily: "var(--font-heading)" }}>{l}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {nextMatch?.watchPartyVenue && (
                    <div className="mb-4 px-3 py-2 rounded"
                      style={{ background: "rgba(198,168,75,0.08)", border: "1px solid rgba(198,168,75,0.2)" }}>
                      <p className="text-xs font-bold" style={{ color: "var(--gold)", fontFamily: "var(--font-heading)" }}>
                        <i className="fa-solid fa-tv mr-1.5" />Watch Party · {nextMatch.watchPartyVenue}
                      </p>
                    </div>
                  )}
                  <Link href="/match-viewings" className="btn-arsenal w-full justify-center text-xs" style={{ height: 38 }}>
                    <i className="fa-solid fa-location-dot" />Find Viewing Venue
                  </Link>
                </>
              ) : (
                <div style={{ color: "var(--text-3)" }}>
                  <i className="fa-solid fa-futbol text-4xl mb-3 block opacity-20" />
                  <p className="text-sm">No upcoming match scheduled</p>
                  <Link href="/season-stats" className="btn-arsenal-outline mt-4 text-xs" style={{ height: 36 }}>
                    View Fixtures
                  </Link>
                </div>
              )}
            </div>
          </motion.div>

          {/* Col 3 — Viewing Centers */}
          <motion.div initial={{ opacity: 0, x: 16 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.6, delay: 0.2 }}>
            <h3 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2"
              style={{ fontFamily: "var(--font-heading)", color: "var(--text)" }}>
              <i className="fa-solid fa-location-dot text-xs" style={{ color: "#10B981" }} />Viewing Centers
            </h3>
            <div className="space-y-2">
              {matchViewings.slice(0, 4).map((mv, i) => (
                <motion.div key={mv.id}
                  initial={{ opacity: 0, x: 8 }} animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: i * 0.07 }}>
                  <Link href="/match-viewings"
                    className="group block card p-3 rounded transition-all duration-200"
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(16,185,129,0.4)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-xs font-bold leading-snug group-hover:text-emerald-500 transition-colors"
                        style={{ color: "var(--text)", fontFamily: "var(--font-heading)" }}>{mv.match_title}</p>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0"
                        style={{ background: mv.is_free ? "rgba(16,185,129,0.1)" : "rgba(198,168,75,0.1)", color: mv.is_free ? "#10B981" : "var(--gold)", fontFamily: "var(--font-heading)" }}>
                        {mv.is_free ? "FREE" : `GH₵${mv.entry_fee}`}
                      </span>
                    </div>
                    <p className="text-[10px] flex items-center gap-1" style={{ color: "var(--text-3)" }}>
                      <i className="fa-solid fa-location-dot text-[9px]" style={{ color: "#10B981" }} />
                      {mv.venue}
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: "var(--text-3)" }}>
                      <i className="fa-solid fa-calendar mr-1" />
                      {new Date(mv.match_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      {mv.kickoff_time && ` · ${mv.kickoff_time}`}
                    </p>
                  </Link>
                </motion.div>
              ))}
              {matchViewings.length === 0 && (
                <div className="card p-6 text-center" style={{ color: "var(--text-3)" }}>
                  <i className="fa-solid fa-tv text-3xl mb-2 block opacity-20" />
                  <p className="text-sm">No viewings scheduled</p>
                </div>
              )}
              <Link href="/match-viewings"
                className="block text-center text-xs font-bold uppercase tracking-wider py-2.5 rounded transition-all mt-2"
                style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", color: "#10B981", fontFamily: "var(--font-heading)" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(16,185,129,0.15)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(16,185,129,0.08)"; }}>
                <i className="fa-solid fa-arrow-right mr-1.5" />All Viewing Centers
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
