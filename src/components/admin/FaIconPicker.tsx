"use client";

import { useMemo, useState } from "react";
import { FA_ICON_OPTIONS } from "@/lib/fontawesomeIcons";

type FaIconPickerProps = {
  value: string;
  onChange: (faClass: string) => void;
  label?: string;
  allowCustom?: boolean;
  compact?: boolean;
};

export default function FaIconPicker({ value, onChange, label, allowCustom = true, compact = false }: FaIconPickerProps) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return FA_ICON_OPTIONS;
    return FA_ICON_OPTIONS.filter(
      (o) =>
        o.label.toLowerCase().includes(s) ||
        o.class.toLowerCase().includes(s) ||
        o.group.toLowerCase().includes(s)
    );
  }, [q]);

  const groups = useMemo(() => {
    const m = new Map<string, typeof FA_ICON_OPTIONS>();
    for (const o of filtered) {
      if (!m.has(o.group)) m.set(o.group, []);
      m.get(o.group)!.push(o);
    }
    return m;
  }, [filtered]);

  const pickerGrid = (
    <div className={`rounded-md p-3 max-h-64 overflow-y-auto space-y-3 ${compact ? "absolute right-0 top-full mt-1 z-50 w-72 shadow-xl" : ""}`}
      style={{ background: compact ? "var(--bg-card, #16213E)" : "rgba(0,0,0,0.35)", border: "1px solid var(--border-color, rgba(255,255,255,0.08))" }}>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search icons…"
        className="form-input text-sm mb-2"
      />
      {[...groups.entries()].map(([group, items]) => (
        <div key={group}>
          <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5 text-white/35" style={{ fontFamily: "var(--font-heading)" }}>
            {group}
          </p>
          <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5">
            {items.map((o) => (
              <button
                key={o.id}
                type="button"
                title={o.label}
                onClick={() => {
                  onChange(o.class);
                  setOpen(false);
                }}
                className="aspect-square rounded-sm flex items-center justify-center transition-all hover:scale-105"
                style={{
                  background: value === o.class ? "rgba(239,1,7,0.2)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${value === o.class ? "rgba(239,1,7,0.5)" : "rgba(255,255,255,0.06)"}`,
                }}
              >
                <i className={o.class} style={{ fontSize: 14, color: value === o.class ? "#EF0107" : "rgba(255,255,255,0.65)" }} />
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  if (compact) {
    return (
      <div className="relative flex-shrink-0">
        <button
          type="button"
          title={value || "Pick icon"}
          onClick={() => setOpen((v) => !v)}
          className="w-9 h-9 rounded-sm flex items-center justify-center transition-all hover:scale-105"
          style={{ background: "rgba(239,1,7,0.12)", border: "1px solid rgba(239,1,7,0.25)" }}
        >
          <i className={value || "fa-solid fa-icons"} style={{ color: "var(--color-red)", fontSize: 14 }} />
        </button>
        {open && pickerGrid}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {label && (
        <label className="form-label block">{label}</label>
      )}
      <div className="flex items-center gap-3 p-3 rounded-md" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
        <div className="w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: "rgba(239,1,7,0.12)" }}>
          <i className={value || "fa-solid fa-icons"} style={{ color: "var(--color-red)", fontSize: 18 }} />
        </div>
        <div className="flex-1 min-w-0">
          {allowCustom ? (
            <input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="form-input text-sm"
              placeholder="fa-solid fa-shield-halved"
            />
          ) : (
            <p className="text-xs font-mono truncate text-white/70">{value || "—"}</p>
          )}
        </div>
        <button type="button" onClick={() => setOpen((v) => !v)} className="text-xs font-bold px-3 py-2 rounded-sm"
          style={{ background: "rgba(239,1,7,0.15)", color: "var(--color-red)", fontFamily: "var(--font-heading)" }}>
          {open ? "Close" : "Pick icon"}
        </button>
      </div>
      {open && pickerGrid}
    </div>
  );
}
