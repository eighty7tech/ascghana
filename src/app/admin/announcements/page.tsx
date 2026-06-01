"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Modal, FormGroup, Input, Select, Switch, EmptyState, RichTextField } from "@/components/ui";
import { useApp } from "@/context/AppContext";
import toast from "react-hot-toast";

const TYPE_COLORS: Record<string, string> = { info: "#3B82F6", success: "#10B981", warning: "#F59E0B", danger: "#EF4444", event: "#C6A84B", ticket: "#8B5CF6" };
const TYPE_ICONS: Record<string, string> = { info: "fa-solid fa-circle-info", success: "fa-solid fa-circle-check", warning: "fa-solid fa-triangle-exclamation", danger: "fa-solid fa-circle-xmark", event: "fa-solid fa-calendar-star", ticket: "fa-solid fa-ticket" };

const EMPTY: any = { title: "", body: "", type: "info", target: "all", isPinned: false, showOnDashboard: true, isActive: true, linkUrl: "", linkLabel: "", expiresAt: "" };

export default function AnnouncementsAdminPage() {
  const { addAdminNotification } = useApp();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("all");

  const load = () => {
    setLoading(true);
    fetch("/api/announcements")
      .then(r => r.json())
      .then(d => setAnnouncements(d.announcements || []))
      .catch(() => setAnnouncements([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(EMPTY); setEditItem(null); setModal(true); };
  const openEdit = (a: any) => {
    setForm({ title: a.title, body: a.body, type: a.type, target: a.target, isPinned: !!a.is_pinned, showOnDashboard: !!a.show_on_dashboard, isActive: !!a.is_active, linkUrl: a.link_url || "", linkLabel: a.link_label || "", expiresAt: a.expires_at ? a.expires_at.split("T")[0] : "" });
    setEditItem(a);
    setModal(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.body) { toast.error("Title and body are required"); return; }
    setSaving(true);
    try {
      const payload = { ...form, createdBy: "admin" };
      if (editItem) {
        await fetch("/api/announcements", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editItem.id, ...payload }) });
        toast.success("Announcement updated");
      } else {
        await fetch("/api/announcements", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        addAdminNotification("Announcement Posted", form.title, "info");
        toast.success("Announcement posted");
      }
      setModal(false);
      load();
    } catch { toast.error("Save failed"); }
    finally { setSaving(false); }
  };

  const handleToggle = async (a: any) => {
    await fetch("/api/announcements", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: a.id, isActive: !a.is_active }) });
    load();
    toast.success(a.is_active ? "Announcement deactivated" : "Announcement activated");
  };

  const handleDelete = async (a: any) => {
    if (!confirm(`Delete "${a.title}"?`)) return;
    await fetch("/api/announcements", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: a.id }) });
    toast.success("Deleted");
    load();
  };

  const visible = filter === "all" ? announcements : announcements.filter(a => a.type === filter);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white" style={{ fontFamily: "var(--font-display)" }}>ANNOUNCEMENTS</h1>
          <p className="text-xs mt-0.5 text-white/40">{announcements.filter(a => a.is_active).length} active announcements</p>
        </div>
        <Button onClick={openAdd}><i className="fa-solid fa-plus mr-1.5" />New Announcement</Button>
      </motion.div>

      {/* Filter Bar */}
      <div className="flex gap-2 flex-wrap">
        {["all", "info", "success", "warning", "danger", "event", "ticket"].map(t => (
          <button key={t} onClick={() => setFilter(t)}
            className="px-3 py-1.5 rounded-sm text-xs font-bold uppercase tracking-wider transition-all"
            style={{
              fontFamily: "var(--font-heading)",
              background: filter === t ? (t === "all" ? "rgba(239,1,7,0.15)" : `${TYPE_COLORS[t]}20`) : "rgba(255,255,255,0.04)",
              color: filter === t ? (t === "all" ? "var(--color-red)" : TYPE_COLORS[t]) : "rgba(255,255,255,0.4)",
              border: `1px solid ${filter === t ? (t === "all" ? "rgba(239,1,7,0.3)" : `${TYPE_COLORS[t]}40`) : "rgba(255,255,255,0.08)"}`,
            }}>
            {t !== "all" && <i className={`${TYPE_ICONS[t]} mr-1 text-[9px]`} />}{t}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total", value: announcements.length, color: "#C6A84B" },
          { label: "Active", value: announcements.filter(a => a.is_active).length, color: "#10B981" },
          { label: "Pinned", value: announcements.filter(a => a.is_pinned).length, color: "#EF0107" },
          { label: "Expired", value: announcements.filter(a => a.expires_at && new Date(a.expires_at) < new Date()).length, color: "#6B7280" },
        ].map(s => (
          <div key={s.label} className="p-3 rounded-sm" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-2xl font-black" style={{ color: s.color, fontFamily: "var(--font-display)" }}>{s.value}</p>
            <p className="text-xs text-white/40" style={{ fontFamily: "var(--font-heading)" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Announcements List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center"><i className="fa-solid fa-spinner fa-spin text-2xl" style={{ color: "var(--color-red)" }} /></div>
          ) : visible.length === 0 ? (
            <EmptyState icon="fa-solid fa-bullhorn" title="No announcements" desc="Create an announcement to inform members and admins." />
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {visible.map(a => {
                const tc = TYPE_COLORS[a.type] || "#3B82F6";
                const isExpired = a.expires_at && new Date(a.expires_at) < new Date();
                return (
                  <motion.div key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex items-start gap-4 p-4 hover:bg-white/[0.02] transition-colors">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: `${tc}18` }}>
                      <i className={`${TYPE_ICONS[a.type] || "fa-solid fa-bullhorn"} text-sm`} style={{ color: tc }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 mb-1">
                        {a.is_pinned ? <i className="fa-solid fa-thumbtack text-xs mt-0.5 flex-shrink-0" style={{ color: "#C6A84B" }} /> : null}
                        <p className="text-sm font-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>{a.title}</p>
                      </div>
                      <p className="text-xs text-white/50 line-clamp-2">{a.body}</p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Badge variant="default" style={{ color: tc, background: `${tc}15`, fontSize: "10px" }}>{a.type}</Badge>
                        <Badge variant="default" style={{ color: "rgba(255,255,255,0.5)", fontSize: "10px" }}>→ {a.target}</Badge>
                        {!a.is_active && <Badge variant="warning" style={{ fontSize: "10px" }}>Inactive</Badge>}
                        {isExpired && <Badge variant="danger" style={{ fontSize: "10px" }}>Expired</Badge>}
                        {a.expires_at && !isExpired && <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>Expires {new Date(a.expires_at).toLocaleDateString()}</span>}
                        <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{new Date(a.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => handleToggle(a)} className="p-1.5 rounded transition-colors hover:bg-white/5" title={a.is_active ? "Deactivate" : "Activate"}
                        style={{ color: a.is_active ? "#10B981" : "rgba(255,255,255,0.3)" }}>
                        <i className={`fa-solid ${a.is_active ? "fa-eye" : "fa-eye-slash"} text-xs`} />
                      </button>
                      <button onClick={() => openEdit(a)} className="p-1.5 rounded transition-colors hover:bg-white/5 text-white/40 hover:text-white">
                        <i className="fa-solid fa-pen text-xs" />
                      </button>
                      <button onClick={() => handleDelete(a)} className="p-1.5 rounded transition-colors hover:bg-white/5 text-white/40 hover:text-red-400">
                        <i className="fa-solid fa-trash text-xs" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editItem ? "Edit Announcement" : "New Announcement"}>
        <div className="space-y-4">
          <FormGroup label="Title *">
            <Input value={form.title} onChange={e => setForm((p: any) => ({ ...p, title: e.target.value }))} placeholder="Announcement title" />
          </FormGroup>
          <FormGroup label="Body *" hint="Rich text — bold, lists, and links supported.">
            <RichTextField value={form.body} onChange={(v) => setForm((p: any) => ({ ...p, body: v }))} placeholder="Announcement content…" minHeight={180} />
          </FormGroup>
          <div className="grid grid-cols-2 gap-3">
            <FormGroup label="Type">
              <Select value={form.type} onChange={e => setForm((p: any) => ({ ...p, type: e.target.value }))}>
                <option value="info">Info</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="danger">Danger</option>
                <option value="event">Event</option>
                <option value="ticket">Ticket</option>
              </Select>
            </FormGroup>
            <FormGroup label="Target Audience">
              <Select value={form.target} onChange={e => setForm((p: any) => ({ ...p, target: e.target.value }))}>
                <option value="all">All</option>
                <option value="members">Members Only</option>
                <option value="admin">Admin Only</option>
                <option value="gold">Gold Members</option>
                <option value="platinum">Platinum Members</option>
              </Select>
            </FormGroup>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormGroup label="Link URL (optional)">
              <Input value={form.linkUrl} onChange={e => setForm((p: any) => ({ ...p, linkUrl: e.target.value }))} placeholder="https://..." />
            </FormGroup>
            <FormGroup label="Link Label">
              <Input value={form.linkLabel} onChange={e => setForm((p: any) => ({ ...p, linkLabel: e.target.value }))} placeholder="Learn more" />
            </FormGroup>
          </div>
          <FormGroup label="Expires At (optional)">
            <Input type="date" value={form.expiresAt} onChange={e => setForm((p: any) => ({ ...p, expiresAt: e.target.value }))} />
          </FormGroup>
          <div className="flex gap-4 pt-1">
            <div className="flex items-center gap-2">
              <Switch checked={form.isPinned} onChange={() => setForm((p: any) => ({ ...p, isPinned: !p.isPinned }))} />
              <span className="text-xs text-white/60">Pin to top</span>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.showOnDashboard} onChange={() => setForm((p: any) => ({ ...p, showOnDashboard: !p.showOnDashboard }))} />
              <span className="text-xs text-white/60">Show on dashboard</span>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.isActive} onChange={() => setForm((p: any) => ({ ...p, isActive: !p.isActive }))} />
              <span className="text-xs text-white/60">Active</span>
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="ghost" size="sm" onClick={() => setModal(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : editItem ? "Update" : "Post Announcement"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
