"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

type SessionRow = {
  id: number;
  tokenHash: string;
  name?: string;
  username?: string;
  membershipNumber?: string;
  deviceLabel?: string;
  ipAddress?: string;
  lastSeenAt?: string;
  createdAt?: string;
  isCurrent?: boolean;
  type: "admin" | "member";
};

export default function AdminSessionsPage() {
  const [tab, setTab] = useState<"admin" | "member">("admin");
  const [adminSessions, setAdminSessions] = useState<SessionRow[]>([]);
  const [memberSessions, setMemberSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetch("/api/admin/sessions", { cache: "no-store" })
      .then(r => (r.ok ? r.json() : {}))
      .then(d => {
        setAdminSessions(d.adminSessions || []);
        setMemberSessions(d.memberSessions || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const revoke = async (s: SessionRow) => {
    if (s.isCurrent) {
      toast.error("Cannot revoke your current session here — use logout.");
      return;
    }
    if (!confirm(`Revoke this ${s.type} session?`)) return;
    const res = await fetch("/api/admin/sessions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tokenHash: s.tokenHash, type: s.type }),
    });
    if (res.ok) {
      toast.success("Session revoked");
      load();
    } else toast.error("Failed to revoke");
  };

  const list = tab === "admin" ? adminSessions : memberSessions;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black text-white" style={{ fontFamily: "var(--font-display)" }}>
          ACTIVE SESSIONS
        </h1>
        <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
          Devices where admins and members are currently signed in
        </p>
      </div>

      <div className="flex gap-2">
        {(["admin", "member"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 py-2 text-xs font-bold uppercase rounded-sm"
            style={{
              background: tab === t ? "rgba(239,1,7,0.15)" : "rgba(255,255,255,0.05)",
              border: `1px solid ${tab === t ? "rgba(239,1,7,0.35)" : "rgba(255,255,255,0.08)"}`,
              color: tab === t ? "#fff" : "rgba(255,255,255,0.5)",
            }}
          >
            {t} ({t === "admin" ? adminSessions.length : memberSessions.length})
          </button>
        ))}
        <button onClick={load} className="ml-auto px-3 py-2 text-xs" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
          Refresh
        </button>
      </div>

      {loading ? (
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>Loading…</p>
      ) : list.length === 0 ? (
        <p className="text-sm p-6 rounded-sm" style={{ background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.4)" }}>
          No active sessions. Upgrade to v2.0.0 for device labels and IP tracking.
        </p>
      ) : (
        <div className="space-y-2">
          {list.map(s => (
            <div
              key={s.tokenHash}
              className="flex flex-wrap items-center gap-3 p-4 rounded-sm"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: `1px solid ${s.isCurrent ? "rgba(198,168,75,0.35)" : "rgba(255,255,255,0.06)"}`,
              }}
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(239,1,7,0.12)" }}>
                <i className="fa-solid fa-desktop text-sm" style={{ color: "var(--color-red)" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white">
                  {s.name || s.username}
                  {s.membershipNumber && (
                    <span className="ml-2 text-xs font-mono" style={{ color: "var(--color-gold)" }}>
                      #{s.membershipNumber}
                    </span>
                  )}
                  {s.isCurrent && (
                    <span className="ml-2 text-[10px] uppercase px-1.5 py-0.5 rounded" style={{ background: "rgba(198,168,75,0.2)", color: "#C6A84B" }}>
                      This device
                    </span>
                  )}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>
                  {s.deviceLabel || "Unknown device"}
                  {s.ipAddress && ` · ${s.ipAddress}`}
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.25)" }}>
                  Last active: {s.lastSeenAt ? new Date(s.lastSeenAt).toLocaleString() : "—"}
                </p>
              </div>
              {!s.isCurrent && (
                <button
                  onClick={() => revoke(s)}
                  className="text-xs px-3 py-1.5 rounded-sm font-bold"
                  style={{ border: "1px solid rgba(239,1,7,0.4)", color: "#EF0107" }}
                >
                  Revoke
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
