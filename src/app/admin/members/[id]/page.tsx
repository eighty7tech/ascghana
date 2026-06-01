"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, Avatar, FormGroup, Input, Select, Modal } from "@/components/ui";
import toast from "react-hot-toast";

const TIER_COLORS: Record<string, string> = { Platinum: "#E8E8E8", Gold: "#C6A84B", Silver: "#A8A9AD", Bronze: "#CD7F32", Abusua: "#2ECC71" };
const STATUS_OPTS = ["Active", "Inactive", "Frozen", "Expired", "Pending Renewal"];
const TIER_OPTS = ["Bronze", "Silver", "Gold", "Platinum", "Abusua"];
const ROLE_OPTS = ["member", "admin", "superadmin", "editor", "moderator", "membership_officer", "event_coordinator", "ticket_manager", "events_moderator"];

export default function AdminMemberDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { members, setMembers, tickets, addAdminNotification } = useApp();
  const [member, setMember] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showPwModal, setShowPwModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [tab, setTab] = useState<"overview" | "tickets" | "activity" | "security">("overview");
  const [deletionRequests, setDeletionRequests] = useState<any[]>([]);

  useEffect(() => {
    const id = params?.id;
    if (!id) return;
    const found = members.find((m: any) => String(m.id) === String(id));
    if (found) { setMember(found); setForm({ ...found }); }
    else { router.push("/admin/members"); }
  }, [params?.id, members]);

  useEffect(() => {
    fetch("/api/member-deletion-requests")
      .then(r => r.json())
      .then(d => setDeletionRequests(d.requests || []))
      .catch(() => {});
  }, []);

  if (!member) return (
    <div className="flex items-center justify-center h-48">
      <div className="text-center">
        <i className="fa-solid fa-spinner fa-spin text-2xl mb-3 block" style={{ color: "var(--color-red)" }} />
        <p className="text-white/50 text-sm">Loading member profile…</p>
      </div>
    </div>
  );

  const memberTickets = tickets.filter((t: any) =>
    String(t.memberId) === String(member.id) || t.membershipNumber === member.membershipNumber
  );
  const deletionReq = deletionRequests.find((r: any) => String(r.member_id) === String(member.id));

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/members/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setMembers(members.map((m: any) => String(m.id) === String(member.id) ? { ...m, ...form } : m));
      setMember({ ...member, ...form });
      setEditMode(false);
      addAdminNotification("Member Updated", `${member.name}'s profile has been updated.`, "success");
      toast.success("Member updated successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!newPassword || newPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/members/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });
      if (!res.ok) throw new Error("Failed to reset password");
      setMembers(members.map((m: any) => String(m.id) === String(member.id) ? { ...m, password: newPassword } : m));
      toast.success("Password reset successfully");
      setNewPassword("");
      setShowPwModal(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/members/${member.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setMembers(members.filter((m: any) => String(m.id) !== String(member.id)));
      addAdminNotification("Member Deleted", `${member.name} has been removed.`, "warning");
      toast.success("Member deleted");
      router.push("/admin/members");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const processDeletionRequest = async (status: "Approved" | "Declined") => {
    if (!deletionReq) return;
    await fetch("/api/member-deletion-requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: deletionReq.id, status, adminUsername: "admin" }),
    });
    if (status === "Approved") await handleDelete();
    else { toast.success("Deletion request declined"); setDeletionRequests(prev => prev.map(r => r.id === deletionReq.id ? { ...r, status } : r)); }
  };

  const tc = TIER_COLORS[member.tier] || "#C6A84B";

  const TABS = [
    { id: "overview", label: "Overview", icon: "fa-solid fa-user" },
    { id: "tickets", label: `Tickets (${memberTickets.length})`, icon: "fa-solid fa-ticket" },
    { id: "security", label: "Security", icon: "fa-solid fa-shield-halved" },
    { id: "activity", label: "Activity", icon: "fa-solid fa-clock-rotate-left" },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4">
        <Link href="/admin/members">
          <Button variant="ghost" size="sm"><i className="fa-solid fa-arrow-left mr-1" /> Members</Button>
        </Link>
        <div className="flex-1" />
        <Button variant="secondary" size="sm" onClick={() => setShowPwModal(true)}>
          <i className="fa-solid fa-key mr-1.5" />Reset Password
        </Button>
        {!editMode
          ? <Button size="sm" onClick={() => setEditMode(true)}><i className="fa-solid fa-pen mr-1.5" />Edit Profile</Button>
          : <>
            <Button variant="ghost" size="sm" onClick={() => { setEditMode(false); setForm({ ...member }); }}>Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? <><i className="fa-solid fa-spinner fa-spin mr-1.5" />Saving…</> : <><i className="fa-solid fa-check mr-1.5" />Save Changes</>}
            </Button>
          </>
        }
        <Button variant="danger" size="sm" onClick={() => setShowDeleteModal(true)}>
          <i className="fa-solid fa-trash mr-1.5" />Delete
        </Button>
      </motion.div>

      {/* Deletion Request Banner */}
      {deletionReq && deletionReq.status === "Pending" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex items-start gap-3 p-4 rounded-sm"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)" }}>
          <i className="fa-solid fa-triangle-exclamation mt-0.5 flex-shrink-0" style={{ color: "#EF4444" }} />
          <div className="flex-1">
            <p className="text-sm font-bold" style={{ color: "#EF4444", fontFamily: "var(--font-heading)" }}>
              Member Requested Account Deletion
            </p>
            <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.6)" }}>
              Reason: {deletionReq.reason || "No reason provided"} · Requested: {new Date(deletionReq.requested_at).toLocaleDateString()}
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="danger" onClick={() => processDeletionRequest("Approved")}>Approve & Delete</Button>
            <Button size="sm" variant="secondary" onClick={() => processDeletionRequest("Declined")}>Decline</Button>
          </div>
        </motion.div>
      )}

      {/* Member Card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <CardContent className="p-0">
            {/* Cover */}
            <div className="h-24 rounded-t-sm" style={{ background: `linear-gradient(135deg, ${tc}40, rgba(239,1,7,0.3), ${tc}20)` }} />
            <div className="px-6 pb-6">
              <div className="flex items-end gap-4 -mt-10 mb-4">
                <Avatar fallback={`${member.firstName?.[0] || "?"}${member.lastName?.[0] || ""}`} size={72} color={tc} />
                {member.photo && <img src={member.photo} className="w-18 h-18 rounded-full object-cover" alt="" />}
                <div className="mb-1">
                  <h2 className="text-xl font-black text-white" style={{ fontFamily: "var(--font-display)" }}>
                    {member.firstName} {member.lastName}
                  </h2>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)", fontFamily: "var(--font-body)" }}>
                    #{member.membershipNumber} · {member.branch}
                  </p>
                </div>
                <div className="ml-auto flex gap-2">
                  <Badge variant={member.status === "Active" ? "success" : member.status === "Frozen" ? "info" : "danger"}>
                    {member.status}
                  </Badge>
                  <Badge variant="gold" style={{ color: tc, background: `${tc}20` }}>{member.tier}</Badge>
                  <Badge variant="default" style={{ color: "rgba(255,255,255,0.5)" }}>{member.role}</Badge>
                </div>
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "Joined", value: member.joined || "—" },
                  { label: "Renewal Due", value: member.renewalDue || "—" },
                  { label: "Ticket Requests", value: memberTickets.length },
                  { label: "Approved Tickets", value: memberTickets.filter((t: any) => t.status === "Approved").length },
                ].map(s => (
                  <div key={s.label} className="p-3 rounded-sm" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "rgba(255,255,255,0.35)", fontFamily: "var(--font-heading)" }}>{s.label}</p>
                    <p className="text-sm font-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>{s.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5"
            style={{
              fontFamily: "var(--font-heading)",
              color: tab === t.id ? "var(--color-red)" : "rgba(255,255,255,0.4)",
              borderBottom: tab === t.id ? "2px solid var(--color-red)" : "2px solid transparent",
            }}>
            <i className={`${t.icon} text-[10px]`} />{t.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === "overview" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid lg:grid-cols-2 gap-5">
          {/* Personal Info */}
          <Card>
            <CardHeader><CardTitle><i className="fa-solid fa-user mr-2" style={{ color: "var(--color-red)" }} />Personal Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {editMode ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <FormGroup label="First Name">
                      <Input value={form.firstName || ""} onChange={e => setForm((p: any) => ({ ...p, firstName: e.target.value }))} />
                    </FormGroup>
                    <FormGroup label="Last Name">
                      <Input value={form.lastName || ""} onChange={e => setForm((p: any) => ({ ...p, lastName: e.target.value }))} />
                    </FormGroup>
                  </div>
                  <FormGroup label="Email"><Input value={form.email || ""} onChange={e => setForm((p: any) => ({ ...p, email: e.target.value }))} /></FormGroup>
                  <FormGroup label="Phone"><Input value={form.phone || ""} onChange={e => setForm((p: any) => ({ ...p, phone: e.target.value }))} /></FormGroup>
                  <FormGroup label="WhatsApp"><Input value={form.whatsapp || ""} onChange={e => setForm((p: any) => ({ ...p, whatsapp: e.target.value }))} /></FormGroup>
                  <FormGroup label="Date of Birth"><Input type="date" value={form.dateOfBirth || ""} onChange={e => setForm((p: any) => ({ ...p, dateOfBirth: e.target.value }))} /></FormGroup>
                  <FormGroup label="Address"><Input value={form.address || ""} onChange={e => setForm((p: any) => ({ ...p, address: e.target.value }))} /></FormGroup>
                </>
              ) : (
                <div className="space-y-3">
                  {[
                    { label: "Full Name", value: member.name },
                    { label: "Email", value: member.email },
                    { label: "Phone", value: member.phone || "—" },
                    { label: "WhatsApp", value: member.whatsapp || "—" },
                    { label: "Date of Birth", value: member.dateOfBirth || "—" },
                    { label: "Address", value: member.address || "—" },
                  ].map(f => (
                    <div key={f.label} className="flex items-start gap-3 py-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <p className="text-xs font-bold w-28 flex-shrink-0" style={{ color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-heading)" }}>{f.label}</p>
                      <p className="text-sm text-white flex-1">{f.value}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Membership Info */}
          <Card>
            <CardHeader><CardTitle><i className="fa-solid fa-id-card mr-2" style={{ color: "var(--color-red)" }} />Membership</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {editMode ? (
                <>
                  <FormGroup label="Membership Number">
                    <Input value={form.membershipNumber || ""} onChange={e => setForm((p: any) => ({ ...p, membershipNumber: e.target.value }))} />
                  </FormGroup>
                  <FormGroup label="Tier">
                    <Select value={form.tier || "Bronze"} onChange={e => setForm((p: any) => ({ ...p, tier: e.target.value }))}>
                      {TIER_OPTS.map(t => <option key={t}>{t}</option>)}
                    </Select>
                  </FormGroup>
                  <FormGroup label="Status">
                    <Select value={form.status || "Active"} onChange={e => setForm((p: any) => ({ ...p, status: e.target.value }))}>
                      {STATUS_OPTS.map(s => <option key={s}>{s}</option>)}
                    </Select>
                  </FormGroup>
                  <FormGroup label="Role">
                    <Select value={form.role || "member"} onChange={e => setForm((p: any) => ({ ...p, role: e.target.value }))}>
                      {ROLE_OPTS.map(r => <option key={r}>{r}</option>)}
                    </Select>
                  </FormGroup>
                  <div className="grid grid-cols-2 gap-3">
                    <FormGroup label="Joined"><Input value={form.joined || ""} onChange={e => setForm((p: any) => ({ ...p, joined: e.target.value }))} /></FormGroup>
                    <FormGroup label="Renewal Due"><Input value={form.renewalDue || ""} onChange={e => setForm((p: any) => ({ ...p, renewalDue: e.target.value }))} /></FormGroup>
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  {[
                    { label: "Number", value: member.membershipNumber },
                    { label: "Tier", value: member.tier },
                    { label: "Status", value: member.status },
                    { label: "Role", value: member.role },
                    { label: "Branch", value: member.branch || "—" },
                    { label: "Joined", value: member.joined || "—" },
                    { label: "Renewal Due", value: member.renewalDue || "—" },
                  ].map(f => (
                    <div key={f.label} className="flex items-start gap-3 py-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <p className="text-xs font-bold w-28 flex-shrink-0" style={{ color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-heading)" }}>{f.label}</p>
                      <p className="text-sm text-white flex-1">{f.value}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Tickets Tab */}
      {tab === "tickets" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card>
            <CardHeader>
              <CardTitle><i className="fa-solid fa-ticket mr-2" style={{ color: "var(--color-red)" }} />
                Ticket Requests ({memberTickets.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {memberTickets.length === 0 ? (
                <div className="py-12 text-center">
                  <i className="fa-solid fa-ticket text-4xl mb-3 block" style={{ color: "rgba(255,255,255,0.08)" }} />
                  <p className="text-sm font-bold text-white/25">No ticket requests</p>
                </div>
              ) : (
                <div className="divide-y divide-white/[0.04]">
                  {memberTickets.map((t: any) => (
                    <div key={t.id} className="flex items-center gap-4 p-4">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{t.match}</p>
                        <p className="text-xs text-white/40 mt-0.5">{t.category} · Qty: {t.qty} · {t.submitted}</p>
                      </div>
                      <Badge variant={t.status === "Approved" ? "success" : t.status === "Pending" ? "warning" : "danger"}>
                        {t.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Security Tab */}
      {tab === "security" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <Card>
            <CardHeader><CardTitle><i className="fa-solid fa-key mr-2" style={{ color: "var(--color-red)" }} />Password Management</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 rounded-sm" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div>
                  <p className="text-sm font-medium text-white">Member Password</p>
                  <p className="text-xs text-white/40 mt-0.5">Reset the member&apos;s login password</p>
                </div>
                <Button variant="secondary" size="sm" onClick={() => setShowPwModal(true)}>
                  <i className="fa-solid fa-key mr-1.5" />Reset Password
                </Button>
              </div>
              <div className="mt-4 flex items-center justify-between p-4 rounded-sm" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div>
                  <p className="text-sm font-medium text-white">Two-Factor Authentication</p>
                  <p className="text-xs text-white/40 mt-0.5">2FA status: {member.two_factor_enabled ? "Enabled" : "Disabled"}</p>
                </div>
                <Button variant="secondary" size="sm" onClick={async () => {
                  const val = member.two_factor_enabled ? 0 : 1;
                  await fetch(`/api/admin/members/${member.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ two_factor_enabled: val }),
                  });
                  setMember((p: any) => ({ ...p, two_factor_enabled: val }));
                  setMembers(members.map((m: any) => String(m.id) === String(member.id) ? { ...m, two_factor_enabled: val } : m));
                  toast.success(val ? "2FA enabled for member" : "2FA disabled for member");
                }}>
                  {member.two_factor_enabled ? "Disable 2FA" : "Enable 2FA"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card>
            <CardHeader><CardTitle style={{ color: "#EF4444" }}><i className="fa-solid fa-skull-crossbones mr-2" />Danger Zone</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 rounded-sm" style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)" }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: "#EF4444" }}>Delete Member Account</p>
                  <p className="text-xs text-white/40 mt-0.5">Permanently remove this member and all their data</p>
                </div>
                <Button variant="danger" size="sm" onClick={() => setShowDeleteModal(true)}>
                  <i className="fa-solid fa-trash mr-1.5" />Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Activity Tab */}
      {tab === "activity" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card>
            <CardHeader><CardTitle><i className="fa-solid fa-clock-rotate-left mr-2" style={{ color: "var(--color-red)" }} />Activity Log</CardTitle></CardHeader>
            <CardContent>
              <div className="py-8 text-center">
                <i className="fa-solid fa-chart-line text-4xl mb-3 block" style={{ color: "rgba(255,255,255,0.08)" }} />
                <p className="text-sm text-white/40">Activity log coming soon. Events, logins, and actions will appear here.</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Password Reset Modal */}
      <Modal open={showPwModal} onClose={() => setShowPwModal(false)} title="Reset Member Password">
        <div className="space-y-4">
          <p className="text-sm text-white/60">Set a new password for <strong className="text-white">{member.name}</strong>. They will need to use this to log in.</p>
          <FormGroup label="New Password">
            <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Enter new password (min 6 chars)" />
          </FormGroup>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setShowPwModal(false)}>Cancel</Button>
            <Button size="sm" onClick={handlePasswordReset} disabled={saving}>
              {saving ? "Resetting…" : "Reset Password"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal open={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Member">
        <div className="space-y-4">
          <p className="text-sm text-white/60">Are you sure you want to permanently delete <strong className="text-white">{member.name}</strong>? This cannot be undone.</p>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
            <Button variant="danger" size="sm" onClick={handleDelete} disabled={saving}>
              {saving ? "Deleting…" : "Delete Permanently"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
