"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { FrozenBanner, ExpiredBanner } from "@/components/MembershipGate";
import AnnouncementsBanner from "@/components/AnnouncementsBanner";
import { formatMemberSince, getRenewalFee, getCurrentSeason, isRenewalWindow } from "@/lib/membershipUtils";
import { useApp } from "@/context/AppContext";
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, Progress, Avatar, StatCard } from "@/components/ui";

const TIER_COLORS: Record<string,string> = { Platinum:"#6B7280",Gold:"#9C824A",Silver:"#6B7280",Bronze:"#B45309",Abusua:"#15803D" };

export default function MemberDashboard() {
  const { user, isLoggedIn, logout, isFrozen, isExpired, isActiveMember, refreshUser } = useAuth();
  const { tickets, events, tiers } = useApp();
  const router = useRouter();
  const [eventsAttended, setEventsAttended] = useState(0);

  useEffect(() => {
    if (!isLoggedIn) router.push("/auth/login");
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) return;
    refreshUser();
    const onFocus = () => refreshUser();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [isLoggedIn, refreshUser]);

  useEffect(() => {
    if (!user?.id) return;
    fetch(`/api/events/bookings?memberId=${user.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d?.bookings) return;
        const count = (d.bookings as { status: string }[]).filter(
          (b) => b.status === "Attended" || b.status === "Confirmed"
        ).length;
        setEventsAttended(count);
      })
      .catch(() => {});
  }, [user?.id]);

  if (!isLoggedIn || !user) return null;

  const myTickets = tickets.filter(t=>t.membershipNumber===user.membershipNumber);
  const approvedTickets = myTickets.filter(t=>t.status==="Approved"||t.status==="Partially Approved").length;
  const pendingTickets = myTickets.filter(t=>t.status==="Pending").length;
  const upcomingEvents = events.filter(e=>e.status==="Published").slice(0,3);
  const tierInfo = tiers.find(t=>t.name===user.tier);
  const tierOrder = ["Bronze","Abusua","Silver","Gold","Platinum"];
  const currentTierIdx = tierOrder.indexOf(user.tier);
  const nextTier = tierOrder[currentTierIdx+1];
  const nextTierInfo = tiers.find(t=>t.name===nextTier);
  const tierColor = TIER_COLORS[user.tier]||"#C6A84B";

  const memberSince = formatMemberSince(user?.joinDate);
  const renewalFee = getRenewalFee();

  const QUICK_ACTIONS = [
    { label:"Request Match Ticket",icon:"fa-solid fa-ticket",href:"/members/tickets",color:"#EF0107",desc:"Apply for Emirates match tickets" },
    { label:"Book Event",icon:"fa-solid fa-calendar-plus",href:"/members/events",color:"#C6A84B",desc:"Register for club events" },
    { label:"Community Forum",icon:"fa-solid fa-people-group",href:"/members/community",color:"#10B981",desc:"Connect with Gunners across Ghana" },
    { label:"Shop",icon:"fa-solid fa-bag-shopping",href:"/shop",color:"#F59E0B",desc:"Get your 10% member discount" },
    { label:"Donate",icon:"fa-solid fa-heart",href:"/members/donate",color:"#EC4899",desc:"Support the club" },
    { label:"Suggestions",icon:"fa-solid fa-lightbulb",href:"/members/suggestions",color:"#8B5CF6",desc:"Share ideas with the committee" },
  ];

  if (isFrozen) return (
    <main style={{ background:"var(--bg-primary)" }}>
      <Navbar />
      <div className="pt-24">
        <FrozenBanner />
      </div>
      <Footer />
    </main>
  );

  return (
    <main style={{ background:"var(--bg-primary)" }}>
      <Navbar />
      <div className="min-h-screen pt-[120px] pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">

          {/* Expired — full restriction, show renewal page only */}
          {isExpired && <ExpiredBanner />}
          <AnnouncementsBanner target="members" className="mb-4" maxItems={3} />
          {!isExpired && (
          <>

          {/* Welcome header */}
          <motion.div initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <Avatar fallback={`${user.firstName[0]}${user.lastName[0]}`} size={56} color={tierColor} src={user.photo} />
              <div>
                <p className="text-xs uppercase tracking-widest mb-0.5 text-muted-foreground" style={{ fontFamily:"var(--font-heading)" }}>Welcome back</p>
                <h1 className="text-2xl font-black" style={{ fontFamily:"var(--font-display)", color:"var(--text-primary)" }}>{user.firstName} {user.lastName}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-mono font-bold" style={{ color:"var(--color-gold)" }}>#{user.membershipNumber}</span>
                  <span className="text-muted-foreground/30">·</span>
                  <Badge style={{ background:`${tierColor}20`, color:tierColor }}><i className="fa-solid fa-crown text-[9px] mr-1" />{user.tier} Member</Badge>
                  <Badge variant={user.status==="Active"?"success":user.status==="Frozen"?"info":"danger"}>{user.status}</Badge>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/members/membership?action=upgrade" className="no-underline">
                <Button variant="gold" size="sm"><i className="fa-solid fa-arrow-up" />Renew / Upgrade</Button>
              </Link>
              <Link href="/members/profile" className="no-underline">
                <Button variant="secondary" size="sm"><i className="fa-solid fa-user" />My Profile</Button>
              </Link>
            </div>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { label:"Tickets Requested",value:myTickets.length,icon:"fa-solid fa-ticket",color:"#EF0107",href:"/members/tickets" },
              { label:"Approved",value:approvedTickets,icon:"fa-solid fa-circle-check",color:"#22C55E",href:"/members/tickets" },
              { label:"Pending",value:pendingTickets,icon:"fa-solid fa-clock",color:"#F59E0B",href:"/members/tickets" },
              { label:"Events Attended",value:eventsAttended,icon:"fa-solid fa-calendar-check",color:"#C6A84B",href:"/members/events" },
            ].map((s,i)=>(
              <motion.div key={s.label} initial={{ opacity:0,y:16 }} animate={{ opacity:1,y:0 }} transition={{ delay:i*0.07 }}>
                <StatCard {...s} light />
              </motion.div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-5">
            {/* Quick Actions */}
            <div className="lg:col-span-2 space-y-5">
              <motion.div initial={{ opacity:0,y:16 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.2 }}>
                <Card>
                  <CardHeader><CardTitle><i className="fa-solid fa-bolt mr-2" style={{ color:"var(--color-red)" }} />Quick Actions</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {QUICK_ACTIONS.map((a,i)=>(
                      <Link key={a.label} href={a.href} className="no-underline">
                        <motion.div whileHover={{ y:-2 }} className="flex flex-col items-center gap-2.5 p-4 rounded-sm text-center cursor-pointer transition-all no-underline"
                          style={{ background:"#EEEEEE", border:"1px solid var(--border-color)" }}>
                          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background:`${a.color}18` }}>
                            <i className={`${a.icon} text-lg`} style={{ color:a.color }} />
                          </div>
                          <p className="text-xs font-bold text-foreground leading-tight" style={{ fontFamily:"var(--font-heading)" }}>{a.label}</p>
                          <p className="text-[10px] leading-relaxed text-muted-foreground">{a.desc}</p>
                        </motion.div>
                      </Link>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Recent ticket requests */}
              <motion.div initial={{ opacity:0,y:16 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.3 }}>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle><i className="fa-solid fa-ticket mr-2" style={{ color:"var(--color-red)" }} />My Ticket Requests</CardTitle>
                      <Link href="/members/tickets" className="no-underline"><Button variant="ghost" size="sm">View all <i className="fa-solid fa-arrow-right ml-1 text-[10px]" /></Button></Link>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {myTickets.length===0
                      ? <div className="py-8 text-center">
                          <i className="fa-solid fa-ticket text-3xl mb-3 block text-muted-foreground/20" />
                          <p className="text-sm text-muted-foreground mb-4">No ticket requests yet</p>
                          <Link href="/members/tickets" className="no-underline"><Button size="sm"><i className="fa-solid fa-plus" />Request Tickets</Button></Link>
                        </div>
                      : <div className="space-y-2">
                          {myTickets.slice(0,3).map(t=>(
                            <div key={t.id} className="flex items-center gap-3 p-3 rounded-sm" style={{ background:"#EEEEEE", border:"1px solid var(--border-color)" }}>
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background:"rgba(239,1,7,0.12)" }}>
                                <i className="fa-solid fa-ticket text-sm" style={{ color:"var(--color-red)" }} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate" style={{ fontFamily:"var(--font-body)" }}>{t.match}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[11px] text-muted-foreground">{t.category} · {t.qty} ticket{t.qty!==1?"s":""}</span>
                                </div>
                              </div>
                              <Badge variant={t.status==="Approved"?"success":t.status==="Pending"?"warning":t.status==="Partially Approved"?"info":"danger"} className="flex-shrink-0">
                                {t.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                    }
                  </CardContent>
                </Card>
              </motion.div>

              {/* Upcoming events */}
              <motion.div initial={{ opacity:0,y:16 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.35 }}>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle><i className="fa-solid fa-calendar-days mr-2" style={{ color:"var(--color-red)" }} />Upcoming Events</CardTitle>
                      <Link href="/members/events" className="no-underline"><Button variant="ghost" size="sm">View all</Button></Link>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {upcomingEvents.length===0
                      ? <p className="text-sm text-center py-4 text-muted-foreground">No upcoming events</p>
                      : upcomingEvents.map(e=>(
                          <div key={e.id} className="flex items-start gap-3 p-3 rounded-sm" style={{ background:"#EEEEEE", border:"1px solid var(--border-color)" }}>
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-center" style={{ background:"rgba(198,168,75,0.12)", minWidth:"40px" }}>
                              <i className="fa-solid fa-calendar text-base" style={{ color:"var(--color-gold)" }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground" style={{ fontFamily:"var(--font-body)" }}>{e.title}</p>
                              <p className="text-xs mt-0.5 text-muted-foreground">{e.date} · {e.venue}</p>
                              {e.memberDiscount && <p className="text-[11px] mt-1" style={{ color:"#22C55E" }}><i className="fa-solid fa-tag text-[9px] mr-1" />Members save {e.memberDiscountPct}%</p>}
                            </div>
                            <Link href="/members/events" className="no-underline"><Button variant="ghost" size="sm">Book</Button></Link>
                          </div>
                        ))
                    }
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Membership card */}
              <motion.div initial={{ opacity:0,y:16 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.25 }}>
                <div className="member-digital-card rounded-md overflow-hidden relative p-5">
                  <div className="absolute top-0 right-0 w-36 h-36 rounded-full opacity-20 pointer-events-none" style={{ background:"var(--color-red)", transform:"translate(35%,-35%)" }} />
                  <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background:"var(--color-red)" }} />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <i className="fa-solid fa-id-card text-sm" style={{ color:"var(--color-red)" }} />
                        <span className="text-xs font-bold uppercase tracking-wider member-card-text" style={{ fontFamily:"var(--font-heading)" }}>Member Card</span>
                      </div>
                      <i className={`fa-solid ${tierInfo?.icon||"fa-star"} text-xl`} style={{ color:tierColor }} />
                    </div>
                    <div className="space-y-2 mb-4">
                      {[["#",user.membershipNumber],["Tier",user.tier],["Branch",user.branch],["Joined",user.joinDate],["Renewal",user.renewalDue]].map(([k,v])=>(
                        <div key={k} className="flex justify-between text-xs">
                          <span className="member-card-label" style={{ fontFamily:"var(--font-body)" }}>{k}</span>
                          <span className="font-medium member-card-text" style={{ color:k==="#"?"var(--color-gold)":undefined, fontFamily:"var(--font-body)" }}>{v}</span>
                        </div>
                      ))}
                    </div>
                    {/* Tier benefits */}
                    {tierInfo && (
                      <div className="pt-3 border-t" style={{ borderColor:"rgba(255,255,255,0.12)" }}>
                        <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color:tierColor, fontFamily:"var(--font-heading)" }}>Benefits</p>
                        {tierInfo.benefits.slice(0,3).map(b=>(
                          <div key={b} className="flex items-center gap-1.5 text-[11px] mb-1 member-card-label">
                            <i className="fa-solid fa-check text-[8px] flex-shrink-0" style={{ color:tierColor }} />{b}
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Upgrade prompt */}
                    {nextTierInfo && (
                      <Link href={`/members/membership?action=upgrade`} className="block mt-4 no-underline">
                        <div className="member-card-inner p-3 rounded-sm border">
                          <p className="text-[10px] uppercase tracking-wider mb-1 member-card-label" style={{ fontFamily:"var(--font-heading)" }}>Upgrade to {nextTierInfo.name}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs member-card-label">+{nextTierInfo.benefits.length - (tierInfo?.benefits.length||0)} more benefits</span>
                            <span className="text-xs font-bold member-card-accent" style={{ fontFamily:"var(--font-display)" }}>GH₵{nextTierInfo.price}</span>
                          </div>
                          <Progress value={((currentTierIdx+1)/(tierOrder.length))*100} className="mt-2" color={nextTierInfo.color} />
                        </div>
                      </Link>
                    )}
                    <div className="flex gap-2 mt-3">
                      <Link href="/members/membership?action=upgrade" className="flex-1 no-underline"><Button variant="gold" size="sm" className="w-full"><i className="fa-solid fa-arrow-up" />Upgrade</Button></Link>
                      <Link href="/members/membership?action=renew" className="flex-1 no-underline"><Button variant="secondary" size="sm" className="w-full"><i className="fa-solid fa-rotate" />Renew</Button></Link>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Branch info */}
              <motion.div initial={{ opacity:0,y:16 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.3 }}>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background:"rgba(239,1,7,0.12)" }}>
                        <i className="fa-solid fa-location-dot text-sm" style={{ color:"var(--color-red)" }} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground" style={{ fontFamily:"var(--font-heading)" }}>{user.branch} Branch</p>
                        <p className="text-[11px] text-muted-foreground">Your local ASC Ghana branch</p>
                      </div>
                    </div>
                    <Link href="/members/community" className="no-underline"><Button variant="secondary" size="sm" className="w-full"><i className="fa-solid fa-people-group" />Join Branch Chat</Button></Link>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
          </>
          )}
        </div>
      </div>
      <Footer />
    </main>
  );
}