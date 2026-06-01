"use client";
import { useState, useRef } from "react";
import { useApp } from "@/context/AppContext";
import { Card, CardHeader, CardTitle, CardContent, Button, FormGroup, Input, Switch, Select, Modal, Badge } from "@/components/ui";
import toast from "react-hot-toast";
import { uploadLocalImage } from "@/lib/clientUploads";
import ImageUploadField from "@/components/ImageUploadField";

const STATUS_OPTS = ["upcoming","live","result","postponed"];
const COMP_OPTS = ["Premier League","FA Cup","EFL Cup","Champions League","Europa League","Community Shield","Pre-Season","Other"];

const EMPTY_FIXTURE: any = {
  homeTeam:"Arsenal", awayTeam:"", competition:"Premier League",
  homeTeamLogo:"", awayTeamLogo:"", date:"", time:"17:30", venue:"Emirates Stadium",
  status:"upcoming", homeScore:null, awayScore:null, isActive:true,
  watchPartyVenue:"", watchPartyTime:"", ticketLink:"/events", sortOrder:0,
};

const EMPTY_NEXT_MATCH: any = {
  title:"", homeTeam:"Arsenal", awayTeam:"", competition:"Premier League",
  date:"", time:"17:30", venue:"Emirates Stadium", homeTeamLogo:"", awayTeamLogo:"",
  ticketLink:"/members/tickets", watchPartyVenue:"", watchPartyTime:"", isActive:true,
};

