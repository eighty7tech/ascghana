"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { useApp, VotingPoll, VotingOption } from "@/context/AppContext";
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, Input, Select, Modal, FormGroup, Switch, EmptyState, StatCard, RichTextField } from "@/components/ui";
import toast from "react-hot-toast";

const POLL_TYPES = [
  { value:"motw",        label:"Member of the Week",    icon:"fa-solid fa-star",   color:"#F59E0B" },
  { value:"motm",        label:"Member of the Month",   icon:"fa-solid fa-crown",  color:"#C6A84B" },
  { value:"motq",        label:"Member of the Quarter", icon:"fa-solid fa-trophy", color:"#8B5CF6" },
  { value:"best_player", label:"Best Player Rating",    icon:"fa-solid fa-futbol", color:"#3B82F6" },
  { value:"custom",      label:"Custom Poll",           icon:"fa-solid fa-list-check",color:"#10B981" },
];

const EMPTY_POLL: Omit<VotingPoll,"id"|"createdAt"> = {
  title:"", description:"", type:"motw", options:[],
  startsAt: new Date().toISOString().split("T")[0],
  endsAt: new Date(Date.now()+7*24*60*60*1000).toISOString().split("T")[0],
  isActive:true, allowNonMembers:false, showResults:true, resultType:"public",
};

