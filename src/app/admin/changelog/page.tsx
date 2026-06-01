"use client";
import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Card, CardHeader, CardTitle, CardContent, Button, FormGroup, Input, Select, Switch, RichTextField } from "@/components/ui";
import toast from "react-hot-toast";

type EntryType = "feature" | "fix" | "improvement" | "security" | "breaking";

interface ChangelogEntry {
  id: string;
  version: string;
  title: string;
  description: string;
  type: EntryType;
  date: string;
  isPublic: boolean;
}

const TYPE_CONFIG: Record<EntryType, { label: string; color: string; icon: string }> = {
  feature:     { label: "New Feature",  color: "#10B981", icon: "fa-plus-circle" },
  fix:         { label: "Bug Fix",      color: "#3B82F6", icon: "fa-bug" },
  improvement: { label: "Improvement",  color: "#8B5CF6", icon: "fa-arrow-up" },
  security:    { label: "Security",     color: "#EF4444", icon: "fa-shield-halved" },
  breaking:    { label: "Breaking",     color: "#F97316", icon: "fa-triangle-exclamation" },
};

const CURRENT_VERSION = "1.1.0";

const DEFAULT_ENTRIES: ChangelogEntry[] = [
  {
    id: "cl-003",
    version: "1.4.0",
    title: "New Features Release — Community, Predictions & Rewards",
    description: `<ul>
      <li><strong>Fan Wall</strong> — Community posts with likes, comments, pinning, photo/matchday/celebration post types. Members earn points for posting.</li>
      <li><strong>Score Predictor</strong> — Members predict Arsenal match scores for upcoming fixtures. Exact score = 5 pts, correct result = 2 pts. Live leaderboard.</li>
      <li><strong>Loyalty Rewards</strong> — Points system across all platform actions (posting, attending, predicting). Rewards catalogue with redemption workflow.</li>
      <li><strong>Fan of the Month</strong> — Members nominate fellow Gooners monthly. Admin crowns the winner (50 pts). Full history of past winners.</li>
      <li><strong>Watch Party RSVPs</strong> — Members RSVP to watch parties directly from fixtures. Admin check-in with attendance points (+10 pts).</li>
      <li><strong>Season Stats</strong> — Admin-managed Arsenal season performance data per competition. Goals, win%, top scorer, assists, clean sheets.</li>
      <li><strong>Club Documents</strong> — Upload constitution, forms, policies and resources. Public or members-only. Download tracking.</li>
      <li><strong>Font Fix</strong> — Added @font-face declarations for Northbank and Chapman. Added preload links in layout.tsx for instant font rendering.</li>
      <li><strong>shadcn/ui Components</strong> — Full Radix UI component library with Select, Switch, Checkbox, Tabs, Accordion, Tooltip, DropdownMenu, ScrollArea, AlertDialog, Avatar, Progress.</li>
      <li><strong>Admin Nav</strong> — Reorganised with Community, Shop & Rewards, and Content sections. All new feature pages linked.</li>
      <li><strong>Light Theme Default</strong> — Site now defaults to light theme (Arsenal.com editorial style). Dark theme still available via toggle.</li>
      <li><strong>CSS Isolation</strong> — Admin panel now uses admin-scope class to fully isolate dark theme from frontend light theme, fixing all text visibility issues.</li>
      <li><strong>Database</strong> — 10 new tables: match_predictions, prediction_leaderboard, fan_wall_posts, fan_wall_likes, fan_wall_comments, watch_party_rsvps, member_points, member_points_balance, rewards_catalogue, reward_redemptions, fan_of_month_nominations, club_documents, season_stats.</li>
    </ul>`,
    type: "feature" as const,
    date: new Date().toISOString().split("T")[0],
    isPublic: true,
  },
  {
    id: "cl-001",
    version: "1.1.0",
    title: "Major Enhancement Release",
    description: `<ul><li>Gallery images now open in fullscreen lightbox when clicked</li><li>Rich text editor added to all body text areas (events, blog, announcements)</li><li>Dedicated Matches &amp; Fixtures admin page — all match settings consolidated in one place</li><li>Match countdown now shows custom event title instead of "Arsenal vs Event"</li><li>Upcoming fixtures logos fixed — supports both camelCase and snake_case field names</li><li>Cart &amp; Checkout pages with Paystack, MoMo, bank transfer and cash payment options</li><li>Orders management page in admin</li><li>Email / SMTP settings page with provider presets (Gmail, SendGrid, Mailgun etc.)</li><li>Image Upload settings — allowed types, max size, dimensions, WebP conversion</li><li>Page Header settings — customise each page's hero banner independently</li><li>Maintenance Mode page with countdown, background image, contact &amp; social visibility</li><li>Security settings — login attempts, lockout, session duration, IP whitelist</li><li>Admin Users management — create, edit, delete, change passwords with role-based access</li><li>Cart count badge in Navbar; cart persisted across sessions via localStorage</li><li>Admin nav reorganised — new sections: Matches &amp; Fixtures, Orders, Email, Uploads, Page Headers</li><li>Version bumped to 1.1.0</li></ul>`,
    type: "feature",
    date: new Date().toISOString().split("T")[0],
    isPublic: true,
  },
  {
    id: "cl-000",
    version: "1.0.0",
    title: "Initial Release",
    description: "<p>First stable release of Arsenal Supporters Club Ghana website.</p>",
    type: "feature",
    date: "2026-05-01",
    isPublic: true,
  },
];

