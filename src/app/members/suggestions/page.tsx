"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import MembershipGate from "@/components/MembershipGate";
import { useApp } from "@/context/AppContext";
import toast from "react-hot-toast";

const STATUS_STYLES: Record<string,{color:string;bg:string}> = {
  "New":{ color:"#F59E0B", bg:"rgba(245,158,11,0.12)" },
  "Under Review":{ color:"#3B82F6", bg:"rgba(59,130,246,0.12)" },
  "Implemented":{ color:"#10B981", bg:"rgba(16,185,129,0.12)" },
  "Dismissed":{ color:"#6B7280", bg:"rgba(107,114,128,0.12)" },
};

export default function MemberSuggestionsPage() {
  const { user, isLoggedIn, isActiveMember, isFrozen, isExpired } = useAuth();
  const { suggestions, addSuggestion } = useApp();
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { if(!isLoggedIn) router.push("/auth/login"); }, [isLoggedIn]);
  if (!isLoggedIn || !user) return null;

  const mySuggestions = suggestions.filter(s => s.memberNumber === user.membershipNumber);

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) { toast.error("Please fill in subject and message"); return; }
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 900));
    addSuggestion({ memberId:String(user.id), memberName:user.name, memberNumber:user.membershipNumber, tier:user.tier, subject:subject.trim(), message:message.trim() });
    setSubject(""); setMessage("");
    setSubmitting(false);
    toast.success("Suggestion submitted to the executive committee!");
  };

  const inp = "w-full px-3 py-2.5 text-sm bg-white/5 border border-white/10 rounded-sm text-white placeholder-white/25 outline-none focus:border-[#EF0107] transition-colors";

  return (
    <main style={{ background:"var(--bg-primary)" }}>
      <Navbar />
      <MembershipGate featureName="Suggestions">
      <div className="pt-32 pb-20 max-w-2xl mx-auto px-6 space-y-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 text-xs font-bold uppercase tracking-widest rounded-sm"
            style={{ background:"rgba(239,1,7,0.1)", border:"1px solid rgba(239,1,7,0.2)", color:"var(--color-red)", fontFamily:"var(--font-heading)" }}>
            <i className="fa-solid fa-lightbulb" />Suggestion Box
          </div>
          <h1 className="text-3xl font-black" style={{ fontFamily:"var(--font-display)", color:"var(--text-primary)" }}>SHARE YOUR IDEAS</h1>
          <p className="text-sm mt-2" style={{ color:"var(--text-secondary)" }}>Submit suggestions directly to the executive committee</p>
        </div>

        {/* Submit form */}
        <div className="p-5 rounded-sm space-y-4" style={{ background:"var(--bg-card)", border:"1px solid var(--border-color)" }}>
          <h2 className="text-sm font-bold uppercase tracking-wider" style={{ fontFamily:"var(--font-heading)", color:"var(--text-primary)" }}>New Suggestion</h2>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color:"rgba(255,255,255,0.4)", fontFamily:"var(--font-heading)" }}>
              <i className="fa-solid fa-heading text-[10px] mr-1.5" style={{ color:"var(--color-red)" }} />Subject *
            </label>
            <input value={subject} onChange={e=>setSubject(e.target.value)} placeholder="Brief subject of your suggestion…" className={inp} />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color:"rgba(255,255,255,0.4)", fontFamily:"var(--font-heading)" }}>
              <i className="fa-solid fa-comment text-[10px] mr-1.5" style={{ color:"var(--color-red)" }} />Your Suggestion *
            </label>
            <textarea value={message} onChange={e=>setMessage(e.target.value)} rows={4}
              placeholder="Describe your idea or feedback in detail…"
              className={`${inp} resize-y`} />
          </div>
          <button onClick={handleSubmit} disabled={submitting||!subject.trim()||!message.trim()}
            className="btn-arsenal px-6 py-2.5 text-sm disabled:opacity-50 inline-flex items-center gap-2">
            {submitting ? <><i className="fa-solid fa-spinner fa-spin" />Submitting…</> : <><i className="fa-solid fa-paper-plane" />Submit to Committee</>}
          </button>
        </div>

        {/* My suggestions */}
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ fontFamily:"var(--font-heading)", color:"var(--text-primary)" }}>
            My Submissions ({mySuggestions.length})
          </h2>
          {mySuggestions.length === 0 ? (
            <p className="text-sm py-4" style={{ color:"var(--text-muted)" }}>No suggestions submitted yet</p>
          ) : (
            <div className="space-y-3">
              {mySuggestions.map(s => {
                const sc = STATUS_STYLES[s.status] || STATUS_STYLES["New"];
                return (
                  <div key={s.id} className="p-4 rounded-sm" style={{ background:"var(--bg-card)", border:"1px solid var(--border-color)" }}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <p className="font-semibold text-sm" style={{ color:"var(--text-primary)", fontFamily:"var(--font-heading)" }}>{s.subject}</p>
                      <span className="text-[10px] px-2 py-0.5 rounded-sm font-bold flex-shrink-0"
                        style={{ background:sc.bg, color:sc.color, fontFamily:"var(--font-heading)" }}>
                        {s.status}
                      </span>
                    </div>
                    <p className="text-xs mb-2" style={{ color:"var(--text-secondary)", fontFamily:"var(--font-body)", lineHeight:1.6 }}>{s.message}</p>
                    {s.adminReply && (
                      <div className="mt-2 p-3 rounded-sm text-xs" style={{ background:"rgba(239,1,7,0.06)", borderLeft:"2px solid rgba(239,1,7,0.3)" }}>
                        <p className="font-bold mb-1" style={{ color:"var(--color-red)", fontFamily:"var(--font-heading)" }}>Committee Response:</p>
                        <p style={{ color:"var(--text-secondary)" }}>{s.adminReply}</p>
                      </div>
                    )}
                    <p className="text-[10px] mt-2" style={{ color:"var(--text-muted)" }}>
                      Submitted {new Date(s.submittedAt).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <Footer />
          </MembershipGate>
      </main>
  );
}
