"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Modal, FormGroup, Input, Select, StatCard, EmptyState } from "@/components/ui";
import { useApp } from "@/context/AppContext";
import toast from "react-hot-toast";

const STATUS_V: Record<string, any> = { Pending: "warning", Confirmed: "success", Cancelled: "danger", Used: "info" };
const PAY_V: Record<string, any> = { Pending: "warning", Paid: "success", Failed: "danger", Refunded: "info" };

export default function AdminTicketBookingsPage() {
  const { matchTickets } = useApp();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [matchFilter, setMatchFilter] = useState("all");
  const [view, setView] = useState<any>(null);
  const [adminNote, setAdminNote] = useState("");
  const [saving, setSaving] = useState(false);

  const load = (matchTicketId?: string) => {
    setLoading(true);
    const url = matchTicketId && matchTicketId !== "all" ? `/api/admin/ticket-bookings?matchTicketId=${matchTicketId}` : "/api/admin/ticket-bookings";
    fetch(url)
      .then(r => r.json())
      .then(d => setBookings(d.bookings || []))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: string, paymentStatus?: string) => {
    setSaving(true);
    try {
      await fetch("/api/admin/ticket-bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, paymentStatus, adminNote: adminNote || undefined }),
      });
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status, payment_status: paymentStatus || b.payment_status, admin_note: adminNote || b.admin_note } : b));
      if (view?.id === id) setView((v: any) => ({ ...v, status, payment_status: paymentStatus || v.payment_status }));
      toast.success(`Booking ${status.toLowerCase()}`);
    } catch { toast.error("Update failed"); }
    finally { setSaving(false); }
  };

  const counts = {
    all: bookings.length,
    pending: bookings.filter(b => b.status === "Pending").length,
    confirmed: bookings.filter(b => b.status === "Confirmed").length,
    cancelled: bookings.filter(b => b.status === "Cancelled").length,
    paid: bookings.filter(b => b.payment_status === "Paid").length,
  };

  const filtered = bookings.filter(b => {
    if (filter !== "all" && b.status !== filter) return false;
    if (matchFilter !== "all" && b.match_ticket_id !== matchFilter) return false;
    return true;
  });

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white" style={{ fontFamily: "var(--font-display)" }}>TICKET BOOKINGS</h1>
          <p className="text-xs mt-0.5 text-white/40">Advanced booking management · ticket counts auto-update</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => load(matchFilter !== "all" ? matchFilter : undefined)}>
          <i className="fa-solid fa-rotate mr-1.5" />Refresh
        </Button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-3">
        <StatCard label="Total Bookings" value={counts.all} icon="fa-solid fa-ticket" color="#C6A84B" />
        <StatCard label="Pending" value={counts.pending} icon="fa-solid fa-clock" color="#F59E0B" />
        <StatCard label="Confirmed" value={counts.confirmed} icon="fa-solid fa-check-circle" color="#10B981" />
        <StatCard label="Cancelled" value={counts.cancelled} icon="fa-solid fa-xmark-circle" color="#EF4444" />
        <StatCard label="Paid" value={counts.paid} icon="fa-solid fa-credit-card" color="#3B82F6" />
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex gap-1">
          {["all", "Pending", "Confirmed", "Cancelled", "Used"].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className="px-3 py-1.5 text-xs font-bold rounded-sm transition-all"
              style={{ fontFamily: "var(--font-heading)", background: filter === s ? "rgba(239,1,7,0.15)" : "rgba(255,255,255,0.04)", color: filter === s ? "var(--color-red)" : "rgba(255,255,255,0.4)", border: `1px solid ${filter === s ? "rgba(239,1,7,0.3)" : "rgba(255,255,255,0.08)"}` }}>
              {s}
            </button>
          ))}
        </div>
        <select value={matchFilter} onChange={e => { setMatchFilter(e.target.value); load(e.target.value !== "all" ? e.target.value : undefined); }}
          className="px-3 py-1.5 text-xs rounded-sm text-white outline-none"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <option value="all">All Matches</option>
          {matchTickets.map((mt: any) => <option key={mt.id} value={mt.id}>{mt.matchName}</option>)}
        </select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center"><i className="fa-solid fa-spinner fa-spin text-2xl" style={{ color: "var(--color-red)" }} /></div>
          ) : filtered.length === 0 ? (
            <EmptyState icon="fa-solid fa-ticket" title="No bookings found" desc="Bookings appear here when members book match tickets." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    {["Booking ID", "Member", "Match", "Qty", "Total", "Payment", "Status", "Booked", ""].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] uppercase tracking-widest font-bold"
                        style={{ color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-heading)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((b: any) => (
                    <tr key={b.id} className="hover:bg-white/[0.02] transition-colors border-b border-white/[0.04] cursor-pointer" onClick={() => { setView(b); setAdminNote(b.admin_note || ""); }}>
                      <td className="px-4 py-3"><span className="font-mono text-xs font-bold" style={{ color: "var(--color-gold)" }}>{b.id}</span></td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-white">{b.member_name}</p>
                        <p className="text-[10px] text-white/35">#{b.membership_number}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-white/70 max-w-[140px] truncate">{b.match_ticket_id}</td>
                      <td className="px-4 py-3 text-sm font-bold text-white text-center">{b.qty}</td>
                      <td className="px-4 py-3 text-sm font-bold text-white">{b.currency} {Number(b.total_price).toFixed(2)}</td>
                      <td className="px-4 py-3"><Badge variant={PAY_V[b.payment_status] || "default"}>{b.payment_status}</Badge></td>
                      <td className="px-4 py-3"><Badge variant={STATUS_V[b.status] || "default"}>{b.status}</Badge></td>
                      <td className="px-4 py-3 text-xs text-white/40">{new Date(b.booked_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <button className="p-1.5 hover:bg-white/5 rounded text-white/30 hover:text-white" onClick={e => { e.stopPropagation(); setView(b); setAdminNote(b.admin_note || ""); }}>
                          <i className="fa-solid fa-arrow-up-right-from-square text-xs" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View/Edit Modal */}
      {view && (
        <Modal open={!!view} onClose={() => setView(null)} title={`Booking ${view.id}`}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: "Member", value: view.member_name },
                { label: "Membership #", value: view.membership_number },
                { label: "Tier", value: view.tier },
                { label: "Match Ticket ID", value: view.match_ticket_id },
                { label: "Quantity", value: view.qty },
                { label: "Unit Price", value: `${view.currency} ${view.unit_price}` },
                { label: "Total", value: `${view.currency} ${view.total_price}` },
                { label: "Payment Method", value: view.payment_method || "—" },
                { label: "Payment Ref", value: view.payment_ref || "—" },
                { label: "Booked At", value: new Date(view.booked_at).toLocaleString() },
              ].map(f => (
                <div key={f.label}>
                  <p className="text-[10px] text-white/35 uppercase tracking-wider" style={{ fontFamily: "var(--font-heading)" }}>{f.label}</p>
                  <p className="text-white font-medium">{f.value}</p>
                </div>
              ))}
            </div>
            {view.special_request && (
              <div className="p-3 rounded-sm text-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <p className="text-xs font-bold text-white/40 mb-1" style={{ fontFamily: "var(--font-heading)" }}>SPECIAL REQUEST</p>
                <p className="text-white/70">{view.special_request}</p>
              </div>
            )}
            <FormGroup label="Admin Note">
              <textarea value={adminNote} onChange={e => setAdminNote(e.target.value)} rows={2}
                placeholder="Internal note for this booking…"
                className="w-full px-3 py-2 text-sm rounded-sm text-white placeholder-white/30 outline-none resize-none"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
            </FormGroup>
            <div className="flex gap-2 justify-end flex-wrap">
              <Button variant="ghost" size="sm" onClick={() => setView(null)}>Close</Button>
              {view.status === "Pending" && <>
                <Button variant="danger" size="sm" onClick={() => updateStatus(view.id, "Cancelled")} disabled={saving}>Cancel Booking</Button>
                <Button size="sm" onClick={() => updateStatus(view.id, "Confirmed", "Paid")} disabled={saving}>
                  {saving ? "Updating…" : "Confirm & Mark Paid"}
                </Button>
              </>}
              {view.status === "Confirmed" && (
                <Button size="sm" onClick={() => updateStatus(view.id, "Used")} disabled={saving}>Mark as Used</Button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
