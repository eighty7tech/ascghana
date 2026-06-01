"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { Card, CardHeader, CardTitle, CardContent, StatCard } from "@/components/ui";

const BAR_COLORS = ["#EF0107","#C6A84B","#3B82F6","#10B981","#8B5CF6","#F59E0B","#06B6D4","#EC4899"];

function BarChart({ data, title, icon }: { data: Record<string,number>; title: string; icon: string }) {
  const entries = Object.entries(data).sort((a,b) => b[1]-a[1]);
  const max = Math.max(...entries.map(e=>e[1]),1);
  return (
    <Card>
      <CardHeader><CardTitle><i className={`${icon} mr-2`} style={{color:"var(--color-red)"}} />{title}</CardTitle></CardHeader>
      <CardContent className="space-y-2.5">
        {entries.slice(0,8).map(([key,val],i) => (
          <div key={key} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-white/70 truncate max-w-[160px]">{key}</span>
              <span className="font-bold text-white ml-2">{val}</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{background:"rgba(255,255,255,0.06)"}}>
              <motion.div initial={{width:0}} animate={{width:`${(val/max)*100}%`}} transition={{delay:i*0.05,duration:0.5}}
                className="h-full rounded-full" style={{background:BAR_COLORS[i%BAR_COLORS.length]}} />
            </div>
          </div>
        ))}
        {entries.length===0 && <p className="text-xs text-white/30 text-center py-2">No data</p>}
      </CardContent>
    </Card>
  );
}

