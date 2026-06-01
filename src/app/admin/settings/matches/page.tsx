"use client";
import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { Card, CardHeader, CardTitle, CardContent, Button, FormGroup, Input, Switch, Select, Modal } from "@/components/ui";
import ImageUploadField from "@/components/ImageUploadField";
import toast from "react-hot-toast";

export default function MatchSettingsPage() {
  const { settings, updateSettings } = useApp();
  const s = settings as any;

  /* ── Countdown (Next Match) ── */
  const nm = s.nextMatch || {};
  const [match, setMatch] = useState({
    homeTeam:       nm.homeTeam       || "Arsenal",
    awayTeam:       nm.awayTeam       || "",
    competition:    nm.competition    || "Premier League",
    date:           nm.date           || "",
    time:           nm.time           || "17:30",
    venue:          nm.venue          || "Emirates Stadium, London",
    homeTeamLogo:   nm.homeTeamLogo   || "",
    awayTeamLogo:   nm.awayTeamLogo   || "",
    ticketLink:     nm.ticketLink     || "/events",
    watchPartyVenue:nm.watchPartyVenue|| "",
    watchPartyTime: nm.watchPartyTime || "",
    isActive:       nm.isActive       !== false,
    // Event name overrides "Arsenal vs Opponent" if set
    eventName:      nm.eventName      || "",
  });
  const [showCountdown, setShowCountdown] = useState<boolean>(s.showMatchCountdownSection !== false);

  /* ── Fixtures ── */
  const [fixtures, setFixtures]         = useState<any[]>([...(s.arsenalFixtures || [])]);
  const [showFixtures, setShowFixtures] = useState<boolean>(s.showArsenalFixturesSection !== false);
  const [fxModal, setFxModal]           = useState(false);
  const [editFx, setEditFx]             = useState<any>(null);
  const emptyFx = { homeTeam:"Arsenal", awayTeam:"", competition:"Premier League", homeTeamLogo:"", awayTeamLogo:"", date:"", time:"17:30", venue:"Emirates Stadium", status:"upcoming", homeScore:null, awayScore:null, isActive:true, watchPartyVenue:"", watchPartyTime:"", ticketLink:"/events", sortOrder:0 };
  const [fxForm, setFxForm]             = useState<any>(emptyFx);

  const [saving, setSaving]             = useState(false);
  const [tab, setTab]                   = useState<"countdown"|"fixtures">("countdown");

  const save = () => {
    setSaving(true);
    updateSettings({
      nextMatch: match,
      showMatchCountdownSection: showCountdown,
      arsenalFixtures: fixtures,
      showArsenalFixturesSection: showFixtures,
    } as any);
    setTimeout(() => { setSaving(false); toast.success("Match settings saved!"); }, 300);
  };

  const saveFx = () => {
    if (!fxForm.awayTeam) { toast.error("Away team required"); return; }
    if (editFx) {
      setFixtures(p => p.map(f => f.id === editFx.id ? { ...f, ...fxForm } : f));
    } else {
      setFixtures(p => [...p, { ...fxForm, id: Date.now() }]);
    }
    setFxModal(false);
    toast.success(editFx ? "Fixture updated" : "Fixture added");
  };

  const setM  = (k: string, v: any) => setMatch(p => ({ ...p, [k]: v }));
  const setFx = (k: string, v: any) => setFxForm((p: any) => ({ ...p, [k]: v }));

  const TABS = [
    { id: "countdown", label: "Match Countdown", icon: "fa-solid fa-clock" },
    { id: "fixtures",  label: "Fixtures & Results", icon: "fa-solid fa-futbol" },
  ] as const;

  return (
    <div className="space-y-5 max-w-4xl">
      <motion.div initial={{ opacity:0,y:-10 }} animate={{ opacity:1,y:0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white" style={{ fontFamily:"var(--font-display)" }}>MATCH SETTINGS</h1>
          <p className="text-xs mt-0.5 text-white/40">Manage the countdown timer and fixtures/results display</p>
        </div>
        <Button onClick={save} disabled={saving}>
          {saving ? <><i className="fa-solid fa-spinner fa-spin mr-1.5"/>Saving…</> : <><i className="fa-solid fa-save mr-1.5"/>Save All</>}
        </Button>
      </motion.div>

      <div className="flex gap-1 border-b" style={{ borderColor:"rgba(255,255,255,0.06)" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all"
            style={{ fontFamily:"var(--font-heading)", color:tab===t.id?"var(--color-red)":"rgba(255,255,255,0.4)", borderBottom:tab===t.id?"2px solid var(--color-red)":"2px solid transparent" }}>
            <i className={`${t.icon} text-[10px]`}/>{t.label}
          </button>
        ))}
      </div>

      {/* ── COUNTDOWN ── */}
      {tab === "countdown" && (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-white">Show Match Countdown</p>
                  <p className="text-xs text-white/40 mt-0.5">Display a live countdown on the homepage</p>
                </div>
                <Switch checked={showCountdown} onChange={() => setShowCountdown(p => !p)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle><i className="fa-solid fa-futbol mr-2" style={{color:"var(--color-red)"}}/>Match Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 rounded-sm text-xs text-white/50 leading-relaxed" style={{ background:"rgba(198,168,75,0.06)", border:"1px solid rgba(198,168,75,0.15)" }}>
                <i className="fa-solid fa-circle-info mr-1.5" style={{color:"#C6A84B"}}/>
                <strong className="text-white">Display Name:</strong> The countdown shows the <strong className="text-white">Event Name</strong> if set, otherwise <strong className="text-white">Home vs Away</strong> team names.
                Set an Event Name like <em>"Watch Party — Arsenal vs Chelsea"</em> to show a custom title.
              </div>

              <FormGroup label="Event Name (shown as countdown title — overrides 'Arsenal vs Opponent')">
                <Input value={match.eventName} onChange={e=>setM("eventName",e.target.value)}
                  placeholder="e.g. Watch Party — Arsenal vs Chelsea · 17 May" />
              </FormGroup>

              <div className="grid grid-cols-2 gap-3">
                <FormGroup label="Home Team"><Input value={match.homeTeam} onChange={e=>setM("homeTeam",e.target.value)} placeholder="Arsenal"/></FormGroup>
                <FormGroup label="Away Team"><Input value={match.awayTeam} onChange={e=>setM("awayTeam",e.target.value)} placeholder="Chelsea"/></FormGroup>
                <FormGroup label="Competition"><Input value={match.competition} onChange={e=>setM("competition",e.target.value)}/></FormGroup>
                <FormGroup label="Venue"><Input value={match.venue} onChange={e=>setM("venue",e.target.value)}/></FormGroup>
                <FormGroup label="Match Date"><Input type="date" value={match.date} onChange={e=>setM("date",e.target.value)}/></FormGroup>
                <FormGroup label="Kick-off Time (24h)"><Input value={match.time} onChange={e=>setM("time",e.target.value)} placeholder="17:30"/></FormGroup>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <ImageUploadField label="Home Team Logo" value={match.homeTeamLogo} onChange={v=>setM("homeTeamLogo",v)} folder="events" previewHeight={72}/>
                <ImageUploadField label="Away Team Logo" value={match.awayTeamLogo} onChange={v=>setM("awayTeamLogo",v)} folder="events" previewHeight={72}/>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormGroup label="Watch Party Venue"><Input value={match.watchPartyVenue} onChange={e=>setM("watchPartyVenue",e.target.value)} placeholder="Silverstar Tower, Accra"/></FormGroup>
                <FormGroup label="Watch Party Time"><Input value={match.watchPartyTime} onChange={e=>setM("watchPartyTime",e.target.value)} placeholder="5:00 PM"/></FormGroup>
              </div>

              <FormGroup label="Event Ticket Link (links to event booking page)">
                <Input value={match.ticketLink} onChange={e=>setM("ticketLink",e.target.value)} placeholder="/events"/>
              </FormGroup>

              <div className="flex items-center gap-3">
                <Switch checked={match.isActive} onChange={() => setM("isActive", !match.isActive)} />
                <span className="text-xs text-white/60">Active — show countdown on homepage</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── FIXTURES ── */}
      {tab === "fixtures" && (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-white">Show Fixtures Section</p>
                  <p className="text-xs text-white/40 mt-0.5">Display upcoming fixtures and results on homepage</p>
                </div>
                <Switch checked={showFixtures} onChange={() => setShowFixtures(p => !p)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle><i className="fa-solid fa-list-ul mr-2" style={{color:"var(--color-red)"}}/>Fixtures & Results ({fixtures.length})</CardTitle>
                <Button size="sm" onClick={()=>{setFxForm(emptyFx);setEditFx(null);setFxModal(true);}}>
                  <i className="fa-solid fa-plus mr-1.5"/>Add Fixture
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {fixtures.length===0 && <p className="text-xs text-white/30 text-center py-6">No fixtures. Add upcoming matches or results.</p>}
              {[...fixtures].sort((a,b)=>new Date(a.date||0).getTime()-new Date(b.date||0).getTime()).map(fx => (
                <div key={fx.id} className="flex items-center gap-3 px-4 py-3" style={{borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
                  {/* Logos */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {fx.homeTeamLogo
                      ? <img src={fx.homeTeamLogo} alt="" className="w-7 h-7 object-contain rounded-sm"/>
                      : <div className="w-7 h-7 rounded-sm flex items-center justify-center text-[10px] font-black" style={{background:"rgba(239,1,7,0.2)",color:"var(--color-red)"}}>{fx.homeTeam?.[0]||"A"}</div>
                    }
                    <span className="text-[10px] text-white/30">vs</span>
                    {fx.awayTeamLogo
                      ? <img src={fx.awayTeamLogo} alt="" className="w-7 h-7 object-contain rounded-sm"/>
                      : <div className="w-7 h-7 rounded-sm flex items-center justify-center text-[10px] font-bold" style={{background:"rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.4)"}}>{fx.awayTeam?.[0]||"?"}</div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{fx.homeTeam||"Arsenal"} vs {fx.awayTeam||"TBC"}</p>
                    <p className="text-xs text-white/40">{fx.competition} · {fx.date} {fx.time}</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    {fx.status==="result"
                      ? <span className="text-sm font-black" style={{color:"#C6A84B"}}>{fx.homeScore??0}–{fx.awayScore??0}</span>
                      : null
                    }
                    <span className="block text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5"
                      style={{
                        background: fx.status==="result"?"rgba(198,168,75,0.15)":fx.status==="live"?"rgba(16,185,129,0.15)":"rgba(59,130,246,0.15)",
                        color: fx.status==="result"?"#C6A84B":fx.status==="live"?"#10B981":"#3B82F6",
                      }}>{fx.status==="result"?"FT":fx.status==="live"?"LIVE":fx.status}</span>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={()=>{setFxForm({...fx});setEditFx(fx);setFxModal(true);}} className="p-1.5 text-white/30 hover:text-white rounded transition-colors"><i className="fa-solid fa-pen text-xs"/></button>
                    <button onClick={()=>setFixtures(p=>p.filter(f=>f.id!==fx.id))} className="p-1.5 text-white/30 hover:text-red-400 rounded transition-colors"><i className="fa-solid fa-trash text-xs"/></button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Fixture Modal */}
      <Modal open={fxModal} onClose={()=>setFxModal(false)} title={editFx?"Edit Fixture":"Add Fixture / Result"} size="lg">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <FormGroup label="Home Team"><Input value={fxForm.homeTeam} onChange={e=>setFx("homeTeam",e.target.value)}/></FormGroup>
            <FormGroup label="Away Team *"><Input value={fxForm.awayTeam} onChange={e=>setFx("awayTeam",e.target.value)} placeholder="Chelsea"/></FormGroup>
          </div>
          <ImageUploadField label="Home Team Logo" value={fxForm.homeTeamLogo||""} onChange={v=>setFx("homeTeamLogo",v)} folder="events" previewHeight={72}/>
          <ImageUploadField label="Away Team Logo" value={fxForm.awayTeamLogo||""} onChange={v=>setFx("awayTeamLogo",v)} folder="events" previewHeight={72}/>
          <div className="grid grid-cols-2 gap-3">
            <FormGroup label="Competition"><Input value={fxForm.competition} onChange={e=>setFx("competition",e.target.value)}/></FormGroup>
            <FormGroup label="Status">
              <Select value={fxForm.status} onChange={e=>setFx("status",e.target.value)}>
                <option value="upcoming">Upcoming</option>
                <option value="live">Live</option>
                <option value="result">Result (FT)</option>
                <option value="postponed">Postponed</option>
              </Select>
            </FormGroup>
            <FormGroup label="Date"><Input type="date" value={fxForm.date} onChange={e=>setFx("date",e.target.value)}/></FormGroup>
            <FormGroup label="Time"><Input type="time" value={fxForm.time} onChange={e=>setFx("time",e.target.value)}/></FormGroup>
          </div>
          {fxForm.status==="result" && (
            <div className="grid grid-cols-2 gap-3">
              <FormGroup label="Home Score"><Input type="number" min={0} value={fxForm.homeScore??""} onChange={e=>setFx("homeScore",e.target.value===""?null:Number(e.target.value))}/></FormGroup>
              <FormGroup label="Away Score"><Input type="number" min={0} value={fxForm.awayScore??""} onChange={e=>setFx("awayScore",e.target.value===""?null:Number(e.target.value))}/></FormGroup>
            </div>
          )}
          <FormGroup label="Venue"><Input value={fxForm.venue} onChange={e=>setFx("venue",e.target.value)}/></FormGroup>
          <div className="grid grid-cols-2 gap-3">
            <FormGroup label="Watch Party Venue"><Input value={fxForm.watchPartyVenue||""} onChange={e=>setFx("watchPartyVenue",e.target.value)} placeholder="Silverstar Tower"/></FormGroup>
            <FormGroup label="Watch Party Time"><Input value={fxForm.watchPartyTime||""} onChange={e=>setFx("watchPartyTime",e.target.value)} placeholder="5:00 PM"/></FormGroup>
          </div>
          <FormGroup label="Event Ticket Link"><Input value={fxForm.ticketLink||""} onChange={e=>setFx("ticketLink",e.target.value)} placeholder="/events"/></FormGroup>
          <div className="flex items-center gap-2">
            <Switch checked={fxForm.isActive!==false} onChange={()=>setFx("isActive",!fxForm.isActive)}/>
            <span className="text-xs text-white/60">Show on homepage</span>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="ghost" size="sm" onClick={()=>setFxModal(false)}>Cancel</Button>
            <Button size="sm" onClick={saveFx}>{editFx?"Update":"Add Fixture"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
