"use client";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { BulletinItem, MemberSpotlight, ClubStat } from "@/context/AppContext";
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, Input, Textarea, Select, Modal, FormGroup, Switch, StatCard, EmptyState, RichTextField } from "@/components/ui";
import toast from "react-hot-toast";
import { uploadLocalImage } from "@/lib/clientUploads";

const BULLETIN_TYPES = ["announcement","news","job","ad","event"] as const;
const BULLETIN_EMOJIS = ["📢","🎉","⚽","🏆","🎟️","✈️","🔴","📋","💼","🗓️","🔄","📣","🌟","🎯","📰"];
const TIER_COLORS: Record<string,string> = { Platinum:"#E8E8E8", Gold:"#C6A84B", Silver:"#A8A9AD", Bronze:"#CD7F32", Abusua:"#2ECC71" };
const STAT_ICONS = ["fa-solid fa-users","fa-solid fa-calendar-star","fa-solid fa-shield-halved","fa-solid fa-map-location-dot","fa-solid fa-calendar-days","fa-solid fa-tv","fa-solid fa-trophy","fa-solid fa-star","fa-solid fa-heart","fa-solid fa-globe","fa-solid fa-ticket","fa-solid fa-people-roof"];
const COLOR_OPTS = ["#EF0107","#C6A84B","#3B82F6","#10B981","#F59E0B","#8B5CF6","#EC4899","#14B8A6","#E8E8E8","#FFFFFF"];
const TABS = ["bulletin","spotlight","stats"] as const;

type Tab = typeof TABS[number];

const EMPTY_BULLETIN: Omit<BulletinItem,"id"|"createdAt"> = {
  type:"announcement", title:"", body:"", emoji:"📢", image:"",
  linkUrl:"", linkLabel:"", priority:5, isActive:true, createdBy:"Admin"
};
const EMPTY_SPOTLIGHT: Omit<MemberSpotlight,"id"> = {
  name:"", photo:"", tier:"Gold", branch:"Accra", quote:"", achievement:"",
  type:"week", isActive:true, startDate:new Date().toISOString().split("T")[0]
};