export default function MatchesAdminPage() {
  const { settings, updateSettings } = useApp();
  const s = settings as any;
  const [tab, setTab] = useState<"fixtures"|"countdown">("fixtures");
  const [saving, setSaving] = useState(false);

  /* ── Arsenal Fixtures ── */
  const [fixtures, setFixtures] = useState<any[]>([...(s.arsenalFixtures || [])]);
  const [showFixtures, setShowFixtures] = useState<boolean>(s.showArsenalFixturesSection !== false);
  const [fixtureModal, setFixtureModal] = useState(false);
  const [editFx, setEditFx] = useState<any>(null);
  const [fxForm, setFxForm] = useState<any>(EMPTY_FIXTURE);
  const homeLogoRef = useRef<HTMLInputElement>(null);
  const awayLogoRef = useRef<HTMLInputElement>(null);

  const openAddFx = () => { setFxForm({ ...EMPTY_FIXTURE, sortOrder: fixtures.length }); setEditFx(null); setFixtureModal(true); };
  const openEditFx = (f: any) => { setFxForm({ ...f }); setEditFx(f); setFixtureModal(true); };

  const saveFx = async () => {
    if (!fxForm.awayTeam && !fxForm.homeTeam) { toast.error("Add at least one team"); return; }
    const id = editFx ? editFx.id : Date.now();
    const newFx = { ...fxForm, id };
    const updated = editFx ? fixtures.map(f => f.id === editFx.id ? newFx : f) : [...fixtures, newFx];
    setFixtures(updated);
    setFixtureModal(false);
  };

  const deleteFx = (id: any) => {
    if (!confirm("Delete this fixture?")) return;
    setFixtures(fixtures.filter(f => f.id !== id));
  };

  const uploadLogo = async (ref: React.RefObject<HTMLInputElement | null>, field: "homeTeamLogo"|"awayTeamLogo") => {
    const file = ref.current?.files?.[0];
    if (!file) return;
    try {
      const url = await uploadLocalImage(file, "logo");
      setFxForm((p: any) => ({ ...p, [field]: url }));
      toast.success("Logo uploaded");
    } catch {
      toast.error("Upload failed");
    }
    if (ref.current) ref.current.value = "";
  };

  /* ── Match Countdown ── */
  const [match, setMatch] = useState({ ...EMPTY_NEXT_MATCH, ...(s.nextMatch || {}) });
  const [showCountdown, setShowCountdown] = useState<boolean>(s.showMatchCountdownSection !== false);
  const nmHomeRef = useRef<HTMLInputElement>(null);
  const nmAwayRef = useRef<HTMLInputElement>(null);

  const uploadCountdownLogo = async (ref: React.RefObject<HTMLInputElement | null>, field: "homeTeamLogo"|"awayTeamLogo") => {
    const file = ref.current?.files?.[0];
    if (!file) return;
    try {
      const url = await uploadLocalImage(file, "logo");
      setMatch((p: any) => ({ ...p, [field]: url }));
      toast.success("Logo uploaded");
    } catch {
      toast.error("Upload failed");
    }
    if (ref.current) ref.current.value = "";
  };

  const saveAll = async () => {
    setSaving(true);
    await updateSettings({
      arsenalFixtures:           fixtures,
      showArsenalFixturesSection: showFixtures,
      nextMatch:                 match,
      showMatchCountdownSection: showCountdown,
    } as any);
    setSaving(false);
    toast.success("Match settings saved");
  };

  const TABS = [
    { key:"fixtures",  label:"Fixtures & Results" },
    { key:"countdown", label:"Match Countdown" },
  ] as const;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <span className="section-red-line" />
          <h1 className="text-3xl font-black" style={{ fontFamily:"var(--font-display)", color:"var(--text-primary)" }}>MATCH SETTINGS</h1>
          <p className="text-sm mt-1" style={{ color:"var(--text-muted)" }}>Manage Arsenal fixtures, results and the match countdown</p>
        </div>
        <Button onClick={saveAll} disabled={saving} className="btn-arsenal">
          <i className="fa-solid fa-save mr-2" />{saving ? "Saving…" : "Save All"}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-sm w-fit" style={{ background:"rgba(255,255,255,0.04)", border:"1px solid var(--border-color)" }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="px-5 py-2 text-xs font-black uppercase tracking-wider rounded-sm transition-all"
            style={{ fontFamily:"var(--font-heading)", background:tab===t.key?"var(--color-red)":"transparent", color:tab===t.key?"#fff":"rgba(255,255,255,0.4)" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Fixtures ── */}
      {tab === "fixtures" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle><i className="fa-solid fa-futbol mr-2" style={{ color:"var(--color-red)" }} />Arsenal Fixtures & Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Switch checked={showFixtures} onChange={setShowFixtures} />
                  <span className="text-sm" style={{ color:"var(--text-muted)" }}>Show on homepage</span>
                </div>
                <Button onClick={openAddFx} size="sm" className="btn-arsenal">
                  <i className="fa-solid fa-plus mr-1" />Add Fixture / Result
                </Button>
              </div>

              {fixtures.length === 0 ? (
                <p className="text-center py-8 text-sm" style={{ color:"var(--text-muted)" }}>No fixtures yet. Add an upcoming match or recent result.</p>
              ) : (
                <div className="divide-y" style={{ borderColor:"var(--border-color)" }}>
                  {[...fixtures].sort((a,b) => new Date(a.date||0).getTime()-new Date(b.date||0).getTime()).map(fx => (
                    <div key={fx.id} className="flex items-center gap-4 py-3">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {fx.homeTeamLogo ? <img src={fx.homeTeamLogo} className="h-7 w-7 object-contain" alt="" /> : <div className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-black" style={{ background:"rgba(239,1,7,0.15)", color:"var(--color-red)" }}>{fx.homeTeam?.[0]||"A"}</div>}
                        <span className="text-sm font-bold" style={{ color:"var(--text-primary)" }}>{fx.homeTeam}</span>
                        <span className="text-xs px-1.5" style={{ color:"var(--text-muted)" }}>
                          {fx.status==="result" ? `${fx.homeScore??0} – ${fx.awayScore??0}` : "vs"}
                        </span>
                        <span className="text-sm font-bold" style={{ color:"var(--text-primary)" }}>{fx.awayTeam}</span>
                        {fx.awayTeamLogo ? <img src={fx.awayTeamLogo} className="h-7 w-7 object-contain" alt="" /> : <div className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-black" style={{ background:"rgba(255,255,255,0.06)", color:"rgba(255,255,255,0.5)" }}>{fx.awayTeam?.[0]||"?"}</div>}
                      </div>
                      <Badge variant={fx.status==="result"?"gold":fx.status==="live"?"success":"default"}>{fx.status}</Badge>
                      <span className="text-xs" style={{ color:"var(--text-muted)" }}>{fx.date}</span>
                      <div className="flex gap-2">
                        <button onClick={() => openEditFx(fx)} className="text-xs px-2 py-1 rounded" style={{ color:"var(--color-gold)" }}><i className="fa-solid fa-edit" /></button>
                        <button onClick={() => deleteFx(fx.id)} className="text-xs px-2 py-1 rounded" style={{ color:"var(--color-red)" }}><i className="fa-solid fa-trash" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Match Countdown ── */}
      {tab === "countdown" && (
        <Card>
          <CardHeader>
            <CardTitle><i className="fa-solid fa-hourglass-half mr-2" style={{ color:"var(--color-red)" }} />Homepage Match Countdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Switch checked={match.isActive} onChange={v => setMatch((p:any)=>({...p,isActive:v}))} />
              <span className="text-sm" style={{ color:"var(--text-muted)" }}>Show countdown section</span>
              <span className="mx-2 opacity-30">|</span>
              <Switch checked={showCountdown} onChange={setShowCountdown} />
              <span className="text-sm" style={{ color:"var(--text-muted)" }}>Show section in homepage</span>
            </div>
            <FormGroup label="Custom Title (optional — overrides 'Home vs Away')">
              <Input value={match.title||""} onChange={e=>setMatch((p:any)=>({...p,title:e.target.value}))} placeholder="e.g. Arsenal Watch Party — North London Derby" />
              <p className="text-xs mt-1" style={{ color:"var(--text-muted)" }}>If set, this title is shown instead of "Arsenal vs [away team]"</p>
            </FormGroup>
            <div className="grid md:grid-cols-3 gap-4">
              <FormGroup label="Home Team"><Input value={match.homeTeam||""} onChange={e=>setMatch((p:any)=>({...p,homeTeam:e.target.value}))}/></FormGroup>
              <FormGroup label="Away Team"><Input value={match.awayTeam||""} onChange={e=>setMatch((p:any)=>({...p,awayTeam:e.target.value}))} placeholder="Opponent"/></FormGroup>
              <FormGroup label="Competition"><Input value={match.competition||""} onChange={e=>setMatch((p:any)=>({...p,competition:e.target.value}))}/></FormGroup>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <FormGroup label="Match Date"><Input type="date" value={match.date||""} onChange={e=>setMatch((p:any)=>({...p,date:e.target.value}))}/></FormGroup>
              <FormGroup label="Kick-off Time"><Input type="time" value={match.time||""} onChange={e=>setMatch((p:any)=>({...p,time:e.target.value}))}/></FormGroup>
            </div>
            <FormGroup label="Venue"><Input value={match.venue||""} onChange={e=>setMatch((p:any)=>({...p,venue:e.target.value}))}/></FormGroup>
            <div className="grid md:grid-cols-2 gap-4">
              <FormGroup label="Home Team Logo">
                <ImageUploadField value={match.homeTeamLogo||""} onChange={(url)=>setMatch((p:any)=>({...p,homeTeamLogo:url}))} folder="hero" />
              </FormGroup>
              <FormGroup label="Away Team Logo">
                <ImageUploadField value={match.awayTeamLogo||""} onChange={(url)=>setMatch((p:any)=>({...p,awayTeamLogo:url}))} folder="hero" />
              </FormGroup>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <FormGroup label="Watch Party Venue"><Input value={match.watchPartyVenue||""} onChange={e=>setMatch((p:any)=>({...p,watchPartyVenue:e.target.value}))} placeholder="Silverstar Tower, Accra"/></FormGroup>
              <FormGroup label="Watch Party Time"><Input value={match.watchPartyTime||""} onChange={e=>setMatch((p:any)=>({...p,watchPartyTime:e.target.value}))} placeholder="4:00 PM"/></FormGroup>
            </div>
            <FormGroup label="Ticket Link"><Input value={match.ticketLink||""} onChange={e=>setMatch((p:any)=>({...p,ticketLink:e.target.value}))} placeholder="/members/tickets"/></FormGroup>
          </CardContent>
        </Card>
      )}

      {/* ── Fixture Modal ── */}
      <Modal open={fixtureModal} onClose={()=>setFixtureModal(false)} title={editFx?"Edit Fixture":"Add Fixture / Result"} size="lg">
        <div className="space-y-4 p-4">
          <div className="grid md:grid-cols-2 gap-4">
            <FormGroup label="Home Team"><Input value={fxForm.homeTeam} onChange={e=>setFxForm((p:any)=>({...p,homeTeam:e.target.value}))}/></FormGroup>
            <FormGroup label="Away Team"><Input value={fxForm.awayTeam} onChange={e=>setFxForm((p:any)=>({...p,awayTeam:e.target.value}))}/></FormGroup>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <FormGroup label="Home Logo">
              <ImageUploadField value={fxForm.homeTeamLogo||""} onChange={(url)=>setFxForm((p:any)=>({...p,homeTeamLogo:url}))} folder="hero" />
            </FormGroup>
            <FormGroup label="Away Logo">
              <ImageUploadField value={fxForm.awayTeamLogo||""} onChange={(url)=>setFxForm((p:any)=>({...p,awayTeamLogo:url}))} folder="hero" />
            </FormGroup>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <FormGroup label="Competition">
              <Select value={fxForm.competition} onChange={e=>setFxForm((p:any)=>({...p,competition:e.target.value}))}>
                {COMP_OPTS.map(c=><option key={c}>{c}</option>)}
              </Select>
            </FormGroup>
            <FormGroup label="Status">
              <Select value={fxForm.status} onChange={e=>setFxForm((p:any)=>({...p,status:e.target.value}))}>
                {STATUS_OPTS.map(s=><option key={s}>{s}</option>)}
              </Select>
            </FormGroup>
          </div>
          {fxForm.status==="result" && (
            <div className="grid md:grid-cols-2 gap-4">
              <FormGroup label="Home Score"><Input type="number" min={0} value={fxForm.homeScore??""} onChange={e=>setFxForm((p:any)=>({...p,homeScore:e.target.value===""?null:Number(e.target.value)}))}/></FormGroup>
              <FormGroup label="Away Score"><Input type="number" min={0} value={fxForm.awayScore??""} onChange={e=>setFxForm((p:any)=>({...p,awayScore:e.target.value===""?null:Number(e.target.value)}))}/></FormGroup>
            </div>
          )}
          <div className="grid md:grid-cols-2 gap-4">
            <FormGroup label="Match Date"><Input type="date" value={fxForm.date} onChange={e=>setFxForm((p:any)=>({...p,date:e.target.value}))}/></FormGroup>
            <FormGroup label="Kick-off Time"><Input type="time" value={fxForm.time} onChange={e=>setFxForm((p:any)=>({...p,time:e.target.value}))}/></FormGroup>
          </div>
          <FormGroup label="Venue"><Input value={fxForm.venue} onChange={e=>setFxForm((p:any)=>({...p,venue:e.target.value}))}/></FormGroup>
          <div className="grid md:grid-cols-2 gap-4">
            <FormGroup label="Watch Party Venue"><Input value={fxForm.watchPartyVenue||""} onChange={e=>setFxForm((p:any)=>({...p,watchPartyVenue:e.target.value}))} placeholder="Silverstar Tower"/></FormGroup>
            <FormGroup label="Watch Party Time"><Input value={fxForm.watchPartyTime||""} onChange={e=>setFxForm((p:any)=>({...p,watchPartyTime:e.target.value}))} placeholder="4:00 PM"/></FormGroup>
          </div>
          <FormGroup label="Ticket / Event Link"><Input value={fxForm.ticketLink||""} onChange={e=>setFxForm((p:any)=>({...p,ticketLink:e.target.value}))} placeholder="/events"/></FormGroup>
          <div className="flex items-center gap-3">
            <Switch checked={fxForm.isActive!==false} onChange={v=>setFxForm((p:any)=>({...p,isActive:v}))}/>
            <span className="text-sm" style={{ color:"var(--text-muted)" }}>Show on site</span>
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={saveFx} className="btn-arsenal flex-1">Save</Button>
            <Button onClick={()=>setFixtureModal(false)} className="flex-1" style={{ background:"rgba(255,255,255,0.06)" }}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
