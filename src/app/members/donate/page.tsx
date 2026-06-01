"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import MembershipGate from "@/components/MembershipGate";
import { useApp } from "@/context/AppContext";
import toast from "react-hot-toast";

const PRESETS = [50,100,200,500,1000];

export default function DonatePage() {
  const { user, isLoggedIn, isActiveMember, isFrozen, isExpired } = useAuth();
  const { donations, settings } = useApp();
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [cause, setCause] = useState("");
  const [name, setName] = useState(user?.name||"");
  const [anonymous, setAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(()=>{ if(!isLoggedIn) router.push("/auth/login"); },[isLoggedIn]);
  useEffect(()=>{ if(user) setName(user.name); },[user]);

  // Parse donation categories from settings
  const categories = (settings.donationCategories||"General,Charity,Events,Youth")
    .split(",").map(c=>c.trim()).filter(Boolean);

  const activeDonations = donations.filter(d=>d.active);
  const totalRaised = activeDonations.reduce((s,d)=>s+d.raised,0);

  const handleDonate = async () => {
    if (!amount || Number(amount)<5) { toast.error("Minimum donation is GHS 5"); return; }
    setLoading(true);
    await new Promise(r=>setTimeout(r,1800));
    setLoading(false);
    setSuccess(true);
    toast.success("Thank you for your donation to Arsenal Ghana!");
  };

  if (success) return (
    <main style={{background:"var(--bg-primary)"}}>
      <Navbar/>
      <div className="min-h-screen flex items-center justify-center pt-20 px-6">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5" style={{background:"rgba(16,185,129,0.12)",border:"2px solid #10B981"}}>
            <i className="fa-solid fa-heart text-3xl" style={{color:"#10B981"}}/>
          </div>
          <h1 className="text-3xl font-black text-white mb-3" style={{fontFamily:"var(--font-display)"}}>THANK YOU!</h1>
          <p className="text-sm mb-6" style={{color:"rgba(255,255,255,0.6)"}}>Your donation of GHS {amount} has been received. You'll receive a confirmation email shortly.</p>
          <div className="flex gap-3 justify-center">
            <Link href="/members/dashboard" className="btn-arsenal px-5 py-2.5 inline-flex items-center gap-2">Dashboard</Link>
            <button onClick={()=>setSuccess(false)} className="px-5 py-2.5 text-sm border border-white/15 text-white/60 hover:text-white transition-colors">Donate Again</button>
          </div>
        </div>
      </div>
      <Footer/>
    </main>
  );

  if (!isLoggedIn || !user) return null;

  const inp = "w-full px-3 py-2.5 text-sm bg-white/5 border border-white/10 rounded-sm text-white placeholder-white/25 outline-none focus:border-[#EF0107] transition-colors";

  return (
    <main style={{background:"var(--bg-primary)"}}>
      <Navbar/>
      <MembershipGate featureName="Donations">
      <div className="pt-32 pb-20 max-w-3xl mx-auto px-6 space-y-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 text-xs font-bold uppercase tracking-widest rounded-sm"
            style={{background:"rgba(239,1,7,0.1)",border:"1px solid rgba(239,1,7,0.2)",color:"var(--color-red)",fontFamily:"var(--font-heading)"}}>
            <i className="fa-solid fa-heart"/>Donate
          </div>
          <h1 className="text-4xl font-black text-white" style={{fontFamily:"var(--font-display)"}}>SUPPORT THE CLUB</h1>
          <p className="mt-2" style={{color:"rgba(255,255,255,0.6)"}}>Your generosity keeps Arsenal Ghana running. Total raised this season: <strong style={{color:"var(--color-gold)"}}>GHS {totalRaised.toLocaleString()}</strong></p>
        </div>

        {/* Causes */}
        {activeDonations.length > 0 && (
          <div className="grid sm:grid-cols-2 gap-4">
            {activeDonations.map(d=>(
              <button key={d.id} onClick={()=>setCause(d.name)}
                className="arsenal-card rounded-sm p-4 text-left transition-all"
                style={{borderLeft:`2px solid ${cause===d.name?"var(--color-red)":"transparent"}`}}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{background:"rgba(239,1,7,0.1)"}}>
                    <i className={`${d.icon} text-sm`} style={{color:"var(--color-red)"}}/>
                  </div>
                  <p className="font-bold text-sm text-white" style={{fontFamily:"var(--font-heading)"}}>{d.name}</p>
                </div>
                <p className="text-xs mb-3" style={{color:"rgba(255,255,255,0.5)"}}>{d.description}</p>
                <div className="h-1.5 rounded-full overflow-hidden mb-1" style={{background:"rgba(255,255,255,0.08)"}}>
                  <div className="h-full rounded-full" style={{width:`${Math.min(100,(d.raised/d.goal)*100)}%`,background:"var(--color-red)"}}/>
                </div>
                <div className="flex justify-between text-[10px]" style={{color:"rgba(255,255,255,0.4)"}}>
                  <span>GHS {d.raised.toLocaleString()} raised</span>
                  <span>Goal: GHS {d.goal.toLocaleString()}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Form */}
        <div className="p-6 rounded-sm space-y-5" style={{background:"var(--bg-card)",border:"1px solid var(--border-color)"}}>
          <h2 className="text-base font-bold uppercase tracking-wider text-white" style={{fontFamily:"var(--font-heading)"}}>Make a Donation</h2>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{color:"rgba(255,255,255,0.4)",fontFamily:"var(--font-heading)"}}>
              <i className="fa-solid fa-sterling-sign text-[10px] mr-1.5" style={{color:"var(--color-red)"}}/>Amount (GHS)
            </label>
            <div className="flex gap-2 flex-wrap mb-3">
              {PRESETS.map(p=>(
                <button key={p} onClick={()=>setAmount(String(p))}
                  className="px-4 py-2 text-sm font-bold rounded-sm transition-all"
                  style={{background:amount===String(p)?"var(--color-red)":"var(--border-subtle)",color:amount===String(p)?"white":"rgba(255,255,255,0.5)",border:`1px solid ${amount===String(p)?"transparent":"rgba(255,255,255,0.1)"}`,fontFamily:"var(--font-heading)"}}>
                  GHS {p}
                </button>
              ))}
            </div>
            <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} min="5" className={inp} placeholder="Or enter custom amount"/>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{color:"rgba(255,255,255,0.4)",fontFamily:"var(--font-heading)"}}>
              <i className="fa-solid fa-tag text-[10px] mr-1.5" style={{color:"var(--color-red)"}}/>Category
            </label>
            <select value={cause} onChange={e=>setCause(e.target.value)}
              className="w-full h-9 px-3 text-sm bg-[#0D1629] border border-white/10 rounded-sm text-white outline-none focus:border-[#EF0107]">
              <option value="">Select a cause…</option>
              {categories.map(c=><option key={c} value={c}>{c}</option>)}
              {activeDonations.map(d=><option key={d.id} value={d.name}>{d.name}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={()=>setAnonymous(v=>!v)}
              className="relative w-10 h-5 rounded-full transition-colors"
              style={{background:anonymous?"var(--color-red)":"rgba(255,255,255,0.1)"}}>
              <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all" style={{left:anonymous?"calc(100%-18px)":"2px"}}/>
            </button>
            <span className="text-sm" style={{color:"rgba(255,255,255,0.5)"}}>Donate anonymously</span>
          </div>
          {!anonymous && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{color:"rgba(255,255,255,0.4)",fontFamily:"var(--font-heading)"}}>
                <i className="fa-solid fa-user text-[10px] mr-1.5" style={{color:"var(--color-red)"}}/>Your Name
              </label>
              <input value={name} onChange={e=>setName(e.target.value)} className={inp}/>
            </div>
          )}
          <button onClick={handleDonate} disabled={loading||!amount||Number(amount)<5}
            className="w-full btn-arsenal py-3.5 text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2">
            {loading?<><i className="fa-solid fa-spinner fa-spin"/>Processing…</>:<><i className="fa-solid fa-heart"/>Donate GHS {amount||"0"}</>}
          </button>
          <p className="text-xs text-center" style={{color:"rgba(255,255,255,0.3)"}}>Secured via Paystack · Receipt emailed to {user.email}</p>
        </div>
      </div>
      <Footer/>
          </MembershipGate>
      </main>
  );
}