export default function MembersUpdatePage() {
  const { settings, updateSettings, members } = useApp();
  const bullets: BulletinItem[]     = settings.bulletinItems     || [];
  const spotlights: MemberSpotlight[] = settings.memberSpotlights || [];
  const stats: ClubStat[]           = settings.clubStats         || [];

  const [tab, setTab] = useState<Tab>("bulletin");

  // ── Bulletin state ──────────────────────────────────────────────────────────
  const [showBulletin, setShowBulletin] = useState(false);
  const [editBulletinId, setEditBulletinId] = useState<number|null>(null);
  const [bForm, setBForm] = useState<Omit<BulletinItem,"id"|"createdAt">>({...EMPTY_BULLETIN});
  const bImgRef = useRef<HTMLInputElement>(null);

  // ── Spotlight state ─────────────────────────────────────────────────────────
  const [showSpotlight, setShowSpotlight] = useState(false);
  const [editSpotlightId, setEditSpotlightId] = useState<number|null>(null);
  const [sForm, setSForm] = useState<Omit<MemberSpotlight,"id">>({...EMPTY_SPOTLIGHT});
  const sImgRef = useRef<HTMLInputElement>(null);
  const [memberSearch, setMemberSearch] = useState("");

  // ── Stats state ─────────────────────────────────────────────────────────────
  const [editingStats, setEditingStats] = useState(false);
  const [localStats, setLocalStats] = useState<ClubStat[]>(stats);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const bf = (k: string) => (e: any) => setBForm(p => ({...p, [k]: e.target.value}));
  const sf2 = (k: string) => (e: any) => setSForm(p => ({...p, [k]: e.target.value}));

  const readImg = (ref: React.RefObject<HTMLInputElement>, setter: (v: string) => void) => {
    ref.current?.click();
    const handler = async (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      if (file.size > 3*1024*1024) { toast.error("Max 3MB"); return; }
      try { setter(await uploadLocalImage(file, "members")); }
      catch (error) { toast.error(error instanceof Error ? error.message : "Upload failed"); }
    };
    if (ref.current) ref.current.onchange = handler as any;
  };

  // ── BULLETIN CRUD ────────────────────────────────────────────────────────────
  const saveBulletin = () => {
    if (!bForm.title.trim()) { toast.error("Title required"); return; }
    let updated: BulletinItem[];
    if (editBulletinId) {
      updated = bullets.map(b => b.id === editBulletinId ? {...b, ...bForm} : b);
      toast.success("Announcement updated");
    } else {
      updated = [...bullets, {...bForm, id:Date.now(), createdAt:new Date().toISOString()}];
      toast.success("Announcement added");
    }
    updateSettings({ bulletinItems: updated });
    setShowBulletin(false); setEditBulletinId(null); setBForm({...EMPTY_BULLETIN});
  };
  const deleteBulletin = (id: number) => {
    updateSettings({ bulletinItems: bullets.filter(b => b.id !== id) });
    toast.success("Deleted");
  };
  const toggleBulletin = (id: number) => {
    updateSettings({ bulletinItems: bullets.map(b => b.id===id ? {...b,isActive:!b.isActive} : b) });
  };
  const openEditBulletin = (b: BulletinItem) => {
    setBForm({type:b.type,title:b.title,body:b.body,emoji:b.emoji||"📢",image:b.image||"",linkUrl:b.linkUrl||"",linkLabel:b.linkLabel||"",priority:b.priority,isActive:b.isActive,createdBy:b.createdBy});
    setEditBulletinId(b.id); setShowBulletin(true);
  };

  // ── SPOTLIGHT CRUD ───────────────────────────────────────────────────────────
  const saveSpotlight = () => {
    if (!sForm.name.trim()) { toast.error("Name required"); return; }
    let updated: MemberSpotlight[];
    if (editSpotlightId) {
      updated = spotlights.map(s => s.id === editSpotlightId ? {...s, ...sForm} : s);
      toast.success("Spotlight updated");
    } else {
      updated = [...spotlights, {...sForm, id:Date.now()}];
      toast.success("Spotlight added");
    }
    updateSettings({ memberSpotlights: updated });
    setShowSpotlight(false); setEditSpotlightId(null); setSForm({...EMPTY_SPOTLIGHT});
  };
  const openEditSpotlight = (s: MemberSpotlight) => {
    setSForm({name:s.name,photo:s.photo||"",tier:s.tier,branch:s.branch,quote:s.quote,achievement:s.achievement||"",type:s.type,isActive:s.isActive,startDate:s.startDate,endDate:s.endDate,memberId:s.memberId});
    setEditSpotlightId(s.id); setShowSpotlight(true);
  };
  const fillFromMember = (m: any) => {
    setSForm(p => ({...p, name:`${m.firstName} ${m.lastName}`, photo:m.photo||"", tier:m.tier, branch:m.branch||"Accra", memberId:m.id}));
    setMemberSearch("");
  };

  // ── STATS SAVE ───────────────────────────────────────────────────────────────
  const saveStats = () => {
    updateSettings({ clubStats: localStats });
    setEditingStats(false);
    toast.success("Club stats updated — visible on homepage");
  };
  const updateStat = (id: number, k: string, v: any) =>
    setLocalStats(p => p.map(s => s.id===id ? {...s,[k]:v} : s));
  const addStat = () => setLocalStats(p => [...p, {id:Date.now(),label:"New Stat",value:"0",icon:"fa-solid fa-star",color:"#C6A84B",isVisible:true,order:p.length+1}]);
  const removeStat = (id: number) => setLocalStats(p => p.filter(s => s.id!==id));

  const TYPE_COLORS: Record<string,string> = {
    announcement:"#3B82F6", news:"#10B981", job:"#F59E0B", ad:"#8B5CF6", event:"#EF0107"
  };
  const TYPE_ICONS: Record<string,string> = {
    announcement:"fa-solid fa-bullhorn", news:"fa-solid fa-newspaper",
    job:"fa-solid fa-briefcase", ad:"fa-solid fa-rectangle-ad", event:"fa-solid fa-calendar-days"
  };

  return (
    <div className="max-w-5xl space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-white" style={{ fontFamily:"var(--font-display)" }}>MEMBERS UPDATE</h1>
          <p className="text-xs mt-0.5" style={{ color:"rgba(255,255,255,0.4)" }}>
            Manage bulletin board, member spotlights and homepage stats — all appear live on the frontend
          </p>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-sm" style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)" }}>
          {([["bulletin","fa-solid fa-bullhorn","Bulletin Board"],["spotlight","fa-solid fa-star","Spotlight"],["stats","fa-solid fa-chart-line","Club Stats"]] as const).map(([t,icon,label])=>(
            <button key={t} onClick={()=>setTab(t as Tab)}
              className="px-4 py-2 text-xs font-bold rounded-sm transition-all flex items-center gap-1.5"
              style={{ background:tab===t?"var(--color-red)":"transparent", color:tab===t?"white":"rgba(255,255,255,0.5)", fontFamily:"var(--font-heading)" }}>
              <i className={`${icon} text-[10px]`} />{label}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ BULLETIN BOARD TAB ════════════════════════════════════════════════ */}
      {tab==="bulletin" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm" style={{ color:"rgba(255,255,255,0.5)" }}>
              {bullets.filter(b=>b.isActive).length} active · {bullets.length} total — displayed on homepage below the stats section
            </p>
            <Button onClick={()=>{setBForm({...EMPTY_BULLETIN});setEditBulletinId(null);setShowBulletin(true);}}>
              <i className="fa-solid fa-plus mr-1.5" />Add Announcement
            </Button>
          </div>

          {bullets.length === 0 ? (
            <EmptyState icon="fa-solid fa-bullhorn" title="No announcements yet"
              desc="Add announcements, news, job posts and ads — they appear on the homepage bulletin board"
              action={<Button onClick={()=>setShowBulletin(true)}>Add First Announcement</Button>} />
          ) : (
            <div className="space-y-3">
              {[...bullets].sort((a,b)=>b.priority-a.priority).map((b, i) => (
                <motion.div key={b.id} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:i*0.04}}
                  className="flex items-start gap-4 p-4 rounded-sm"
                  style={{ background:"rgba(255,255,255,0.03)", border:`1px solid ${b.isActive?"rgba(255,255,255,0.1)":"rgba(255,255,255,0.04)"}`, opacity:b.isActive?1:0.5 }}>
                  {/* Emoji */}
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background:`${TYPE_COLORS[b.type]||"#3B82F6"}15` }}>
                    {b.emoji || "📢"}
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge variant="info" style={{ background:`${TYPE_COLORS[b.type]}20`, color:TYPE_COLORS[b.type], border:`1px solid ${TYPE_COLORS[b.type]}40` }}>
                        <i className={`${TYPE_ICONS[b.type]} text-[9px] mr-1`} />{b.type}
                      </Badge>
                      <span className="text-[10px]" style={{ color:"rgba(255,255,255,0.3)" }}>Priority: {b.priority}</span>
                      {!b.isActive && <Badge variant="default">Hidden</Badge>}
                      {b.expiresAt && <Badge variant="warning">Expires: {new Date(b.expiresAt).toLocaleDateString()}</Badge>}
                    </div>
                    <p className="font-bold text-sm text-white" style={{ fontFamily:"var(--font-heading)" }}>{b.title}</p>
                    <p className="text-xs mt-1 line-clamp-2" style={{ color:"rgba(255,255,255,0.5)", fontFamily:"var(--font-body)" }}>{b.body}</p>
                    {b.linkUrl && (
                      <p className="text-xs mt-1" style={{ color:"var(--color-red)" }}>
                        <i className="fa-solid fa-link text-[9px] mr-1" />{b.linkLabel || b.linkUrl}
                      </p>
                    )}
                  </div>
                  {/* Actions */}
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={()=>toggleBulletin(b.id)} title={b.isActive?"Hide":"Show"}
                      className="w-8 h-8 flex items-center justify-center rounded-sm transition-colors"
                      style={{ background:"rgba(255,255,255,0.05)", color:b.isActive?"#22C55E":"rgba(255,255,255,0.3)" }}>
                      <i className={`fa-solid ${b.isActive?"fa-eye":"fa-eye-slash"} text-xs`} />
                    </button>
                    <button onClick={()=>openEditBulletin(b)} title="Edit"
                      className="w-8 h-8 flex items-center justify-center rounded-sm transition-colors"
                      style={{ background:"rgba(255,255,255,0.05)", color:"rgba(255,255,255,0.5)" }}>
                      <i className="fa-solid fa-pen text-xs" />
                    </button>
                    <button onClick={()=>{ if(!confirm("Delete?"))return; deleteBulletin(b.id); }} title="Delete"
                      className="w-8 h-8 flex items-center justify-center rounded-sm transition-colors hover:bg-red-500/20"
                      style={{ background:"rgba(255,255,255,0.05)", color:"rgba(239,1,7,0.6)" }}>
                      <i className="fa-solid fa-trash text-xs" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ SPOTLIGHT TAB ══════════════════════════════════════════════════════ */}
      {tab==="spotlight" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm" style={{ color:"rgba(255,255,255,0.5)" }}>
              Member of the Week/Month spotlights — shown on the homepage right column
            </p>
            <Button onClick={()=>{setSForm({...EMPTY_SPOTLIGHT});setEditSpotlightId(null);setShowSpotlight(true);}}>
              <i className="fa-solid fa-star mr-1.5" />Add Spotlight
            </Button>
          </div>

          {spotlights.length === 0 ? (
            <EmptyState icon="fa-solid fa-star" title="No spotlights yet"
              desc="Highlight your Member of the Week, Month or Quarter. They'll be shown on the homepage."
              action={<Button onClick={()=>setShowSpotlight(true)}>Add First Spotlight</Button>} />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {spotlights.map((s, i) => (
                <motion.div key={s.id} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:i*0.06}}
                  className="arsenal-card overflow-hidden" style={{ opacity:s.isActive?1:0.55 }}>
                  <div className="px-4 py-2.5 flex items-center justify-between"
                    style={{ background:`rgba(${s.type==="week"?"239,1,7":s.type==="month"?"198,168,75":"59,130,246"},0.12)`, borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
                    <span className="text-[10px] font-black uppercase tracking-widest" style={{ color:s.type==="week"?"var(--color-red)":s.type==="month"?"var(--color-gold)":"#3B82F6", fontFamily:"var(--font-heading)" }}>
                      <i className={`fa-solid ${s.type==="week"?"fa-star":s.type==="month"?"fa-crown":"fa-trophy"} mr-1`} />
                      Member of the {s.type.charAt(0).toUpperCase()+s.type.slice(1)}
                    </span>
                    {!s.isActive && <Badge variant="default">Hidden</Badge>}
                  </div>
                  <div className="p-4 text-center">
                    <div className="w-16 h-16 rounded-full overflow-hidden mx-auto mb-3"
                      style={{ border:`2px solid ${TIER_COLORS[s.tier]||"#C6A84B"}` }}>
                      {s.photo
                        ? <img src={s.photo} alt={s.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-lg font-black"
                            style={{ background:`${TIER_COLORS[s.tier]||"#C6A84B"}20`, color:TIER_COLORS[s.tier]||"#C6A84B" }}>
                            {s.name.split(" ").map(n=>n[0]).slice(0,2).join("")}
                          </div>
                      }
                    </div>
                    <p className="font-black text-sm text-white" style={{ fontFamily:"var(--font-heading)" }}>{s.name}</p>
                    <p className="text-xs mt-0.5" style={{ color:"rgba(255,255,255,0.4)" }}>{s.tier} · {s.branch}</p>
                    {s.achievement && <p className="text-[10px] mt-1 font-bold" style={{ color:"var(--color-gold)" }}>{s.achievement}</p>}
                    <p className="text-xs mt-2 italic line-clamp-2" style={{ color:"rgba(255,255,255,0.5)" }}>"{s.quote}"</p>
                  </div>
                  <div className="px-4 pb-4 flex gap-2">
                    <Button size="sm" variant="secondary" className="flex-1" onClick={()=>openEditSpotlight(s)}>
                      <i className="fa-solid fa-pen mr-1" />Edit
                    </Button>
                    <button onClick={()=>updateSettings({memberSpotlights:spotlights.map(x=>x.id===s.id?{...x,isActive:!x.isActive}:x)})}
                      className="px-2 py-1 rounded-sm text-xs" style={{ background:"rgba(255,255,255,0.05)", color:s.isActive?"#22C55E":"rgba(255,255,255,0.3)" }}>
                      <i className={`fa-solid ${s.isActive?"fa-eye":"fa-eye-slash"}`} />
                    </button>
                    <button onClick={()=>{ if(!confirm("Delete?"))return; updateSettings({memberSpotlights:spotlights.filter(x=>x.id!==s.id)}); toast.success("Deleted"); }}
                      className="px-2 py-1 rounded-sm text-xs hover:bg-red-500/20" style={{ background:"rgba(255,255,255,0.05)", color:"rgba(239,1,7,0.6)" }}>
                      <i className="fa-solid fa-trash" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ STATS TAB ══════════════════════════════════════════════════════════ */}
      {tab==="stats" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm" style={{ color:"rgba(255,255,255,0.5)" }}>
              The 4 stat cards shown at the top of the Members section on the homepage
            </p>
            <div className="flex gap-2">
              {editingStats ? (
                <>
                  <Button variant="secondary" onClick={()=>{setLocalStats(stats);setEditingStats(false);}}>Cancel</Button>
                  <Button onClick={saveStats}><i className="fa-solid fa-save mr-1.5" />Save Stats</Button>
                </>
              ) : (
                <>
                  <Button variant="secondary" onClick={addStat}><i className="fa-solid fa-plus mr-1.5" />Add Stat</Button>
                  <Button onClick={()=>setEditingStats(true)}><i className="fa-solid fa-pen mr-1.5" />Edit Stats</Button>
                </>
              )}
            </div>
          </div>

          {/* Preview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-sm" style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-[10px] col-span-full uppercase tracking-widest mb-1" style={{ color:"rgba(255,255,255,0.3)", fontFamily:"var(--font-heading)" }}>Homepage Preview</p>
            {(editingStats ? localStats : stats).filter(s=>s.isVisible).sort((a,b)=>a.order-b.order).slice(0,4).map(s=>(
              <div key={s.id} className="p-4 rounded-sm flex flex-col items-center text-center" style={{ background:"var(--bg-card)", borderTop:`3px solid ${s.color}` }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center mb-2" style={{ background:`${s.color}18` }}>
                  <i className={`${s.icon} text-sm`} style={{ color:s.color }} />
                </div>
                <p className="text-2xl font-black" style={{ color:s.color, fontFamily:"var(--font-display)" }}>
                  {s.value==="dynamic"?"Live":s.value}
                </p>
                <p className="text-[10px] mt-1 font-bold uppercase tracking-wider" style={{ color:"rgba(255,255,255,0.5)", fontFamily:"var(--font-heading)" }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Edit table */}
          <div className="space-y-2">
            {(editingStats ? localStats : stats).sort((a,b)=>a.order-b.order).map((s,i)=>(
              <div key={s.id} className="flex items-center gap-3 p-3 rounded-sm" style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)" }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background:`${s.color}20` }}>
                  <i className={`${s.icon} text-xs`} style={{ color:s.color }} />
                </div>
                {editingStats ? (
                  <>
                    <input value={s.label} onChange={e=>updateStat(s.id,"label",e.target.value)}
                      className="input-arsenal flex-1 text-xs py-1.5" placeholder="Label" />
                    <div className="flex items-center gap-1">
                      <input value={s.value} onChange={e=>updateStat(s.id,"value",e.target.value)}
                        className="input-arsenal w-24 text-xs py-1.5" placeholder="Value or 'dynamic'" />
                      <span className="text-[10px] text-white/30">dynamic=live count</span>
                    </div>
                    <select value={s.icon} onChange={e=>updateStat(s.id,"icon",e.target.value)}
                      className="input-arsenal text-xs py-1.5 w-40">
                      {STAT_ICONS.map(ic=><option key={ic} value={ic}>{ic.replace("fa-solid fa-","")}</option>)}
                    </select>
                    <div className="flex gap-1">
                      {COLOR_OPTS.map(c=><button key={c} type="button" onClick={()=>updateStat(s.id,"color",c)}
                        className="w-5 h-5 rounded-full transition-transform hover:scale-110"
                        style={{ background:c, outline:s.color===c?"2px solid white":"none", outlineOffset:1 }} />)}
                    </div>
                    <button onClick={()=>updateStat(s.id,"isVisible",!s.isVisible)}
                      className="w-8 h-8 flex items-center justify-center rounded-sm"
                      style={{ background:"rgba(255,255,255,0.05)", color:s.isVisible?"#22C55E":"rgba(255,255,255,0.3)" }}>
                      <i className={`fa-solid ${s.isVisible?"fa-eye":"fa-eye-slash"} text-xs`} />
                    </button>
                    <button onClick={()=>removeStat(s.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-sm hover:bg-red-500/20"
                      style={{ background:"rgba(255,255,255,0.05)", color:"rgba(239,1,7,0.6)" }}>
                      <i className="fa-solid fa-trash text-xs" />
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-white" style={{ fontFamily:"var(--font-heading)" }}>{s.label}</p>
                      <p className="text-xs" style={{ color:"rgba(255,255,255,0.4)" }}>{s.value==="dynamic"?"Shows live member count":s.value}</p>
                    </div>
                    <Badge variant={s.isVisible?"success":"default"}>{s.isVisible?"Visible":"Hidden"}</Badge>
                    <span className="text-xs font-mono" style={{ color:s.color }}>#{s.color.replace("#","")}</span>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ BULLETIN MODAL ═════════════════════════════════════════════════════ */}
      <Modal open={showBulletin} onClose={()=>setShowBulletin(false)} title={editBulletinId?"Edit Announcement":"Add Announcement"} size="lg">
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          <input ref={bImgRef} type="file" accept="image/*" className="hidden"
            onChange={async e=>{ const f=e.target.files?.[0]; if(!f)return; if(f.size>3*1024*1024){toast.error("Max 3MB");return;} try { const image = await uploadLocalImage(f, "members"); setBForm(p=>({...p,image})); } catch (error) { toast.error(error instanceof Error ? error.message : "Upload failed"); } }} />

          <div className="grid sm:grid-cols-2 gap-4">
            <FormGroup label="Type" icon="fa-solid fa-tag">
              <Select value={bForm.type} onChange={bf("type")}>
                {BULLETIN_TYPES.map(t=><option key={t} value={t} style={{background:"#0D0B18"}}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
              </Select>
            </FormGroup>
            <FormGroup label="Priority (higher = first)" icon="fa-solid fa-arrow-up-9-1">
              <Input type="number" value={bForm.priority} onChange={bf("priority")} min="1" max="10" />
            </FormGroup>
            <div className="sm:col-span-2">
              <FormGroup label="Title *" icon="fa-solid fa-heading">
                <Input value={bForm.title} onChange={bf("title")} placeholder="Announcement title" />
              </FormGroup>
            </div>
            <div className="sm:col-span-2">
              <FormGroup label="Body" icon="fa-solid fa-align-left">
                <RichTextField value={bForm.body} onChange={v => setBForm((p:any) => ({...p, body: v}))} placeholder="Full announcement text…" minHeight={180} />
              </FormGroup>
            </div>
            <FormGroup label="Link URL (optional)" icon="fa-solid fa-link">
              <Input value={bForm.linkUrl||""} onChange={bf("linkUrl")} placeholder="https://... or /events" />
            </FormGroup>
            <FormGroup label="Link Button Label" icon="fa-solid fa-cursor">
              <Input value={bForm.linkLabel||""} onChange={bf("linkLabel")} placeholder="e.g. Learn More, Register" />
            </FormGroup>
            <FormGroup label="Expires (optional)" icon="fa-solid fa-clock">
              <Input type="date" value={(bForm as any).expiresAt||""} onChange={bf("expiresAt")} />
            </FormGroup>
          </div>

          {/* Emoji picker */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color:"rgba(255,255,255,0.4)", fontFamily:"var(--font-heading)" }}>Emoji Icon</label>
            <div className="flex gap-2 flex-wrap">
              {BULLETIN_EMOJIS.map(e=>(
                <button key={e} type="button" onClick={()=>setBForm(p=>({...p,emoji:e}))}
                  className="w-9 h-9 text-xl rounded-sm flex items-center justify-center transition-all"
                  style={{ background:bForm.emoji===e?"rgba(239,1,7,0.2)":"rgba(255,255,255,0.05)", border:`1px solid ${bForm.emoji===e?"var(--color-red)":"rgba(255,255,255,0.08)"}`, transform:bForm.emoji===e?"scale(1.15)":"none" }}>
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Image upload */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color:"rgba(255,255,255,0.4)", fontFamily:"var(--font-heading)" }}>Image (optional)</label>
            {bForm.image ? (
              <div className="relative h-32 rounded-sm overflow-hidden">
                <img src={bForm.image} alt="" className="w-full h-full object-cover" />
                <button onClick={()=>setBForm(p=>({...p,image:""}))} className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center" style={{ background:"rgba(239,1,7,0.9)" }}>
                  <i className="fa-solid fa-xmark text-white text-xs" />
                </button>
              </div>
            ) : (
              <button onClick={()=>bImgRef.current?.click()} className="w-full h-24 rounded-sm flex flex-col items-center justify-center gap-1.5 transition-colors hover:bg-white/5" style={{ border:"2px dashed rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.02)" }}>
                <i className="fa-solid fa-image text-xl" style={{ color:"rgba(255,255,255,0.2)" }} />
                <p className="text-xs" style={{ color:"rgba(255,255,255,0.3)" }}>Upload image (max 3MB)</p>
              </button>
            )}
          </div>

          <Switch checked={bForm.isActive} onChange={()=>setBForm(p=>({...p,isActive:!p.isActive}))} label="Active (visible on homepage)" />
        </div>
        <div className="px-5 py-4 flex justify-end gap-3" style={{ borderTop:"1px solid rgba(255,255,255,0.06)" }}>
          <Button variant="secondary" onClick={()=>setShowBulletin(false)}>Cancel</Button>
          <Button onClick={saveBulletin}><i className="fa-solid fa-save mr-1.5" />{editBulletinId?"Update":"Add Announcement"}</Button>
        </div>
      </Modal>

      {/* ═══ SPOTLIGHT MODAL ════════════════════════════════════════════════════ */}
      <Modal open={showSpotlight} onClose={()=>setShowSpotlight(false)} title={editSpotlightId?"Edit Spotlight":"Add Member Spotlight"} size="lg">
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          <input ref={sImgRef} type="file" accept="image/*" className="hidden"
            onChange={async e=>{ const f=e.target.files?.[0]; if(!f)return; try { const photo = await uploadLocalImage(f, "members"); setSForm(p=>({...p,photo})); } catch (error) { toast.error(error instanceof Error ? error.message : "Upload failed"); } }} />

          {/* Member search */}
          <div className="relative">
            <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block" style={{ color:"rgba(255,255,255,0.4)", fontFamily:"var(--font-heading)" }}>
              <i className="fa-solid fa-magnifying-glass mr-1.5" style={{ color:"var(--color-red)" }} />Search & Fill from Existing Member
            </label>
            <Input value={memberSearch} onChange={e=>setMemberSearch(e.target.value)} placeholder="Type member name to auto-fill..." />
            {memberSearch.length > 1 && (
              <div className="absolute z-10 top-full left-0 right-0 rounded-sm shadow-2xl overflow-hidden" style={{ background:"#111020", border:"1px solid rgba(255,255,255,0.1)", marginTop:2 }}>
                {members.filter(m=>`${m.firstName} ${m.lastName}`.toLowerCase().includes(memberSearch.toLowerCase())).slice(0,5).map(m=>(
                  <button key={m.id} onClick={()=>fillFromMember(m)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-white/5"
                    style={{ color:"rgba(255,255,255,0.8)", fontFamily:"var(--font-body)" }}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0" style={{ background:"rgba(239,1,7,0.15)", color:"var(--color-red)" }}>
                      {m.firstName[0]}{m.lastName[0]}
                    </div>
                    {m.firstName} {m.lastName} · {m.tier} · {m.branch}
                  </button>
                ))}
                {members.filter(m=>`${m.firstName} ${m.lastName}`.toLowerCase().includes(memberSearch.toLowerCase())).length===0 && (
                  <p className="px-4 py-3 text-xs" style={{ color:"rgba(255,255,255,0.3)" }}>No members found</p>
                )}
              </div>
            )}
          </div>

          {/* Photo */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color:"rgba(255,255,255,0.4)", fontFamily:"var(--font-heading)" }}>Photo</label>
            {sForm.photo ? (
              <div className="flex items-center gap-3">
                <div className="w-20 h-20 rounded-full overflow-hidden" style={{ border:"2px solid rgba(255,255,255,0.1)" }}>
                  <img src={sForm.photo} alt="" className="w-full h-full object-cover" />
                </div>
                <Button variant="secondary" size="sm" onClick={()=>sImgRef.current?.click()}>Change Photo</Button>
                <Button variant="ghost" size="sm" onClick={()=>setSForm(p=>({...p,photo:""}))}>Remove</Button>
              </div>
            ) : (
              <button onClick={()=>sImgRef.current?.click()} className="w-20 h-20 rounded-full flex flex-col items-center justify-center gap-1 transition-colors" style={{ border:"2px dashed rgba(255,255,255,0.15)", background:"rgba(255,255,255,0.03)" }}>
                <i className="fa-solid fa-camera text-lg" style={{ color:"rgba(255,255,255,0.2)" }} />
                <p className="text-[9px]" style={{ color:"rgba(255,255,255,0.3)" }}>Upload</p>
              </button>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <FormGroup label="Member Name *" icon="fa-solid fa-user">
              <Input value={sForm.name} onChange={sf2("name")} placeholder="Full name" />
            </FormGroup>
            <FormGroup label="Spotlight Type" icon="fa-solid fa-star">
              <Select value={sForm.type} onChange={sf2("type")}>
                <option value="week">Member of the Week</option>
                <option value="month">Member of the Month</option>
                <option value="quarter">Member of the Quarter</option>
              </Select>
            </FormGroup>
            <FormGroup label="Tier" icon="fa-solid fa-crown">
              <Select value={sForm.tier} onChange={sf2("tier")}>
                {["Bronze","Silver","Gold","Platinum","Abusua"].map(t=><option key={t} style={{background:"#0D0B18"}}>{t}</option>)}
              </Select>
            </FormGroup>
            <FormGroup label="Branch" icon="fa-solid fa-map-marker-alt">
              <Select value={sForm.branch} onChange={sf2("branch")}>
                {["Accra","Ashanti","Sunyani","Volta","Central","Northern Regions","Eastern","Western","Tema","Ladies"].map(b=><option key={b} style={{background:"#0D0B18"}}>{b}</option>)}
              </Select>
            </FormGroup>
            <div className="sm:col-span-2">
              <FormGroup label="Quote / Feature Text" icon="fa-solid fa-quote-left">
                <Textarea value={sForm.quote} onChange={sf2("quote")} rows={3} placeholder="Their quote or reason for being featured..." className="resize-y" />
              </FormGroup>
            </div>
            <FormGroup label="Achievement / Reason" icon="fa-solid fa-trophy" hint="Short tag shown under name">
              <Input value={sForm.achievement||""} onChange={sf2("achievement")} placeholder="e.g. Most events attended, Top donor" />
            </FormGroup>
            <FormGroup label="Start Date" icon="fa-solid fa-calendar">
              <Input type="date" value={sForm.startDate} onChange={sf2("startDate")} />
            </FormGroup>
          </div>
          <Switch checked={sForm.isActive} onChange={()=>setSForm(p=>({...p,isActive:!p.isActive}))} label="Active (visible on homepage)" />
        </div>
        <div className="px-5 py-4 flex justify-end gap-3" style={{ borderTop:"1px solid rgba(255,255,255,0.06)" }}>
          <Button variant="secondary" onClick={()=>setShowSpotlight(false)}>Cancel</Button>
          <Button onClick={saveSpotlight}><i className="fa-solid fa-save mr-1.5" />{editSpotlightId?"Update":"Add Spotlight"}</Button>
        </div>
      </Modal>
    </div>
  );
}
