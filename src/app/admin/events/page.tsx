"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Modal, FormGroup, Input, Select, Switch, EmptyState, StatCard, Textarea, RichTextField } from "@/components/ui";
import ImageUploadField from "@/components/ImageUploadField";
import toast from "react-hot-toast";
import Link from "next/link";

type AdminTab = "events"|"bookings"|"attendance";

const STATUS_V: Record<string,any> = { Draft:"default", Published:"success", Cancelled:"danger", Completed:"info" };
const BOOKING_STATUS_V: Record<string,any> = { Pending:"warning", Confirmed:"success", Cancelled:"danger", Attended:"info", "No-Show":"danger" };
const CATEGORIES = ["Watch Party","Award Ceremony","Annual Gala","Community Event","Football Tournament","Charity","Meeting","Other"];

const EMPTY_EVENT: any = {
  title:"", date:"", time:"", endTime:"", category:"Watch Party", venue:"", address:"",
  description:"", shortDescription:"", image:"", capacity:0, isFree:true,
  memberPrice:0, nonMemberPrice:0, memberDiscount:true, memberDiscountPct:10,
  status:"Draft", requiresBooking:true, featured:false, organizer:"", contactEmail:"",
  tags:"", onlineLink:"",
  // Arsenal fixture link
  fixtureHomeTeam:"Arsenal", fixtureAwayTeam:"", fixtureHomeLogo:"", fixtureAwayLogo:"",
  fixtureCompetition:"", fixtureKickoff:"",
};

