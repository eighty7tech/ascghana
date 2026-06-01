"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import MembershipGate from "@/components/MembershipGate";
import { useApp } from "@/context/AppContext";
import toast from "react-hot-toast";
import PaymentStep from "@/components/PaymentStep";
import { useRouter } from "next/navigation";

const CAT_COLORS: Record<string,string> = { A:"#C6A84B", B:"#EF0107", C:"#3B82F6" };
const CAT_NAMES: Record<string,string> = { A:"Category A", B:"Category B", C:"Category C" };
const STATUS_COLORS: Record<string,string> = { Pending:"#F39C12", Approved:"#2ECC71", "Partially Approved":"#3498DB", Declined:"#E74C3C" };

export default function MemberTicketsPage() {
  const { user, isLoggedIn, isActiveMember, isFrozen, isExpired } = useAuth();
  const { tickets, setTickets, matchTickets, updateMatchTicket, settings } = useApp();
  const router = useRouter();

  const [tab, setTab] = useState<"available"|"my">("available");
  const [selected, setSelected] = useState<any>(null);
  const [qty, setQty] = useState("1");
  const [special, setSpecial] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [pendingPayData, setPendingPayData] = useState<any>(null);

  useEffect(() => { if (!isLoggedIn) router.push("/auth/login?redirect=/members/tickets"); }, [isLoggedIn]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!isLoggedIn || !user) return null;
  const currMode = (settings as any).ticketCurrencyMode || "both";
  const gbpRate = Number((settings as any).gbpToGhsRate || 650);

  const available = matchTickets.filter(t => t.status === "Active" && t.ticketsAvailable > 0);
  const myTickets = tickets.filter(t => t.membershipNumber === user.membershipNumber);

  const fmtPrice = (gbp: number) => {
    if (currMode === "GBP") return `£${gbp}`;
    if (currMode === "GHS") return `GHS ${(gbp * gbpRate).toFixed(0)}`;
    return `£${gbp} (GHS ${(gbp * gbpRate).toFixed(0)})`;
  };

  if (isFrozen) return (
    <main style={{ background:"var(--bg-primary)" }}>
      <Navbar />
      <div className="min-h-screen flex items-center justify-center pt-24 px-6">
        <div className="max-w-sm text-center p-8 rounded-sm" style={{ background:"var(--bg-card)", border:"1px solid var(--border-color)" }}>
          <i className="fa-solid fa-snowflake text-4xl mb-4 block" style={{ color:"#3498DB" }} />
          <h2 className="text-2xl font-black mb-3" style={{ fontFamily:"var(--font-display)", color:"var(--text-primary)" }}>Account Frozen</h2>
          <p className="text-sm mb-5" style={{ color:"var(--text-secondary)" }}>Ticket requests are unavailable while your account is frozen.</p>
          <Link href="/members/dashboard" className="btn-arsenal px-5 py-2.5 inline-flex items-center gap-2">← Dashboard</Link>
        </div>
      </div>
      <Footer />
    </main>
  );

  const submitRequest = async () => {
    if (!selected) return;
    const requestedQty = parseInt(qty) || 1;
    if (requestedQty > selected.ticketsAvailable) { toast.error(`Only ${selected.ticketsAvailable} tickets available`); return; }
    setSubmitting(true);

    try {
      // Create booking via API — this decrements ticket count server-side
      const bookRes = await fetch("/api/admin/ticket-bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchTicketId: selected.id,
          memberId: user.id,
          memberName: user.name,
          membershipNumber: user.membershipNumber,
          tier: user.tier,
          qty: requestedQty,
          unitPrice: selected.ticketPrice || 0,
          currency: (settings as any).ticketCurrencyMode === "GBP" ? "GBP" : "GHS",
          specialRequest: special || undefined,
        }),
      });

      const bookData = await bookRes.json();
      if (!bookRes.ok && bookRes.status !== 201) {
        throw new Error(bookData.error || "Booking failed");
      }

      // Also create ticket request in state (for the member portal view)
      const newTicket = {
        id: `TK${Date.now()}`,
        memberId: String(user.id),
        member: user.name,
        membershipNumber: user.membershipNumber,
        tier: user.tier,
        match: selected.matchName,
        category: `Category ${selected.category}` as any,
        date: selected.matchDate,
        qty: requestedQty,
        section: "",
        passport: user.membershipNumber,
        status: "Pending" as const,
        submitted: new Date().toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" }),
        specialRequest: special || undefined,
      };

      // Update match ticket count in local state (API already decremented DB)
      if (bookData.updatedTicket) {
        updateMatchTicket(selected.id, { ticketsAvailable: bookData.updatedTicket.ticketsAvailable, status: bookData.updatedTicket.status });
      } else {
        updateMatchTicket(selected.id, { ticketsAvailable: selected.ticketsAvailable - requestedQty });
      }

      setTickets([...tickets, newTicket]);
      setSelected(null); setSpecial(""); setQty("1");
      setTab("my");
      toast.success(`Booking submitted! ${requestedQty} ticket${requestedQty > 1 ? "s" : ""} reserved. Admin will confirm shortly.`);
    } catch (err: any) {
      // Fallback: still save locally if API is unavailable
      const newTicket = {
        id: `TK${Date.now()}`,
        memberId: String(user.id),
        member: user.name,
        membershipNumber: user.membershipNumber,
        tier: user.tier,
        match: selected.matchName,
        category: `Category ${selected.category}` as any,
        date: selected.matchDate,
        qty: requestedQty,
        section: "",
        passport: user.membershipNumber,
        status: "Pending" as const,
        submitted: new Date().toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" }),
        specialRequest: special || undefined,
      };
      updateMatchTicket(selected.id, { ticketsAvailable: selected.ticketsAvailable - requestedQty });
      setTickets([...tickets, newTicket]);
      setSelected(null); setSpecial(""); setQty("1");
      setTab("my");
      toast.success(`Request submitted! ${requestedQty} ticket${requestedQty > 1 ? "s" : ""} reserved.`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main style={{ background:"var(--bg-primary)" }}>
      <Navbar />
      <MembershipGate featureName="Match Ticket Requests">
      <div className="pt-32 pb-20 max-w-4xl mx-auto px-4 sm:px-6">
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 text-xs font-bold uppercase tracking-widest rounded-sm"
            style={{ background:"rgba(239,1,7,0.1)", border:"1px solid rgba(239,1,7,0.2)", color:"var(--color-red)", fontFamily:"var(--font-heading)" }}>
            <i className="fa-solid fa-ticket" />Match Tickets
          </div>
          <h1 className="text-4xl font-black" style={{ fontFamily:"var(--font-display)", color:"var(--text-primary)" }}>TICKET REQUESTS</h1>
          <p className="mt-2 text-sm" style={{ color:"var(--text-secondary)" }}>
            Member <span style={{ color:"var(--color-gold)" }}>#{user.membershipNumber}</span> · {user.tier} Tier
            {currMode === "both" && <span className="ml-3 text-xs" style={{ color:"var(--text-muted)" }}>Rate: £1 = GHS {gbpRate}</span>}
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-sm mb-8" style={{ background:"var(--bg-card)", width:"fit-content", border:"1px solid var(--border-color)" }}>
          {[["available","Available Matches"],["my",`My Requests (${myTickets.length})`]].map(([val,label]) => (
            <button key={val} onClick={() => setTab(val as any)}
              className="px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-sm transition-all"
              style={{ background:tab===val?"var(--color-red)":"transparent", color:tab===val?"white":"var(--text-muted)", fontFamily:"var(--font-heading)" }}>
              {label}
            </button>
          ))}
        </div>

        {tab === "available" ? (
          <div className="space-y-4">
            {available.length === 0 ? (
              <div className="text-center py-16" style={{ color:"var(--text-muted)" }}>
                <i className="fa-solid fa-ticket text-4xl mb-4 block opacity-20" />
                <p className="font-bold text-lg" style={{ fontFamily:"var(--font-heading)" }}>No matches available for booking</p>
                <p className="text-sm mt-1">Check back soon — the admin team updates listings regularly</p>
              </div>
            ) : available.map(mt => {
              const catColor = CAT_COLORS[mt.category];
              const gbpTicket = Number(mt.ticketPrice) || 0;
              const gbpFee = Number(mt.bookingFee) || 0;
              const pct = Number(mt.paystackChargePct) || 4;
              const ghsTicket = gbpTicket * gbpRate;
              const ghsFee = gbpFee * gbpRate;
              const charge = (ghsTicket + ghsFee) * (pct / 100);
              const totalGhs = ghsTicket + ghsFee + charge;
              const isPast = mt.deadline && new Date(mt.deadline) < new Date();
              const isSelected = selected?.id === mt.id;

              return (
                <div key={mt.id} className="rounded-sm overflow-hidden"
                  style={{ background:"var(--bg-card)", border:`1px solid ${isSelected ? catColor : "var(--border-color)"}`, borderLeft:`3px solid ${catColor}`, transition:"border-color 0.2s" }}>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          {mt.image && <img src={mt.image} alt="" className="w-10 h-7 object-cover rounded-sm flex-shrink-0" />}
                          <h3 className="font-black text-lg leading-tight" style={{ fontFamily:"var(--font-display)", color:"var(--text-primary)" }}>{mt.matchName}</h3>
                          <span className="text-xs px-2 py-0.5 rounded-sm font-bold flex-shrink-0" style={{ background:`${catColor}20`, color:catColor, fontFamily:"var(--font-heading)" }}>
                            {CAT_NAMES[mt.category]}
                          </span>
                          {mt.ticketsAvailable <= 5 && <span className="text-xs px-2 py-0.5 rounded-sm font-bold" style={{ background:"rgba(245,158,11,0.15)", color:"#F59E0B" }}>Only {mt.ticketsAvailable} left!</span>}
                        </div>
                        <p className="text-sm mb-2" style={{ color:"var(--text-muted)" }}>{mt.competition} {mt.matchDate && `· ${mt.matchDate}`}</p>

                        {/* Pricing breakdown */}
                        <div className="p-3 rounded-sm text-xs space-y-1 mb-2" style={{ background:"rgba(0,0,0,0.15)", border:"1px solid var(--border-subtle)" }}>
                          <div className="flex flex-wrap gap-x-4 gap-y-1">
                            <span style={{ color:"var(--text-muted)" }}>Ticket: <strong style={{ color:"var(--text-primary)" }}>{fmtPrice(gbpTicket)}</strong></span>
                            {gbpFee > 0 && <span style={{ color:"var(--text-muted)" }}>Booking fee: <strong style={{ color:"var(--text-primary)" }}>{fmtPrice(gbpFee)}</strong></span>}
                            {pct > 0 && <span style={{ color:"var(--text-muted)" }}>Paystack ({pct}%): <strong style={{ color:"#F59E0B" }}>GHS {charge.toFixed(2)}</strong></span>}
                          </div>
                          <div className="pt-1" style={{ borderTop:"1px solid rgba(255,255,255,0.06)" }}>
                            <span className="font-bold" style={{ color:"var(--text-muted)" }}>Total per ticket: </span>
                            <span className="font-black" style={{ color:"#10B981" }}>GHS {totalGhs.toFixed(2)}</span>
                          </div>
                        </div>

                        {mt.deadline && <p className="text-xs" style={{ color:isPast?"#EF4444":"#F59E0B" }}>
                          <i className="fa-solid fa-clock mr-1 text-[10px]" />Deadline: {mt.deadline}{isPast && " — CLOSED"}
                        </p>}
                        {mt.notes && <p className="text-xs mt-1 italic" style={{ color:"var(--text-muted)" }}>{mt.notes}</p>}
                      </div>
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <span className="text-sm font-bold" style={{ color:mt.ticketsAvailable>0?"#10B981":"#EF4444" }}>
                          {mt.ticketsAvailable} available
                        </span>
                        {!isPast && !isExpired && mt.ticketsAvailable > 0 && (
                          <button onClick={() => setSelected(isSelected ? null : mt)}
                            className="btn-arsenal text-xs px-4 py-2"
                            style={{ background:isSelected?"#10B981":"var(--color-red)" }}>
                            {isSelected ? <><i className="fa-solid fa-check mr-1" />Selected</> : <><i className="fa-solid fa-ticket mr-1" />Request</>}
                          </button>
                        )}
                        {isExpired && <span className="text-xs" style={{ color:"#EF4444" }}>Renew to book</span>}
                        {isPast && <span className="text-xs" style={{ color:"#888" }}>Closed</span>}
                      </div>
                    </div>
                  </div>

                  {/* Request form */}
                  {isSelected && (
                    <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }} exit={{ opacity:0, height:0 }}
                      className="px-5 pb-5 space-y-4" style={{ borderTop:`1px solid ${catColor}30` }}>
                      <div className="pt-4 grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color:"var(--text-muted)", fontFamily:"var(--font-heading)" }}>
                            <i className="fa-solid fa-id-card text-[10px] mr-1" style={{ color:"var(--color-red)" }} />Membership Number (auto)
                          </label>
                          <div className="flex items-center h-9 px-3 rounded-sm text-sm" style={{ background:"rgba(255,255,255,0.04)", border:"1px solid var(--border-color)", color:"var(--text-secondary)" }}>
                            <i className="fa-solid fa-lock text-xs mr-2" style={{ color:"var(--color-gold)" }} />
                            {user.membershipNumber}
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color:"var(--text-muted)", fontFamily:"var(--font-heading)" }}>
                            <i className="fa-solid fa-ticket text-[10px] mr-1" style={{ color:"var(--color-red)" }} />Number of Tickets
                          </label>
                          <select value={qty} onChange={e=>setQty(e.target.value)}
                            className="w-full h-9 px-3 text-sm rounded-sm outline-none border"
                            style={{ background:"var(--bg-input)", borderColor:"var(--border-color)", color:"var(--text-primary)" }}>
                            {Array.from({length:Math.min(4,mt.ticketsAvailable)},(_,i)=>i+1).map(n=>
                              <option key={n} value={n} style={{ background:"var(--bg-card)" }}>{n} ticket{n>1?"s":""}</option>
                            )}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color:"var(--text-muted)", fontFamily:"var(--font-heading)" }}>
                          <i className="fa-solid fa-note-sticky text-[10px] mr-1" style={{ color:"var(--color-red)" }} />Special Request (optional)
                        </label>
                        <input value={special} onChange={e=>setSpecial(e.target.value)}
                          placeholder="Accessibility needs, special arrangements..."
                          className="w-full h-9 px-3 text-sm rounded-sm outline-none border"
                          style={{ background:"var(--bg-input)", borderColor:"var(--border-color)", color:"var(--text-primary)" }} />
                      </div>
                      {/* Total preview */}
                      <div className="p-3 rounded-sm text-xs space-y-1" style={{ background:"rgba(0,0,0,0.2)", border:"1px solid rgba(255,255,255,0.06)" }}>
                        <div className="flex justify-between"><span style={{ color:"var(--text-muted)" }}>Tickets × {qty}</span><span style={{ color:"var(--text-primary)" }}>GHS {(Number(qty)||1) * (Number(mt.ticketPrice)||0) * gbpRate}</span></div>
                        <div className="flex justify-between font-bold pt-1" style={{ borderTop:"1px solid rgba(255,255,255,0.08)" }}>
                          <span style={{ color:"var(--text-primary)" }}>Total payable</span>
                          <span style={{ color:"#10B981" }}>GHS {((Number(qty)||1) * totalGhs).toFixed(2)}</span>
                        </div>
                      </div>
                      {!showPayment ? (
                        <button onClick={() => {
                          const totalGhsAmt = ((Number(qty)||1) * (mt.ticketPrice ? mt.ticketPrice * gbpRate : 0));
                          setPendingPayData({ mt, qty: parseInt(qty)||1, totalGhs: totalGhsAmt });
                          setShowPayment(true);
                        }} className="w-full btn-arsenal py-3 text-sm font-bold">
                          <i className="fa-solid fa-credit-card mr-2" />Proceed to Payment
                        </button>
                      ) : pendingPayData?.mt?.id === mt.id && (
                        <div className="border-t pt-4" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                          <PaymentStep
                            amount={pendingPayData.totalGhs}
                            currency="GHS"
                            email={user.email}
                            name={user.name}
                            phone={(user as any).phone}
                            description={`Match Ticket — ${mt.matchName} × ${pendingPayData.qty}`}
                            callbackPath="/members/tickets?payment=success"
                            metadata={{ matchTicketId: mt.id, qty: pendingPayData.qty }}
                            onManualRef={(ref, method) => {
                              setPendingPayData((p: any) => ({ ...p, payRef: ref, payMethod: method }));
                              submitRequest();
                            }}
                            onRef={(ref, gateway) => {
                              setPendingPayData((p: any) => ({ ...p, payRef: ref, payMethod: gateway }));
                            }}
                            onBack={() => setShowPayment(false)}
                            submitLabel={submitting ? "Submitting…" : "Submit Ticket Request"}
                            disableSubmit={submitting}
                          />
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-3">
            {myTickets.length === 0 ? (
              <div className="text-center py-16" style={{ color:"var(--text-muted)" }}>
                <i className="fa-solid fa-clock text-4xl mb-4 block opacity-20" />
                <p className="font-bold text-lg" style={{ fontFamily:"var(--font-heading)" }}>No requests yet</p>
                <button onClick={()=>setTab("available")} className="mt-3 text-sm font-bold" style={{ color:"var(--color-red)" }}>Browse Available →</button>
              </div>
            ) : myTickets.map(t => (
              <div key={t.id} className="p-4 rounded-sm" style={{ background:"var(--bg-card)", border:`1px solid var(--border-color)`, borderLeft:`2px solid ${STATUS_COLORS[t.status]||"#888"}` }}>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <p className="font-bold" style={{ color:"var(--text-primary)", fontFamily:"var(--font-heading)" }}>{t.match}</p>
                    <p className="text-xs mt-1" style={{ color:"var(--text-muted)" }}>
                      {t.id} · {t.category} · {t.qty} ticket{t.qty>1?"s":""} · Submitted {t.submitted}
                    </p>
                    {t.specialRequest && <p className="text-xs mt-1 italic" style={{ color:"var(--text-muted)" }}>{t.specialRequest}</p>}
                  </div>
                  <span className="text-xs font-bold px-3 py-1.5 rounded-sm flex items-center gap-1.5 flex-shrink-0"
                    style={{ background:`${STATUS_COLORS[t.status]||"#888"}18`, color:STATUS_COLORS[t.status]||"#888", fontFamily:"var(--font-heading)" }}>
                    {t.status==="Approved"&&<i className="fa-solid fa-check text-[10px]" />}
                    {t.status==="Pending"&&<i className="fa-solid fa-clock text-[10px]" />}
                    {t.status==="Declined"&&<i className="fa-solid fa-xmark text-[10px]" />}
                    {t.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
          </MembershipGate>
      </main>
  );
}
