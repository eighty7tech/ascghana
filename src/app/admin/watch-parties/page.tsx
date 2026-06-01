"use client";
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, Button, EmptyState, Badge, PageHeader, Input } from "@/components/ui";
import { useApp } from "@/context/AppContext";
import toast from "react-hot-toast";

export default function AdminWatchPartiesPage() {
  const { settings } = useApp();
  const s = settings as any;
  // Get events that have watch party venue
  const events: any[] = (s.arsenalFixtures || []).filter((f: any) => f.watchPartyVenue);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [rsvps, setRsvps]   = useState<any[]>([]);
  const [stats, setStats]   = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [checkinId, setCheckinId] = useState<number|null>(null);

  const loadRsvps = async (ev: any) => {
    setSelectedEvent(ev);
    setLoading(true);
    try {
      const res = await fetch(`/api/watch-party?eventId=${ev.id || ev.date}`);
      const d   = await res.json();
      if (d.success) { setRsvps(d.rsvps); setStats({ total:d.totalAttendees, checkedIn:d.checkedIn }); }
    } finally { setLoading(false); }
  };

  const checkin = async (rsvp: any) => {
    setCheckinId(rsvp.id);
    try {
      const res = await fetch("/api/watch-party", {
        method:"PATCH", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ action:"checkin", rsvpId:rsvp.id, memberId:rsvp.member_id, eventId:selectedEvent?.id||selectedEvent?.date }),
      });
      const d = await res.json();
      if (d.success) { toast.success(`${rsvp.member_name} checked in! +10 pts`); if (selectedEvent) loadRsvps(selectedEvent); }
      else toast.error(d.error || "Failed");
    } finally { setCheckinId(null); }
  };

  const filtered = rsvps.filter(r =>
    !search || r.member_name?.toLowerCase().includes(search.toLowerCase()) || r.member_number?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <PageHeader title="Watch Parties" subtitle="Manage RSVP lists and check-in members"/>

      {events.length === 0 ? (
        <EmptyState icon="fa-tv" title="No watch parties scheduled" desc="Add watch party venues to fixtures in the Matches settings to enable RSVPs"/>
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          {events.map((ev: any) => (
            <button key={ev.id || ev.date} onClick={() => loadRsvps(ev)}
              className="p-4 rounded-xl border text-left transition-all"
              style={{
                background: selectedEvent?.date===ev.date ? "rgba(239,1,7,0.06)" : "var(--bg-card)",
                borderColor: selectedEvent?.date===ev.date ? "var(--color-red)" : "var(--border-color)",
                boxShadow: "var(--shadow-sm)",
              }}>
              <p className="font-bold text-sm" style={{ color:"var(--text-primary)", fontFamily:"var(--font-heading)" }}>
                {ev.homeTeam||"Arsenal"} vs {ev.awayTeam}
              </p>
              <p className="text-xs mt-0.5" style={{ color:"var(--text-muted)" }}>{ev.date} · {ev.watchPartyVenue}</p>
              <p className="text-xs mt-1" style={{ color:"var(--color-red)", fontFamily:"var(--font-heading)" }}>
                <i className="fa-solid fa-clock mr-1"/>{ev.watchPartyTime || ev.time}
              </p>
            </button>
          ))}
        </div>
      )}

      {selectedEvent && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <CardTitle>{selectedEvent.homeTeam||"Arsenal"} vs {selectedEvent.awayTeam} — RSVP List</CardTitle>
                <div className="flex gap-4 mt-1 text-xs" style={{ color:"var(--text-muted)" }}>
                  <span><i className="fa-solid fa-users mr-1"/>{stats.total || 0} total (inc. guests)</span>
                  <span><i className="fa-solid fa-circle-check mr-1" style={{ color:"#10B981" }}/>{stats.checkedIn || 0} checked in</span>
                </div>
              </div>
              <Input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search member…" className="w-48"/>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="py-12 text-center" style={{ color:"var(--text-muted)" }}><i className="fa-solid fa-spinner fa-spin text-2xl"/></div>
            ) : filtered.length === 0 ? (
              <EmptyState icon="fa-calendar-check" title={search ? "No matches" : "No RSVPs yet"}/>
            ) : (
              <table className="w-full">
                <thead>
                  <tr style={{ background:"var(--bg-secondary)", borderBottom:`1px solid var(--border-color)` }}>
                    {["Member","Number","Guests","Status","Notes","Action"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color:"var(--text-muted)", fontFamily:"var(--font-heading)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => (
                    <tr key={r.id} className="transition-colors hover:bg-[var(--bg-card-hover)]" style={{ borderBottom:`1px solid var(--border-color)` }}>
                      <td className="px-4 py-3 font-semibold text-sm" style={{ color:"var(--text-primary)" }}>{r.member_name}</td>
                      <td className="px-4 py-3 text-sm font-mono" style={{ color:"var(--text-muted)" }}>{r.member_number}</td>
                      <td className="px-4 py-3 text-sm" style={{ color:"var(--text-secondary)" }}>+{r.guests}</td>
                      <td className="px-4 py-3">
                        {r.checked_in ? <Badge variant="success">Checked In</Badge> : <Badge variant="warning">RSVP'd</Badge>}
                      </td>
                      <td className="px-4 py-3 text-xs max-w-[150px] truncate" style={{ color:"var(--text-muted)" }}>{r.notes || "—"}</td>
                      <td className="px-4 py-3">
                        {!r.checked_in && (
                          <Button size="sm" onClick={() => checkin(r)} disabled={checkinId===r.id} className="btn-arsenal">
                            {checkinId===r.id ? <i className="fa-solid fa-spinner fa-spin"/> : "Check In"}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
