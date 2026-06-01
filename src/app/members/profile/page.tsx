"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { formatMemberSince } from "@/lib/membershipUtils";
import { useApp } from "@/context/AppContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import toast from "react-hot-toast";
import { uploadLocalImage } from "@/lib/clientUploads";

// ── Settings Tab Component ───────────────────────────────────────────────────
function SettingsTab({ user }: { user: any }) {
  const [section, setSection] = useState<"main" | "password" | "2fa" | "sessions" | "delete">("main");
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [saving, setSaving] = useState(false);
  const [twoFaCode, setTwoFaCode] = useState("");
  const [twoFaEnabled, setTwoFaEnabled] = useState((user as any)?.two_factor_enabled ?? false);
  const [codeSent, setCodeSent] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteRequested, setDeleteRequested] = useState(false);
  const [existingRequest, setExistingRequest] = useState<any>(null);

  useEffect(() => {
    // Check for existing deletion request
    fetch("/api/member-deletion-requests")
      .then(r => r.json())
      .then(d => {
        const mine = (d.requests || []).find((r: any) => String(r.member_id) === String(user.id) && r.status === "Pending");
        if (mine) setExistingRequest(mine);
      }).catch(() => {});
  }, [user.id]);

  const handleChangePassword = async () => {
    if (!currentPw) { toast.error("Enter your current password"); return; }
    if (newPw.length < 8) { toast.error("New password must be at least 8 characters"); return; }
    if (newPw !== confirmPw) { toast.error("Passwords do not match"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast.success("Password changed successfully!");
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      setSection("main");
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const sendTwoFaCode = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/auth/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: user.id, email: user.email, name: user.firstName, purpose: "login" }),
      });
      const data = await res.json();
      if (data.success) {
        setCodeSent(true);
        toast.success("Verification code sent to your email");
        if (data.dev) toast.success(`DEV: code is ${data.dev}`, { duration: 10000 });
      } else throw new Error("Failed to send code");
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const verifyAndToggle2FA = async () => {
    if (!twoFaCode) { toast.error("Enter the verification code"); return; }
    setSaving(true);
    try {
      const verifyRes = await fetch("/api/auth/2fa", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: user.id, code: twoFaCode }),
      });
      const vd = await verifyRes.json();
      if (!vd.success) throw new Error(vd.error || "Invalid code");

      const newVal = !twoFaEnabled;
      await fetch(`/api/admin/members/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ two_factor_enabled: newVal ? 1 : 0 }),
      });
      setTwoFaEnabled(newVal);
      setCodeSent(false); setTwoFaCode("");
      toast.success(newVal ? "Two-factor authentication enabled!" : "Two-factor authentication disabled");
      setSection("main");
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const handleDeletionRequest = async () => {
    if (!deleteReason.trim()) { toast.error("Please provide a reason"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/member-deletion-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: deleteReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setDeleteRequested(true);
      toast.success("Deletion request submitted. Admin will process it shortly.");
      setSection("main");
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const cardStyle = { background: "var(--bg-card)", border: "1px solid var(--border-color)" };
  const inp = "w-full px-3 py-2.5 text-sm rounded-sm outline-none input-arsenal";

  if (section === "password") return (
    <div className="max-w-lg space-y-4">
      <button onClick={() => setSection("main")} className="flex items-center gap-1.5 text-sm transition-colors mb-2 nav-interactive" style={{ color: "var(--text-muted)" }}>
        <i className="fa-solid fa-arrow-left text-xs" />Back
      </button>
      <div className="p-5 rounded-sm" style={cardStyle}>
        <h2 className="text-sm font-bold mb-4 uppercase tracking-wider" style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}>
          <i className="fa-solid fa-key mr-2" style={{ color: "var(--color-gold)" }} />Change Password
        </h2>
        <div className="space-y-3">
          <div><label className="text-xs text-white/40 mb-1 block" style={{ fontFamily: "var(--font-heading)" }}>Current Password</label>
            <input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="Your current password" className={inp} /></div>
          <div><label className="text-xs mb-1 block" style={{ color: "var(--text-muted)", fontFamily: "var(--font-heading)" }}>New Password</label>
            <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="At least 8 characters" className={inp} /></div>
          <div><label className="text-xs mb-1 block" style={{ color: "var(--text-muted)", fontFamily: "var(--font-heading)" }}>Confirm New Password</label>
            <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="Repeat new password" className={inp} /></div>
          <button onClick={handleChangePassword} disabled={saving} className="btn-arsenal w-full py-2.5 text-sm mt-2">
            {saving ? <><i className="fa-solid fa-spinner fa-spin mr-1.5" />Changing…</> : "Change Password"}
          </button>
        </div>
      </div>
    </div>
  );

  if (section === "2fa") return (
    <div className="max-w-lg space-y-4">
      <button onClick={() => setSection("main")} className="flex items-center gap-1.5 text-sm transition-colors mb-2 nav-interactive" style={{ color: "var(--text-muted)" }}>
        <i className="fa-solid fa-arrow-left text-xs" />Back
      </button>
      <div className="p-5 rounded-sm" style={cardStyle}>
        <h2 className="text-sm font-bold text-white mb-2 uppercase tracking-wider" style={{ fontFamily: "var(--font-heading)" }}>
          <i className="fa-solid fa-mobile-screen-button mr-2" style={{ color: "#3498DB" }} />Two-Factor Authentication
        </h2>
        <p className="text-xs text-white/50 mb-4">
          2FA is currently <strong className={twoFaEnabled ? "text-green-400" : "text-red-400"}>{twoFaEnabled ? "ENABLED" : "DISABLED"}</strong>.
          {twoFaEnabled ? " A code will be sent to your email each time you log in." : " Enable it to add an extra layer of security."}
        </p>
        {!codeSent ? (
          <button onClick={sendTwoFaCode} disabled={saving} className="btn-arsenal w-full py-2.5 text-sm">
            {saving ? <><i className="fa-solid fa-spinner fa-spin mr-1.5" />Sending…</> : `Send Verification Code to ${user.email}`}
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-white/60">Enter the 6-digit code sent to <strong className="text-white">{user.email}</strong>:</p>
            <input value={twoFaCode} onChange={e => setTwoFaCode(e.target.value)} placeholder="000000" maxLength={6}
              className={`${inp} text-center text-2xl tracking-widest font-mono`} />
            <button onClick={verifyAndToggle2FA} disabled={saving} className="btn-arsenal w-full py-2.5 text-sm">
              {saving ? "Verifying…" : twoFaEnabled ? "Disable 2FA" : "Enable 2FA"}
            </button>
            <button onClick={() => setCodeSent(false)} className="w-full text-xs text-white/40 hover:text-white transition-colors py-1">
              Resend code
            </button>
          </div>
        )}
      </div>
    </div>
  );

  if (section === "delete") return (
    <div className="max-w-lg space-y-4">
      <button onClick={() => setSection("main")} className="flex items-center gap-1.5 text-sm transition-colors mb-2 nav-interactive" style={{ color: "var(--text-muted)" }}>
        <i className="fa-solid fa-arrow-left text-xs" />Back
      </button>
      {existingRequest || deleteRequested ? (
        <div className="p-5 rounded-sm" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)" }}>
          <i className="fa-solid fa-clock text-2xl mb-3 block" style={{ color: "#F59E0B" }} />
          <h3 className="text-sm font-bold mb-2" style={{ color: "#F59E0B", fontFamily: "var(--font-heading)" }}>Deletion Request Pending</h3>
          <p className="text-xs text-white/60">Your account deletion request has been submitted and is awaiting admin review. You will be notified once processed.</p>
        </div>
      ) : (
        <div className="p-5 rounded-sm" style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <h2 className="text-sm font-bold mb-3 uppercase tracking-wider" style={{ fontFamily: "var(--font-heading)", color: "#EF4444" }}>
            <i className="fa-solid fa-triangle-exclamation mr-2" />Request Account Deletion
          </h2>
          <p className="text-xs text-white/60 mb-4">
            Only an admin can permanently delete your account. Submitting this request notifies the admin team who will review and process it.
          </p>
          <div className="mb-3">
            <label className="text-xs text-white/40 mb-1 block" style={{ fontFamily: "var(--font-heading)" }}>Reason for Deletion *</label>
            <textarea value={deleteReason} onChange={e => setDeleteReason(e.target.value)} rows={3}
              placeholder="Please explain why you want your account deleted…"
              className={inp} style={{ resize: "none" }} />
          </div>
          <button onClick={handleDeletionRequest} disabled={saving}
            className="w-full py-2.5 text-sm font-bold rounded-sm transition-all"
            style={{ background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.4)", color: "#EF4444", fontFamily: "var(--font-heading)" }}>
            {saving ? "Submitting…" : "Submit Deletion Request to Admin"}
          </button>
        </div>
      )}
    </div>
  );

  // Main settings view
  return (
    <div className="max-w-lg space-y-4">
      {/* Security */}
      <div className="p-5 rounded-sm" style={cardStyle}>
        <h2 className="text-sm font-bold mb-4 uppercase tracking-wider" style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}>
          <i className="fa-solid fa-lock mr-2" style={{ color: "var(--color-red)" }} />Security
        </h2>
        <div className="space-y-2">
          <button onClick={() => setSection("password")} className="w-full flex items-center justify-between px-4 py-3 rounded-sm transition-all nav-interactive" style={{ border: "1px solid var(--border-color)" }}>
            <div className="flex items-center gap-3">
              <i className="fa-solid fa-key" style={{ color: "var(--color-gold)", width: 16 }} />
              <span className="text-sm text-white">Change Password</span>
            </div>
            <i className="fa-solid fa-chevron-right text-xs text-white/30" />
          </button>
          <button onClick={() => setSection("2fa")} className="w-full flex items-center justify-between px-4 py-3 rounded-sm transition-all nav-interactive" style={{ border: "1px solid var(--border-color)" }}>
            <div className="flex items-center gap-3">
              <i className="fa-solid fa-mobile-screen-button" style={{ color: "#3498DB", width: 16 }} />
              <div className="text-left">
                <span className="text-sm text-white block">Two-Factor Authentication</span>
                <span className={`text-xs ${twoFaEnabled ? "text-green-400" : "text-white/40"}`}>{twoFaEnabled ? "Enabled" : "Disabled"}</span>
              </div>
            </div>
            <i className="fa-solid fa-chevron-right text-xs text-white/30" />
          </button>
          <button onClick={() => setSection("sessions")} className="w-full flex items-center justify-between px-4 py-3 rounded-sm transition-all nav-interactive" style={{ border: "1px solid var(--border-color)" }}>
            <div className="flex items-center gap-3">
              <i className="fa-solid fa-shield-halved" style={{ color: "#10B981", width: 16 }} />
              <div className="text-left">
                <span className="text-sm text-white block">Active Sessions</span>
                <span className="text-xs text-white/40">View devices where you&apos;re logged in</span>
              </div>
            </div>
            <i className="fa-solid fa-chevron-right text-xs text-white/30" />
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="p-5 rounded-sm" style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)" }}>
        <h2 className="text-sm font-bold mb-3 uppercase tracking-wider" style={{ fontFamily: "var(--font-heading)", color: "#EF4444" }}>
          <i className="fa-solid fa-triangle-exclamation mr-2" />Account Actions
        </h2>
        <p className="text-xs text-white/50 mb-3">Account deletion can only be performed by an admin. You can submit a request below.</p>
        {existingRequest ? (
          <div className="px-4 py-3 rounded-sm text-sm" style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", color: "#F59E0B" }}>
            <i className="fa-solid fa-clock mr-2" />Deletion request pending admin review
          </div>
        ) : (
          <button onClick={() => setSection("delete")} className="w-full flex items-center justify-between px-4 py-3 rounded-sm transition-all"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <span className="text-sm" style={{ color: "#EF4444" }}>Request Account Deletion</span>
            <i className="fa-solid fa-chevron-right text-xs" style={{ color: "#EF4444", opacity: 0.5 }} />
          </button>
        )}
      </div>
    </div>
  );
}

const BRANCHES = ["Ashanti","Accra","Ladies","Sunyani","Volta","Central","Northern Regions","Eastern","Western","Tema"];
const SOCIAL_PLATFORMS = [
  { key:"facebook", label:"Facebook", icon:"fa-brands fa-facebook-f", color:"#1877F2", placeholder:"https://facebook.com/yourname" },
  { key:"instagram", label:"Instagram", icon:"fa-brands fa-instagram", color:"#E1306C", placeholder:"https://instagram.com/yourname" },
  { key:"twitter", label:"Twitter / X", icon:"fa-brands fa-x-twitter", color:"#1DA1F2", placeholder:"https://twitter.com/yourname" },
  { key:"whatsapp", label:"WhatsApp", icon:"fa-brands fa-whatsapp", color:"#25D366", placeholder:"https://wa.me/233XXXXXXXXX" },
  { key:"tiktok", label:"TikTok", icon:"fa-brands fa-tiktok", color:"#69C9D0", placeholder:"https://tiktok.com/@yourname" },
  { key:"youtube", label:"YouTube", icon:"fa-brands fa-youtube", color:"#FF0000", placeholder:"https://youtube.com/@yourchannel" },
];

const TABS = ["Overview","Tickets","Events","Social","Settings","Notifications"];

const tierGradients: Record<string,string> = {
  Gold:"linear-gradient(135deg, #9B0000, #EF0107, #C6A84B, #EF0107)",
  Platinum:"linear-gradient(135deg, #9B0000, #EF0107, #E8E8E8, #EF0107)",
  Silver:"linear-gradient(135deg, #9B0000, #EF0107, #A8A9AD)",
  Bronze:"linear-gradient(135deg, #9B0000, #EF0107, #CD7F32)",
  Abusua:"linear-gradient(135deg, #1B5E20, #EF0107, #2ECC71)",
};

function formatTimeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

const NOTIF_VISUAL: Record<string, { color: string; bg: string }> = {
  ticket:   { color: "#E30613", bg: "rgba(227,6,19,0.1)" },
  renewal:  { color: "#947A58", bg: "rgba(148,122,88,0.12)" },
  event:    { color: "#3B82F6", bg: "rgba(59,130,246,0.1)" },
  account:  { color: "#8B5CF6", bg: "rgba(139,92,246,0.1)" },
  system:   { color: "#10B981", bg: "rgba(16,185,129,0.1)" },
  success:  { color: "#10B981", bg: "rgba(16,185,129,0.1)" },
  warning:  { color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
  danger:   { color: "#EF4444", bg: "rgba(239,68,68,0.1)" },
};

export default function MemberProfilePage() {
  const { user, isLoggedIn, updateUser } = useAuth();
  const memberSince = formatMemberSince(user?.joinDate);

  const saveSocial = () => {
    const clean: Record<string,string> = {};
    Object.entries(socialForm).forEach(([k,v]) => { if (v.trim()) clean[k] = v.trim(); });
    updateUser({ ...user, socialAccounts: clean } as any);
    setSocialEdit(false);
    toast.success("Social accounts updated");
  };
  const { tickets, events } = useApp();
  const router = useRouter();

  const [tab, setTab] = useState("Overview");
  const [editMode, setEditMode] = useState(false);
  const [profileImg, setProfileImg] = useState<string|null>(null);
  const [saving, setSaving] = useState(false);
  const imgRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  const [coverPhoto, setCoverPhoto] = useState<string>((user as any)?.coverPhoto || "");
  const [socialEdit, setSocialEdit] = useState(false);
  const [socialForm, setSocialForm] = useState({
    facebook:  (user as any)?.socialAccounts?.facebook  || "",
    instagram: (user as any)?.socialAccounts?.instagram || "",
    twitter:   (user as any)?.socialAccounts?.twitter   || "",
    youtube:   (user as any)?.socialAccounts?.youtube   || "",
    tiktok:    (user as any)?.socialAccounts?.tiktok    || "",
    linkedin:  (user as any)?.socialAccounts?.linkedin  || "",
  });
  const [memberNotifs, setMemberNotifs] = useState<Array<{
    id: number; title: string; message: string; icon?: string;
    category?: string; type?: string; isRead: number; linkHref?: string; createdAt: string;
  }>>([]);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [notifsLoading, setNotifsLoading] = useState(false);

  const readCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    if (f.size > 5*1024*1024) { toast.error("Max 5MB for cover photo"); return; }
    try {
      const url = await uploadLocalImage(f, "members");
      setCoverPhoto(url);
      updateUser({ coverPhoto: url } as any);
      toast.success("Cover photo updated!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    }
  };

  // Local editable copy — always seeded from live auth user
  const [profileData, setProfileData] = useState(() => ({
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    whatsapp: user?.phone ?? "",
    dateOfBirth: "",
    address: "",
    postGPS: "",
    branch: user?.branch ?? "Accra",
    bio: "Proud Ghana Gooner! COYG 🔴⚪",
    socials: { facebook:"", instagram:"", twitter:"", whatsapp:"", tiktok:"", youtube:"" },
    notifications: { email:true, sms:false, events:true, tickets:true, renewals:true, community:false },
  }));

  useEffect(() => {
    if (!isLoggedIn) { router.push("/auth/login"); return; }
    if (user) {
      setProfileData(p => ({
        ...p,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        whatsapp: user.phone,
        branch: user.branch,
      }));
      if (user.photo) setProfileImg(user.photo);
    }
  }, [isLoggedIn, user]);

  const loadMemberNotifications = async () => {
    setNotifsLoading(true);
    try {
      const res = await fetch("/api/members/notifications?limit=30");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setMemberNotifs(data.notifications || []);
      setUnreadNotifs(Number(data.unreadCount || 0));
      if (data.preferences) {
        setProfileData(p => ({ ...p, notifications: { ...p.notifications, ...data.preferences } }));
      }
    } catch {
      toast.error("Could not load notifications");
    } finally {
      setNotifsLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn && tab === "Notifications") loadMemberNotifications();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, tab]);

  const saveNotificationPrefs = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/members/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences: profileData.notifications }),
      });
      if (!res.ok) throw new Error("Save failed");
      toast.success("Notification preferences saved");
    } catch {
      toast.error("Could not save preferences");
    } finally {
      setSaving(false);
    }
  };

  const markNotifRead = async (id: number) => {
    setMemberNotifs(prev => prev.map(n => n.id === id ? { ...n, isRead: 1 } : n));
    setUnreadNotifs(prev => Math.max(0, prev - 1));
    fetch("/api/members/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch(() => {});
  };

  if (!isLoggedIn || !user) return null;

  const myTickets = tickets.filter(t => t.membershipNumber === user.membershipNumber);
  const approvedTickets = myTickets.filter(t => t.status === "Approved" || t.status === "Partially Approved").length;
  const pendingTickets  = myTickets.filter(t => t.status === "Pending").length;
  const myEvents        = events.filter(e => e.status === "Published");

  const tierColor = user.tierColor || "#C6A84B";

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) =>
    setProfileData(p => ({ ...p, [k]: e.target.value }));

  const setSocial = (k: string, v: string) =>
    setProfileData(p => ({ ...p, socials: { ...p.socials, [k]: v } }));

  const setNotif = (k: string, v: boolean) =>
    setProfileData(p => ({ ...p, notifications: { ...p.notifications, [k]: v } }));

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 900));
    // Persist back to the server-backed auth session.
    updateUser({
      firstName: profileData.firstName,
      lastName: profileData.lastName,
      name: `${profileData.firstName} ${profileData.lastName}`,
      email: profileData.email,
      phone: profileData.phone,
      branch: profileData.branch,
      photo: profileImg ?? user.photo,
    });
    setSaving(false);
    setEditMode(false);
    toast.success("Profile updated successfully!");
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await uploadLocalImage(file, "members");
      setProfileImg(result);
      updateUser({ photo: result });
      toast.success("Profile photo updated!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    }
  };

  const cardStyle = { background: "var(--bg-card)", border: "1px solid var(--border-color)" };

  return (
    <main className="member-scope" style={{ background:"var(--bg-primary)" }}>
      <Navbar />
      <div className="min-h-screen pt-[120px]">

        {/* Cover banner */}
        <div className="relative w-full overflow-hidden" style={{ height:"240px" }}>
          {coverPhoto
            ? <img src={coverPhoto} alt="Cover" className="absolute inset-0 w-full h-full object-cover" />
            : <>
                <div className="absolute inset-0" style={{ background: tierGradients[user.tier] || tierGradients.Gold }} />
                <div className="absolute inset-0 arsenal-pattern opacity-40" />
                <div className="absolute inset-0 flex items-center justify-end pr-16 opacity-[0.07]">
                  <span style={{ fontFamily:"var(--font-display)", fontSize:"14rem", color:"white", lineHeight:1, userSelect:"none" }}>AFC</span>
                </div>
              </>
          }
          {/* Upload cover button */}
          <button onClick={() => coverRef.current?.click()}
            className="absolute bottom-3 right-3 flex items-center gap-2 px-3 py-2 text-xs font-bold transition-all hover:scale-105"
            style={{ background:"rgba(0,0,0,0.6)", backdropFilter:"blur(8px)", border:"1px solid rgba(255,255,255,0.2)", color:"white", fontFamily:"var(--font-heading)", borderRadius:"2px", clipPath:"polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))" }}>
            <i className="fa-solid fa-camera" />
            {coverPhoto ? "Change Cover Photo" : "Upload Cover Photo"}
          </button>
          {coverPhoto && (
            <button onClick={() => { setCoverPhoto(""); updateUser({ coverPhoto: "" } as any); }}
              className="absolute bottom-3 right-48 flex items-center gap-1.5 px-3 py-2 text-xs font-bold transition-all"
              style={{ background:"rgba(239,1,7,0.7)", backdropFilter:"blur(8px)", border:"1px solid rgba(239,1,7,0.4)", color:"white", fontFamily:"var(--font-heading)", borderRadius:"2px" }}>
              <i className="fa-solid fa-xmark text-[10px]" />Remove
            </button>
          )}
          {/* Tier badge */}
          <div className="absolute top-5 right-5 flex items-center gap-2 px-3 py-1.5 rounded-sm"
            style={{ background:"rgba(0,0,0,0.45)", backdropFilter:"blur(10px)", border:`1px solid ${tierColor}50` }}>
            <i className="fa-solid fa-crown text-xs" style={{ color: tierColor }} />
            <span className="text-sm font-bold" style={{ color: tierColor, fontFamily:"var(--font-heading)" }}>{user.tier} Member</span>
          </div>
          {/* Status badge */}
          <div className="absolute top-5 left-5">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full"
              style={{
                background: user.status === "Active" ? "rgba(46,204,113,0.2)" : "rgba(231,76,60,0.2)",
                border: `1px solid ${user.status === "Active" ? "#2ECC71" : "#E74C3C"}50`,
                color: user.status === "Active" ? "#2ECC71" : "#E74C3C",
                fontFamily:"var(--font-heading)"
              }}>
              {user.status}
            </span>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6">

          {/* Avatar + name row */}
          <div className="flex flex-wrap items-end gap-4 -mt-16 mb-6 relative z-10">
            <div className="relative flex-shrink-0">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden"
                style={{ border:"4px solid var(--color-gold)", boxShadow:"0 4px 20px rgba(0,0,0,0.5)" }}>
                {profileImg
                  ? <img src={profileImg} alt="Profile" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-3xl font-black"
                      style={{ background:"linear-gradient(135deg,#C6A84B,#E8C97A)", color:"#1A1A2E", fontFamily:"var(--font-heading)" }}>
                      {user.firstName[0]}{user.lastName[0]}
                    </div>
                }
              </div>
              <button onClick={() => imgRef.current?.click()}
                className="absolute bottom-1 right-1 w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
                style={{ background:"var(--color-red)", boxShadow:"0 2px 8px rgba(0,0,0,0.5)" }}>
                <i className="fa-solid fa-camera text-xs text-white" />
              </button>
              <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={readCover} />
        <input ref={imgRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </div>

            <div className="flex-1 min-w-0 pb-2">
              <h1 className="text-2xl sm:text-3xl font-black text-white" style={{ fontFamily:"var(--font-display)" }}>
                {user.firstName} {user.lastName}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-1">
                <span className="text-sm font-mono font-bold" style={{ color:"var(--color-gold)" }}>#{user.membershipNumber}</span>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>·</span>
                <span className="text-sm" style={{ color: "var(--text-secondary)", fontFamily:"var(--font-body)" }}>{user.branch} Branch</span>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>·</span>
                <span className="text-sm" style={{ color: "var(--text-secondary)", fontFamily:"var(--font-body)" }}>
                  Member since {memberSince.yearsDisplay}
                </span>
              </div>
            </div>

            <div className="pb-2 flex gap-2">
              {editMode ? (
                <>
                  <button onClick={() => { setEditMode(false); }}
                    className="px-4 py-2 text-sm rounded-sm border hover:bg-white/5 transition-all"
                    style={{ borderColor:"var(--border-color)", color:"var(--text-secondary)", fontFamily:"var(--font-heading)" }}>
                    <i className="fa-solid fa-xmark mr-1.5" />Cancel
                  </button>
                  <button onClick={handleSave} disabled={saving} className="btn-arsenal px-5 py-2 text-sm">
                    {saving ? <><i className="fa-solid fa-spinner fa-spin mr-1.5" />Saving...</> : <><i className="fa-solid fa-save mr-1.5" />Save</>}
                  </button>
                </>
              ) : (
                <button onClick={() => setEditMode(true)} className="btn-arsenal px-5 py-2 text-sm">
                  <i className="fa-solid fa-pen mr-1.5" />Edit Profile
                </button>
              )}
            </div>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label:"Tickets Requested", value:myTickets.length, icon:"fa-solid fa-ticket" },
              { label:"Tickets Approved",  value:approvedTickets,  icon:"fa-solid fa-circle-check" },
              { label:"Pending Requests",  value:pendingTickets,   icon:"fa-solid fa-clock" },
              { label:"Upcoming Events",   value:myEvents.length,  icon:"fa-solid fa-calendar-days" },
            ].map(s => (
              <div key={s.label} className="p-4 rounded-sm text-center" style={cardStyle}>
                <i className={`${s.icon} text-lg mb-1.5 block`} style={{ color:"var(--color-red)" }} />
                <p className="text-2xl font-black text-white" style={{ fontFamily:"var(--font-display)" }}>{s.value}</p>
                <p className="text-xs mt-0.5" style={{ color:"var(--text-muted)", fontFamily:"var(--font-body)" }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-0 mb-6 overflow-x-auto" style={{ borderBottom:"1px solid var(--border-color)" }}>
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)}
                className="px-5 py-3 text-sm font-medium whitespace-nowrap transition-all relative"
                style={{ color: tab===t ? "var(--text-primary)" : "var(--text-muted)", fontFamily:"var(--font-heading)" }}>
                {t}
                {tab===t && <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background:"var(--color-red)" }} />}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }} transition={{ duration:0.25 }}
              className="pb-16">

              {/* OVERVIEW */}
              {tab === "Overview" && (
                <div className="grid lg:grid-cols-3 gap-5">
                  <div className="lg:col-span-2 space-y-5">

                    {/* Personal Info */}
                    <div className="p-5 rounded-sm" style={cardStyle}>
                      <h2 className="text-sm font-bold text-white mb-4 uppercase tracking-wider" style={{ fontFamily:"var(--font-heading)" }}>
                        <i className="fa-solid fa-user mr-2" style={{ color:"var(--color-red)" }} />Personal Information
                      </h2>
                      <div className="grid sm:grid-cols-2 gap-4">
                        {[
                          { label:"First Name", key:"firstName", icon:"fa-solid fa-user" },
                          { label:"Last Name",  key:"lastName",  icon:"fa-solid fa-user" },
                          { label:"Email",      key:"email",     icon:"fa-solid fa-envelope", type:"email" },
                          { label:"Phone",      key:"phone",     icon:"fa-solid fa-phone",    type:"tel" },
                          { label:"WhatsApp",   key:"whatsapp",  icon:"fa-brands fa-whatsapp",type:"tel" },
                          { label:"Date of Birth", key:"dateOfBirth", icon:"fa-solid fa-cake-candles", type:"date" },
                        ].map(f => (
                          <div key={f.key}>
                            <label className="text-xs uppercase tracking-wider mb-1.5 flex items-center gap-1.5"
                              style={{ color: "var(--text-muted)", fontFamily:"var(--font-heading)" }}>
                              <i className={`${f.icon} text-[10px]`} style={{ color:"var(--color-red)" }} />{f.label}
                            </label>
                            {editMode
                              ? <input type={f.type||"text"} value={(profileData as any)[f.key]} onChange={set(f.key)} className="input-arsenal text-sm" />
                              : <p className="text-sm text-white" style={{ fontFamily:"var(--font-body)" }}>{(profileData as any)[f.key] || "—"}</p>
                            }
                          </div>
                        ))}
                        <div className="sm:col-span-2">
                          <label className="text-xs uppercase tracking-wider mb-1.5 flex items-center gap-1.5"
                            style={{ color: "var(--text-muted)", fontFamily:"var(--font-heading)" }}>
                            <i className="fa-solid fa-location-dot text-[10px]" style={{ color:"var(--color-red)" }} />Address
                          </label>
                          {editMode
                            ? <input value={profileData.address} onChange={set("address")} className="input-arsenal text-sm" />
                            : <p className="text-sm text-white" style={{ fontFamily:"var(--font-body)" }}>{profileData.address || "—"}</p>
                          }
                        </div>
                        <div>
                          <label className="text-xs uppercase tracking-wider mb-1.5 flex items-center gap-1.5"
                            style={{ color: "var(--text-muted)", fontFamily:"var(--font-heading)" }}>
                            <i className="fa-solid fa-map-pin text-[10px]" style={{ color:"var(--color-red)" }} />Post GPS
                          </label>
                          {editMode
                            ? <input value={profileData.postGPS} onChange={set("postGPS")} className="input-arsenal text-sm" />
                            : <p className="text-sm text-white" style={{ fontFamily:"var(--font-body)" }}>{profileData.postGPS || "—"}</p>
                          }
                        </div>
                        <div>
                          <label className="text-xs uppercase tracking-wider mb-1.5 flex items-center gap-1.5"
                            style={{ color: "var(--text-muted)", fontFamily:"var(--font-heading)" }}>
                            <i className="fa-solid fa-location-crosshairs text-[10px]" style={{ color:"var(--color-red)" }} />Branch
                          </label>
                          {editMode
                            ? <select value={profileData.branch} onChange={set("branch")} className="input-arsenal text-sm" style={{ background:"#1A1A2E" }}>
                                {BRANCHES.map(b => <option key={b} style={{ background:"#1A1A2E" }}>{b}</option>)}
                              </select>
                            : <p className="text-sm text-white" style={{ fontFamily:"var(--font-body)" }}>{profileData.branch}</p>
                          }
                        </div>
                      </div>
                      <div className="mt-4">
                        <label className="text-xs uppercase tracking-wider mb-1.5 flex items-center gap-1.5"
                          style={{ color: "var(--text-muted)", fontFamily:"var(--font-heading)" }}>
                          <i className="fa-solid fa-quote-left text-[10px]" style={{ color:"var(--color-red)" }} />Bio
                        </label>
                        {editMode
                          ? <textarea value={profileData.bio} onChange={set("bio")} rows={3} className="input-arsenal text-sm resize-none" />
                          : <p className="text-sm" style={{ color:"var(--text-secondary)", fontFamily:"var(--font-body)", lineHeight:1.7 }}>{profileData.bio}</p>
                        }
                      </div>
                    </div>

                    {/* Social Links */}
                    <div className="p-5 rounded-sm" style={cardStyle}>
                      <h2 className="text-sm font-bold text-white mb-4 uppercase tracking-wider" style={{ fontFamily:"var(--font-heading)" }}>
                        <i className="fa-solid fa-share-nodes mr-2" style={{ color:"var(--color-red)" }} />Social Links
                      </h2>
                      <div className="space-y-3">
                        {SOCIAL_PLATFORMS.map(p => (
                          <div key={p.key}>
                            <label className="text-xs uppercase tracking-wider mb-1.5 flex items-center gap-2"
                              style={{ color: "var(--text-muted)", fontFamily:"var(--font-heading)" }}>
                              <i className={`${p.icon} text-sm`} style={{ color: p.color }} />{p.label}
                            </label>
                            {editMode
                              ? <input value={(profileData.socials as any)[p.key]} onChange={e => setSocial(p.key, e.target.value)}
                                  className="input-arsenal text-sm" placeholder={p.placeholder} />
                              : (profileData.socials as any)[p.key]
                                ? <a href={(profileData.socials as any)[p.key]} target="_blank" rel="noopener noreferrer"
                                    className="text-sm flex items-center gap-1.5 transition-opacity hover:opacity-80"
                                    style={{ color: p.color, fontFamily:"var(--font-body)" }}>
                                    <i className="fa-solid fa-arrow-up-right-from-square text-xs" />
                                    {(profileData.socials as any)[p.key]}
                                  </a>
                                : <p className="text-sm" style={{ color:"var(--text-muted)", fontFamily:"var(--font-body)" }}>Not set</p>
                            }
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Sidebar */}
                  <div className="space-y-4">
                    {/* Membership card */}
                    <div className="p-5 rounded-sm overflow-hidden relative"
                      style={{ background:`linear-gradient(135deg,${tierColor}20,#1A1A2E)`, border:`1px solid ${tierColor}40` }}>
                      <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10"
                        style={{ background:tierColor, transform:"translate(30%,-30%)" }} />
                      <div className="flex items-center gap-2 mb-4">
                        <i className="fa-solid fa-id-card text-sm" style={{ color:tierColor }} />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-white" style={{ fontFamily:"var(--font-heading)" }}>Membership Card</h3>
                      </div>
                      <div className="space-y-2">
                        {[
                          ["Membership #", user.membershipNumber],
                          ["Full Name",    `${user.firstName} ${user.lastName}`],
                          ["Tier",         `${user.tier} Member`],
                          ["Branch",       user.branch],
                          ["Member Since",  memberSince.yearsDisplay],
                          ["Renewal Due",  user.renewalDue],
                        ].map(([k,v]) => (
                          <div key={k} className="flex justify-between text-xs">
                            <span style={{ color:"var(--text-muted)", fontFamily:"var(--font-body)" }}>{k}</span>
                            <span style={{ color: k==="Membership #" ? tierColor : "var(--text-secondary)", fontFamily:"var(--font-body)", fontWeight: k==="Membership #" ? 700 : 400 }}>{v}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 pt-3" style={{ borderTop:`1px solid ${tierColor}30` }}>
                        <div className="flex items-center gap-1.5">
                          <i className={`fa-solid ${user.status==="Active"?"fa-circle-check":"fa-circle-xmark"} text-xs`}
                            style={{ color: user.status==="Active" ? "#2ECC71" : "#E74C3C" }} />
                          <span className="text-xs font-bold"
                            style={{ color: user.status==="Active" ? "#2ECC71" : "#E74C3C", fontFamily:"var(--font-heading)" }}>
                            {user.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick actions */}
                    <div className="p-5 rounded-sm" style={cardStyle}>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-3" style={{ fontFamily:"var(--font-heading)" }}>Quick Actions</h3>
                      <div className="space-y-1.5">
                        {[
                          { label:"Request Match Ticket", href:"/members/tickets",    icon:"fa-solid fa-ticket" },
                          { label:"Book Event",           href:"/members/events",     icon:"fa-solid fa-calendar-plus" },
                          { label:"View Membership",      href:"/members/membership", icon:"fa-solid fa-crown" },
                          { label:"Community Forum",      href:"/members/community",  icon:"fa-solid fa-people-group" },
                          { label:"Make Donation",        href:"/members/donate",     icon:"fa-solid fa-heart" },
                        ].map(a => (
                          <Link key={a.label} href={a.href}
                            className="flex items-center gap-2.5 px-3 py-2.5 rounded-sm text-sm transition-all hover:bg-red-900/20 group"
                            style={{ color:"var(--text-secondary)", fontFamily:"var(--font-body)" }}>
                            <i className={`${a.icon} text-xs w-4 text-center flex-shrink-0`} style={{ color:"var(--color-red)" }} />
                            {a.label}
                            <i className="fa-solid fa-chevron-right text-[9px] ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* NOTIFICATIONS TAB — readable list of notifications */}
              {tab === "Notifications" && (
                <div className="max-w-2xl space-y-5">
                  {/* Preferences section */}
                  <div className="p-5 rounded-sm" style={{ background:"var(--bg-card)", border:"1px solid var(--border-color)" }}>
                    <h2 className="text-sm font-bold mb-1 uppercase tracking-wider" style={{ fontFamily:"var(--font-heading)", color:"var(--text-primary)" }}>
                      <i className="fa-solid fa-sliders mr-2" style={{ color:"var(--color-red)" }} />Notification Preferences
                    </h2>
                    <p className="text-xs mb-5" style={{ color:"var(--text-muted)" }}>
                      Choose how and when you receive notifications from ASC Ghana
                    </p>
                    <div className="space-y-1">
                      {[
                        { key:"email",     label:"Email Notifications",  desc:"Receive updates via email",          icon:"fa-solid fa-envelope" },
                        { key:"sms",       label:"SMS Notifications",    desc:"Receive SMS alerts (via Hubtel)",     icon:"fa-solid fa-mobile-screen-button" },
                        { key:"events",    label:"Event Updates",        desc:"New events and registrations",        icon:"fa-solid fa-calendar-days" },
                        { key:"tickets",   label:"Ticket Status Updates",desc:"Ticket approvals & changes",          icon:"fa-solid fa-ticket" },
                        { key:"renewals",  label:"Membership Renewals",  desc:"Renewal reminders & deadlines",       icon:"fa-solid fa-crown" },
                        { key:"community", label:"Community Mentions",   desc:"Replies & mentions in forum",         icon:"fa-solid fa-people-group" },
                      ].map(n => (
                        <div key={n.key} className="flex items-center justify-between py-3" style={{ borderBottom:"1px solid var(--border-color)" }}>
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0"
                              style={{ background:"rgba(227,6,19,0.1)" }}>
                              <i className={`${n.icon} text-xs`} style={{ color:"var(--color-red)" }} />
                            </div>
                            <div>
                              <p className="text-sm font-medium" style={{ fontFamily:"var(--font-body)", color:"var(--text-primary)" }}>{n.label}</p>
                              <p className="text-xs mt-0.5" style={{ color:"var(--text-muted)" }}>{n.desc}</p>
                            </div>
                          </div>
                          <button onClick={() => setNotif(n.key, !(profileData.notifications as any)[n.key])}
                            className="relative w-11 h-6 rounded-full transition-all flex-shrink-0"
                            style={{ background:(profileData.notifications as any)[n.key] ? "var(--color-red)" : "var(--bg-card-hover)" }}>
                            <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all"
                              style={{ left:(profileData.notifications as any)[n.key] ? "calc(100% - 22px)" : "2px", boxShadow:"0 1px 4px rgba(0,0,0,0.4)" }} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={saveNotificationPrefs}
                      disabled={saving} className="w-full btn-arsenal mt-5 py-2.5 text-sm">
                      {saving ? <><i className="fa-solid fa-spinner fa-spin mr-2" />Saving...</> : <><i className="fa-solid fa-save mr-2" />Save Preferences</>}
                    </button>
                  </div>

                  {/* Recent notifications inbox */}
                  <div className="p-5 rounded-sm" style={{ background:"var(--bg-card)", border:"1px solid var(--border-color)" }}>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-sm font-bold uppercase tracking-wider" style={{ fontFamily:"var(--font-heading)", color:"var(--text-primary)" }}>
                        <i className="fa-solid fa-inbox mr-2" style={{ color:"var(--color-red)" }} />Recent Notifications
                      </h2>
                      {unreadNotifs > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                          style={{ background:"rgba(227,6,19,0.12)", color:"var(--color-red)", fontFamily:"var(--font-heading)" }}>
                          {unreadNotifs} new
                        </span>
                      )}
                    </div>
                    {notifsLoading ? (
                      <div className="py-8 text-center text-sm" style={{ color:"var(--text-muted)" }}>
                        <i className="fa-solid fa-spinner fa-spin mr-2" />Loading notifications…
                      </div>
                    ) : memberNotifs.length === 0 ? (
                      <div className="py-10 text-center rounded-sm" style={{ background:"var(--bg-card-alt)", border:"1px dashed var(--border-color)" }}>
                        <i className="fa-solid fa-bell-slash text-2xl mb-3 block" style={{ color:"var(--text-muted)" }} />
                        <p className="text-sm font-bold" style={{ color:"var(--text-primary)", fontFamily:"var(--font-heading)" }}>No notifications yet</p>
                        <p className="text-xs mt-1" style={{ color:"var(--text-muted)" }}>Updates about tickets, renewals, and events will appear here.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {memberNotifs.map((notif) => {
                          const vis = NOTIF_VISUAL[notif.category || notif.type || "system"] || NOTIF_VISUAL.system;
                          const read = Boolean(notif.isRead);
                          const inner = (
                            <>
                              <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                                style={{ background: vis.bg }}>
                                <i className={`${notif.icon || "fa-solid fa-bell"} text-sm`} style={{ color: vis.color }} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <p className="text-xs font-semibold" style={{ fontFamily:"var(--font-heading)", color:"var(--text-primary)" }}>
                                    {notif.title}
                                  </p>
                                  {!read && (
                                    <span className="w-2 h-2 rounded-full flex-shrink-0 mt-1" style={{ background:"var(--color-red)" }} />
                                  )}
                                </div>
                                <p className="text-xs mt-0.5" style={{ color:"var(--text-secondary)", fontFamily:"var(--font-body)", lineHeight:1.5 }}>
                                  {notif.message}
                                </p>
                                <p className="text-[10px] mt-1" style={{ color:"var(--text-muted)" }}>{formatTimeAgo(notif.createdAt)}</p>
                              </div>
                            </>
                          );
                          const rowClass = "flex gap-3 p-3 rounded-sm transition-all cursor-pointer nav-interactive";
                          const rowStyle = {
                            background: read ? "transparent" : "rgba(227,6,19,0.04)",
                            border:"1px solid var(--border-color)",
                          };
                          return notif.linkHref ? (
                            <Link key={notif.id} href={notif.linkHref} onClick={() => !read && markNotifRead(notif.id)}
                              className={rowClass} style={rowStyle}>{inner}</Link>
                          ) : (
                            <div key={notif.id} onClick={() => !read && markNotifRead(notif.id)}
                              className={rowClass} style={rowStyle}>{inner}</div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SETTINGS TAB */}

              {tab === "Social" && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="text-base font-black mb-0.5" style={{ fontFamily:"var(--font-heading)", color:"var(--text-primary)" }}>Social Media Accounts</h3>
                      <p className="text-xs" style={{ color:"var(--text-muted)" }}>Link your social media profiles to your member card.</p>
                    </div>
                    {!socialEdit
                      ? <button onClick={() => setSocialEdit(true)} className="btn-arsenal text-xs px-4 py-2"><i className="fa-solid fa-pen" />Edit</button>
                      : <div className="flex gap-2">
                          <button onClick={() => setSocialEdit(false)} className="text-xs px-4 py-2 font-bold" style={{ color:"var(--text-muted)", border:"1px solid var(--border-color)", fontFamily:"var(--font-heading)" }}>Cancel</button>
                          <button onClick={saveSocial} className="btn-arsenal text-xs px-4 py-2"><i className="fa-solid fa-save" />Save</button>
                        </div>
                    }
                  </div>
                  {[
                    { key:"facebook",  icon:"fa-brands fa-facebook",  label:"Facebook",  color:"#1877F2", placeholder:"https://facebook.com/yourname" },
                    { key:"instagram", icon:"fa-brands fa-instagram",  label:"Instagram", color:"#E4405F", placeholder:"https://instagram.com/yourname" },
                    { key:"twitter",   icon:"fa-brands fa-x-twitter",  label:"X / Twitter",color:"#000",   placeholder:"https://x.com/yourhandle" },
                    { key:"youtube",   icon:"fa-brands fa-youtube",    label:"YouTube",   color:"#FF0000", placeholder:"https://youtube.com/@yourchannel" },
                    { key:"tiktok",    icon:"fa-brands fa-tiktok",     label:"TikTok",    color:"#69C9D0", placeholder:"https://tiktok.com/@yourname" },
                    { key:"linkedin",  icon:"fa-brands fa-linkedin",   label:"LinkedIn",  color:"#0A66C2", placeholder:"https://linkedin.com/in/yourname" },
                  ].map(({ key, icon, label, color, placeholder }) => {
                    const val = (socialForm as any)[key] || "";
                    const saved = (user as any)?.socialAccounts?.[key] || "";
                    return (
                      <div key={key} className="flex items-center gap-4 p-3 rounded-sm" style={{ background:"var(--bg-card)", border:"1px solid var(--border-subtle)" }}>
                        <div className="w-10 h-10 flex items-center justify-center rounded-sm flex-shrink-0" style={{ background:`${color}15`, border:`1px solid ${color}30` }}>
                          <i className={`${icon} text-lg`} style={{ color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold mb-1" style={{ color:"var(--text-primary)", fontFamily:"var(--font-heading)" }}>{label}</p>
                          {socialEdit ? (
                            <input
                              value={val}
                              onChange={e => setSocialForm(p=>({...p,[key]:e.target.value}))}
                              placeholder={placeholder}
                              className="w-full text-xs bg-transparent outline-none"
                              style={{ color:"var(--text-secondary)", borderBottom:"1px solid var(--border-accent)", paddingBottom:"2px" }}
                            />
                          ) : (
                            saved
                              ? <a href={saved} target="_blank" rel="noopener noreferrer" className="text-xs truncate block" style={{ color }}>{saved}</a>
                              : <p className="text-xs" style={{ color:"var(--text-disabled)" }}>Not linked</p>
                          )}
                        </div>
                        {!socialEdit && saved && (
                          <a href={saved} target="_blank" rel="noopener noreferrer"
                            className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-sm transition-colors"
                            style={{ background:`${color}10`, color }}>
                            <i className="fa-solid fa-arrow-up-right-from-square text-xs" />
                          </a>
                        )}
                      </div>
                    );
                  })}
                  <p className="text-xs" style={{ color:"var(--text-muted)" }}>
                    <i className="fa-solid fa-lock mr-1.5" />Your social links are visible on your member profile to other members.
                  </p>
                </div>
              )}

              {tab === "Settings" && (
                <SettingsTab user={user} />
              )}

              {/* Tickets & Events tabs */}
              {(tab === "Tickets" || tab === "Events") && (
                <div className="py-16 text-center rounded-sm" style={cardStyle}>
                  <i className={`${tab==="Tickets"?"fa-solid fa-ticket":"fa-solid fa-calendar-days"} text-4xl mb-4 block`} style={{ color:"var(--text-muted)" }} />
                  <p className="font-bold mb-1" style={{ fontFamily:"var(--font-heading)", color:"var(--text-primary)" }}>Your {tab}</p>
                  <p className="text-sm mb-5" style={{ color:"var(--text-muted)" }}>View your {tab.toLowerCase()} history and upcoming bookings</p>
                  <Link href={tab==="Tickets"?"/members/tickets":"/members/events"} className="btn-arsenal text-sm px-6 py-2.5 inline-flex items-center gap-2">
                    <i className={`${tab==="Tickets"?"fa-solid fa-ticket":"fa-solid fa-calendar-plus"}`} />View {tab}
                  </Link>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      <Footer />
    </main>
  );
}
