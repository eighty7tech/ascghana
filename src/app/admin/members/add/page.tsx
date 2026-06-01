"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useApp } from "@/context/AppContext";
import type { Member } from "@/context/AppContext";
import {
  FormSection,
  FormField,
  FormInput,
  FormSelect,
  FormPasswordInput,
  FormGrid,
} from "@/components/forms/ModernForm";

const BRANCHES = ["Ashanti","Accra","Ladies","Sunyani","Volta","Central","Northern Regions","Eastern","Western","Tema"];
const TIERS    = ["Bronze","Silver","Gold","Platinum","Abusua"];
const ROLES    = ["member","editor","moderator","membership_officer","event_coordinator","ticket_manager","events_moderator","admin"];

export default function AddMemberPage() {
  const { members, setMembers, addAdminNotification } = useApp();
  const router = useRouter();

  const [form, setForm] = useState({
    firstName:"", lastName:"", dateOfBirth:"", email:"",
    address:"", postGPS:"", phone:"", whatsapp:"",
    membershipNumber:"", tier:"Bronze", branch:"Accra",
    role:"member", password:"", confirmPassword:"",
  });
  const [loading, setLoading]     = useState(false);

  // Controlled input handler — no autoReset issues
  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  // Auto-generate next membership number
  const nextNumber = () => {
    const nums = members
      .map(m => parseInt(m.membershipNumber, 10))
      .filter(n => !isNaN(n));
    const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
    return String(next).padStart(5, "0");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.firstName.trim()) { toast.error("First name is required"); return; }
    if (!form.lastName.trim())  { toast.error("Last name is required");  return; }
    if (!form.email.trim())     { toast.error("Email is required");       return; }
    if (!form.phone.trim())     { toast.error("Phone number is required"); return; }
    if (!form.password)         { toast.error("Password is required");    return; }
    if (form.password !== form.confirmPassword) { toast.error("Passwords do not match"); return; }
    if (form.password.length < 8) { toast.error("Password must be at least 8 characters"); return; }

    // Validate / auto-generate membership number
    let memberNum = form.membershipNumber.trim();
    if (!memberNum) {
      memberNum = nextNumber();
    } else {
      if (!/^\d{5}$/.test(memberNum)) { toast.error("Membership number must be exactly 5 digits"); return; }
      if (members.find(m => m.membershipNumber === memberNum)) {
        toast.error(`Membership number ${memberNum} is already taken`); return;
      }
    }

    // Check email uniqueness
    if (members.find(m => m.email.toLowerCase() === form.email.toLowerCase())) {
      toast.error("A member with this email already exists"); return;
    }

    setLoading(true);
    await new Promise(r => setTimeout(r, 600));

    const newMember: Member = {
      id: members.length > 0
        ? Math.max(...members.map((m: any) => typeof m.id === "number" ? m.id : parseInt(String(m.id),10) || 0)) + 1
        : 1,
      membershipNumber: memberNum,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      name: `${form.firstName.trim()} ${form.lastName.trim()}`,
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      whatsapp: form.whatsapp.trim() || form.phone.trim(),
      dateOfBirth: form.dateOfBirth,
      address: form.address.trim(),
      postGPS: form.postGPS.trim(),
      branch: form.branch,
      tier: form.tier,
      status: "Active",
      joined: String(new Date().getFullYear()), // 4-digit year only
      renewalDue: (() => { const now = new Date(); const endYear = now.getMonth() >= 4 ? now.getFullYear()+1 : now.getFullYear(); return `May 31, ${endYear}`; })(),
      role: form.role as Member["role"],
      password: form.password,
    };

    // Persist to the database-backed AppContext.
    setMembers([...members, newMember]);

    setLoading(false);
    toast.success(`✅ Member ${newMember.firstName} ${newMember.lastName} (#${memberNum}) added!`);
    addAdminNotification("New Member Added", `${newMember.firstName} ${newMember.lastName} (#${memberNum}) has been registered as a ${newMember.tier} member.`, "success");
    router.push("/admin/members");
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/members" className="p-2 transition-colors hover:text-white" style={{ color:"rgba(255,255,255,0.4)" }}>
          <i className="fa-solid fa-arrow-left" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white" style={{ fontFamily:"var(--font-display)" }}>Add New Member</h1>
          <p className="text-xs mt-0.5" style={{ color:"rgba(255,255,255,0.4)", fontFamily:"var(--font-body)" }}>
            Member will be able to log in immediately after creation
          </p>
        </div>
        <div className="ml-auto px-3 py-1 rounded-sm text-xs font-bold"
          style={{ background:"rgba(46,204,113,0.1)", border:"1px solid rgba(46,204,113,0.3)", color:"#2ECC71", fontFamily:"var(--font-heading)" }}>
          {members.length} members in DB
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">

        <FormSection title="Personal Information" icon="fa-solid fa-user">
          <FormGrid>
            <FormField label="First Name" icon="fa-solid fa-user" required>
              <FormInput value={form.firstName} onChange={e => handleChange("firstName", e.target.value)} placeholder="Kwame" autoComplete="off" />
            </FormField>
            <FormField label="Last Name" icon="fa-solid fa-user" required>
              <FormInput value={form.lastName} onChange={e => handleChange("lastName", e.target.value)} placeholder="Asante" autoComplete="off" />
            </FormField>
            <FormField label="Date of Birth" icon="fa-solid fa-cake-candles">
              <FormInput type="date" value={form.dateOfBirth} onChange={e => handleChange("dateOfBirth", e.target.value)} />
            </FormField>
            <FormField label="Email Address" icon="fa-solid fa-envelope" required>
              <FormInput type="email" value={form.email} onChange={e => handleChange("email", e.target.value)} placeholder="kwame@example.com" autoComplete="off" />
            </FormField>
            <FormField label="Address" icon="fa-solid fa-location-dot" className="sm:col-span-2">
              <FormInput value={form.address} onChange={e => handleChange("address", e.target.value)} placeholder="123 Ring Road, Accra" />
            </FormField>
            <FormField label="Post GPS" icon="fa-solid fa-map-pin">
              <FormInput value={form.postGPS} onChange={e => handleChange("postGPS", e.target.value)} placeholder="GH-1234-5678" />
            </FormField>
          </FormGrid>
        </FormSection>

        <FormSection title="Contact Details" icon="fa-solid fa-phone">
          <FormGrid>
            <FormField label="Phone Number" icon="fa-solid fa-phone" required>
              <FormInput type="tel" value={form.phone} onChange={e => handleChange("phone", e.target.value)} placeholder="+233201234567" />
            </FormField>
            <FormField label="WhatsApp Number" icon="fa-brands fa-whatsapp">
              <FormInput type="tel" value={form.whatsapp} onChange={e => handleChange("whatsapp", e.target.value)} placeholder="+233201234567" />
            </FormField>
          </FormGrid>
        </FormSection>

        <FormSection title="Membership Details" icon="fa-solid fa-id-card">
          <FormGrid>
            <FormField label="Membership Number" icon="fa-solid fa-hashtag" hint={`Next available: #${nextNumber()} — leave blank to auto-assign`}>
              <div className="flex gap-2">
                <FormInput
                  className="flex-1"
                  value={form.membershipNumber}
                  onChange={e => handleChange("membershipNumber", e.target.value.replace(/\D/g, "").slice(0, 5))}
                  placeholder="Auto-generate"
                  maxLength={5}
                />
                <button
                  type="button"
                  onClick={() => handleChange("membershipNumber", nextNumber())}
                  className="px-3 h-11 text-xs whitespace-nowrap rounded-lg transition-colors hover:bg-white/10"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}
                >
                  Auto
                </button>
              </div>
            </FormField>
            <FormField label="Membership Tier" icon="fa-solid fa-crown" required>
              <FormSelect value={form.tier} onChange={e => handleChange("tier", e.target.value)}>
                {TIERS.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </FormSelect>
            </FormField>
            <FormField label="Branch / Region" icon="fa-solid fa-location-pin" required>
              <FormSelect value={form.branch} onChange={e => handleChange("branch", e.target.value)}>
                {BRANCHES.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </FormSelect>
            </FormField>
            <FormField label="Role" icon="fa-solid fa-shield-halved">
              <FormSelect value={form.role} onChange={e => handleChange("role", e.target.value)}>
                {ROLES.map(r => (
                  <option key={r} value={r}>{r.replace(/_/g, " ")}</option>
                ))}
              </FormSelect>
            </FormField>
          </FormGrid>
        </FormSection>

        <FormSection
          title="Login Password"
          icon="fa-solid fa-lock"
          description="Member signs in at /auth/login with their membership number and this password."
        >
          <FormGrid>
            <FormField label="Password" icon="fa-solid fa-key" required>
              <FormPasswordInput value={form.password} onChange={v => handleChange("password", v)} placeholder="Min. 8 characters" autoComplete="new-password" />
            </FormField>
            <FormField label="Confirm Password" icon="fa-solid fa-key" required error={form.password && form.confirmPassword && form.password !== form.confirmPassword ? "Passwords do not match" : undefined}>
              <FormPasswordInput value={form.confirmPassword} onChange={v => handleChange("confirmPassword", v)} placeholder="Repeat password" autoComplete="new-password" />
            </FormField>
          </FormGrid>
        </FormSection>

        {/* Summary preview */}
        {form.firstName && form.lastName && (
          <div className="p-4 rounded-sm" style={{ background:"rgba(239,1,7,0.05)", border:"1px solid rgba(239,1,7,0.15)" }}>
            <p className="text-xs mb-1" style={{ color:"rgba(255,255,255,0.4)", fontFamily:"var(--font-heading)" }}>MEMBER PREVIEW</p>
            <p className="text-white font-bold" style={{ fontFamily:"var(--font-display)" }}>
              {form.firstName} {form.lastName}
              <span className="ml-3 text-sm font-normal" style={{ color:"var(--color-gold)" }}>
                #{form.membershipNumber || nextNumber()}
              </span>
            </p>
            <p className="text-xs mt-0.5" style={{ color:"rgba(255,255,255,0.5)" }}>
              {form.tier} · {form.branch} · {form.email || "no email"}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <Link href="/admin/members"
            className="px-5 py-2.5 text-sm transition-colors hover:text-white"
            style={{ color:"rgba(255,255,255,0.45)", fontFamily:"var(--font-heading)" }}>
            <i className="fa-solid fa-xmark mr-1.5" />Cancel
          </Link>
          <button type="submit" disabled={loading}
            className="btn-arsenal px-8 py-3 text-sm" style={{ opacity:loading ? 0.7 : 1 }}>
            {loading
              ? <><i className="fa-solid fa-spinner fa-spin mr-2" />Adding Member...</>
              : <><i className="fa-solid fa-user-plus mr-2" />Add Member</>
            }
          </button>
        </div>
      </form>
    </div>
  );
}
