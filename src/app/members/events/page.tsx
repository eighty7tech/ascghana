"use client";
import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import MembershipGate from "@/components/MembershipGate";
import { useApp } from "@/context/AppContext";
import { Button, Badge, Card, CardContent } from "@/components/ui";
import toast from "react-hot-toast";
import PaymentStep from "@/components/PaymentStep";

export default function MemberEventsPage() {
  const { user, isLoggedIn, isActiveMember, isFrozen, isExpired } = useAuth();
  const { events } = useApp();
  const [bookingId, setBookingId] = useState<number|null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [booked, setBooked] = useState<number[]>([]);
  const [paymentEvent, setPaymentEvent] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);

  const published = events.filter(e=>e.status==="Published");

  if (!isLoggedIn || !user) {
    return (
      <main style={{ background:"var(--bg-primary)" }}>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center pt-20">
          <motion.div className="text-center p-10 rounded-sm max-w-md" style={{ background:"#16213E",border:"1px solid rgba(239,1,7,0.2)" }} initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }}>
            <i className="fa-solid fa-calendar-days text-4xl mb-4 block" style={{ color:"var(--color-red)" }} />
            <h2 className="text-2xl font-black text-white mb-2" style={{ fontFamily:"var(--font-display)" }}>Members Only</h2>
            <p className="text-sm mb-6" style={{ color:"rgba(255,255,255,0.5)" }}>Sign in to book events and get your exclusive 10% member discount.</p>
            <Link href="/auth/login"><Button className="w-full"><i className="fa-solid fa-right-to-bracket mr-2" />Sign In to Continue</Button></Link>
            <p className="mt-4 text-xs" style={{ color:"rgba(255,255,255,0.3)" }}>Not a member? <Link href="/membership/register" style={{ color:"var(--color-red)" }}>Join ASC Ghana</Link></p>
          </motion.div>
        </div>
        <Footer />
      </main>
    );
  }

  const handleBook = (ev: any) => {
    const memberPrice = ev.isFree ? 0 : (ev.memberDiscount ? ev.memberPrice || Math.round(ev.nonMemberPrice*(1-(ev.memberDiscountPct||10)/100)) : ev.nonMemberPrice || 0);
    if (ev.isFree || memberPrice === 0) {
      // Free event — book directly
      doBookEvent(ev, 0, "Free", "");
    } else {
      setPaymentEvent(ev);
      setPaymentAmount(memberPrice);
    }
  };

  const doBookEvent = async (ev: any, amount: number, payMethod: string, payRef: string) => {
    setBookingId(ev.id); setBookingLoading(true);
    try {
      const res = await fetch("/api/events/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: ev.id, eventTitle: ev.title,
          memberId: user.id, memberName: user.name,
          membershipNumber: user.membershipNumber,
          email: user.email, phone: (user as any).phone || "",
          qty: 1, unitPrice: amount, currency: "GHS",
          paymentMethod: payMethod, paymentRef: payRef,
        }),
      });
      const data = await res.json();
      if (data.alreadyBooked) { toast.error("You have already booked this event."); return; }
      if (data.full) { toast.error(data.error || "Event is fully booked."); return; }
      if (!res.ok && res.status !== 201) throw new Error(data.error || "Booking failed");
      setBooked(prev => [...prev, ev.id]);
      setPaymentEvent(null);
      toast.success(`🎟️ ${ev.title} — ${amount > 0 ? `GHS ${amount}` : "Free"} — Booking confirmed!`);
    } catch (err: any) {
      toast.error(err.message || "Booking failed. Please try again.");
    } finally {
      setBookingId(null); setBookingLoading(false);
    }
  };

  return (
    <main style={{ background:"var(--bg-primary)" }}>
      <Navbar />
      <MembershipGate featureName="Event Booking">
      <div className="min-h-screen pt-[120px] pb-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <motion.div initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} className="mb-8">
            <div className="flex items-center gap-3 mb-1">
              <i className="fa-solid fa-calendar-days text-xl" style={{ color:"var(--color-red)" }} />
              <h1 className="text-3xl font-black text-white" style={{ fontFamily:"var(--font-display)" }}>Events</h1>
            </div>
            <p className="text-sm" style={{ color:"rgba(255,255,255,0.45)" }}>
              Hi {user.firstName}! As a <span style={{ color:"var(--color-gold)",fontWeight:"bold" }}>{user.tier} member</span>, you receive automatic discounts on all events.
            </p>
          </motion.div>

          {/* Member discount banner */}
          <motion.div initial={{ opacity:0,y:10 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.1 }} className="flex items-center gap-3 p-4 rounded-sm mb-6" style={{ background:"rgba(198,168,75,0.08)",border:"1px solid rgba(198,168,75,0.25)" }}>
            <i className="fa-solid fa-crown" style={{ color:"var(--color-gold)" }} />
            <div>
              <p className="text-sm font-bold" style={{ color:"var(--color-gold)",fontFamily:"var(--font-heading)" }}>Member #{user.membershipNumber} — 10% discount automatically applied</p>
              <p className="text-xs" style={{ color:"rgba(255,255,255,0.5)" }}>Your membership number is verified — no extra steps needed.</p>
            </div>
          </motion.div>

          {/* Events grid */}
          {published.length===0
            ? <div className="py-16 text-center"><i className="fa-solid fa-calendar-xmark text-4xl mb-4 block" style={{ color:"rgba(255,255,255,0.15)" }} /><p className="text-white/40">No events available right now</p></div>
            : <div className="grid sm:grid-cols-2 gap-5">
                {published.map((e,i)=>{
                  const isBooked = booked.includes(e.id);
                  const memberPrice = e.memberDiscount ? e.memberPrice||Math.round(e.nonMemberPrice*(1-e.memberDiscountPct/100)) : e.nonMemberPrice;
                  const spotsLeft = e.capacity-e.booked;
                  return (
                    <motion.div key={e.id} initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} transition={{ delay:i*0.07 }}>
                      <Card className="overflow-hidden hover:-translate-y-1 transition-transform duration-300">
                        <div className="relative h-40" style={{ background:"linear-gradient(135deg, #9B0000, #1A1A2E)" }}>
                          <div className="absolute inset-0 flex items-center justify-center opacity-15">
                            <i className="fa-solid fa-calendar-days text-7xl text-white" />
                          </div>
                          <div className="absolute top-3 left-3 flex gap-2">
                            <Badge variant="default" style={{ background:"rgba(239,1,7,0.85)",color:"white" }}>{e.category}</Badge>
                            {e.memberDiscount && <Badge variant="success"><i className="fa-solid fa-tag text-[9px] mr-1" />Member {e.memberDiscountPct}% Off</Badge>}
                          </div>
                          {isBooked && (
                            <div className="absolute inset-0 flex items-center justify-center" style={{ background:"rgba(34,197,94,0.3)",backdropFilter:"blur(2px)" }}>
                              <div className="text-center"><i className="fa-solid fa-circle-check text-3xl text-white mb-1 block" /><p className="text-white font-bold text-sm" style={{ fontFamily:"var(--font-heading)" }}>BOOKED!</p></div>
                            </div>
                          )}
                        </div>
                        <CardContent>
                          <h3 className="font-bold text-white text-sm mb-2 leading-snug" style={{ fontFamily:"var(--font-heading)" }}>{e.title}</h3>
                          <div className="space-y-1 mb-4">
                            {[
                              { icon:"fa-solid fa-calendar",val:`${e.date} at ${e.time}` },
                              { icon:"fa-solid fa-location-dot",val:e.venue },
                              { icon:"fa-solid fa-users",val:`${spotsLeft} spots remaining (${e.capacity} total)` },
                            ].map(item=>(
                              <p key={item.icon} className="text-xs flex items-center gap-1.5" style={{ color:"rgba(255,255,255,0.5)" }}>
                                <i className={`${item.icon} w-3.5 text-center flex-shrink-0`} style={{ color:"var(--color-red)" }} />{item.val}
                              </p>
                            ))}
                          </div>
                          {/* Pricing */}
                          <div className="flex items-end justify-between mb-4 p-3 rounded-sm" style={{ background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)" }}>
                            <div>
                              <p className="text-[10px] uppercase tracking-wider" style={{ color:"rgba(255,255,255,0.4)",fontFamily:"var(--font-heading)" }}>Member Price</p>
                              <p className="text-xl font-black" style={{ color:"var(--color-gold)",fontFamily:"var(--font-display)" }}>GH₵{memberPrice}</p>
                              {e.memberDiscount && <p className="text-[10px] line-through" style={{ color:"rgba(255,255,255,0.3)" }}>GH₵{e.nonMemberPrice} non-member</p>}
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color:"rgba(255,255,255,0.4)",fontFamily:"var(--font-heading)" }}>You save</p>
                              <p className="text-sm font-bold" style={{ color:"#22C55E",fontFamily:"var(--font-display)" }}>GH₵{e.memberDiscount?e.nonMemberPrice-memberPrice:0}</p>
                            </div>
                          </div>
                          <Button className="w-full" disabled={isBooked||bookingLoading||spotsLeft===0} onClick={()=>handleBook(e)}>
                            {isBooked ? <><i className="fa-solid fa-circle-check" />Booked!</>
                              : bookingId===e.id ? <><i className="fa-solid fa-spinner fa-spin" />Processing...</>
                              : spotsLeft===0 ? "Sold Out"
                              : <><i className="fa-solid fa-ticket" />Book Now — GH₵{memberPrice}</>
                            }
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
          }
        </div>
      </div>
      <Footer />
          </MembershipGate>
    </main>
  );
}