function DonutChart({ data, title, icon }: { data: Record<string,number>; title: string; icon: string }) {
  const total = Object.values(data).reduce((a,b)=>a+b,0);
  const entries = Object.entries(data).filter(([,v])=>v>0);
  let offset = 25;
  const R=40, CIRC=2*Math.PI*R;
  const slices = entries.map(([key,val],i) => {
    const pct = total>0?val/total:0;
    const dash = pct*CIRC;
    const s = {key,val,pct,dash,offset,color:BAR_COLORS[i%BAR_COLORS.length]};
    offset += dash;
    return s;
  });
  return (
    <Card>
      <CardHeader><CardTitle><i className={`${icon} mr-2`} style={{color:"var(--color-red)"}} />{title}</CardTitle></CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <svg width={100} height={100} viewBox="0 0 100 100" className="flex-shrink-0">
            <circle cx={50} cy={50} r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={12}/>
            {slices.map(s=>(
              <circle key={s.key} cx={50} cy={50} r={R} fill="none" stroke={s.color} strokeWidth={12}
                strokeDasharray={`${s.dash} ${CIRC-s.dash}`} strokeDashoffset={-s.offset} />
            ))}
            <text x={50} y={54} textAnchor="middle" fill="white" fontSize={14} fontWeight="bold">{total}</text>
          </svg>
          <div className="flex-1 space-y-1.5 min-w-0">
            {slices.map(s=>(
              <div key={s.key} className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{background:s.color}} />
                <span className="text-white/60 flex-1 truncate">{s.key}</span>
                <span className="font-bold text-white">{s.val}</span>
                <span className="text-white/30">({Math.round(s.pct*100)}%)</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AnalyticsPage() {
  const { members, tickets, events, donations, matchTickets, posts, products } = useApp();
  const [apiData, setApiData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (isRefresh=false) => {
    if(isRefresh) setRefreshing(true);
    try { const d = await fetch("/api/analytics").then(r=>r.json()); setApiData(d); } catch {}
    finally { setRefreshing(false); }
  };
  useEffect(() => { load(); },[]);

  // Local computed stats (always available)
  const membersByStatus = members.reduce((a:any,m:any)=>{a[m.status||"Unknown"]=(a[m.status||"Unknown"]||0)+1;return a;},{});
  const membersByTier   = members.reduce((a:any,m:any)=>{a[m.tier||"Unknown"]=(a[m.tier||"Unknown"]||0)+1;return a;},{});
  const membersByBranch = members.reduce((a:any,m:any)=>{a[m.branch||"Unknown"]=(a[m.branch||"Unknown"]||0)+1;return a;},{});
  const ticketsByStatus = tickets.reduce((a:any,t:any)=>{a[t.status]=(a[t.status]||0)+1;return a;},{});
  const totalRaised = donations.reduce((s:number,d:any)=>s+(d.raised||0),0);
  const totalGoal   = donations.reduce((s:number,d:any)=>s+(d.goal||0),0);

  const stats = [
    { label:"Total Members",    value:members.length,   icon:"fa-solid fa-users",           color:"#C6A84B" },
    { label:"Active",           value:membersByStatus["Active"]||0, icon:"fa-solid fa-circle-check", color:"#10B981" },
    { label:"Frozen",           value:membersByStatus["Frozen"]||0, icon:"fa-solid fa-snowflake",    color:"#8B5CF6" },
    { label:"Ticket Requests",  value:tickets.length,   icon:"fa-solid fa-ticket",          color:"#EF0107" },
    { label:"Pending Tickets",  value:ticketsByStatus["Pending"]||0, icon:"fa-solid fa-clock",      color:"#F59E0B" },
    { label:"Approved Tickets", value:(ticketsByStatus["Approved"]||0)+(ticketsByStatus["Partially Approved"]||0), icon:"fa-solid fa-check", color:"#10B981" },
    { label:"Events Published", value:events.filter((e:any)=>e.status==="Published").length, icon:"fa-solid fa-calendar-check", color:"#3B82F6" },
    { label:"Total Raised",     value:`GHS ${totalRaised.toLocaleString()}`, icon:"fa-solid fa-hand-holding-heart", color:"#C6A84B" },
  ];

  return (
    <div className="space-y-6">
      <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white" style={{fontFamily:"var(--font-display)"}}>ANALYTICS & REPORTS</h1>
          <p className="text-xs mt-0.5 text-white/40">Real-time club statistics and member insights</p>
        </div>
        <button onClick={()=>load(true)} disabled={refreshing}
          className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-sm transition-all"
          style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",color:"rgba(255,255,255,0.5)"}}>
          <i className={`fa-solid fa-rotate text-[10px] ${refreshing?"animate-spin":""}`} />Refresh
        </button>
      </motion.div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map(s=>(
          <StatCard key={s.label} label={s.label} value={s.value} icon={s.icon} color={s.color} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-5">
        <DonutChart data={membersByStatus} title="Members by Status" icon="fa-solid fa-chart-pie" />
        <DonutChart data={membersByTier}   title="Members by Tier"   icon="fa-solid fa-trophy" />
      </div>
      <div className="grid lg:grid-cols-2 gap-5">
        <BarChart data={membersByBranch}  title="Members by Branch" icon="fa-solid fa-location-dot" />
        <BarChart data={ticketsByStatus}  title="Tickets by Status"  icon="fa-solid fa-ticket" />
      </div>

      {/* Donations & Match Tickets */}
      <div className="grid lg:grid-cols-2 gap-5">
        <Card>
          <CardHeader><CardTitle><i className="fa-solid fa-hand-holding-heart mr-2" style={{color:"var(--color-red)"}} />Donations</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-white/50">Total Raised</span>
                <span className="font-bold text-white">GHS {totalRaised.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-white/50">Total Goal</span>
                <span className="font-bold text-white">GHS {totalGoal.toLocaleString()}</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{background:"rgba(255,255,255,0.06)"}}>
                <motion.div initial={{width:0}} animate={{width:`${Math.min(totalGoal>0?(totalRaised/totalGoal)*100:0,100)}%`}}
                  transition={{duration:0.8}} className="h-full rounded-full" style={{background:"var(--color-gold)"}} />
              </div>
              <p className="text-xs text-white/40 mt-1 text-right">{totalGoal>0?Math.round((totalRaised/totalGoal)*100):0}% of goal</p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              {[
                {label:"Campaigns",value:donations.length,color:"#C6A84B"},
                {label:"Avg per Campaign",value:donations.length>0?`GHS ${Math.round(totalRaised/donations.length).toLocaleString()}`:"—",color:"#10B981"},
              ].map(s=>(
                <div key={s.label} className="p-3 rounded-sm text-center" style={{background:"rgba(255,255,255,0.03)"}}>
                  <p className="text-lg font-black" style={{color:s.color,fontFamily:"var(--font-display)"}}>{s.value}</p>
                  <p className="text-xs text-white/40">{s.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle><i className="fa-solid fa-ticket mr-2" style={{color:"var(--color-red)"}} />Match Tickets</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {[
              {label:"Total Listings",value:matchTickets.length,color:"#C6A84B"},
              {label:"Active",value:matchTickets.filter((mt:any)=>mt.status==="Active").length,color:"#10B981"},
              {label:"Sold Out",value:matchTickets.filter((mt:any)=>mt.status==="Sold Out").length,color:"#EF4444"},
              {label:"Seats Available",value:matchTickets.reduce((a:number,mt:any)=>a+(mt.ticketsAvailable||0),0),color:"#3B82F6"},
            ].map(s=>(
              <div key={s.label} className="flex items-center justify-between py-1.5" style={{borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
                <p className="text-xs text-white/50">{s.label}</p>
                <p className="text-sm font-bold" style={{color:s.color}}>{typeof s.value==="number"?s.value.toLocaleString():s.value}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Deletion Requests from API */}
      {apiData?.deletionRequests?.length>0 && (
        <Card>
          <CardHeader><CardTitle><i className="fa-solid fa-user-slash mr-2" style={{color:"#EF4444"}} />Deletion Requests</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-3">
              {apiData.deletionRequests.map((r:any)=>(
                <div key={r.status} className="p-4 rounded-sm text-center" style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",flex:1}}>
                  <p className="text-2xl font-black text-white" style={{fontFamily:"var(--font-display)"}}>{r.count}</p>
                  <p className="text-xs text-white/40">{r.status}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