export default function AdminEventsPage() {
  const { events, setEvents, addAdminNotification, settings } = useApp();
  const [tab, setTab] = useState<AdminTab>("events");
  const [modal, setModal] = useState(false);
  const [editEvent, setEditEvent] = useState<any>(null);
  const [form, setForm] = useState<any>(EMPTY_EVENT);
  const [saving, setSaving] = useState(false);
  const [formTab, setFormTab] = useState<"basic"|"details"|"fixture"|"pricing">("basic");
  const [bookings, setBookings] = useState<any[]>([]);
  const [bookingStats, setBookingStats] = useState<any[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [attendanceList, setAttendanceList] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [searchQ, setSearchQ] = useState("");

  useEffect(() => {
    if (tab === "bookings") loadBookings();
  }, [tab]);

  const loadBookings = async (eventId?: string) => {
    setBookingsLoading(true);
    const url = eventId ? `/api/events/bookings?eventId=${eventId}` : "/api/events/bookings";
    fetch(url)
      .then(r => r.json())
      .then(d => { setBookings(d.bookings || []); setBookingStats(d.stats || []); })
      .catch(() => {})
      .finally(() => setBookingsLoading(false));
  };

  const openAdd = () => { setForm(EMPTY_EVENT); setEditEvent(null); setFormTab("basic"); setModal(true); };
  const openEdit = (ev: any) => {
    setForm({
      title:ev.title||"", date:ev.date||"", time:ev.time||"", endTime:ev.endTime||"",
      category:ev.category||"Watch Party", venue:ev.venue||"", address:ev.address||"",
      description:ev.description||"", shortDescription:ev.shortDescription||"",
      image:ev.image||ev.imageUrl||"", capacity:ev.capacity||0,
      isFree:ev.isFree!==false, memberPrice:ev.memberPrice||0, nonMemberPrice:ev.nonMemberPrice||0,
      memberDiscount:ev.memberDiscount!==false, memberDiscountPct:ev.memberDiscountPct||10,
      status:ev.status||"Draft", requiresBooking:ev.requiresBooking!==false,
      featured:!!ev.featured, organizer:ev.organizer||"", contactEmail:ev.contactEmail||"",
      tags:ev.tags||"", onlineLink:ev.onlineLink||"",
      fixtureHomeTeam:ev.fixtureHomeTeam||"Arsenal", fixtureAwayTeam:ev.fixtureAwayTeam||"",
      fixtureHomeLogo:ev.fixtureHomeLogo||"", fixtureAwayLogo:ev.fixtureAwayLogo||"",
      fixtureCompetition:ev.fixtureCompetition||"", fixtureKickoff:ev.fixtureKickoff||"",
    });
    setEditEvent(ev);
    setFormTab("basic");
    setModal(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.date) { toast.error("Title and date are required"); return; }
    setSaving(true);
    try {
      if (editEvent) {
        const updated = events.map((e: any) => e.id === editEvent.id ? { ...e, ...form } : e);
        setEvents(updated);
        addAdminNotification("Event Updated", form.title, "info");
        toast.success("Event updated");
      } else {
        const newEvent = { ...form, id: (events.length > 0 ? Math.max(...events.map((x: any) => typeof x.id === "number" ? x.id : 0)) + 1 : 1), booked: 0, createdAt: new Date().toISOString() };
        setEvents([...events, newEvent]);
        addAdminNotification("Event Created", form.title, "success");
        toast.success("Event created");
      }
      setModal(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (ev: any) => {
    if (!confirm(`Delete "${ev.title}"?`)) return;
    setEvents(events.filter((e: any) => e.id !== ev.id));
    addAdminNotification("Event Deleted", ev.title, "warning");
    toast.success("Event deleted");
  };

  const toggleStatus = (ev: any) => {
    const next = ev.status === "Published" ? "Draft" : "Published";
    setEvents(events.map((e: any) => e.id === ev.id ? { ...e, status: next } : e));
    toast.success(`${ev.title} ${next === "Published" ? "published" : "unpublished"}`);
  };

  const updateBooking = async (id: string, status: string, paymentStatus?: string) => {
    await fetch("/api/events/bookings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, paymentStatus }),
    });
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status, payment_status: paymentStatus || b.payment_status } : b));
    toast.success(`Booking ${status.toLowerCase()}`);
  };

  const displayed = events
    .filter((e: any) => {
      if (filter !== "all" && e.status !== filter) return false;
      if (searchQ && !e.title?.toLowerCase().includes(searchQ.toLowerCase())) return false;
      return true;
    })
    .sort((a: any, b: any) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());

  const published = events.filter((e: any) => e.status === "Published").length;
  const totalBooked = events.reduce((s: number, e: any) => s + (e.booked || 0), 0);

  const inp = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" } as const;
  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  const TABS: { id: AdminTab; label: string; icon: string }[] = [
    { id:"events",     label:`Events (${events.length})`,        icon:"fa-solid fa-calendar-days" },
    { id:"bookings",   label:`Bookings`,                          icon:"fa-solid fa-ticket" },
    { id:"attendance", label:"Attendance",                        icon:"fa-solid fa-user-check" },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white" style={{fontFamily:"var(--font-display)"}}>EVENTS MANAGEMENT</h1>
          <p className="text-xs mt-0.5 text-white/40">Manage events, bookings, and attendance</p>
        </div>
        {tab === "events" && <Button onClick={openAdd}><i className="fa-solid fa-plus mr-1.5"/>Add Event</Button>}
        {tab === "bookings" && <Button variant="secondary" size="sm" onClick={() => loadBookings()}><i className="fa-solid fa-rotate mr-1.5"/>Refresh</Button>}
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Total Events"   value={events.length}       icon="fa-solid fa-calendar-days" color="#C6A84B"/>
        <StatCard label="Published"      value={published}           icon="fa-solid fa-circle-check"  color="#10B981"/>
        <StatCard label="Total Bookings" value={totalBooked}         icon="fa-solid fa-ticket"         color="#EF0107"/>
        <StatCard label="Pending Bookings" value={bookings.filter(b=>b.status==="Pending").length || bookingStats.find((s:any)=>s.status==="Pending")?.count || 0}
          icon="fa-solid fa-clock" color="#F59E0B"/>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b" style={{borderColor:"rgba(255,255,255,0.06)"}}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all"
            style={{
              fontFamily:"var(--font-heading)",
              color: tab===t.id ? "var(--color-red)" : "rgba(255,255,255,0.4)",
              borderBottom: tab===t.id ? "2px solid var(--color-red)" : "2px solid transparent",
            }}>
            <i className={`${t.icon} text-[10px]`}/>{t.label}
          </button>
        ))}
      </div>

      {/* ── EVENTS TAB ── */}
      {tab === "events" && (
        <>
          {/* Filters */}
          <div className="flex gap-3 flex-wrap items-center">
            <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Search events…"
              className="px-3 py-1.5 text-sm rounded-sm text-white placeholder-white/30 outline-none"
              style={inp}/>
            <div className="flex gap-1">
              {["all","Published","Draft","Cancelled","Completed"].map(s=>(
                <button key={s} onClick={()=>setFilter(s)}
                  className="px-3 py-1.5 text-xs font-bold rounded-sm uppercase tracking-wider transition-all"
                  style={{fontFamily:"var(--font-heading)", background:filter===s?"rgba(239,1,7,0.15)":"rgba(255,255,255,0.04)", color:filter===s?"var(--color-red)":"rgba(255,255,255,0.4)", border:`1px solid ${filter===s?"rgba(239,1,7,0.3)":"rgba(255,255,255,0.08)"}`}}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {displayed.length === 0 ? (
            <EmptyState icon="fa-solid fa-calendar-days" title="No events" desc="Create your first event to get started." />
          ) : (
            <div className="grid lg:grid-cols-2 gap-4">
              {displayed.map((ev: any) => (
                <Card key={ev.id}>
                  <CardContent className="p-0">
                    {/* Image */}
                    {(ev.image||ev.imageUrl) && (
                      <div className="h-32 rounded-t-sm overflow-hidden">
                        <img src={ev.image||ev.imageUrl} alt={ev.title} className="w-full h-full object-cover"/>
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <Badge variant={STATUS_V[ev.status]||"default"}>{ev.status}</Badge>
                            {ev.featured && <Badge variant="gold" style={{fontSize:10}}>Featured</Badge>}
                            <span className="text-[10px] text-white/30">{ev.category}</span>
                          </div>
                          <h3 className="text-sm font-black text-white leading-tight" style={{fontFamily:"var(--font-heading)"}}>{ev.title}</h3>
                          <p className="text-xs text-white/40 mt-0.5">
                            <i className="fa-solid fa-calendar mr-1"/>
                            {new Date(ev.date).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})}
                            {ev.time && <> · {ev.time}</>}
                            {ev.venue && <> · <i className="fa-solid fa-location-dot ml-1 mr-0.5"/>{ev.venue}</>}
                          </p>
                        </div>
                        <div className="text-center flex-shrink-0">
                          <p className="text-xl font-black" style={{color:"var(--color-gold)",fontFamily:"var(--font-display)"}}>{ev.booked||0}</p>
                          <p className="text-[9px] text-white/30">{ev.capacity>0?`of ${ev.capacity}`:"booked"}</p>
                        </div>
                      </div>
                      {/* Fixture badge */}
                      {ev.fixtureAwayTeam && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-sm mb-3" style={{background:"rgba(239,1,7,0.08)",border:"1px solid rgba(239,1,7,0.15)"}}>
                          {ev.fixtureHomeLogo && <img src={ev.fixtureHomeLogo} alt="" className="h-5 object-contain"/>}
                          <span className="text-xs font-bold text-white">{ev.fixtureHomeTeam||"Arsenal"}</span>
                          <span className="text-xs text-white/40">vs</span>
                          <span className="text-xs font-bold text-white">{ev.fixtureAwayTeam}</span>
                          {ev.fixtureAwayLogo && <img src={ev.fixtureAwayLogo} alt="" className="h-5 object-contain"/>}
                          {ev.fixtureCompetition && <span className="text-[10px] text-white/30 ml-auto">{ev.fixtureCompetition}</span>}
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 pt-2" style={{borderTop:"1px solid rgba(255,255,255,0.06)"}}>
                        <button onClick={()=>toggleStatus(ev)}
                          className="text-xs px-2.5 py-1 rounded-sm font-bold transition-colors"
                          style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",color:ev.status==="Published"?"#F59E0B":"#10B981",fontFamily:"var(--font-heading)"}}>
                          {ev.status==="Published"?"Unpublish":"Publish"}
                        </button>
                        <button onClick={()=>{setSelectedEvent(ev);loadBookings(String(ev.id));setTab("bookings");}}
                          className="text-xs px-2.5 py-1 rounded-sm font-bold transition-colors"
                          style={{background:"rgba(59,130,246,0.1)",border:"1px solid rgba(59,130,246,0.2)",color:"#3B82F6",fontFamily:"var(--font-heading)"}}>
                          Bookings
                        </button>
                        <div className="flex-1"/>
                        <button onClick={()=>openEdit(ev)} className="p-1.5 text-white/30 hover:text-white rounded transition-colors">
                          <i className="fa-solid fa-pen text-xs"/>
                        </button>
                        <button onClick={()=>handleDelete(ev)} className="p-1.5 text-white/30 hover:text-red-400 rounded transition-colors">
                          <i className="fa-solid fa-trash text-xs"/>
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── BOOKINGS TAB ── */}
      {tab === "bookings" && (
        <>
          {selectedEvent && (
            <div className="flex items-center gap-3 p-3 rounded-sm" style={{background:"rgba(239,1,7,0.08)",border:"1px solid rgba(239,1,7,0.2)"}}>
              <i className="fa-solid fa-calendar text-xs" style={{color:"var(--color-red)"}}/>
              <p className="text-sm font-bold text-white">{selectedEvent.title}</p>
              <button onClick={()=>{setSelectedEvent(null);loadBookings();}} className="ml-auto text-xs text-white/40 hover:text-white">
                View All Events
              </button>
            </div>
          )}
          <Card>
            <CardContent className="p-0">
              {bookingsLoading ? (
                <div className="py-12 text-center"><i className="fa-solid fa-spinner fa-spin text-xl" style={{color:"var(--color-red)"}}/></div>
              ) : bookings.length === 0 ? (
                <EmptyState icon="fa-solid fa-ticket" title="No bookings" desc="Event bookings will appear here when members book events."/>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr style={{borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
                        {["ID","Member","Event","Qty","Total","Payment","Status","Date",""].map(h=>(
                          <th key={h} className="px-4 py-3 text-left text-[10px] uppercase tracking-wider font-bold"
                            style={{color:"rgba(255,255,255,0.3)",fontFamily:"var(--font-heading)"}}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map((b:any) => (
                        <tr key={b.id} className="hover:bg-white/[0.02] border-b border-white/[0.04] transition-colors">
                          <td className="px-4 py-3"><span className="font-mono text-xs font-bold" style={{color:"var(--color-gold)"}}>{b.id}</span></td>
                          <td className="px-4 py-3">
                            <p className="text-sm text-white">{b.member_name}</p>
                            <p className="text-[10px] text-white/35">{b.email}</p>
                          </td>
                          <td className="px-4 py-3 text-xs text-white/70 max-w-[140px] truncate">{b.event_title}</td>
                          <td className="px-4 py-3 text-sm text-white text-center">{b.qty}</td>
                          <td className="px-4 py-3 text-sm font-bold text-white">{b.total_price>0?`${b.currency} ${b.total_price}`:"Free"}</td>
                          <td className="px-4 py-3"><Badge variant={b.payment_status==="Paid"?"success":b.payment_status==="Free"?"info":"warning"}>{b.payment_status}</Badge></td>
                          <td className="px-4 py-3"><Badge variant={BOOKING_STATUS_V[b.status]||"default"}>{b.status}</Badge></td>
                          <td className="px-4 py-3 text-xs text-white/40">{new Date(b.booked_at).toLocaleDateString()}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              {b.status==="Pending"&&<>
                                <button onClick={()=>updateBooking(b.id,"Confirmed","Paid")}
                                  className="px-2 py-1 text-[10px] font-bold rounded-sm" style={{background:"rgba(16,185,129,0.1)",border:"1px solid rgba(16,185,129,0.25)",color:"#10B981",fontFamily:"var(--font-heading)"}}>Confirm</button>
                                <button onClick={()=>updateBooking(b.id,"Cancelled")}
                                  className="px-2 py-1 text-[10px] font-bold rounded-sm" style={{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.25)",color:"#EF4444",fontFamily:"var(--font-heading)"}}>Cancel</button>
                              </>}
                              {b.status==="Confirmed"&&
                                <button onClick={()=>updateBooking(b.id,"Attended")}
                                  className="px-2 py-1 text-[10px] font-bold rounded-sm" style={{background:"rgba(59,130,246,0.1)",border:"1px solid rgba(59,130,246,0.25)",color:"#3B82F6",fontFamily:"var(--font-heading)"}}>Check In</button>
                              }
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* ── ATTENDANCE TAB ── */}
      {tab === "attendance" && (
        <div className="space-y-4">
          <p className="text-sm text-white/40">Select an event from the Events tab and use the attendance tracker from there, or use <Link href="/admin/events/attendance" className="text-red-400 underline">Event Attendance</Link>.</p>
        </div>
      )}

      {/* ── Event Form Modal ── */}
      <Modal open={modal} onClose={()=>setModal(false)} title={editEvent?"Edit Event":"Create Event"} size="xl">
        <div className="space-y-4">
          {/* Form sub-tabs */}
          <div className="flex gap-1 border-b" style={{borderColor:"rgba(255,255,255,0.08)"}}>
            {(["basic","details","fixture","pricing"] as const).map(t=>(
              <button key={t} onClick={()=>setFormTab(t)}
                className="px-3 py-2 text-xs font-bold uppercase tracking-wider transition-all"
                style={{fontFamily:"var(--font-heading)",color:formTab===t?"var(--color-red)":"rgba(255,255,255,0.35)",borderBottom:formTab===t?"2px solid var(--color-red)":"2px solid transparent"}}>
                {t}
              </button>
            ))}
          </div>

          {formTab==="basic" && (
            <div className="space-y-3">
              <FormGroup label="Event Title *"><Input value={form.title} onChange={e=>set("title",e.target.value)} placeholder="Match Day Watch Party"/></FormGroup>
              <div className="grid grid-cols-2 gap-3">
                <FormGroup label="Category">
                  <Select value={form.category} onChange={e=>set("category",e.target.value)}>
                    {CATEGORIES.map(c=><option key={c}>{c}</option>)}
                  </Select>
                </FormGroup>
                <FormGroup label="Status">
                  <Select value={form.status} onChange={e=>set("status",e.target.value)}>
                    {["Draft","Published","Cancelled","Completed"].map(s=><option key={s}>{s}</option>)}
                  </Select>
                </FormGroup>
                <FormGroup label="Date *"><Input type="date" value={form.date} onChange={e=>set("date",e.target.value)}/></FormGroup>
                <FormGroup label="Start Time"><Input type="time" value={form.time} onChange={e=>set("time",e.target.value)}/></FormGroup>
                <FormGroup label="End Time"><Input type="time" value={form.endTime} onChange={e=>set("endTime",e.target.value)}/></FormGroup>
                <FormGroup label="Capacity (0=unlimited)"><Input type="number" min={0} value={form.capacity} onChange={e=>set("capacity",Number(e.target.value))}/></FormGroup>
              </div>
              <FormGroup label="Venue"><Input value={form.venue} onChange={e=>set("venue",e.target.value)} placeholder="Silverstar Tower, Accra"/></FormGroup>
              <FormGroup label="Address"><Input value={form.address} onChange={e=>set("address",e.target.value)}/></FormGroup>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer"><Switch checked={!!form.featured} onChange={()=>set("featured",!form.featured)}/><span className="text-xs text-white/60">Featured</span></label>
                <label className="flex items-center gap-2 cursor-pointer"><Switch checked={form.requiresBooking!==false} onChange={()=>set("requiresBooking",!form.requiresBooking)}/><span className="text-xs text-white/60">Require Booking</span></label>
              </div>
            </div>
          )}

          {formTab==="details" && (
            <div className="space-y-3">
              <FormGroup label="Short Description">
                <Textarea value={form.shortDescription} onChange={e=>set("shortDescription",e.target.value)} rows={2} placeholder="Brief summary for event cards…" className="resize-none" />
              </FormGroup>
              <FormGroup label="Full Description" icon="fa-solid fa-align-left">
                <RichTextField value={form.description} onChange={v=>set("description",v)} placeholder="Write the full event details…" minHeight={220}/>
              </FormGroup>
              <ImageUploadField label="Event Image" value={form.image} onChange={v=>set("image",v)} folder="events" previewHeight={140}/>
              <FormGroup label="Organizer"><Input value={form.organizer} onChange={e=>set("organizer",e.target.value)} placeholder="Arsenal Ghana Events Team"/></FormGroup>
              <FormGroup label="Contact Email"><Input type="email" value={form.contactEmail} onChange={e=>set("contactEmail",e.target.value)}/></FormGroup>
              <FormGroup label="Tags (comma-separated)"><Input value={form.tags} onChange={e=>set("tags",e.target.value)} placeholder="watch party, match day, accra"/></FormGroup>
              <FormGroup label="Online/Stream Link"><Input value={form.onlineLink} onChange={e=>set("onlineLink",e.target.value)} placeholder="https://youtube.com/..."/></FormGroup>
            </div>
          )}

          {formTab==="fixture" && (
            <div className="space-y-3">
              <div className="p-3 rounded-sm text-sm text-white/60" style={{background:"rgba(198,168,75,0.06)",border:"1px solid rgba(198,168,75,0.15)"}}>
                <i className="fa-solid fa-circle-info mr-2" style={{color:"#C6A84B"}}/>Link this event to an Arsenal match fixture (optional). Used to display the fixture card on the event.
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormGroup label="Home Team"><Input value={form.fixtureHomeTeam} onChange={e=>set("fixtureHomeTeam",e.target.value)} placeholder="Arsenal"/></FormGroup>
                <FormGroup label="Away Team"><Input value={form.fixtureAwayTeam} onChange={e=>set("fixtureAwayTeam",e.target.value)} placeholder="Chelsea"/></FormGroup>
              </div>
              <ImageUploadField label="Home Team Logo" value={form.fixtureHomeLogo} onChange={v=>set("fixtureHomeLogo",v)} folder="events" previewHeight={80} showPreview/>
              <ImageUploadField label="Away Team Logo" value={form.fixtureAwayLogo} onChange={v=>set("fixtureAwayLogo",v)} folder="events" previewHeight={80} showPreview/>
              <FormGroup label="Competition"><Input value={form.fixtureCompetition} onChange={e=>set("fixtureCompetition",e.target.value)} placeholder="Premier League"/></FormGroup>
              <FormGroup label="Kick-off Date & Time"><Input type="datetime-local" value={form.fixtureKickoff} onChange={e=>set("fixtureKickoff",e.target.value)}/></FormGroup>
            </div>
          )}

          {formTab==="pricing" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-sm" style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)"}}>
                <div><p className="text-sm font-medium text-white">Free Event</p><p className="text-xs text-white/40">No ticket price required</p></div>
                <Switch checked={!!form.isFree} onChange={()=>set("isFree",!form.isFree)}/>
              </div>
              {!form.isFree && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <FormGroup label="Member Price (GHS)"><Input type="number" min={0} step={0.01} value={form.memberPrice} onChange={e=>set("memberPrice",Number(e.target.value))}/></FormGroup>
                    <FormGroup label="Non-Member Price (GHS)"><Input type="number" min={0} step={0.01} value={form.nonMemberPrice} onChange={e=>set("nonMemberPrice",Number(e.target.value))}/></FormGroup>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-sm" style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)"}}>
                    <div><p className="text-sm font-medium text-white">Member Discount</p><p className="text-xs text-white/40">Extra discount for members</p></div>
                    <Switch checked={!!form.memberDiscount} onChange={()=>set("memberDiscount",!form.memberDiscount)}/>
                  </div>
                  {form.memberDiscount && (
                    <FormGroup label={`Discount Percentage: ${form.memberDiscountPct}%`}>
                      <input type="range" min={0} max={100} value={form.memberDiscountPct} onChange={e=>set("memberDiscountPct",Number(e.target.value))} className="w-full"/>
                    </FormGroup>
                  )}
                </>
              )}
            </div>
          )}

          <div className="flex gap-2 justify-end pt-2 border-t" style={{borderColor:"rgba(255,255,255,0.06)"}}>
            <Button variant="ghost" size="sm" onClick={()=>setModal(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving?<><i className="fa-solid fa-spinner fa-spin mr-1.5"/>Saving…</>:<><i className="fa-solid fa-check mr-1.5"/>{editEvent?"Update Event":"Create Event"}</>}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
