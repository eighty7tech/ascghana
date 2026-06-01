"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Modal, FormGroup, Input, EmptyState, StatCard } from "@/components/ui";
import toast from "react-hot-toast";

export default function EventAttendancePage() {
  const { events, members } = useApp();
  const [attendance, setAttendance] = useState<any[]>([]);
  const [counts, setCounts] = useState<Record<number, number>>({});
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [eventAttendance, setEventAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [checkInModal, setCheckInModal] = useState(false);
  const [search, setSearch] = useState("");
  const [processing, setProcessing] = useState(false);

  const loadCounts = async () => {
    try {
      const res = await fetch("/api/attendance");
      const d = await res.json();
      const countMap: Record<number, number> = {};
      (d.counts || []).forEach((c: any) => { countMap[c.event_id] = c.count; });
      setCounts(countMap);
    } catch { /* table may not exist yet */ }
  };

  useEffect(() => { loadCounts(); }, []);

  const loadEventAttendance = async (event: any) => {
    setSelectedEvent(event);
    setLoading(true);
    try {
      const res = await fetch(`/api/attendance?eventId=${event.id}`);
      const d = await res.json();
      setEventAttendance(d.attendance || []);
    } catch { setEventAttendance([]); }
    finally { setLoading(false); }
  };

  const filteredMembers = members.filter((m: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (m.name || `${m.firstName} ${m.lastName}`).toLowerCase().includes(q) ||
      (m.membershipNumber || "").toLowerCase().includes(q) ||
      (m.email || "").toLowerCase().includes(q);
  });

  const handleCheckIn = async (member: any) => {
    if (!selectedEvent) return;
    setProcessing(true);
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: selectedEvent.id,
          memberId: member.id,
          memberName: member.name || `${member.firstName} ${member.lastName}`,
          membershipNumber: member.membershipNumber,
          tier: member.tier,
          checkedInBy: "admin",
        }),
      });
      const d = await res.json();
      if (d.alreadyCheckedIn) { toast.error("Member already checked in"); return; }
      if (!res.ok) throw new Error(d.error || "Check-in failed");
      toast.success(`${member.name || `${member.firstName} ${member.lastName}`} checked in!`);
      await loadEventAttendance(selectedEvent);
      loadCounts();
      setSearch("");
    } catch (e: any) { toast.error(e.message); }
    finally { setProcessing(false); }
  };

  const handleRemove = async (memberId: number) => {
    if (!selectedEvent || !confirm("Remove this check-in?")) return;
    await fetch("/api/attendance", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId: selectedEvent.id, memberId }),
    });
    toast.success("Check-in removed");
    await loadEventAttendance(selectedEvent);
    loadCounts();
  };

  const alreadyCheckedIn = (memberId: number) =>
    eventAttendance.some((a: any) => String(a.member_id) === String(memberId));

  const published = events.filter((e: any) => e.status === "Published");

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white" style={{ fontFamily: "var(--font-display)" }}>EVENT ATTENDANCE</h1>
          <p className="text-xs mt-0.5 text-white/40">Track member check-ins per event — click an event to manage attendance</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Published Events" value={published.length} icon="fa-solid fa-calendar-check" color="#10B981" />
        <StatCard label="Total Check-Ins" value={Object.values(counts).reduce((a, b) => a + b, 0)} icon="fa-solid fa-user-check" color="#C6A84B" />
        <StatCard label="Total Members" value={members.length} icon="fa-solid fa-users" color="#3B82F6" />
      </div>

      <div className="grid lg:grid-cols-5 gap-5">
        {/* Events List */}
        <div className="lg:col-span-2 space-y-2">
          <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3" style={{ fontFamily: "var(--font-heading)" }}>Select Event</p>
          {published.length === 0 ? (
            <div className="text-center py-8 text-white/30 text-sm">No published events</div>
          ) : (
            published.map((event: any) => (
              <button key={event.id} onClick={() => loadEventAttendance(event)}
                className="w-full text-left p-4 rounded-sm transition-all"
                style={{
                  background: selectedEvent?.id === event.id ? "rgba(239,1,7,0.1)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${selectedEvent?.id === event.id ? "rgba(239,1,7,0.4)" : "rgba(255,255,255,0.06)"}`,
                }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate" style={{ fontFamily: "var(--font-heading)" }}>{event.title}</p>
                    <p className="text-xs text-white/40 mt-0.5">{event.date} · {event.location}</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-lg font-black" style={{ color: "var(--color-gold)", fontFamily: "var(--font-display)" }}>
                      {counts[event.id] || 0}
                    </p>
                    <p className="text-[9px] text-white/30">checked in</p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Attendance Panel */}
        <div className="lg:col-span-3">
          {!selectedEvent ? (
            <div className="flex items-center justify-center h-64 rounded-sm" style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.08)" }}>
              <div className="text-center">
                <i className="fa-solid fa-calendar-days text-4xl mb-3 block text-white/10" />
                <p className="text-sm text-white/30">Select an event to manage attendance</p>
              </div>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle><i className="fa-solid fa-user-check mr-2" style={{ color: "var(--color-red)" }} />{selectedEvent.title}</CardTitle>
                    <p className="text-xs text-white/40 mt-0.5">{selectedEvent.date} · {eventAttendance.length} checked in</p>
                  </div>
                  <Button size="sm" onClick={() => setCheckInModal(true)}>
                    <i className="fa-solid fa-plus mr-1.5" />Check In Member
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="py-10 text-center"><i className="fa-solid fa-spinner fa-spin text-xl" style={{ color: "var(--color-red)" }} /></div>
                ) : eventAttendance.length === 0 ? (
                  <EmptyState icon="fa-solid fa-user-clock" title="No check-ins yet" desc="Click 'Check In Member' to record attendance." />
                ) : (
                  <div className="divide-y divide-white/[0.04]">
                    {eventAttendance.map((a: any) => (
                      <div key={a.id} className="flex items-center gap-3 px-4 py-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                          style={{ background: "rgba(198,168,75,0.15)", color: "#C6A84B" }}>
                          {a.member_name?.[0] || "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{a.member_name}</p>
                          <p className="text-xs text-white/40">#{a.membership_number} · {a.tier}</p>
                        </div>
                        <p className="text-xs text-white/30 flex-shrink-0">{new Date(a.checked_in_at).toLocaleTimeString()}</p>
                        <button onClick={() => handleRemove(a.member_id)}
                          className="p-1.5 rounded hover:bg-white/5 text-white/20 hover:text-red-400 transition-colors flex-shrink-0">
                          <i className="fa-solid fa-times text-xs" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Check-In Modal */}
      <Modal open={checkInModal} onClose={() => { setCheckInModal(false); setSearch(""); }} title={`Check In — ${selectedEvent?.title}`}>
        <div className="space-y-3">
          <FormGroup label="Search Member">
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Name, membership number, or email…" autoFocus />
          </FormGroup>
          <div className="max-h-72 overflow-y-auto space-y-1">
            {filteredMembers.slice(0, 20).map((m: any) => {
              const name = m.name || `${m.firstName} ${m.lastName}`;
              const checkedIn = alreadyCheckedIn(m.id);
              return (
                <button key={m.id} onClick={() => !checkedIn && handleCheckIn(m)} disabled={checkedIn || processing}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-sm transition-all text-left"
                  style={{
                    background: checkedIn ? "rgba(16,185,129,0.08)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${checkedIn ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.06)"}`,
                    opacity: checkedIn ? 0.7 : 1,
                    cursor: checkedIn ? "default" : "pointer",
                  }}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                    style={{ background: "rgba(198,168,75,0.15)", color: "#C6A84B" }}>
                    {name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">{name}</p>
                    <p className="text-xs text-white/40">#{m.membershipNumber} · {m.tier}</p>
                  </div>
                  {checkedIn && <i className="fa-solid fa-check text-xs flex-shrink-0" style={{ color: "#10B981" }} />}
                  {!checkedIn && !processing && <i className="fa-solid fa-user-plus text-xs flex-shrink-0 text-white/20" />}
                </button>
              );
            })}
            {filteredMembers.length === 0 && search && (
              <p className="text-center text-sm text-white/30 py-4">No members match &ldquo;{search}&rdquo;</p>
            )}
            {!search && (
              <p className="text-center text-xs text-white/20 py-2">Type to search {members.length} members</p>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
