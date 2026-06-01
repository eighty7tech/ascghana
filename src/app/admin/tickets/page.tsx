"use client";
import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, EmptyState, Modal, FormGroup, Input, Select, TabBar, StatCard } from "@/components/ui";
import toast from "react-hot-toast";

const CAT_COLORS: Record<string,string> = { "Category A":"#C6A84B","Category B":"#EF0107","Category C":"#3B82F6" };
const STATUS_V: Record<string,"default"|"warning"|"success"|"info"|"danger"> = {
  Pending:"warning",Approved:"success","Partially Approved":"info",Declined:"danger",Deleted:"default"
};

export default function AdminTicketsPage() {
  const { tickets, updateTicket, deleteTicket, setTickets, matchTickets } = useApp();
  const [filter, setFilter] = useState("All");
  const [view, setView] = useState<any>(null);
  const [partialQty, setPartialQty] = useState("");
  const [showPartial, setShowPartial] = useState<any>(null);

  const visible = tickets.filter(t => t.status !== "Deleted");
  const filtered = filter === "All" ? visible : visible.filter(t => t.status === filter);

  const counts = {
    all: visible.length,
    pending: visible.filter(t=>t.status==="Pending").length,
    approved: visible.filter(t=>t.status==="Approved").length,
    declined: visible.filter(t=>t.status==="Declined").length,
  };

  const setStatus = (id:string, status:string) => {
    const ticket = tickets.find(t => t.id === id);
    updateTicket(id, { status:status as any });
    fetch("/api/admin/ticket-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ticketId: id,
        status,
        memberId: ticket?.memberId,
        match: ticket?.match,
        membershipNumber: ticket?.membershipNumber,
      }),
    }).catch(() => {});
    toast.success(`Ticket ${status.toLowerCase()} — member portal updated`);
    if (view?.id === id) setView((v:any) => v ? {...v,status} : v);
  };

  const handleDelete = (id:string) => {
    if (!confirm("Permanently delete this ticket? It will be removed from the member's view.")) return;
    deleteTicket(id);
    toast.success("Ticket deleted permanently");
    if (view?.id === id) setView(null);
  };

  const tabs = [
    { id:"All", label:"All", count:counts.all },
    { id:"Pending", label:"Pending", count:counts.pending },
    { id:"Approved", label:"Approved", count:counts.approved },
    { id:"Declined", label:"Declined", count:counts.declined },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white" style={{ fontFamily:"var(--font-display)" }}>TICKET REQUESTS</h1>
          <p className="text-xs mt-0.5" style={{ color:"rgba(255,255,255,0.4)" }}>
            {counts.pending} pending · {counts.approved} approved · {counts.declined} declined — auto-syncs with member portal
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Pending Review" value={counts.pending} icon="fa-solid fa-clock" color="#F59E0B" />
        <StatCard label="Approved" value={counts.approved} icon="fa-solid fa-check-circle" color="#10B981" />
        <StatCard label="Declined" value={counts.declined} icon="fa-solid fa-xmark-circle" color="#EF4444" />
        <StatCard label="Total Requests" value={counts.all} icon="fa-solid fa-ticket" color="#C6A84B" />
      </div>

      <Card>
        <div style={{ borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
          <TabBar tabs={tabs} active={filter} onChange={setFilter} />
        </div>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <EmptyState icon="fa-solid fa-ticket" title="No ticket requests" desc={filter==="All"?"No requests yet":"No requests in this category"} />
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {filtered.map(t => {
                const catColor = CAT_COLORS[t.category] || "#EF0107";
                return (
                  <div key={t.id} className="p-4 hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={()=>setView(t)}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="w-10 h-10 rounded-sm flex items-center justify-center flex-shrink-0 font-black text-xs"
                          style={{ background:`${catColor}20`, color:catColor, fontFamily:"var(--font-heading)" }}>
                          {t.category.replace("Category ","")}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-sm text-white" style={{ fontFamily:"var(--font-heading)" }}>{t.match}</p>
                            <Badge variant={STATUS_V[t.status]||"default"}>{t.status}</Badge>
                          </div>
                          <p className="text-xs mt-0.5" style={{ color:"rgba(255,255,255,0.4)" }}>
                            {t.member} · #{t.membershipNumber} · {t.tier} · {t.qty} ticket{t.qty>1?"s":""} · {t.submitted}
                          </p>
                          {t.specialRequest && <p className="text-xs mt-1 italic" style={{ color:"rgba(255,255,255,0.4)" }}>Note: {t.specialRequest}</p>}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5 flex-shrink-0" onClick={e=>e.stopPropagation()}>
                        {t.status === "Pending" && (
                          <>
                            <Button size="sm" onClick={()=>setStatus(t.id,"Approved")}
                              className="bg-green-500/15 hover:bg-green-500/25 text-green-400 border border-green-500/20 text-[11px] px-2 h-7">
                              <i className="fa-solid fa-check text-[10px]" />Approve
                            </Button>
                            <Button size="sm" onClick={()=>{ setShowPartial(t); setPartialQty(String(t.qty)); }}
                              className="bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 border border-blue-500/20 text-[11px] px-2 h-7">
                              <i className="fa-solid fa-check-double text-[10px]" />Partial
                            </Button>
                            <Button size="sm" variant="danger" onClick={()=>setStatus(t.id,"Declined")}
                              className="text-[11px] px-2 h-7">
                              <i className="fa-solid fa-xmark text-[10px]" />Decline
                            </Button>
                          </>
                        )}
                        {t.status !== "Pending" && (
                          <Button size="sm" variant="secondary" onClick={()=>setStatus(t.id,"Pending")}
                            className="text-[11px] px-2 h-7">
                            Reset
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={()=>handleDelete(t.id)}
                          className="hover:bg-red-500/15 hover:text-red-400 text-[11px] px-2 h-7">
                          <i className="fa-solid fa-trash text-[10px]" />Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* View modal */}
      <Modal open={!!view} onClose={()=>setView(null)} title="Ticket Request Details" size="md">
        {view && (
          <div className="p-5 space-y-3">
            {[["Match",view.match],["Category",view.category],["Member",view.member],["Membership #",view.membershipNumber],["Tier",view.tier],["Quantity",String(view.qty)+" ticket"+(view.qty>1?"s":"")],["Passport/ID",view.passport||"—"],["Section",view.section||"—"],["Submitted",view.submitted],["Special Request",view.specialRequest||"None"]].map(([label,val])=>(
              <div key={label} className="flex items-center gap-3 py-2" style={{ borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
                <span className="text-xs font-bold w-28 flex-shrink-0" style={{ color:"rgba(255,255,255,0.4)", fontFamily:"var(--font-heading)" }}>{label}</span>
                <span className="text-sm text-white" style={{ fontFamily:"var(--font-body)" }}>{val}</span>
              </div>
            ))}
            <div className="flex gap-2 pt-2">
              <Badge variant={STATUS_V[view.status]||"default"}>{view.status}</Badge>
            </div>
          </div>
        )}
      </Modal>

      {/* Partial approval modal */}
      <Modal open={!!showPartial} onClose={()=>setShowPartial(null)} title="Partially Approve Ticket" size="sm">
        {showPartial && (
          <div className="p-5 space-y-4">
            <p className="text-sm" style={{ color:"rgba(255,255,255,0.6)" }}>
              Request: {showPartial.qty} tickets for {showPartial.match}. How many to approve?
            </p>
            <FormGroup label="Approved Quantity" icon="fa-solid fa-ticket">
              <Input type="number" min="1" max={showPartial.qty} value={partialQty} onChange={e=>setPartialQty(e.target.value)} />
            </FormGroup>
            <div className="flex gap-3">
              <Button onClick={()=>{ updateTicket(showPartial.id,{status:"Partially Approved",qty:parseInt(partialQty)||1}); toast.success("Partially approved"); setShowPartial(null); }}>
                Confirm
              </Button>
              <Button variant="secondary" onClick={()=>setShowPartial(null)}>Cancel</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
