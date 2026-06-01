"use client";
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, Button, EmptyState, Badge, PageHeader, Alert } from "@/components/ui";
import toast from "react-hot-toast";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export default function AdminFanOfMonthPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [crowning, setCrowning] = useState<number|null>(null);
  const now   = new Date();
  const year  = now.getFullYear();
  const month = now.getMonth() + 1;

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/fan-of-month?year=${year}&month=${month}`);
      const d   = await res.json();
      if (d.success) setData(d);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const crown = async (nominatedId: number) => {
    if (!confirm("Crown this member as Fan of the Month? This awards them 50 points.")) return;
    setCrowning(nominatedId);
    try {
      const res = await fetch("/api/fan-of-month", {
        method:"PATCH", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ nominatedId, year, month }),
      });
      const d = await res.json();
      if (d.success) { toast.success("Fan of the Month crowned! 50 pts awarded 🏆"); load(); }
      else toast.error(d.error || "Failed");
    } finally { setCrowning(null); }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <PageHeader title="Fan of the Month" subtitle={`Manage nominations for ${MONTHS[month-1]} ${year}`} actions={
        <Button size="sm" variant="secondary" onClick={load}><i className="fa-solid fa-rotate mr-1"/>Refresh</Button>
      }/>

      {loading ? (
        <div className="skeleton h-48 rounded-xl"/>
      ) : (
        <>
          {/* Current winner */}
          {data?.winner && (
            <div className="p-6 rounded-xl text-center" style={{ background:"linear-gradient(135deg,#C6A84B,#E8C97A)", boxShadow:"var(--shadow-lg)" }}>
              <div className="text-4xl mb-2">🏆</div>
              <p className="text-sm font-bold uppercase tracking-widest mb-2" style={{ color:"rgba(26,10,10,0.6)", fontFamily:"var(--font-heading)" }}>
                Winner — {MONTHS[month-1]} {year}
              </p>
              <div className="w-20 h-20 rounded-full mx-auto mb-3 overflow-hidden border-4 border-white shadow-lg">
                {data.winner.photo
                  ? <img src={data.winner.photo} className="w-full h-full object-cover" alt=""/>
                  : <div className="w-full h-full flex items-center justify-center text-2xl font-black" style={{ background:"rgba(26,10,10,0.1)", color:"#1A0A0A" }}>{data.winner.name?.[0]}</div>}
              </div>
              <h2 className="text-xl font-black" style={{ fontFamily:"var(--font-display)", color:"#1A0A0A" }}>{data.winner.name}</h2>
              <p className="text-sm" style={{ color:"rgba(26,10,10,0.6)" }}>{data.winner.tier} · {data.winner.membership_number}</p>
            </div>
          )}

          {/* Nominees */}
          <Card>
            <CardHeader><CardTitle>Nominations — {MONTHS[month-1]} {year} ({data?.nominees?.length || 0})</CardTitle></CardHeader>
            <CardContent className="p-0">
              {!data?.nominees?.length ? (
                <EmptyState icon="fa-star" title="No nominations yet" desc="Members can nominate via the Fan of the Month page"/>
              ) : (
                <div className="divide-y" style={{ borderColor:"var(--border-color)" }}>
                  {data.nominees.map((n: any, i: number) => (
                    <div key={n.nominated_id} className="flex items-center gap-4 p-4">
                      <span className="text-xl font-black w-8 text-center flex-shrink-0" style={{ fontFamily:"var(--font-display)", color:"var(--color-gold)" }}>{i+1}</span>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0"
                        style={{ background:"rgba(239,1,7,0.1)", color:"var(--color-red)", fontFamily:"var(--font-heading)" }}>
                        {n.photo ? <img src={n.photo} className="w-full h-full object-cover rounded-full" alt=""/> : n.name?.[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm" style={{ color:"var(--text-primary)", fontFamily:"var(--font-heading)" }}>{n.name}</p>
                        <p className="text-xs" style={{ color:"var(--text-muted)" }}>{n.tier} · {n.membership_number}</p>
                        {n.reason && <p className="text-xs mt-0.5 italic truncate" style={{ color:"var(--text-muted)" }}>"{n.reason}"</p>}
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-center">
                          <p className="font-black text-xl" style={{ color:"var(--color-red)", fontFamily:"var(--font-display)" }}>{n.vote_count}</p>
                          <p className="text-xs" style={{ color:"var(--text-muted)" }}>votes</p>
                        </div>
                        {data.winner?.nominated_id === n.nominated_id ? (
                          <Badge variant="gold">Winner 🏆</Badge>
                        ) : (
                          <Button size="sm" onClick={() => crown(n.nominated_id)} disabled={crowning === n.nominated_id} className="btn-arsenal">
                            {crowning === n.nominated_id ? <i className="fa-solid fa-spinner fa-spin"/> : "Crown"}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Past winners */}
          {data?.history?.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Past Winners</CardTitle></CardHeader>
              <CardContent className="p-0">
                <div className="divide-y" style={{ borderColor:"var(--border-color)" }}>
                  {data.history.map((h: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-4">
                      <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0" style={{ background:"rgba(198,168,75,0.1)" }}>
                        {h.photo ? <img src={h.photo} className="w-full h-full object-cover" alt=""/> : <div className="w-full h-full flex items-center justify-center font-bold" style={{ color:"var(--color-gold)" }}>{h.name?.[0]}</div>}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm" style={{ color:"var(--text-primary)" }}>{h.name}</p>
                        <p className="text-xs" style={{ color:"var(--text-muted)" }}>{MONTHS[(h.period_month||1)-1]} {h.period_year}</p>
                      </div>
                      <Badge variant="gold">{h.tier}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
