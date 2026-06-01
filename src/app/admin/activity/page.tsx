"use client";

import { useEffect, useState } from "react";

type Activity = {
  id: number;
  actorType: "member" | "admin";
  actorId?: string | number;
  actorName?: string;
  action: string;
  detail?: string;
  ipAddress?: string;
  createdAt: string;
};

export default function AdminActivityPage() {
  const [filter, setFilter] = useState<"all" | "member" | "admin">("all");
  const [rows, setRows] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetch(`/api/admin/activity?type=${filter}&limit=150`, { cache: "no-store" })
      .then(r => (r.ok ? r.json() : { activities: [] }))
      .then(d => setRows(d.activities || []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [filter]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-white" style={{ fontFamily: "var(--font-display)" }}>
            ACTIVITY LOG
          </h1>
          <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
            Member and admin actions stored in the database
          </p>
        </div>
        <div className="flex gap-2">
          {(["all", "member", "admin"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3 py-1.5 text-xs font-bold uppercase rounded-sm"
              style={{
                background: filter === f ? "rgba(239,1,7,0.2)" : "rgba(255,255,255,0.05)",
                border: `1px solid ${filter === f ? "rgba(239,1,7,0.4)" : "rgba(255,255,255,0.1)"}`,
                color: filter === f ? "#fff" : "rgba(255,255,255,0.5)",
              }}
            >
              {f}
            </button>
          ))}
          <button onClick={load} className="px-3 py-1.5 text-xs rounded-sm" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
            <i className="fa-solid fa-rotate" />
          </button>
        </div>
      </div>

      <div className="rounded-sm overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
        {loading ? (
          <p className="p-8 text-center text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
            Loading…
          </p>
        ) : rows.length === 0 ? (
          <p className="p-8 text-center text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
            No activity yet. Run database upgrade v2.0.0 to enable logging.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.04)" }}>
                <th className="text-left p-3 text-xs uppercase" style={{ color: "rgba(255,255,255,0.4)" }}>When</th>
                <th className="text-left p-3 text-xs uppercase" style={{ color: "rgba(255,255,255,0.4)" }}>Type</th>
                <th className="text-left p-3 text-xs uppercase" style={{ color: "rgba(255,255,255,0.4)" }}>Actor</th>
                <th className="text-left p-3 text-xs uppercase" style={{ color: "rgba(255,255,255,0.4)" }}>Action</th>
                <th className="text-left p-3 text-xs uppercase" style={{ color: "rgba(255,255,255,0.4)" }}>Detail</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={`${r.actorType}-${r.id}`} style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                  <td className="p-3 text-xs whitespace-nowrap" style={{ color: "rgba(255,255,255,0.5)" }}>
                    {new Date(r.createdAt).toLocaleString()}
                  </td>
                  <td className="p-3">
                    <span
                      className="text-[10px] font-bold uppercase px-2 py-0.5 rounded"
                      style={{
                        background: r.actorType === "admin" ? "rgba(198,168,75,0.15)" : "rgba(16,185,129,0.15)",
                        color: r.actorType === "admin" ? "#C6A84B" : "#10B981",
                      }}
                    >
                      {r.actorType}
                    </span>
                  </td>
                  <td className="p-3 text-white text-xs">{r.actorName || r.actorId}</td>
                  <td className="p-3 text-xs font-semibold text-white">{r.action}</td>
                  <td className="p-3 text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>
                    {r.detail || "—"}
                    {r.ipAddress && <span className="block text-[10px] opacity-60">IP: {r.ipAddress}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
