"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";

type Session = {
  id: number;
  tokenHash: string;
  deviceLabel?: string;
  ipAddress?: string;
  lastSeenAt?: string;
  createdAt?: string;
  isCurrent?: boolean;
};

export default function MemberSessionsPage() {
  const { isLoggedIn } = useAuth();
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) router.push("/auth/login");
  }, [isLoggedIn, router]);

  const load = () => {
    fetch("/api/member/sessions", { cache: "no-store" })
      .then(r => (r.ok ? r.json() : { sessions: [] }))
      .then(d => setSessions(d.sessions || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isLoggedIn) load();
  }, [isLoggedIn]);

  const revoke = async (tokenHash: string) => {
    const res = await fetch("/api/member/sessions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tokenHash }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      toast.success("Device signed out");
      load();
    } else toast.error(data.error || "Could not revoke session");
  };

  if (!isLoggedIn) return null;

  return (
    <main style={{ background: "var(--bg-primary)" }}>
      <Navbar />
      <div className="min-h-screen pt-[120px] pb-20 px-4">
        <div className="max-w-2xl mx-auto">
          <Link href="/members/profile" className="text-xs mb-4 inline-flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
            <i className="fa-solid fa-arrow-left" /> Back to profile
          </Link>
          <h1 className="text-2xl font-black mb-2" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
            Active Sessions
          </h1>
          <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>
            Devices where you are signed in to the member portal
          </p>

          {loading ? (
            <p style={{ color: "var(--text-muted)" }}>Loading…</p>
          ) : sessions.length === 0 ? (
            <p className="arsenal-card p-6 text-sm" style={{ color: "var(--text-muted)" }}>
              Only this device is active, or session tracking requires a database upgrade.
            </p>
          ) : (
            <div className="space-y-3">
              {sessions.map(s => (
                <div key={s.tokenHash} className="arsenal-card p-4 flex items-center gap-4">
                  <i className="fa-solid fa-desktop text-xl" style={{ color: "var(--color-red)" }} />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
                      {s.deviceLabel || "Unknown device"}
                      {s.isCurrent && (
                        <span className="ml-2 text-[10px] uppercase px-1.5 py-0.5 rounded" style={{ background: "rgba(239,1,7,0.12)", color: "var(--color-red)" }}>
                          This device
                        </span>
                      )}
                    </p>
                    {s.ipAddress && (
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                        IP: {s.ipAddress}
                      </p>
                    )}
                    <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                      Last active: {s.lastSeenAt ? new Date(s.lastSeenAt).toLocaleString() : "—"}
                    </p>
                  </div>
                  {!s.isCurrent && (
                    <button
                      type="button"
                      onClick={() => revoke(s.tokenHash)}
                      className="text-xs px-3 py-1.5 rounded-lg font-bold"
                      style={{ border: "1px solid var(--color-red)", color: "var(--color-red)" }}
                    >
                      Sign out
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </main>
  );
}
