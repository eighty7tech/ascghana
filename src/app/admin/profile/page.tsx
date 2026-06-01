"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FormSection, FormField, FormInput, FormTextarea } from "@/components/forms/ModernForm";

export default function AdminProfilePage() {
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/profile", { cache: "no-store" })
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (!d) return;
        setUsername(d.username || "");
        setRole(d.role || "");
        setDisplayName(d.profile?.displayName || "");
        setEmail(d.profile?.email || "");
        setPhone(d.profile?.phone || "");
        setBio(d.profile?.bio || "");
        setJobTitle(d.profile?.jobTitle || "");
        setPhotoUrl(d.profile?.photoUrl || "");
      });
  }, []);

  const uploadPhoto = async (file: File) => {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "admin");
    try {
      const res = await fetch("/api/uploads", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setPhotoUrl(data.url);
      toast.success("Photo uploaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    }
    setUploading(false);
  };

  const save = async () => {
    setSaving(true);
    const res = await fetch("/api/admin/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName, email, phone, bio, jobTitle, photoUrl }),
    });
    setSaving(false);
    if (res.ok) toast.success("Profile saved — refresh admin to see header photo");
    else toast.error("Save failed");
  };

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-black text-white" style={{ fontFamily: "var(--font-display)" }}>
          ADMIN PROFILE
        </h1>
        <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
          Photo and details appear in the admin sidebar and top bar
        </p>
      </div>

      <FormSection title="Profile photo" icon="fa-solid fa-camera">
        <div className="flex items-center gap-4">
          <div
            className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center text-2xl font-black flex-shrink-0"
            style={{
              background: photoUrl ? "transparent" : "linear-gradient(135deg,#C6A84B,#E8C97A)",
              color: "#1A0A0A",
              border: "2px solid rgba(198,168,75,0.4)",
            }}
          >
            {photoUrl ? (
              <img src={photoUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              displayName?.[0] || username?.[0] || "A"
            )}
          </div>
          <label className="btn-arsenal px-4 py-2 text-xs cursor-pointer inline-block">
            {uploading ? "Uploading…" : "Upload photo"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={e => {
                const f = e.target.files?.[0];
                if (f) uploadPhoto(f);
              }}
            />
          </label>
        </div>
        <FormField label="Or paste image URL" className="mt-4">
          <FormInput value={photoUrl} onChange={e => setPhotoUrl(e.target.value)} placeholder="https://..." />
        </FormField>
      </FormSection>

      <FormSection title="Account" icon="fa-solid fa-user">
        <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>
          Username: <strong className="text-white">{username}</strong> · Role:{" "}
          <strong className="text-white">{role}</strong>
        </p>
        <FormField label="Display name" required>
          <FormInput value={displayName} onChange={e => setDisplayName(e.target.value)} />
        </FormField>
        <FormField label="Job title" className="mt-3">
          <FormInput value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="e.g. Membership Officer" />
        </FormField>
        <FormField label="Email" className="mt-3">
          <FormInput type="email" value={email} onChange={e => setEmail(e.target.value)} />
        </FormField>
        <FormField label="Phone" className="mt-3">
          <FormInput value={phone} onChange={e => setPhone(e.target.value)} />
        </FormField>
        <FormField label="Bio" className="mt-3">
          <FormTextarea value={bio} onChange={e => setBio(e.target.value)} rows={3} />
        </FormField>
      </FormSection>

      <button onClick={save} disabled={saving} className="btn-arsenal px-6 py-3 text-sm">
        {saving ? "Saving…" : "Save profile"}
      </button>
    </div>
  );
}
