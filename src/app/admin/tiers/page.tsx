"use client";
import { RENEWAL_FEE } from "@/lib/membershipUtils";
import { useState } from "react";
import { useApp } from "@/context/AppContext";
import toast from "react-hot-toast";

const ICONS = ["fa-solid fa-medal","fa-solid fa-shield","fa-solid fa-star","fa-solid fa-trophy","fa-solid fa-people-roof","fa-solid fa-crown","fa-solid fa-gem"];
const COLORS_PRESET = ["#CD7F32","#A8A9AD","#C6A84B","#E8E8E8","#2ECC71","#EF0107","#3498DB","#9B59B6"];

export default function AdminTiersPage() {
  const { tiers, updateTier, deleteTier, setTiers } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number|null>(null);
  const [form, setForm] = useState({ name:"",slug:"",color:"#EF0107",icon:"fa-solid fa-star",price:"",renewalPrice:"",popular:false,isFamily:false,familyMembers:5,description:"",benefits:[""] });

  const openAdd = () => { setForm({ name:"",slug:"",color:"#EF0107",icon:"fa-solid fa-star",price:"",renewalPrice:"",popular:false,isFamily:false,familyMembers:5,description:"",benefits:[""] }); setEditId(null); setShowForm(true); };
  const openEdit = (t: any) => { setForm({ ...t,price:String(t.price),renewalPrice:String(t.renewalPrice),benefits:[...t.benefits] }); setEditId(t.id); setShowForm(true); };

  const save = () => {
    if (!form.name||!form.price) { toast.error("Fill required fields"); return; }
    const slug = form.name.toLowerCase().replace(/\s+/g,"-");
    const data = { ...form,slug,price:parseFloat(form.price),renewalPrice:parseFloat(form.renewalPrice)||0,benefits:form.benefits.filter(b=>b.trim()) };
    if (editId) { updateTier(editId,data); toast.success("Tier updated"); }
    else { setTiers([...tiers,{ id:Date.now(),...data }]); toast.success("Tier created"); }
    setShowForm(false);
  };

  const addBenefit = () => setForm(p=>({...p,benefits:[...p.benefits,""]}));
  const setBenefit = (i:number,v:string) => setForm(p=>({...p,benefits:p.benefits.map((b,idx)=>idx===i?v:b)}));
  const removeBenefit = (i:number) => setForm(p=>({...p,benefits:p.benefits.filter((_,idx)=>idx!==i)}));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold text-white" style={{ fontFamily:"var(--font-display)" }}>Membership Tiers</h1>
        <p className="text-xs mt-0.5" style={{ color:"rgba(255,255,255,0.4)" }}>Manage membership packages, pricing, and benefits — including Abusua family tier</p></div>
        <button onClick={openAdd} className="btn-arsenal text-xs px-4 py-2"><i className="fa-solid fa-plus mr-1.5" />Add Tier</button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tiers.map((t,i)=>(
          <div key={t.id} className="rounded-sm overflow-hidden" style={{ background:"#16213E",border:`1px solid ${t.color}30` }}>
            <div className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ background:`${t.color}20` }}>
                    <i className={`${t.icon} text-lg`} style={{ color:t.color }} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-black text-white text-base" style={{ fontFamily:"var(--font-heading)" }}>{t.name}</h3>
                      {t.popular&&<span className="px-1.5 py-0.5 text-[9px] font-bold rounded-sm" style={{ background:"var(--color-red)",color:"white",fontFamily:"var(--font-heading)" }}>POPULAR</span>}
                      {t.isFamily&&<span className="px-1.5 py-0.5 text-[9px] font-bold rounded-sm" style={{ background:"rgba(46,204,113,0.2)",color:"#2ECC71",fontFamily:"var(--font-heading)" }}>FAMILY</span>}
                    </div>
                    <p className="text-xs mt-0.5" style={{ color:"rgba(255,255,255,0.4)" }}>Join: GH₵{t.price} · Renewal: GH₵{RENEWAL_FEE} (fixed)</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={()=>openEdit(t)} className="p-1.5 rounded hover:bg-white/10" style={{ color:"rgba(255,255,255,0.4)" }}><i className="fa-solid fa-pen text-xs" /></button>
                  <button onClick={()=>{ if(tiers.length<=1){toast.error("Must have at least one tier");return;} if(!confirm("Delete tier?"))return; deleteTier(t.id); toast.success("Tier deleted"); }}
                    className="p-1.5 rounded hover:bg-red-500/10" style={{ color:"rgba(239,1,7,0.5)" }}><i className="fa-solid fa-trash text-xs" /></button>
                </div>
              </div>
              {t.isFamily&&<div className="mb-3 px-3 py-2 rounded-sm text-xs" style={{ background:"rgba(46,204,113,0.08)",border:"1px solid rgba(46,204,113,0.2)",color:"#2ECC71",fontFamily:"var(--font-body)" }}>
                <i className="fa-solid fa-people-roof mr-1.5" />Family package: 2 adults + up to {(t.familyMembers||5)-2} children
              </div>}
              {t.description&&<p className="text-xs mb-3 leading-relaxed" style={{ color:"rgba(255,255,255,0.45)",fontFamily:"var(--font-body)" }}>{t.description}</p>}
              <ul className="space-y-1.5">
                {t.benefits.slice(0,4).map(b=>(
                  <li key={b} className="flex items-center gap-2 text-xs" style={{ color:"rgba(255,255,255,0.6)" }}>
                    <i className="fa-solid fa-check text-[9px] flex-shrink-0" style={{ color:t.color }} />{b}
                  </li>
                ))}
                {t.benefits.length>4&&<li className="text-xs" style={{ color:"rgba(255,255,255,0.3)" }}>+{t.benefits.length-4} more benefits</li>}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {showForm&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" style={{ background:"rgba(0,0,0,0.75)" }}>
          <div className="w-full max-w-lg rounded-sm my-4" style={{ background:"#16213E",border:"1px solid rgba(239,1,7,0.2)" }}>
            <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
              <h2 className="font-bold text-white" style={{ fontFamily:"var(--font-display)" }}>{editId?"Edit Tier":"New Tier"}</h2>
              <button onClick={()=>setShowForm(false)} style={{ color:"rgba(255,255,255,0.4)" }}><i className="fa-solid fa-xmark" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs uppercase tracking-wider mb-1 block" style={{ color:"rgba(255,255,255,0.4)",fontFamily:"var(--font-heading)" }}><i className="fa-solid fa-tag mr-1.5" style={{ color:"var(--color-red)" }} />Name *</label>
                <input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} className="input-arsenal text-sm" style={{ borderRadius:"2px" }} /></div>
                <div><label className="text-xs uppercase tracking-wider mb-1 block" style={{ color:"rgba(255,255,255,0.4)",fontFamily:"var(--font-heading)" }}><i className="fa-solid fa-money-bill mr-1.5" style={{ color:"var(--color-red)" }} />Price (GH₵) *</label>
                <input type="number" value={form.price} onChange={e=>setForm(p=>({...p,price:e.target.value}))} className="input-arsenal text-sm" style={{ borderRadius:"2px" }} /></div>
                <div><label className="text-xs uppercase tracking-wider mb-1 block" style={{ color:"rgba(255,255,255,0.4)",fontFamily:"var(--font-heading)" }}><i className="fa-solid fa-rotate mr-1.5" style={{ color:"var(--color-red)" }} />Renewal Price</label>
                <input type="number" value={form.renewalPrice} onChange={e=>setForm(p=>({...p,renewalPrice:e.target.value}))} className="input-arsenal text-sm" style={{ borderRadius:"2px" }} />
              <p className="text-[10px] mt-1" style={{ color:"rgba(255,255,255,0.3)" }}>ℹ️ System-wide renewal fee is fixed at GH₵{RENEWAL_FEE} for all tiers (2 seasons). This field is informational only.</p></div>
              </div>
              <div><label className="text-xs uppercase tracking-wider mb-1 block" style={{ color:"rgba(255,255,255,0.4)",fontFamily:"var(--font-heading)" }}><i className="fa-solid fa-align-left mr-1.5" style={{ color:"var(--color-red)" }} />Description</label>
              <textarea value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} rows={2} className="input-arsenal text-sm resize-none" style={{ borderRadius:"2px" }} /></div>
              <div><label className="text-xs uppercase tracking-wider mb-2 block" style={{ color:"rgba(255,255,255,0.4)",fontFamily:"var(--font-heading)" }}><i className="fa-solid fa-palette mr-1.5" style={{ color:"var(--color-red)" }} />Color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={form.color} onChange={e=>setForm(p=>({...p,color:e.target.value}))} className="w-10 h-10 rounded cursor-pointer" />
                <div className="flex gap-2 flex-wrap">{COLORS_PRESET.map(c=><button key={c} onClick={()=>setForm(p=>({...p,color:c}))} className="w-6 h-6 rounded-full transition-transform hover:scale-125" style={{ background:c,outline:form.color===c?"2px solid white":"none",outlineOffset:"2px" }} />)}</div>
              </div></div>
              <div><label className="text-xs uppercase tracking-wider mb-2 block" style={{ color:"rgba(255,255,255,0.4)",fontFamily:"var(--font-heading)" }}><i className="fa-solid fa-icons mr-1.5" style={{ color:"var(--color-red)" }} />Icon</label>
              <div className="flex gap-2 flex-wrap">{ICONS.map(icon=><button key={icon} onClick={()=>setForm(p=>({...p,icon}))} className="w-9 h-9 rounded-sm flex items-center justify-center" style={{ background:form.icon===icon?"rgba(239,1,7,0.2)":"rgba(255,255,255,0.06)",border:`1px solid ${form.icon===icon?"var(--color-red)":"rgba(255,255,255,0.08)"}`,color:form.icon===icon?"var(--color-red)":"rgba(255,255,255,0.5)" }}><i className={`${icon} text-sm`} /></button>)}</div></div>
              
              {/* Toggles */}
              <div className="flex gap-6">
                {[["popular","Popular"],["isFamily","Family Package (Abusua)"]].map(([k,l])=>(
                  <div key={k} className="flex items-center gap-2">
                    <button onClick={()=>setForm(p=>({...p,[k]:!(p as any)[k]}))} className="relative w-10 h-5 rounded-full transition-all" style={{ background:(form as any)[k]?"var(--color-red)":"rgba(255,255,255,0.12)" }}>
                      <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all" style={{ left:(form as any)[k]?"calc(100% - 18px)":"2px" }} />
                    </button>
                    <span className="text-sm" style={{ color:"rgba(255,255,255,0.6)",fontFamily:"var(--font-body)" }}>{l}</span>
                  </div>
                ))}
              </div>
              {form.isFamily&&<div><label className="text-xs uppercase tracking-wider mb-1 block" style={{ color:"rgba(255,255,255,0.4)",fontFamily:"var(--font-heading)" }}><i className="fa-solid fa-users mr-1.5" style={{ color:"var(--color-red)" }} />Total Family Members (adults + children)</label>
              <input type="number" min={2} max={10} value={form.familyMembers} onChange={e=>setForm(p=>({...p,familyMembers:parseInt(e.target.value)||5}))} className="input-arsenal text-sm" style={{ borderRadius:"2px" }} /></div>}
              
              {/* Benefits */}
              <div><label className="text-xs uppercase tracking-wider mb-2 block" style={{ color:"rgba(255,255,255,0.4)",fontFamily:"var(--font-heading)" }}><i className="fa-solid fa-list-check mr-1.5" style={{ color:"var(--color-red)" }} />Benefits</label>
              <div className="space-y-2">
                {form.benefits.map((b,i)=>(
                  <div key={i} className="flex gap-2">
                    <input value={b} onChange={e=>setBenefit(i,e.target.value)} placeholder="e.g. Ticket request eligibility" className="input-arsenal text-sm flex-1" style={{ borderRadius:"2px" }} />
                    <button onClick={()=>removeBenefit(i)} className="p-2 rounded hover:bg-red-500/10" style={{ color:"rgba(239,1,7,0.5)" }}><i className="fa-solid fa-xmark text-xs" /></button>
                  </div>
                ))}
                <button onClick={addBenefit} className="flex items-center gap-1.5 text-xs transition-colors hover:text-white" style={{ color:"rgba(255,255,255,0.4)",fontFamily:"var(--font-heading)" }}>
                  <i className="fa-solid fa-plus" />Add Benefit
                </button>
              </div></div>
            </div>
            <div className="px-6 py-4 flex gap-3" style={{ borderTop:"1px solid rgba(255,255,255,0.06)" }}>
              <button onClick={()=>setShowForm(false)} className="flex-1 py-2.5 text-sm rounded-sm border hover:bg-white/5" style={{ borderColor:"rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.5)",fontFamily:"var(--font-heading)" }}>Cancel</button>
              <button onClick={save} className="flex-1 btn-arsenal py-2.5 text-sm"><i className="fa-solid fa-save mr-2" />{editId?"Update":"Create"} Tier</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
