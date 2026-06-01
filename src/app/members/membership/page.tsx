"use client";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { getRenewalFee, getCurrentSeason, isRenewalWindow, formatMemberSince } from "@/lib/membershipUtils";
import { useApp } from "@/context/AppContext";
import { Badge, Button } from "@/components/ui";
import toast from "react-hot-toast";

const TIER_COLORS: Record<string, string> = {
  Platinum: "#6B7280", Gold: "#C6A84B", Silver: "#9CA3AF", Bronze: "#B45309", Abusua: "#15803D",
};

type MembershipRequest = {
  id: string;
  requestType: string;
  requestedTier: string;
  currentTier?: string;
  amount: number;
  status: string;
  submittedAt: string;
  memberDetails?: {
    status: string;
    joinDate: string;
    renewalDue: string;
  };
};

function calcTierFee(
  action: string | null,
  isCurrent: boolean,
  isExpired: boolean,
  tier: { name: string; price: number; renewalPrice: number },
  userTier: string,
  tiers: { name: string; price: number; renewalPrice: number }[]
): number {
  const renewalFee = getRenewalFee();
  if (action === "renew" || isCurrent) {
    return isExpired ? renewalFee : (tier.renewalPrice || renewalFee);
  }
  if (action === "upgrade") {
    const from = tiers.find(t => t.name === userTier);
    return Math.max(0, tier.price - (from?.price || 0)) || tier.price;
  }
  if (action === "downgrade") {
    return tier.renewalPrice || renewalFee;
  }
  return tier.renewalPrice || renewalFee;
}

