"use client";
import { useState } from "react";

interface Props { items?: string[] }

const DEFAULTS = [
  "🔴 Arsenal vs Chelsea – Watch Party at Silver Star Tower, Saturday 5:30pm",
  "🏆 ASC Ghana Annual Awards Night – Nominations now open",
  "🎟️ Emirates Stadium tickets for 25/26 season – Members apply now",
  "📢 Renewal window open – Renew before May 31 to keep your benefits",
  "⚽ Victoria Concordia Crescit — Arsenal Supporters Club Ghana",
];

export default function NewsTicker({ items }: Props) {
  const [paused, setPaused] = useState(false);
  const list = items?.length ? items : DEFAULTS;
  const text = [...list, ...list].join("   ·   ");
  const duration = Math.max(30, list.length * 10);

  return (
    <div className="w-full overflow-hidden relative"
      style={{
        background: "linear-gradient(90deg, rgba(139,0,0,0.3) 0%, rgba(239,1,7,0.12) 50%, rgba(139,0,0,0.3) 100%)",
        borderBottom: "1px solid rgba(239,1,7,0.2)",
        height: 36,
      }}>
      <div className="flex items-center h-full">
        {/* Badge */}
        <div className="flex-shrink-0 flex items-center gap-2 px-4 h-full z-10"
          style={{ background: "var(--red)", minWidth: 80 }}>
          <span className="live-dot" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white"
            style={{ fontFamily: "var(--font-heading)" }}>Live</span>
        </div>
        <div className="w-px h-4 flex-shrink-0" style={{ background: "rgba(239,1,7,0.4)" }} />

        {/* Scrolling text */}
        <div className="flex-1 overflow-hidden"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}>
          <div className="ticker-inner"
            style={{
              animationDuration: `${duration}s`,
              "--ticker-state": paused ? "paused" : "running",
            } as React.CSSProperties}>
            <span className="text-xs px-6 whitespace-nowrap"
              style={{ color: "rgba(255,255,255,0.65)", fontFamily: "var(--font-body)" }}>
              {text}
            </span>
          </div>
        </div>

        <button onClick={() => setPaused(p => !p)}
          className="flex-shrink-0 px-3 h-full flex items-center transition-colors"
          style={{ color: "rgba(255,255,255,0.3)" }}
          onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
          onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
          aria-label={paused ? "Resume" : "Pause"}>
          <i className={`fa-solid ${paused ? "fa-play" : "fa-pause"} text-[9px]`} />
        </button>
      </div>
    </div>
  );
}