export default function AdminVotingPage() {
  const { settings, updateSettings, members } = useApp();
  const polls: VotingPoll[] = settings.votingPolls || [];

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId]     = useState<number|null>(null);
  const [form, setForm]         = useState<Omit<VotingPoll,"id"|"createdAt">>({...EMPTY_POLL});
  const [optName, setOptName]   = useState("");
  const [memberSearch, setMemberSearch] = useState("");

  const sf = (k: string) => (e: any) => setForm(p=>({...p,[k]:e.target.value}));

  const savePoll = () => {
    if (!form.title.trim()) { toast.error("Title required"); return; }
    if (form.options.length < 2) { toast.error("Add at least 2 options"); return; }
    let updated: VotingPoll[];
    if (editId) {
      updated = polls.map(p => p.id===editId ? {...p,...form} : p);
      toast.success("Poll updated");
    } else {
      updated = [...polls, {...form, id:Date.now(), createdAt:new Date().toISOString()}];
      toast.success("Poll created");
    }
    updateSettings({ votingPolls:updated } as any);
    setShowForm(false); setEditId(null); setForm({...EMPTY_POLL});
  };

  const deletePoll = (id: number) => {
    if (!confirm("Delete this poll?")) return;
    updateSettings({ votingPolls: polls.filter(p=>p.id!==id) } as any);
    toast.success("Poll deleted");
  };

  const togglePoll = (id: number) =>
    updateSettings({ votingPolls: polls.map(p=>p.id===id?{...p,isActive:!p.isActive}:p) } as any);

  const addOption = () => {
    if (!optName.trim()) return;
    const opt: VotingOption = { id:Date.now(), pollId:editId||0, name:optName, votes:0 };
    setForm(p=>({...p, options:[...p.options,opt]}));
    setOptName("");
  };

  const addMemberOption = (m: any) => {
    const already = form.options.some(o=>o.memberId===m.id);
    if (already) { toast.error("Already added"); return; }
    const opt: VotingOption = { id:Date.now(), pollId:editId||0, memberId:m.id, name:`${m.firstName} ${m.lastName}`, photo:m.photo, tier:m.tier, branch:m.branch, votes:0 };
    setForm(p=>({...p, options:[...p.options,opt]}));
    setMemberSearch("");
  };

  const removeOption = (id: number) => setForm(p=>({...p,options:p.options.filter(o=>o.id!==id)}));

  const openEdit = (poll: VotingPoll) => {
    setForm({title:poll.title,description:poll.description,type:poll.type,options:[...poll.options],startsAt:poll.startsAt,endsAt:poll.endsAt,isActive:poll.isActive,allowNonMembers:poll.allowNonMembers,showResults:poll.showResults,resultType:poll.resultType,createdBy:poll.createdBy});
    setEditId(poll.id); setShowForm(true);
  };

  const openPolls = polls.filter(p=>p.isActive&&new Date(p.startsAt)<=new Date()&&new Date(p.endsAt)>new Date());
  const totalVotes = polls.reduce((a,p)=>a+p.options.reduce((b,o)=>b+(o.votes||0),0),0);

  const typeConfig = Object.fromEntries(POLL_TYPES.map(t=>[t.value,t]));

  return (
    <div className="max-w-5xl space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-white" style={{ fontFamily:"var(--font-display)" }}>VOTING & POLLS</h1>
          <p className="text-xs mt-0.5" style={{ color:"rgba(255,255,255,0.4)" }}>Create polls for MOTW, MOTM, MOTQ, best player and custom votes — shown on the homepage</p>
        </div>
        <Button onClick={()=>{setForm({...EMPTY_POLL});setEditId(null);setShowForm(true);}}>
          <i className="fa-solid fa-plus mr-1.5" />Create Poll
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Total Polls"  value={polls.length}      icon="fa-solid fa-list-check"   color="#3B82F6" />
        <StatCard label="Live Now"     value={openPolls.length}  icon="fa-solid fa-circle"        color="#22C55E" />
        <StatCard label="Total Votes"  value={totalVotes}        icon="fa-solid fa-vote-yea"      color="#C6A84B" />
      </div>

      {polls.length === 0 ? (
        <EmptyState icon="fa-solid fa-vote-yea" title="No polls yet"
          desc="Create your first poll — Member of the Week, Month, Quarter or a custom vote. Polls appear on the homepage."
          action={<Button onClick={()=>setShowForm(true)}><i className="fa-solid fa-plus mr-2" />Create First Poll</Button>} />
      ) : (
        <div className="space-y-3">
          {polls.map((poll,i) => {
            const cfg = typeConfig[poll.type];
            const totalPollVotes = poll.options.reduce((a,o)=>a+(o.votes||0),0);
            const isLive = poll.isActive && new Date(poll.startsAt)<=new Date() && new Date(poll.endsAt)>new Date();
            const isEnded = new Date(poll.endsAt) <= new Date();
            const winner = poll.options.reduce((a,b)=>(b.votes||0)>(a.votes||0)?b:a, poll.options[0]);
            return (
              <motion.div key={poll.id} initial={{ opacity:0,y:12 }} animate={{ opacity:1,y:0 }} transition={{ delay:i*0.05 }}
                className="arsenal-card p-5" style={{ opacity:poll.isActive?1:0.6 }}>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background:`${cfg?.color||"#3B82F6"}18` }}>
                    <i className={`${cfg?.icon||"fa-solid fa-list-check"} text-base`} style={{ color:cfg?.color||"#3B82F6" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Badge variant="info" style={{ background:`${cfg?.color}20`, color:cfg?.color, border:`1px solid ${cfg?.color}40` }}>
                        {cfg?.label || poll.type}
                      </Badge>
                      {isLive  && <Badge variant="success"><i className="fa-solid fa-circle text-[8px] animate-pulse mr-1" />Live</Badge>}
                      {isEnded && <Badge variant="default">Ended</Badge>}
                      {!poll.isActive && <Badge variant="default">Inactive</Badge>}
                    </div>
                    <h3 className="font-black text-base text-white" style={{ fontFamily:"var(--font-heading)" }}>{poll.title}</h3>
                    {poll.description && <p className="text-xs mt-0.5 line-clamp-1" style={{ color:"rgba(255,255,255,0.45)" }}>{poll.description}</p>}
                    <div className="flex items-center gap-4 mt-2 text-xs" style={{ color:"rgba(255,255,255,0.4)" }}>
                      <span><i className="fa-solid fa-calendar mr-1" />{new Date(poll.startsAt).toLocaleDateString("en-GB")} → {new Date(poll.endsAt).toLocaleDateString("en-GB")}</span>
                      <span><i className="fa-solid fa-users mr-1" />{poll.options.length} candidates</span>
                      <span><i className="fa-solid fa-vote-yea mr-1" />{totalPollVotes} votes</span>
                    </div>
                    {isEnded && winner && totalPollVotes > 0 && (
                      <div className="mt-2 flex items-center gap-2 text-xs">
                        <i className="fa-solid fa-crown" style={{ color:"var(--color-gold)" }} />
                        <span style={{ color:"var(--color-gold)", fontFamily:"var(--font-heading)" }}>Winner: {winner.name} ({winner.votes} votes)</span>
                      </div>
                    )}
                    {/* Mini bar chart of top 3 */}
                    {totalPollVotes > 0 && poll.showResults && (
                      <div className="mt-3 space-y-1.5">
                        {[...poll.options].sort((a,b)=>(b.votes||0)-(a.votes||0)).slice(0,3).map(opt=>(
                          <div key={opt.id} className="flex items-center gap-2">
                            <span className="text-[10px] w-28 truncate" style={{ color:"rgba(255,255,255,0.6)" }}>{opt.name}</span>
                            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background:"rgba(255,255,255,0.06)" }}>
                              <div className="h-full rounded-full" style={{ width:`${totalPollVotes>0?Math.round(((opt.votes||0)/totalPollVotes)*100):0}%`, background:cfg?.color||"#3B82F6" }} />
                            </div>
                            <span className="text-[10px] w-8 text-right font-bold" style={{ color:"rgba(255,255,255,0.5)" }}>{opt.votes||0}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button onClick={()=>togglePoll(poll.id)} title={poll.isActive?"Deactivate":"Activate"}
                      className="w-8 h-8 flex items-center justify-center rounded-sm"
                      style={{ background:"rgba(255,255,255,0.05)", color:poll.isActive?"#22C55E":"rgba(255,255,255,0.3)" }}>
                      <i className={`fa-solid ${poll.isActive?"fa-toggle-on":"fa-toggle-off"} text-sm`} />
                    </button>
                    <button onClick={()=>openEdit(poll)}
                      className="w-8 h-8 flex items-center justify-center rounded-sm"
                      style={{ background:"rgba(255,255,255,0.05)", color:"rgba(255,255,255,0.5)" }}>
                      <i className="fa-solid fa-pen text-xs" />
                    </button>
                    <button onClick={()=>deletePoll(poll.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-sm hover:bg-red-500/20"
                      style={{ background:"rgba(255,255,255,0.05)", color:"rgba(239,1,7,0.6)" }}>
                      <i className="fa-solid fa-trash text-xs" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal open={showForm} onClose={()=>setShowForm(false)} title={editId?"Edit Poll":"Create Poll"} size="xl">
        <div className="p-5 space-y-5 max-h-[78vh] overflow-y-auto">
          {/* Poll Type */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color:"rgba(255,255,255,0.4)", fontFamily:"var(--font-heading)" }}>Poll Type</label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {POLL_TYPES.map(t=>(
                <button key={t.value} type="button" onClick={()=>setForm(p=>({...p,type:t.value as any}))}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-sm transition-all text-center"
                  style={{ border:`1px solid ${form.type===t.value?t.color:"rgba(255,255,255,0.08)"}`, background:form.type===t.value?`${t.color}12`:"rgba(255,255,255,0.02)" }}>
                  <i className={`${t.icon} text-lg`} style={{ color:form.type===t.value?t.color:"rgba(255,255,255,0.3)" }} />
                  <span className="text-[9px] font-bold leading-tight text-center" style={{ color:form.type===t.value?t.color:"rgba(255,255,255,0.4)", fontFamily:"var(--font-heading)" }}>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2"><FormGroup label="Poll Title *" icon="fa-solid fa-heading"><Input value={form.title} onChange={sf("title")} placeholder="e.g. Vote for Member of the Week — May 2025" /></FormGroup></div>
            <div className="sm:col-span-2"><FormGroup label="Description" icon="fa-solid fa-align-left"><RichTextField value={form.description} onChange={v => setForm(p => ({...p, description: v}))} placeholder="Brief description shown on the frontend…" minHeight={140} /></FormGroup></div>
            <FormGroup label="Starts" icon="fa-solid fa-calendar-plus"><Input type="date" value={form.startsAt} onChange={sf("startsAt")} /></FormGroup>
            <FormGroup label="Ends" icon="fa-solid fa-calendar-minus"><Input type="date" value={form.endsAt} onChange={sf("endsAt")} /></FormGroup>
          </div>

          {/* Options */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color:"rgba(255,255,255,0.4)", fontFamily:"var(--font-heading)" }}>
              <i className="fa-solid fa-users mr-1.5 text-[10px]" style={{ color:"var(--color-red)" }} />Candidates / Options ({form.options.length})
            </label>

            {/* From member search */}
            <div className="relative mb-3">
              <Input value={memberSearch} onChange={e=>setMemberSearch(e.target.value)} placeholder="Search members to add as candidate..." />
              {memberSearch.length > 1 && (
                <div className="absolute z-20 top-full left-0 right-0 rounded-sm shadow-xl overflow-hidden" style={{ background:"#111020", border:"1px solid rgba(255,255,255,0.1)", marginTop:2 }}>
                  {members.filter(m=>`${m.firstName} ${m.lastName}`.toLowerCase().includes(memberSearch.toLowerCase())).slice(0,5).map(m=>(
                    <button key={m.id} onClick={()=>addMemberOption(m)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-white/5 text-left"
                      style={{ color:"rgba(255,255,255,0.8)" }}>
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black" style={{ background:"rgba(239,1,7,0.15)", color:"var(--color-red)" }}>
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

            {/* Custom option */}
            <div className="flex gap-2 mb-3">
              <Input value={optName} onChange={e=>setOptName(e.target.value)} placeholder="Or type a custom option name..." onKeyDown={e=>e.key==="Enter"&&addOption()} className="flex-1" />
              <Button variant="secondary" onClick={addOption}><i className="fa-solid fa-plus mr-1" />Add</Button>
            </div>

            {/* Options list */}
            <div className="space-y-1.5">
              {form.options.map((opt,i) => (
                <div key={opt.id} className="flex items-center gap-3 p-2.5 rounded-sm" style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)" }}>
                  <span className="text-xs w-5 text-center font-bold" style={{ color:"rgba(255,255,255,0.3)" }}>{i+1}</span>
                  {opt.photo ? <img src={opt.photo} alt="" className="w-7 h-7 rounded-full object-cover" /> : (
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black" style={{ background:"rgba(239,1,7,0.15)", color:"var(--color-red)" }}>
                      {opt.name.split(" ").map(n=>n[0]).slice(0,2).join("")}
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-bold text-white" style={{ fontFamily:"var(--font-heading)" }}>{opt.name}</p>
                    {opt.tier && <p className="text-[10px]" style={{ color:"rgba(255,255,255,0.4)" }}>{opt.tier} · {opt.branch}</p>}
                  </div>
                  <span className="text-xs font-bold" style={{ color:"rgba(255,255,255,0.3)" }}>{opt.votes||0} votes</span>
                  <button onClick={()=>removeOption(opt.id)} className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-500/20" style={{ color:"rgba(239,1,7,0.6)" }}>
                    <i className="fa-solid fa-xmark text-xs" />
                  </button>
                </div>
              ))}
              {form.options.length === 0 && (
                <p className="text-xs text-center py-4" style={{ color:"rgba(255,255,255,0.3)" }}>No candidates yet — search members or add a custom option above</p>
              )}
            </div>
          </div>

          {/* Settings */}
          <div className="grid sm:grid-cols-3 gap-3 p-4 rounded-sm" style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)" }}>
            <Switch checked={form.isActive} onChange={()=>setForm(p=>({...p,isActive:!p.isActive}))} label="Active / Visible" />
            <Switch checked={form.showResults} onChange={()=>setForm(p=>({...p,showResults:!p.showResults}))} label="Show Results Publicly" />
            <Switch checked={form.allowNonMembers} onChange={()=>setForm(p=>({...p,allowNonMembers:!p.allowNonMembers}))} label="Allow Non-Members to Vote" />
          </div>
        </div>
        <div className="px-5 py-4 flex justify-end gap-3" style={{ borderTop:"1px solid rgba(255,255,255,0.06)" }}>
          <Button variant="secondary" onClick={()=>setShowForm(false)}>Cancel</Button>
          <Button onClick={savePoll}><i className="fa-solid fa-save mr-1.5" />{editId?"Update Poll":"Create Poll"}</Button>
        </div>
      </Modal>
    </div>
  );
}