export default function ChangelogAdminPage() {
  const { settings, updateSettings } = useApp();
  const s = settings as any;

  const [entries, setEntries] = useState<ChangelogEntry[]>(
    s.changelogEntries?.length ? s.changelogEntries : DEFAULT_ENTRIES
  );
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ChangelogEntry>({
    id: "", version: CURRENT_VERSION, title: "", description: "",
    type: "feature", date: new Date().toISOString().split("T")[0], isPublic: true,
  });

  const openAdd = () => {
    setForm({ id: "", version: CURRENT_VERSION, title: "", description: "", type: "feature", date: new Date().toISOString().split("T")[0], isPublic: true });
    setIsEditing(false);
    setShowForm(true);
  };

  const openEdit = (e: ChangelogEntry) => {
    setForm({ ...e });
    setIsEditing(true);
    setShowForm(true);
  };

  const saveEntry = async () => {
    if (!form.title.trim() || !form.version.trim()) {
      toast.error("Version and title are required");
      return;
    }
    setSaving(true);
    const entry = { ...form, id: form.id || `cl-${Date.now()}` };
    const updated = isEditing
      ? entries.map(e => e.id === entry.id ? entry : e)
      : [entry, ...entries];
    setEntries(updated);
    await updateSettings({ changelogEntries: updated } as any);
    setSaving(false);
    setShowForm(false);
    toast.success(isEditing ? "Entry updated" : "Entry added");
  };

  const deleteEntry = async (id: string) => {
    if (!confirm("Delete this changelog entry?")) return;
    const updated = entries.filter(e => e.id !== id);
    setEntries(updated);
    await updateSettings({ changelogEntries: updated } as any);
    toast.success("Entry deleted");
  };

  // Group by version
  const grouped: Record<string, ChangelogEntry[]> = {};
  entries.forEach(e => {
    if (!grouped[e.version]) grouped[e.version] = [];
    grouped[e.version].push(e);
  });

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <span className="section-red-line" />
          <h1 className="text-3xl font-black" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
            CHANGELOG
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Track features, fixes and improvements across versions · Current:{" "}
            <span className="font-bold" style={{ color: "var(--color-red)" }}>v{CURRENT_VERSION}</span>
          </p>
        </div>
        <Button onClick={openAdd} className="btn-arsenal">
          <i className="fa-solid fa-plus mr-2" />Add Entry
        </Button>
      </div>

      {/* Add / Edit form */}
      {showForm && (
        <Card className="border-red-500/20">
          <CardHeader>
            <CardTitle>{isEditing ? "Edit Entry" : "New Changelog Entry"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <FormGroup label="Version *">
                <Input value={form.version} onChange={e => setForm(p => ({ ...p, version: e.target.value }))} placeholder="1.1.0" />
              </FormGroup>
              <FormGroup label="Type *">
                <Select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as EntryType }))}>
                  {(Object.keys(TYPE_CONFIG) as EntryType[]).map(t => (
                    <option key={t} value={t}>{TYPE_CONFIG[t].label}</option>
                  ))}
                </Select>
              </FormGroup>
              <FormGroup label="Date *">
                <Input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
              </FormGroup>
            </div>
            <FormGroup label="Title *">
              <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="What changed in this version?" />
            </FormGroup>
            <FormGroup label="Description">
              <RichTextField value={form.description} onChange={v => setForm(p => ({ ...p, description: v }))} placeholder="Describe the changes…" minHeight={200} />
            </FormGroup>
            <FormGroup label="Show publicly on changelog page">
              <Switch checked={form.isPublic} onChange={v => setForm(p => ({ ...p, isPublic: v }))} />
            </FormGroup>
            <div className="flex gap-3 pt-2">
              <Button onClick={saveEntry} disabled={saving} className="btn-arsenal flex-1">
                {saving ? "Saving…" : isEditing ? "Update Entry" : "Add Entry"}
              </Button>
              <Button onClick={() => setShowForm(false)} className="flex-1" style={{ background: "rgba(255,255,255,0.06)" }}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Version groups */}
      {Object.entries(grouped)
        .sort(([a], [b]) => b.localeCompare(a, undefined, { numeric: true }))
        .map(([version, vEntries]) => (
          <div key={version}>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-sm font-black px-3 py-1 rounded-sm"
                style={{ background: "rgba(239,1,7,0.1)", color: "var(--color-red)", fontFamily: "var(--font-heading)", border: "1px solid rgba(239,1,7,0.2)" }}>
                v{version}
              </span>
              <div className="h-px flex-1" style={{ background: "var(--border-color)" }} />
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                {vEntries[0].date}
              </span>
            </div>
            <div className="space-y-3">
              {vEntries.map(entry => {
                const cfg = TYPE_CONFIG[entry.type];
                return (
                  <Card key={entry.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="w-8 h-8 rounded-sm flex items-center justify-center flex-shrink-0 mt-0.5"
                            style={{ background: `${cfg.color}15` }}>
                            <i className={`fa-solid ${cfg.icon} text-xs`} style={{ color: cfg.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <p className="font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}>
                                {entry.title}
                              </p>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase"
                                style={{ background: `${cfg.color}18`, color: cfg.color, fontFamily: "var(--font-heading)" }}>
                                {cfg.label}
                              </span>
                              {!entry.isPublic && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase"
                                  style={{ background: "rgba(255,255,255,0.06)", color: "var(--text-muted)", fontFamily: "var(--font-heading)" }}>
                                  Private
                                </span>
                              )}
                            </div>
                            {entry.description && (
                              <div className="text-sm prose-sm" style={{ color: "var(--text-secondary)" }}
                                dangerouslySetInnerHTML={{ __html: entry.description }} />
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button onClick={() => openEdit(entry)}
                            className="text-xs px-2 py-1 rounded-sm transition-colors hover:bg-white/10"
                            style={{ color: "var(--color-gold)" }}>
                            <i className="fa-solid fa-edit" />
                          </button>
                          <button onClick={() => deleteEntry(entry.id)}
                            className="text-xs px-2 py-1 rounded-sm transition-colors hover:bg-white/10"
                            style={{ color: "var(--color-red)" }}>
                            <i className="fa-solid fa-trash" />
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
    </div>
  );
}