function MembershipContent() {
  const { user, isLoggedIn, refreshUser } = useAuth();
  const { tiers } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const action = searchParams.get("action");

  const [selected, setSelected] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [notes, setNotes] = useState("");
  const [history, setHistory] = useState<MembershipRequest[]>([]);
  const [pendingRequest, setPendingRequest] = useState<MembershipRequest | null>(null);

  useEffect(() => {
    if (!isLoggedIn) router.push("/auth/login");
  }, [isLoggedIn, router]);

  useEffect(() => {
    if (!isLoggedIn) return;
    refreshUser().catch(() => {});
    fetch("/api/memberships/requests", { cache: "no-store" })
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        const reqs = (d?.requests || []) as MembershipRequest[];
        setHistory(reqs);
        setPendingRequest(reqs.find(r => r.status === "Pending") || null);
      })
      .catch(() => {});
  }, [isLoggedIn]);

  if (!isLoggedIn || !user) return null;

  const currentTier = tiers.find(t => t.name === user.tier);
  const tierOrder = ["Bronze", "Abusua", "Silver", "Gold", "Platinum"];
  const currentIdx = tierOrder.indexOf(user.tier);
  const renewalWindow = isRenewalWindow();
  const renewalFee = getRenewalFee();
  const season = getCurrentSeason();
  const isExpired = user.status === "Expired" || user.status === "Pending Renewal";

  const availableForAction = action === "downgrade"
    ? tiers.filter(t => tierOrder.indexOf(t.name) < currentIdx)
    : action === "upgrade"
    ? tiers.filter(t => tierOrder.indexOf(t.name) > currentIdx)
    : tiers;

  const handleProcess = async (tierName: string) => {
    if (!tierName || processing) return;
    setProcessing(true);
    try {
      const res = await fetch("/api/memberships/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestedTier: tierName,
          requestType: action || "renew",
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      toast.success("Request submitted! An admin will review and confirm your payment.");
      router.push("/members/dashboard");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to submit request");
    } finally {
      setProcessing(false);
    }
  };

  const displayTiers = availableForAction.length > 0 ? availableForAction : tiers;

  return (
    <main style={{ background: "var(--bg-primary)" }}>
      <Navbar />
      <div className="pt-32 pb-20 max-w-5xl mx-auto px-6">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 text-xs font-bold uppercase tracking-widest rounded-sm"
            style={{ background: "rgba(198,168,75,0.1)", border: "1px solid rgba(198,168,75,0.2)", color: "var(--color-gold)", fontFamily: "var(--font-heading)" }}>
            <i className="fa-solid fa-crown" />My Membership
          </div>
          <h1 className="text-4xl font-black" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
            {action === "upgrade" ? "UPGRADE TIER" : action === "downgrade" ? "DOWNGRADE TIER" : "RENEW MEMBERSHIP"}
          </h1>
          <p className="text-sm mt-2 text-muted-foreground">
            Season {season.label} · Member since {formatMemberSince(user.joinDate).yearsDisplay}
          </p>
        </div>

        {pendingRequest && (
          <div className="p-4 rounded-sm mb-6 flex items-start gap-3"
            style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)" }}>
            <i className="fa-solid fa-clock mt-0.5" style={{ color: "#F59E0B" }} />
            <div>
              <p className="text-sm font-bold" style={{ color: "#F59E0B" }}>Pending admin approval</p>
              <p className="text-xs mt-0.5 text-muted-foreground">
                Your {pendingRequest.requestType} request to {pendingRequest.requestedTier} (GH₵{pendingRequest.amount.toLocaleString()}) is awaiting review.
              </p>
            </div>
          </div>
        )}

        {/* Current status card */}
        <div className="p-5 rounded-sm mb-8" style={{ background: "#EEEEEE", border: `1px solid ${TIER_COLORS[user.tier] || "#C6A84B"}40` }}>
          <div className="flex flex-wrap items-center gap-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: `${TIER_COLORS[user.tier] || "#C6A84B"}20` }}>
              <i className={`${currentTier?.icon || "fa-solid fa-star"} text-2xl`} style={{ color: TIER_COLORS[user.tier] || "#C6A84B" }} />
            </div>
            <div className="flex-1">
              <p className="text-xl font-black" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
                {user.firstName} {user.lastName}
              </p>
              <p className="text-sm" style={{ color: TIER_COLORS[user.tier] || "#C6A84B" }}>
                {user.tier} Member · #{user.membershipNumber}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <Badge variant={user.status === "Active" ? "success" : "warning"}>{user.status}</Badge>
                {user.renewalDue && (
                  <span className="text-xs text-muted-foreground">Renewal due: {user.renewalDue}</span>
                )}
              </div>
            </div>
            {isExpired && (
              <Badge variant="danger">Membership Expired</Badge>
            )}
          </div>
          {!renewalWindow && !action && (
            <div className="mt-4 p-3 rounded-sm" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
              <p className="text-xs" style={{ color: "#F59E0B" }}>
                <i className="fa-solid fa-triangle-exclamation mr-2" />
                Renewal window is May 1 – May 31. Requests outside this window require admin approval.
              </p>
            </div>
          )}
        </div>

        {/* Quick actions */}
        {!action && (
          <div className="flex flex-wrap gap-2 mb-8">
            <Link href="/members/membership?action=upgrade" className="no-underline">
              <Button variant="gold" size="sm"><i className="fa-solid fa-arrow-up" />Upgrade</Button>
            </Link>
            <Link href="/members/membership?action=renew" className="no-underline">
              <Button variant="primary" size="sm"><i className="fa-solid fa-rotate" />Renew</Button>
            </Link>
            <Link href="/members/membership?action=downgrade" className="no-underline">
              <Button variant="secondary" size="sm"><i className="fa-solid fa-arrow-down" />Downgrade</Button>
            </Link>
          </div>
        )}

        <h2 className="text-xl font-black mb-5" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
          {action === "upgrade" ? "Available Upgrades" : action === "downgrade" ? "Downgrade Options" : "Select Tier"}
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {displayTiers.map(tier => {
            const isCurrent = tier.name === user.tier;
            const tierColor = TIER_COLORS[tier.name] || "#C6A84B";
            const isSelected = selected === tier.name;
            const fee = calcTierFee(action, isCurrent, isExpired, tier, user.tier, tiers);

            return (
              <button key={tier.id} onClick={() => !isCurrent && !pendingRequest && setSelected(tier.name)}
                disabled={isCurrent || !!pendingRequest}
                className="p-5 rounded-sm text-left transition-all disabled:opacity-60 no-underline"
                style={{
                  background: isSelected ? "rgba(239,1,7,0.06)" : "#EEEEEE",
                  border: `1px solid ${isSelected ? "var(--color-red)" : isCurrent ? `${tierColor}40` : "var(--border-color)"}`,
                }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: `${tierColor}20` }}>
                    <i className={`${tier.icon} text-lg`} style={{ color: tierColor }} />
                  </div>
                  <div>
                    <p className="font-black text-sm" style={{ color: tierColor, fontFamily: "var(--font-display)" }}>{tier.name}</p>
                    {isCurrent && <span className="text-[10px] font-bold" style={{ color: "#10B981" }}>Current</span>}
                    {tier.popular && !isCurrent && <span className="text-[10px] font-bold ml-1" style={{ color: "var(--color-gold)" }}>Popular</span>}
                  </div>
                </div>
                <p className="text-xl font-black mb-1" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
                  GH₵{fee.toLocaleString()}
                </p>
                <p className="text-[10px] mb-3 text-muted-foreground">
                  {action === "upgrade" ? "Upgrade fee (tier difference)"
                    : action === "downgrade" ? "Downgrade renewal rate"
                    : isCurrent ? `Renewal fee · Season ${season.label}`
                    : `Join fee · Renewal GH₵${renewalFee}`}
                </p>
                <ul className="space-y-1">
                  {tier.benefits.slice(0, 4).map(b => (
                    <li key={b} className="text-xs flex items-start gap-1.5 text-muted-foreground">
                      <i className="fa-solid fa-check text-[9px] mt-0.5" style={{ color: tierColor }} />{b}
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>

        {selected && !pendingRequest && (
          <div className="p-5 rounded-sm" style={{ background: "#EEEEEE", border: "1px solid rgba(239,1,7,0.2)" }}>
            <h3 className="font-bold text-base mb-2" style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}>
              Confirm {action === "downgrade" ? "Downgrade" : action === "upgrade" ? "Upgrade" : "Renewal"} to {selected}
            </h3>
            <p className="text-sm mb-4 text-muted-foreground">
              Your request will be sent to the admin team for approval. Payment via Paystack, Mobile Money, or bank transfer will be confirmed by an officer.
            </p>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="Optional notes for the admin (e.g. payment reference)…"
              className="w-full px-3 py-2 text-sm rounded-sm mb-4 border outline-none focus:border-[#EF0107]"
              style={{ background: "#FFFFFF", borderColor: "var(--border-color)", color: "var(--text-primary)" }}
            />
            <div className="flex gap-3">
              <Button onClick={() => handleProcess(selected)} disabled={processing}>
                {processing ? <><i className="fa-solid fa-spinner fa-spin mr-2" />Submitting…</> : <><i className="fa-solid fa-paper-plane mr-2" />Submit for Approval</>}
              </Button>
              <Button variant="secondary" onClick={() => setSelected(null)}>Cancel</Button>
            </div>
          </div>
        )}

        {history.length > 0 && (
          <div className="mt-10">
            <h2 className="text-lg font-black mb-4" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
              Request History
            </h2>
            <div className="space-y-2">
              {history.slice(0, 5).map(r => (
                <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-sm"
                  style={{ background: "#EEEEEE", border: "1px solid var(--border-color)" }}>
                  <div>
                    <p className="text-sm font-medium capitalize">{r.requestType} → {r.requestedTier}</p>
                    <p className="text-xs text-muted-foreground">{new Date(r.submittedAt).toLocaleDateString()} · GH₵{r.amount.toLocaleString()}</p>
                  </div>
                  <Badge variant={r.status === "Approved" ? "success" : r.status === "Declined" ? "danger" : "warning"}>
                    {r.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </main>
  );
}

export default function MembershipPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-primary)" }}>
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <MembershipContent />
    </Suspense>
  );
}
