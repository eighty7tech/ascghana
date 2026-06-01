"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { Card, CardHeader, CardTitle, CardContent, Button, FormGroup, Input, Switch, Select, Modal, RichTextField, Textarea } from "@/components/ui";
import toast from "react-hot-toast";

export default function HomepageSettingsPage() {
  const { settings, updateSettings } = useApp();
  const s = settings as any;
  const [saving, setSaving] = useState(false);

  // Section visibility
  const [showClubStats,    setShowClubStats]    = useState<boolean>(s.showClubStatsSection !== false);
  const [showMatchCD,      setShowMatchCD]      = useState<boolean>(s.showMatchCountdownSection !== false);
  const [showBulletin,     setShowBulletin]     = useState<boolean>(s.showBulletinSection !== false);
  const [showSpotlight,    setShowSpotlight]    = useState<boolean>(s.showMemberSpotlightSection !== false);
  const [showPoll,         setShowPoll]         = useState<boolean>(s.showCommunityPollSection !== false);
  const [showSponsors,     setShowSponsors]     = useState<boolean>(settings.showSponsorsOnHome !== false);

  // Section background colors
  const [sectionBgs, setSectionBgs] = useState<Record<string,string>>((s as any).sectionBgs || {
    hero:"", stats:"", countdown:"", bulletin:"", spotlight:"", poll:"", sponsors:"", fixtures:"",
  });
  const updateSectionBg = (key:string, val:string) => setSectionBgs((p:any)=>({...p,[key]:val}));

  // Club Stats
  const [clubStats, setClubStats] = useState<any[]>([...(settings.clubStats || [])]);

  // Bulletin Items
  const [bulletinItems, setBulletinItems] = useState<any[]>([...(settings.bulletinItems || [])]);
  const [bulletinModal, setBulletinModal] = useState(false);
  const [editBulletin, setEditBulletin] = useState<any>(null);
  const emptyBulletin = { type:"announcement", title:"", body:"", emoji:"📢", linkUrl:"", linkLabel:"", priority:5, isActive:true, expiresAt:"" };
  const [bForm, setBForm] = useState<any>(emptyBulletin);


  // Member Spotlights
  const [spotlights, setSpotlights] = useState<any[]>([...(settings.memberSpotlights || [])]);
  const [spotlightModal, setSpotlightModal] = useState(false);
  const [editSpotlight, setEditSpotlight] = useState<any>(null);
  const emptySpotlight = { name:"", photo:"", tier:"Gold", branch:"Accra", quote:"", achievement:"", type:"month", isActive:true, startDate:"", endDate:"" };
  const [spForm, setSpForm] = useState<any>(emptySpotlight);


  const save = () => {
    setSaving(true);
    updateSettings({
      showClubStatsSection:      showClubStats,
      showMatchCountdownSection: showMatchCD,
      showBulletinSection:       showBulletin,
      showMemberSpotlightSection:showSpotlight,
      showCommunityPollSection:  showPoll,
      showSponsorsOnHome:        showSponsors,
      sectionBgs,
      clubStats,
      bulletinItems,
      memberSpotlights:          spotlights,
    } as any);
    setTimeout(() => { setSaving(false); toast.success("Homepage settings saved!"); }, 300);
  };

  // Bulletin CRUD
  const saveBulletin = () => {
    if (!bForm.title || !bForm.body) { toast.error("Title and body required"); return; }
    if (editBulletin) {
      setBulletinItems(prev => prev.map(b => b.id === editBulletin.id ? { ...b, ...bForm } : b));
    } else {
      setBulletinItems(prev => [...prev, { ...bForm, id: Date.now(), createdAt: new Date().toISOString(), createdBy: "admin" }]);
    }
    setBulletinModal(false); setEditBulletin(null); setBForm(emptyBulletin);
  };
  const deleteBulletin = (id: number) => setBulletinItems(prev => prev.filter(b => b.id !== id));
  const openBulletin = (b?: any) => { setEditBulletin(b||null); setBForm(b ? { ...b } : emptyBulletin); setBulletinModal(true); };

  // Spotlight CRUD
  const saveSpotlight = () => {
    if (!spForm.name || !spForm.quote) { toast.error("Name and quote required"); return; }
    if (editSpotlight) {
      setSpotlights(prev => prev.map(s => s.id === editSpotlight.id ? { ...s, ...spForm } : s));
    } else {
      setSpotlights(prev => [...prev, { ...spForm, id: Date.now() }]);
    }
    setSpotlightModal(false); setEditSpotlight(null); setSpForm(emptySpotlight);
  };
  const deleteSpotlight = (id: number) => setSpotlights(prev => prev.filter(s => s.id !== id));
  const openSpotlight = (sp?: any) => { setEditSpotlight(sp||null); setSpForm(sp ? { ...sp } : emptySpotlight); setSpotlightModal(true); };

  const sec = { background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)" };
  const inp = "w-full px-3 py-2 text-sm rounded-sm text-white placeholder-white/30 outline-none";
  const inpS = { background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)" };

  return (
    <div className="space-y-6 max-w-4xl">
      <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white" style={{fontFamily:"var(--font-display)"}}>HOMEPAGE SETTINGS</h1>
          <p className="text-xs mt-0.5 text-white/40">Control all homepage sections — all changes persist to database</p>
        </div>
        <Button onClick={save} disabled={saving}>
          {saving ? <><i className="fa-solid fa-spinner fa-spin mr-1.5"/>Saving…</> : <><i className="fa-solid fa-save mr-1.5"/>Save All</>}
        </Button>
      </motion.div>

      {/* Section Visibility */}
      <Card>
        <CardHeader><CardTitle><i className="fa-solid fa-eye mr-2" style={{color:"var(--color-red)"}}/>Section Visibility</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {[
            { label:"Club Stats Bar",       sub:"Animated member count, years active, regions", val:showClubStats,   set:setShowClubStats },
            { label:"Match Countdown",      sub:"Countdown to next Arsenal match",               val:showMatchCD,     set:setShowMatchCD },
            { label:"Club Bulletin Board",  sub:"Announcements, news, events board",             val:showBulletin,    set:setShowBulletin },
            { label:"Member Spotlight",     sub:"Member of the week / month",                    val:showSpotlight,   set:setShowSpotlight },
            { label:"Community Poll",       sub:"Live voting polls for members",                 val:showPoll,        set:setShowPoll },

            { label:"Sponsors Section",     sub:"Sponsor logos and partner tiers",               val:showSponsors,    set:setShowSponsors },
          ].map(row => (
            <div key={row.label} className="flex items-center justify-between p-3 rounded-sm" style={sec}>
              <div>
                <p className="text-sm font-medium text-white">{row.label}</p>
                <p className="text-xs text-white/40">{row.sub}</p>
              </div>
              <Switch checked={row.val} onChange={() => row.set((p: boolean) => !p)} />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Section Backgrounds */}
      <Card>
        <CardHeader><CardTitle><i className="fa-solid fa-palette mr-2" style={{color:"var(--color-red)"}}/>Section Background Colors</CardTitle></CardHeader>
        <CardContent>
          <p className="text-xs mb-4" style={{color:"rgba(255,255,255,0.4)"}}>Override the background color/gradient for each homepage section. Leave blank to use the theme default.</p>
          <div className="grid md:grid-cols-2 gap-3">
            {[
              {key:"hero",       label:"Hero Slider"},
              {key:"stats",      label:"Club Stats Bar"},
              {key:"countdown",  label:"Match Countdown"},
              {key:"bulletin",   label:"Bulletin Board"},
              {key:"spotlight",  label:"Member Spotlight"},
              {key:"poll",       label:"Community Poll"},
              {key:"sponsors",   label:"Sponsors Section"},
              {key:"fixtures",   label:"Arsenal Fixtures"},
            ].map(({key,label})=>(
              <div key={key}>
                <label className="block text-xs font-bold uppercase mb-1" style={{color:"rgba(255,255,255,0.4)",fontFamily:"var(--font-heading)"}}>{label}</label>
                <div className="flex gap-2">
                  {sectionBgs[key] && !sectionBgs[key].includes("gradient") && (
                    <input type="color" value={sectionBgs[key]||"#000000"} onChange={e=>updateSectionBg(key,e.target.value)}
                      className="w-9 h-9 rounded border border-white/10 p-1 cursor-pointer flex-shrink-0" style={{background:"transparent"}}/>
                  )}
                  <input value={sectionBgs[key]||""} onChange={e=>updateSectionBg(key,e.target.value)}
                    className="input-arsenal flex-1 text-xs" placeholder="e.g. #1A0A0A or linear-gradient(…)"/>
                  {sectionBgs[key] && (
                    <button onClick={()=>updateSectionBg(key,"")} className="px-2 text-xs text-white/30 hover:text-red-400 transition-colors" title="Reset">✕</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Next Match — moved to dedicated page */}
      <Card>
        <CardHeader>
          <CardTitle><i className="fa-solid fa-hourglass-half mr-2" style={{color:"var(--color-red)"}}/>Next Match Countdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 p-4 rounded-sm" style={{ background:"rgba(198,168,75,0.06)", border:"1px solid rgba(198,168,75,0.2)" }}>
            <i className="fa-solid fa-circle-info text-2xl flex-shrink-0" style={{ color:"#C6A84B" }} />
            <div className="flex-1">
              <p className="font-bold text-sm" style={{ color:"var(--text-primary)", fontFamily:"var(--font-heading)" }}>Match Countdown moved</p>
              <p className="text-xs mt-1" style={{ color:"var(--text-muted)" }}>
                Match countdown configuration is now in the dedicated <strong>Matches &amp; Fixtures</strong> page under the "Match Countdown" tab.
              </p>
            </div>
            <a href="/admin/matches"
              className="flex-shrink-0 px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-wider transition-all hover:opacity-80"
              style={{ background:"rgba(239,1,7,0.1)", border:"1px solid rgba(239,1,7,0.25)", color:"var(--color-red)", fontFamily:"var(--font-heading)" }}>
              <i className="fa-solid fa-arrow-right mr-1.5" />Go to Matches
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Club Stats */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle><i className="fa-solid fa-chart-bar mr-2" style={{color:"var(--color-red)"}}/>Club Stats Bar</CardTitle>
            <Button size="sm" onClick={()=>setClubStats(prev=>[...prev,{id:Date.now(),label:"New Stat",value:"0",icon:"fa-solid fa-star",color:"#C6A84B",isVisible:true,order:prev.length}])}>
              <i className="fa-solid fa-plus mr-1.5"/>Add Stat
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {clubStats.length===0 && <p className="text-xs text-white/30 text-center py-4">No stats yet. Click "Add Stat" to create one.</p>}
          {clubStats.map((stat, i) => (
            <div key={stat.id||i} className="flex items-center gap-3 p-3 rounded-sm" style={sec}>
              <i className={stat.icon||"fa-solid fa-star"} style={{color:stat.color||"#C6A84B",width:20}}/>
              <div className="flex-1 grid grid-cols-3 gap-2">
                <input value={stat.label} onChange={e=>{const n=[...clubStats];n[i]={...n[i],label:e.target.value};setClubStats(n);}}
                  className={`${inp} text-xs`} style={inpS} placeholder="Label"/>
                <input value={stat.value} onChange={e=>{const n=[...clubStats];n[i]={...n[i],value:e.target.value};setClubStats(n);}}
                  className={`${inp} text-xs`} style={inpS} placeholder="Value or 'dynamic'"/>
                <input value={stat.icon} onChange={e=>{const n=[...clubStats];n[i]={...n[i],icon:e.target.value};setClubStats(n);}}
                  className={`${inp} text-xs`} style={inpS} placeholder="fa-solid fa-..."/>
              </div>
              <input type="color" value={stat.color||"#C6A84B"} onChange={e=>{const n=[...clubStats];n[i]={...n[i],color:e.target.value};setClubStats(n);}}
                className="w-8 h-8 rounded cursor-pointer border border-white/10 bg-transparent flex-shrink-0"/>
              <Switch checked={stat.isVisible!==false} onChange={()=>{const n=[...clubStats];n[i]={...n[i],isVisible:!n[i].isVisible};setClubStats(n);}}/>
              <button onClick={()=>setClubStats(prev=>prev.filter((_,idx)=>idx!==i))}
                className="p-1.5 text-white/25 hover:text-red-400 rounded transition-colors flex-shrink-0">
                <i className="fa-solid fa-times text-xs"/>
              </button>
            </div>
          ))}
          <p className="text-xs text-white/30 pt-1">Value <code className="px-1 rounded" style={{background:"rgba(255,255,255,0.08)"}}>dynamic</code> = live active member count.</p>
        </CardContent>
      </Card>

      {/* Arsenal Fixtures — moved to dedicated page */}
      <Card>
        <CardHeader>
          <CardTitle><i className="fa-solid fa-futbol mr-2" style={{color:"var(--color-red)"}}/>Arsenal Fixtures &amp; Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 p-4 rounded-sm" style={{ background:"rgba(198,168,75,0.06)", border:"1px solid rgba(198,168,75,0.2)" }}>
            <i className="fa-solid fa-circle-info text-2xl flex-shrink-0" style={{ color:"#C6A84B" }} />
            <div className="flex-1">
              <p className="font-bold text-sm" style={{ color:"var(--text-primary)", fontFamily:"var(--font-heading)" }}>
                Fixtures &amp; Results have moved
              </p>
              <p className="text-xs mt-1" style={{ color:"var(--text-muted)" }}>
                All fixture, result, and match countdown settings are now managed in the dedicated <strong>Matches &amp; Fixtures</strong> page for better organisation.
              </p>
            </div>
            <a href="/admin/matches"
              className="flex-shrink-0 px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-wider transition-all hover:opacity-80"
              style={{ background:"rgba(239,1,7,0.1)", border:"1px solid rgba(239,1,7,0.25)", color:"var(--color-red)", fontFamily:"var(--font-heading)" }}>
              <i className="fa-solid fa-arrow-right mr-1.5" />Go to Matches
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Bulletin Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle><i className="fa-solid fa-clipboard-list mr-2" style={{color:"var(--color-red)"}}/>Bulletin Board Items ({bulletinItems.length})</CardTitle>
            <Button size="sm" onClick={()=>openBulletin()}><i className="fa-solid fa-plus mr-1.5"/>Add Item</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 p-0">
          {bulletinItems.length===0 && <p className="text-xs text-white/30 text-center py-6">No bulletin items. Add one above.</p>}
          {bulletinItems.sort((a,b)=>b.priority-a.priority).map(b=>(
            <div key={b.id} className="flex items-center gap-3 px-4 py-3" style={{borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
              <span className="text-xl flex-shrink-0">{b.emoji||"📢"}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{b.title}</p>
                <p className="text-xs text-white/40 truncate">{b.type} · Priority {b.priority}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <span className={`w-1.5 h-1.5 rounded-full ${b.isActive?"bg-green-500":"bg-gray-600"}`}/>
                <button onClick={()=>openBulletin(b)} className="p-1.5 text-white/30 hover:text-white rounded transition-colors"><i className="fa-solid fa-pen text-xs"/></button>
                <button onClick={()=>deleteBulletin(b.id)} className="p-1.5 text-white/30 hover:text-red-400 rounded transition-colors"><i className="fa-solid fa-trash text-xs"/></button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Member Spotlights */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle><i className="fa-solid fa-star mr-2" style={{color:"var(--color-gold)"}}/>Member Spotlights ({spotlights.length})</CardTitle>
            <Button size="sm" onClick={()=>openSpotlight()}><i className="fa-solid fa-plus mr-1.5"/>Add Spotlight</Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {spotlights.length===0 && <p className="text-xs text-white/30 text-center py-6">No spotlights. Add a Member of the Week/Month.</p>}
          {spotlights.map(sp=>(
            <div key={sp.id} className="flex items-center gap-3 px-4 py-3" style={{borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0"
                style={{background:"rgba(198,168,75,0.15)",color:"#C6A84B"}}>{sp.name?.[0]||"?"}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{sp.name}</p>
                <p className="text-xs text-white/40">{sp.type==="week"?"Week":sp.type==="month"?"Month":"Quarter"} · {sp.tier} · {sp.branch}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <span className={`w-1.5 h-1.5 rounded-full ${sp.isActive?"bg-green-500":"bg-gray-600"}`}/>
                <button onClick={()=>openSpotlight(sp)} className="p-1.5 text-white/30 hover:text-white rounded transition-colors"><i className="fa-solid fa-pen text-xs"/></button>
                <button onClick={()=>deleteSpotlight(sp.id)} className="p-1.5 text-white/30 hover:text-red-400 rounded transition-colors"><i className="fa-solid fa-trash text-xs"/></button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Bulletin Modal */}
      <Modal open={bulletinModal} onClose={()=>setBulletinModal(false)} title={editBulletin?"Edit Bulletin Item":"Add Bulletin Item"}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <FormGroup label="Type">
              <Select value={bForm.type} onChange={e=>setBForm((p:any)=>({...p,type:e.target.value}))}>
                <option value="announcement">Announcement</option>
                <option value="news">News</option>
                <option value="event">Event</option>
                <option value="job">Opportunity</option>
                <option value="ad">Notice</option>
              </Select>
            </FormGroup>
            <FormGroup label="Emoji">
              <Input value={bForm.emoji||""} onChange={e=>setBForm((p:any)=>({...p,emoji:e.target.value}))} placeholder="📢"/>
            </FormGroup>
          </div>
          <FormGroup label="Title *"><Input value={bForm.title} onChange={e=>setBForm((p:any)=>({...p,title:e.target.value}))}/></FormGroup>
          <FormGroup label="Body *">
            <RichTextField value={bForm.body} onChange={v=>setBForm((p:any)=>({...p,body:v}))} placeholder="Bulletin message…" minHeight={140} />
          </FormGroup>
          <div className="grid grid-cols-2 gap-3">
            <FormGroup label="Link URL"><Input value={bForm.linkUrl||""} onChange={e=>setBForm((p:any)=>({...p,linkUrl:e.target.value}))} placeholder="/members/tickets"/></FormGroup>
            <FormGroup label="Link Label"><Input value={bForm.linkLabel||""} onChange={e=>setBForm((p:any)=>({...p,linkLabel:e.target.value}))} placeholder="Learn More"/></FormGroup>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormGroup label="Priority (higher = first)">
              <Input type="number" value={bForm.priority||5} onChange={e=>setBForm((p:any)=>({...p,priority:Number(e.target.value)}))}/>
            </FormGroup>
            <FormGroup label="Expires (optional)">
              <Input type="date" value={bForm.expiresAt||""} onChange={e=>setBForm((p:any)=>({...p,expiresAt:e.target.value}))}/>
            </FormGroup>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={bForm.isActive} onChange={()=>setBForm((p:any)=>({...p,isActive:!p.isActive}))}/>
            <span className="text-xs text-white/60">Active (show on homepage)</span>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="ghost" size="sm" onClick={()=>setBulletinModal(false)}>Cancel</Button>
            <Button size="sm" onClick={saveBulletin}>{editBulletin?"Update":"Add Item"}</Button>
          </div>
        </div>
      </Modal>

      {/* Spotlight Modal */}
      <Modal open={spotlightModal} onClose={()=>setSpotlightModal(false)} title={editSpotlight?"Edit Spotlight":"Add Member Spotlight"}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <FormGroup label="Name *"><Input value={spForm.name} onChange={e=>setSpForm((p:any)=>({...p,name:e.target.value}))}/></FormGroup>
            <FormGroup label="Type">
              <Select value={spForm.type} onChange={e=>setSpForm((p:any)=>({...p,type:e.target.value}))}>
                <option value="week">Member of the Week</option>
                <option value="month">Member of the Month</option>
                <option value="quarter">Member of the Quarter</option>
              </Select>
            </FormGroup>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormGroup label="Tier">
              <Select value={spForm.tier} onChange={e=>setSpForm((p:any)=>({...p,tier:e.target.value}))}>
                {["Bronze","Silver","Gold","Platinum","Abusua"].map(t=><option key={t}>{t}</option>)}
              </Select>
            </FormGroup>
            <FormGroup label="Branch"><Input value={spForm.branch} onChange={e=>setSpForm((p:any)=>({...p,branch:e.target.value}))}/></FormGroup>
          </div>
          <FormGroup label="Photo URL (optional)"><Input value={spForm.photo||""} onChange={e=>setSpForm((p:any)=>({...p,photo:e.target.value}))} placeholder="https://…"/></FormGroup>
          <FormGroup label="Quote *">
            <Textarea value={spForm.quote} onChange={e=>setSpForm((p:any)=>({...p,quote:e.target.value}))} rows={3} className="resize-none" placeholder="What the member said…" />
          </FormGroup>
          <FormGroup label="Achievement (optional)"><Input value={spForm.achievement||""} onChange={e=>setSpForm((p:any)=>({...p,achievement:e.target.value}))} placeholder="Most events attended"/></FormGroup>
          <div className="grid grid-cols-2 gap-3">
            <FormGroup label="Start Date"><Input type="date" value={spForm.startDate||""} onChange={e=>setSpForm((p:any)=>({...p,startDate:e.target.value}))}/></FormGroup>
            <FormGroup label="End Date"><Input type="date" value={spForm.endDate||""} onChange={e=>setSpForm((p:any)=>({...p,endDate:e.target.value}))}/></FormGroup>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={spForm.isActive} onChange={()=>setSpForm((p:any)=>({...p,isActive:!p.isActive}))}/>
            <span className="text-xs text-white/60">Active (show on homepage)</span>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="ghost" size="sm" onClick={()=>setSpotlightModal(false)}>Cancel</Button>
            <Button size="sm" onClick={saveSpotlight}>{editSpotlight?"Update":"Add Spotlight"}</Button>
          </div>
        </div>
      </Modal>

      {/* Fixture Modal */}</div>
  );
}
