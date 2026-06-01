"use client";
import { useState } from "react";
import { useApp } from "@/context/AppContext";
import toast from "react-hot-toast";

export default function AdminDonationsPage() {
  const { donations, updateDonation, deleteDonation, setDonations } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number|null>(null);
  const [form, setForm] = useState({ name:"",description:"",goal:"",icon:"fa-solid fa-heart",active:true });
  const [viewDonors, setViewDonors] = useState<any>(null);

  const ICONS = ["fa-solid fa-building","fa-solid fa-hand-holding-heart","fa-solid fa-child","fa-solid fa-plane","fa-solid fa-heart","fa-solid fa-trophy","fa-solid fa-star","fa-solid fa-futbol"];

  const mockDonors = [
    { name:"Kwame Asante", amount:200, date:"Mar 15, 2025", method:"MoMo" },
    { name:"Ama Boateng", amount:100, date:"Mar 12, 2025", method:"Card" },
    { name:"Anonymous", amount:500, date:"Mar 10, 2025", method:"MoMo" },
  ];

  const openAdd = () => { setForm({ name:"",description:"",goal:"",icon:"fa-solid fa-heart",active:true }); setEditId(null); setShowForm(true); };
  const openEdit = (d: any) => { setForm({ name:d.name,description:d.description,goal:String(d.goal),icon:d.icon,active:d.active }); setEditId(d.id); setShowForm(true); };

  const save = () => {
    if (!form.name||!form.goal) { toast.error("Fill required fields"); return; }
    if (editId) {
      updateDonation(editId, { name:form.name,description:form.description,goal:parseFloat(form.goal),icon:form.icon,active:form.active });
      toast.success("Donation cause updated");
    } else {
      setDonations([...donations, { id:Date.now(),name:form.name,description:form.description,goal:parseFloat(form.goal),raised:0,active:form.active,icon:form.icon }]);
      toast.success("Cause added");
    }
    setShowForm(false);
  };

  const totalRaised = donations.reduce((a,d)=>a+d.raised,0);
  const totalGoal = donations.reduce((a,d)=>a+d.goal,0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold text-white" style={{ fontFamily:"var(--font-display)" }}>Donations Management</h1>
        <p className="text-xs mt-0.5" style={{ color:"rgba(255,255,255,0.4)" }}>Manage donation causes and track contributions</p></div>
        <button onClick={openAdd} className="btn-arsenal text-xs px-4 py-2"><i className="fa-solid fa-plus mr-1.5" />Add Cause</button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label:"Total Raised",value:`GH₵${totalRaised.toLocaleString()}`,icon:"fa-solid fa-coins",color:"#2ECC71" },
          { label:"Total Goal",value:`GH₵${totalGoal.toLocaleString()}`,icon:"fa-solid fa-bullseye",color:"#C6A84B" },
          { label:"Active Causes",value:donations.filter(d=>d.active).length,icon:"fa-solid fa-hand-holding-heart",color:"#EF0107" },
        ].map(s=>(
          <div key={s.label} className="p-4 rounded-sm" style={{ background:"#16213E",border:"1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center justify-between">
              <div><p className="text-xs uppercase tracking-wider mb-1" style={{ color:"rgba(255,255,255,0.4)",fontFamily:"var(--font-heading)" }}>{s.label}</p>
              <p className="text-2xl font-bold text-white" style={{ fontFamily:"var(--font-display)" }}>{s.value}</p></div>
              <i className={`${s.icon} text-xl`} style={{ color:s.color,opacity:0.8 }} />
            </div>
          </div>
        ))}
      </div>

      {/* Causes grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {donations.map(d=>{
          const pct=Math.min(Math.round((d.raised/d.goal)*100),100);
          return (
            <div key={d.id} className="p-5 rounded-sm" style={{ background:"#16213E",border:"1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background:"rgba(239,1,7,0.15)" }}>
                    <i className={`${d.icon} text-sm`} style={{ color:"var(--color-red)" }} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm" style={{ fontFamily:"var(--font-heading)" }}>{d.name}</h3>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-sm font-bold" style={{ background:d.active?"rgba(46,204,113,0.15)":"rgba(255,255,255,0.08)",color:d.active?"#2ECC71":"rgba(255,255,255,0.4)",fontFamily:"var(--font-heading)" }}>{d.active?"Active":"Inactive"}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={()=>setViewDonors(d)} className="p-1.5 rounded hover:bg-white/10" style={{ color:"rgba(255,255,255,0.4)" }}><i className="fa-solid fa-users text-xs" /></button>
                  <button onClick={()=>openEdit(d)} className="p-1.5 rounded hover:bg-white/10" style={{ color:"rgba(255,255,255,0.4)" }}><i className="fa-solid fa-pen text-xs" /></button>
                  <button onClick={()=>{ if(!confirm("Delete this cause?"))return; deleteDonation(d.id); toast.success("Cause deleted"); }} className="p-1.5 rounded hover:bg-red-500/10" style={{ color:"rgba(239,1,7,0.5)" }}><i className="fa-solid fa-trash text-xs" /></button>
                </div>
              </div>
              {d.description&&<p className="text-xs mb-4 leading-relaxed" style={{ color:"rgba(255,255,255,0.45)",fontFamily:"var(--font-body)" }}>{d.description}</p>}
              <div className="space-y-2">
                <div className="flex justify-between text-xs" style={{ color:"rgba(255,255,255,0.5)" }}>
                  <span>GH₵{d.raised.toLocaleString()} raised</span><span>Goal: GH₵{d.goal.toLocaleString()}</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background:"rgba(255,255,255,0.08)" }}>
                  <div className="h-full rounded-full transition-all" style={{ width:`${pct}%`,background:pct>=100?"#2ECC71":"var(--color-red)" }} />
                </div>
                <div className="flex justify-between text-xs">
                  <span style={{ color:pct>=100?"#2ECC71":"var(--color-gold)",fontFamily:"var(--font-heading)",fontWeight:"bold" }}>{pct}% funded</span>
                  <button onClick={()=>{ updateDonation(d.id,{ raised:d.raised+50 }); toast.success("+GH₵50 simulated"); }} className="text-[10px] hover:underline" style={{ color:"rgba(255,255,255,0.3)" }}>+Simulate donation</button>
                </div>
              </div>
              <button onClick={()=>{ updateDonation(d.id,{ active:!d.active }); toast.success(d.active?"Cause deactivated":"Cause activated"); }}
                className="w-full mt-3 py-1.5 text-xs rounded-sm transition-all" style={{ border:`1px solid ${d.active?"rgba(231,76,60,0.3)":"rgba(46,204,113,0.3)"}`,color:d.active?"#E74C3C":"#2ECC71",fontFamily:"var(--font-heading)" }}>
                <i className={`fa-solid ${d.active?"fa-eye-slash":"fa-eye"} mr-1`} />{d.active?"Deactivate":"Activate"}
              </button>
            </div>
          );
        })}
      </div>

      {/* Add/Edit Modal */}
      {showForm&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background:"rgba(0,0,0,0.75)" }}>
          <div className="w-full max-w-md rounded-sm p-6" style={{ background:"#16213E",border:"1px solid rgba(239,1,7,0.2)" }}>
            <h2 className="font-bold text-white mb-4" style={{ fontFamily:"var(--font-display)" }}>{editId?"Edit Cause":"New Cause"}</h2>
            <div className="space-y-3">
              <div><label className="text-xs uppercase tracking-wider mb-1 block" style={{ color:"rgba(255,255,255,0.4)",fontFamily:"var(--font-heading)" }}>
                <i className="fa-solid fa-tag mr-1.5" style={{ color:"var(--color-red)" }} />Cause Name *</label>
                <input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} className="input-arsenal text-sm" style={{ borderRadius:"2px" }} /></div>
              <div><label className="text-xs uppercase tracking-wider mb-1 block" style={{ color:"rgba(255,255,255,0.4)",fontFamily:"var(--font-heading)" }}>
                <i className="fa-solid fa-align-left mr-1.5" style={{ color:"var(--color-red)" }} />Description</label>
                <textarea value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} rows={2} className="input-arsenal text-sm resize-none" style={{ borderRadius:"2px" }} /></div>
              <div><label className="text-xs uppercase tracking-wider mb-1 block" style={{ color:"rgba(255,255,255,0.4)",fontFamily:"var(--font-heading)" }}>
                <i className="fa-solid fa-bullseye mr-1.5" style={{ color:"var(--color-red)" }} />Goal Amount (GH₵) *</label>
                <input type="number" value={form.goal} onChange={e=>setForm(p=>({...p,goal:e.target.value}))} className="input-arsenal text-sm" style={{ borderRadius:"2px" }} /></div>
              <div><label className="text-xs uppercase tracking-wider mb-2 block" style={{ color:"rgba(255,255,255,0.4)",fontFamily:"var(--font-heading)" }}>
                <i className="fa-solid fa-icons mr-1.5" style={{ color:"var(--color-red)" }} />Icon</label>
                <div className="flex flex-wrap gap-2">
                  {ICONS.map(icon=>(
                    <button key={icon} onClick={()=>setForm(p=>({...p,icon}))} className="w-9 h-9 rounded-sm flex items-center justify-center transition-all"
                      style={{ background:form.icon===icon?"rgba(239,1,7,0.2)":"rgba(255,255,255,0.06)",border:`1px solid ${form.icon===icon?"var(--color-red)":"rgba(255,255,255,0.08)"}`,color:form.icon===icon?"var(--color-red)":"rgba(255,255,255,0.5)" }}>
                      <i className={`${icon} text-sm`} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <button type="button" onClick={()=>setForm(p=>({...p,active:!p.active}))} className="relative w-10 h-5 rounded-full transition-all" style={{ background:form.active?"var(--color-red)":"rgba(255,255,255,0.12)" }}>
                  <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all" style={{ left:form.active?"calc(100% - 18px)":"2px" }} />
                </button>
                <span className="text-sm" style={{ color:"rgba(255,255,255,0.6)",fontFamily:"var(--font-body)" }}>Active</span>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={()=>setShowForm(false)} className="flex-1 py-2.5 text-sm rounded-sm border hover:bg-white/5" style={{ borderColor:"rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.5)",fontFamily:"var(--font-heading)" }}>Cancel</button>
              <button onClick={save} className="flex-1 btn-arsenal py-2.5 text-sm"><i className="fa-solid fa-save mr-2" />{editId?"Update":"Add"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Donors modal */}
      {viewDonors&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background:"rgba(0,0,0,0.75)" }}>
          <div className="w-full max-w-md rounded-sm" style={{ background:"#16213E",border:"1px solid rgba(239,1,7,0.2)" }}>
            <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
              <h2 className="font-bold text-white" style={{ fontFamily:"var(--font-display)" }}>Donors — {viewDonors.name}</h2>
              <button onClick={()=>setViewDonors(null)} style={{ color:"rgba(255,255,255,0.4)" }}><i className="fa-solid fa-xmark" /></button>
            </div>
            <div className="p-6">
              {mockDonors.map((d,i)=>(
                <div key={i} className="flex items-center justify-between py-3" style={{ borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                  <div><p className="text-sm text-white" style={{ fontFamily:"var(--font-body)" }}>{d.name}</p>
                  <p className="text-xs" style={{ color:"rgba(255,255,255,0.4)" }}>{d.date} · {d.method}</p></div>
                  <span className="font-bold text-sm" style={{ color:"var(--color-gold)",fontFamily:"var(--font-display)" }}>GH₵{d.amount}</span>
                </div>
              ))}
              <p className="text-xs mt-4 text-center" style={{ color:"rgba(255,255,255,0.3)" }}>In production, real donors pulled from Paystack webhooks</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
