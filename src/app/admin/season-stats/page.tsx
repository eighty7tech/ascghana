"use client";
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, Button, FormGroup, Input, Select, Modal, EmptyState, Badge, PageHeader } from "@/components/ui";
import toast from "react-hot-toast";

const COMPETITIONS = ["Premier League","FA Cup","EFL Cup","Champions League","Europa League","Community Shield","Pre-Season","Other"];

const EMPTY = { season:"2025/26", competition:"Premier League", played:0, won:0, drawn:0, lost:0, goalsFor:0, goalsAgainst:0, position:1, points:0, topScorer:"", topScorerGoals:0, assistLeader:"", assistLeaderAssists:0, cleanSheets:0 };

export default function AdminSeasonStatsPage() {
  const [stats, setStats]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]     = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/season-stats");
      const d   = await res.json();
      if (d.success) setStats(d.stats);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  const save = async () => {
    if (!form.season) { toast.error("Season is required"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/season-stats", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(form) });
      const d   = await res.json();
      if (d.success) { toast.success("Stats saved"); setShowForm(false); setForm(EMPTY); load(); }
      else toast.error(d.error || "Failed");
    } finally { setSaving(false); }
  };

  const del = async (id: number) => {
    if (!confirm("Delete this entry?")) return;
    await fetch(`/api/season-stats?id=${id}`, { method:"DELETE" });
    toast.success("Deleted"); load();
  };

  const n = (field: string) => ({ type:"number" as const, value:form[field], onChange:(e:any) => set(field, Number(e.target.value)) });

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <PageHeader title="Season Stats" subtitle="Manage Arsenal season performance data" actions={
        <Button onClick={() => { setForm(EMPTY); setShowForm(true); }} className="btn-arsenal">
          <i className="fa-solid fa-plus mr-2"/>Add Stats
        </Button>
      }/>

      {loading ? (
        <div className="space-y-4">{[1,2].map(i=><div key={i} className="skeleton h-32 rounded-xl"/>)}</div>
      ) : stats.length === 0 ? (
        <EmptyState icon="fa-chart-bar" title="No stats yet" desc="Add Arsenal's season performance data" action={
          <Button onClick={() => { setForm(EMPTY); setShowForm(true); }} className="btn-arsenal">Add Stats</Button>
        }/>
      ) : (
        <div className="space-y-4">
          {stats.map(s => {
            const gd = s.goals_for - s.goals_against;
            return (
              <Card key={s.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3 flex-wrap">
                        <h3 className="font-black text-lg" style={{ fontFamily:"var(--font-display)", color:"var(--text-primary)" }}>{s.competition}</h3>
                        <Badge variant="gold">{s.season}</Badge>
                        <Badge variant="red">#{s.position}</Badge>
                      </div>
                      <div className="grid grid-cols-4 md:grid-cols-8 gap-3 text-center">
                        {[["P",s.played,"var(--text-primary)"],["W",s.won,"#10B981"],["D",s.drawn,"#F59E0B"],["L",s.lost,"#EF4444"],["GF",s.goals_for,"#10B981"],["GA",s.goals_against,"#EF4444"],["GD",gd>=0?`+${gd}`:gd,gd>=0?"#10B981":"#EF4444"],["Pts",s.points,"var(--color-red)"]].map(([label,val,color]) => (
                          <div key={label as string} className="rounded p-2" style={{ background:"var(--bg-secondary)" }}>
                            <p className="text-lg font-black" style={{ fontFamily:"var(--font-display)", color:color as string }}>{val}</p>
                            <p className="text-[10px] font-bold uppercase" style={{ color:"var(--text-muted)", fontFamily:"var(--font-heading)" }}>{label}</p>
                          </div>
                        ))}
                      </div>
                      {(s.top_scorer || s.assist_leader) && (
                        <div className="flex gap-4 mt-3 flex-wrap">
                          {s.top_scorer && <p className="text-xs" style={{ color:"var(--text-muted)" }}><i className="fa-solid fa-futbol mr-1" style={{ color:"var(--color-red)" }}/>{s.top_scorer} ({s.top_scorer_goals})</p>}
                          {s.assist_leader && <p className="text-xs" style={{ color:"var(--text-muted)" }}><i className="fa-solid fa-hands-helping mr-1" style={{ color:"#3B82F6" }}/>{s.assist_leader} ({s.assist_leader_assists})</p>}
                          <p className="text-xs" style={{ color:"var(--text-muted)" }}><i className="fa-solid fa-shield-halved mr-1" style={{ color:"#10B981" }}/>{s.clean_sheets} clean sheets</p>
                        </div>
                      )}
                    </div>
                    <button onClick={() => del(s.id)} className="text-sm px-3 py-1.5 rounded flex-shrink-0" style={{ background:"rgba(239,68,68,0.08)", color:"#EF4444" }}>
                      <i className="fa-solid fa-trash"/>
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add / Update Season Stats" size="lg">
        <div className="p-5 space-y-5">
          <div className="grid md:grid-cols-2 gap-4">
            <FormGroup label="Season">
              <Input value={form.season} onChange={e=>set("season",e.target.value)} placeholder="2025/26"/>
            </FormGroup>
            <FormGroup label="Competition">
              <Select value={form.competition} onChange={e=>set("competition",e.target.value)}>
                {COMPETITIONS.map(c=><option key={c}>{c}</option>)}
              </Select>
            </FormGroup>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {[["Played","played"],["Won","won"],["Drawn","drawn"],["Lost","lost"],["Position","position"],["Points","points"]].map(([label,field]) => (
              <FormGroup key={field} label={label}><Input min={0} {...n(field)}/></FormGroup>
            ))}
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <FormGroup label="Goals For"><Input min={0} {...n("goalsFor")}/></FormGroup>
            <FormGroup label="Goals Against"><Input min={0} {...n("goalsAgainst")}/></FormGroup>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <FormGroup label="Top Scorer"><Input value={form.topScorer} onChange={e=>set("topScorer",e.target.value)} placeholder="Bukayo Saka"/></FormGroup>
            <FormGroup label="Goals"><Input type="number" min={0} value={form.topScorerGoals} onChange={e=>set("topScorerGoals",Number(e.target.value))}/></FormGroup>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <FormGroup label="Assist Leader"><Input value={form.assistLeader} onChange={e=>set("assistLeader",e.target.value)} placeholder="Leandro Trossard"/></FormGroup>
            <FormGroup label="Assists"><Input type="number" min={0} value={form.assistLeaderAssists} onChange={e=>set("assistLeaderAssists",Number(e.target.value))}/></FormGroup>
          </div>
          <FormGroup label="Clean Sheets"><Input type="number" min={0} value={form.cleanSheets} onChange={e=>set("cleanSheets",Number(e.target.value))}/></FormGroup>
          <div className="flex gap-3 pt-2">
            <Button onClick={save} disabled={saving} className="btn-arsenal flex-1">
              {saving ? <><i className="fa-solid fa-spinner fa-spin mr-2"/>Saving…</> : "Save Stats"}
            </Button>
            <Button variant="secondary" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
