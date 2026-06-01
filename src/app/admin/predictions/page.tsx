"use client";
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, Button, FormGroup, Input, EmptyState, Badge, PageHeader, Alert } from "@/components/ui";
import { useApp } from "@/context/AppContext";
import toast from "react-hot-toast";

export default function AdminPredictionsPage() {
  const { settings } = useApp();
  const s = settings as any;
  const fixtures: any[] = s.arsenalFixtures || [];

  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [settling, setSettling] = useState<string|null>(null);
  const [settleForm, setSettleForm] = useState<Record<string,{home:number;away:number}>>({});

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/predictions?leaderboard=1");
      const d   = await res.json();
      if (d.success) setLeaderboard(d.leaderboard);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const buildRef = (f: any) => `Arsenal-vs-${(f.awayTeam||"").replace(/\s+/g,"-")}-${f.date}`;

  const settle = async (fixture: any) => {
    const ref = buildRef(fixture);
    const sc  = settleForm[ref] || { home:0, away:0 };
    setSettling(ref);
    try {
      const res = await fetch("/api/predictions", {
        method:"PATCH", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ fixtureRef:ref, actualHome:sc.home, actualAway:sc.away }),
      });
      const d = await res.json();
      if (d.success) { toast.success(`Settled ${d.settled} predictions`); load(); }
      else toast.error(d.error || "Failed");
    } finally { setSettling(null); }
  };

  const setScore = (ref: string, side: "home"|"away", v: number) =>
    setSettleForm(p => ({ ...p, [ref]: { ...p[ref], home:p[ref]?.home??0, away:p[ref]?.away??0, [side]:v } }));

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <PageHeader title="Score Predictor" subtitle="Settle predictions and view leaderboard" actions={
        <Button size="sm" variant="secondary" onClick={load}><i className="fa-solid fa-rotate mr-1"/>Refresh</Button>
      }/>

      <Alert variant="info" title="How settling works">
        When a match finishes, enter the actual score and click Settle. Members who predicted the exact score earn 5 pts, correct result earns 2 pts. Points are awarded automatically.
      </Alert>

      {/* Settle fixtures */}
      <Card>
        <CardHeader><CardTitle>Settle Predictions</CardTitle></CardHeader>
        <CardContent>
          {fixtures.filter(f => f.status === "upcoming" || f.status === "result").length === 0 ? (
            <EmptyState icon="fa-futbol" title="No fixtures" desc="Add fixtures in Matches & Fixtures settings"/>
          ) : (
            <div className="space-y-4">
              {fixtures.map((f: any) => {
                const ref = buildRef(f);
                const sc  = settleForm[ref] || { home:0, away:0 };
                return (
                  <div key={ref} className="flex items-center gap-4 p-4 rounded-lg border flex-wrap"
                    style={{ background:"var(--bg-card-alt)", borderColor:"var(--border-color)" }}>
                    <div className="flex-1 min-w-[200px]">
                      <p className="font-bold text-sm" style={{ color:"var(--text-primary)", fontFamily:"var(--font-heading)" }}>
                        {f.homeTeam||"Arsenal"} vs {f.awayTeam}
                      </p>
                      <p className="text-xs" style={{ color:"var(--text-muted)" }}>{f.competition} · {f.date}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input type="number" min={0} max={20} value={sc.home}
                        onChange={e=>setScore(ref,"home",Number(e.target.value))}
                        className="w-16 text-center"/>
                      <span className="font-black" style={{ color:"var(--text-muted)" }}>–</span>
                      <Input type="number" min={0} max={20} value={sc.away}
                        onChange={e=>setScore(ref,"away",Number(e.target.value))}
                        className="w-16 text-center"/>
                    </div>
                    <Button size="sm" onClick={() => settle(f)} disabled={settling===ref} className="btn-arsenal flex-shrink-0">
                      {settling===ref ? <i className="fa-solid fa-spinner fa-spin"/> : "Settle"}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Leaderboard */}
      <Card>
        <CardHeader><CardTitle><i className="fa-solid fa-trophy mr-2" style={{ color:"var(--color-gold)" }}/>Leaderboard</CardTitle></CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-8 text-center" style={{ color:"var(--text-muted)" }}><i className="fa-solid fa-spinner fa-spin text-2xl"/></div>
          ) : leaderboard.length === 0 ? (
            <EmptyState icon="fa-trophy" title="No predictions yet"/>
          ) : (
            <table className="w-full">
              <thead>
                <tr style={{ background:"var(--bg-secondary)", borderBottom:`1px solid var(--border-color)` }}>
                  {["#","Member","Points","Predictions","Exact Scores","Correct Results"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color:"var(--text-muted)", fontFamily:"var(--font-heading)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((e, i) => (
                  <tr key={e.member_id} className="transition-colors hover:bg-[var(--bg-card-hover)]" style={{ borderBottom:`1px solid var(--border-color)` }}>
                    <td className="px-4 py-3">{i===0?"🥇":i===1?"🥈":i===2?"🥉":<span className="font-bold text-sm" style={{ color:"var(--text-muted)" }}>{i+1}</span>}</td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-sm" style={{ color:"var(--text-primary)", fontFamily:"var(--font-heading)" }}>{e.member_name}</p>
                      <p className="text-xs" style={{ color:"var(--text-muted)" }}>{e.member_number}</p>
                    </td>
                    <td className="px-4 py-3 font-black text-base" style={{ fontFamily:"var(--font-display)", color:"var(--color-red)" }}>{e.total_points}</td>
                    <td className="px-4 py-3 text-sm" style={{ color:"var(--text-secondary)" }}>{e.total_predictions}</td>
                    <td className="px-4 py-3"><Badge variant="success">{e.exact_scores}</Badge></td>
                    <td className="px-4 py-3"><Badge variant="info">{e.correct_results}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
