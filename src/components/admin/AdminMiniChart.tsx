"use client";

export type ChartDatum = { label: string; value: number; color: string };

type Props = {
  title: string;
  data: ChartDatum[];
  emptyLabel?: string;
  icon?: string;
};

/** Lightweight bar chart for admin dashboards — no chart library dependency. */
export default function AdminMiniChart({ title, data, emptyLabel = "No data", icon }: Props) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const total = data.reduce((a, d) => a + d.value, 0);

  return (
    <div
      className="p-4 rounded-sm h-full"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="flex items-center gap-2 mb-4">
        {icon && <i className={icon} style={{ color: "var(--color-red)" }} />}
        <p className="text-xs font-bold uppercase tracking-wider text-white" style={{ fontFamily: "var(--font-heading)" }}>
          {title}
        </p>
        {total > 0 && (
          <span className="ml-auto text-[10px] font-bold" style={{ color: "rgba(255,255,255,0.35)", fontFamily: "var(--font-body)" }}>
            {total} total
          </span>
        )}
      </div>
      {total === 0 ? (
        <p className="text-xs py-6 text-center" style={{ color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-body)" }}>
          {emptyLabel}
        </p>
      ) : (
        <div className="space-y-3">
          {data.map((d) => {
            const pct = (d.value / max) * 100;
            const share = total ? Math.round((d.value / total) * 100) : 0;
            return (
              <div key={d.label}>
                <div className="flex justify-between text-[11px] mb-1">
                  <span style={{ color: "rgba(255,255,255,0.55)", fontFamily: "var(--font-body)" }}>{d.label}</span>
                  <span className="font-bold" style={{ color: d.color, fontFamily: "var(--font-display)" }}>
                    {d.value}
                    <span className="font-normal opacity-60 ml-1">({share}%)</span>
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, background: d.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
