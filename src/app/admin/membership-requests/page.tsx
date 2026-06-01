"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, Modal, Textarea, EmptyState, Table, Thead, Th, Tbody, Tr, Td } from "@/components/ui";

type MembershipRequest = {
  id: string;
  memberId: number;
  memberName: string;
  membershipNumber: string;
  email: string;
  phone: string;
  branch: string;
  currentTier: string;
  requestedTier: string;
  requestType: "renew" | "upgrade" | "downgrade";
  amount: number;
  season: string;
  renewalWindow: boolean;
  status: "Pending" | "Approved" | "Declined";
  notes?: string;
  adminNotes?: string;
  submittedAt: string;
  processedAt?: string;
  processedBy?: string;
  memberDetails?: {
    status: string;
    joinDate: string;
    renewalDue: string;
    address?: string;
    whatsapp?: string;
    role?: string;
  };
};

const TYPE_COLORS: Record<string, string> = {
  renew: "#C6A84B",
  upgrade: "#10B981",
  downgrade: "#F59E0B",
};

export default function MembershipRequestsPage() {
  const [requests, setRequests] = useState<MembershipRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "Pending" | "Approved" | "Declined">("all");
  const [selected, setSelected] = useState<MembershipRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  const load = () => {
    setLoading(true);
    fetch("/api/memberships/requests", { cache: "no-store" })
      .then(r => (r.ok ? r.json() : null))
      .then(d => setRequests(d?.requests || []))
      .catch(() => toast.error("Failed to load membership requests"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = filter === "all" ? requests : requests.filter(r => r.status === filter);
  const pendingCount = requests.filter(r => r.status === "Pending").length;

  const process = async (status: "Approved" | "Declined") => {
    if (!selected) return;
    setProcessing(true);
    try {
      const res = await fetch("/api/memberships/requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selected.id, status, adminNotes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast.success(`Request ${status.toLowerCase()}`);
      setSelected(null);
      setAdminNotes("");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to process");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white" style={{ fontFamily: "var(--font-display)" }}>
            MEMBERSHIP REQUESTS
          </h1>
          <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>
            Review renewals, upgrades, and downgrades submitted by members
          </p>
        </div>
        {pendingCount > 0 && (
          <Badge variant="warning">{pendingCount} pending approval</Badge>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        {(["all", "Pending", "Approved", "Declined"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-sm transition-all"
            style={{
              background: filter === f ? "rgba(239,1,7,0.15)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${filter === f ? "rgba(239,1,7,0.4)" : "rgba(255,255,255,0.08)"}`,
              color: filter === f ? "#EF0107" : "rgba(255,255,255,0.5)",
              fontFamily: "var(--font-heading)",
            }}>
            {f === "all" ? "All" : f}
          </button>
        ))}
      </div>

      <Card style={{ background: "#16213E", borderColor: "rgba(255,255,255,0.08)" }}>
        <CardHeader>
          <CardTitle className="text-white">
            <i className="fa-solid fa-crown mr-2" style={{ color: "var(--color-gold)" }} />
            Request Queue
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 text-center text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
              <i className="fa-solid fa-spinner fa-spin mr-2" />Loading…
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState icon="fa-solid fa-crown" title="No requests" desc="Membership change requests will appear here." />
          ) : (
            <Table>
              <Thead>
                <Th>Member</Th>
                <Th>Type</Th>
                <Th>Tier Change</Th>
                <Th>Amount</Th>
                <Th>Branch</Th>
                <Th>Status</Th>
                <Th>Submitted</Th>
                <Th></Th>
              </Thead>
              <Tbody>
                {filtered.map(r => (
                  <Tr key={r.id}>
                    <Td>
                      <p className="font-bold text-white text-sm">{r.memberName}</p>
                      <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>#{r.membershipNumber}</p>
                    </Td>
                    <Td>
                      <span className="text-xs font-bold uppercase px-2 py-0.5 rounded-sm"
                        style={{ background: `${TYPE_COLORS[r.requestType]}20`, color: TYPE_COLORS[r.requestType] }}>
                        {r.requestType}
                      </span>
                    </Td>
                    <Td>
                      <span className="text-sm">{r.currentTier}</span>
                      <i className="fa-solid fa-arrow-right mx-1.5 text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }} />
                      <span className="text-sm font-bold" style={{ color: "var(--color-gold)" }}>{r.requestedTier}</span>
                    </Td>
                    <Td><span className="font-bold">GH₵{r.amount.toLocaleString()}</span></Td>
                    <Td>{r.branch}</Td>
                    <Td>
                      <Badge variant={r.status === "Approved" ? "success" : r.status === "Declined" ? "danger" : "warning"}>
                        {r.status}
                      </Badge>
                    </Td>
                    <Td>
                      <span className="text-xs">{new Date(r.submittedAt).toLocaleDateString()}</span>
                    </Td>
                    <Td>
                      <Button size="sm" variant="ghost" onClick={() => { setSelected(r); setAdminNotes(r.adminNotes || ""); }}>
                        Review
                      </Button>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Review Membership Request">
        {selected && (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              {[
                ["Member", selected.memberName],
                ["Membership #", selected.membershipNumber],
                ["Email", selected.email],
                ["Phone", selected.phone || "—"],
                ["WhatsApp", selected.memberDetails?.whatsapp || selected.phone || "—"],
                ["Branch", selected.branch],
                ["Status", selected.memberDetails?.status || "—"],
                ["Joined", selected.memberDetails?.joinDate || "—"],
                ["Current Renewal", selected.memberDetails?.renewalDue || "—"],
                ["Season", selected.season],
                ["Request", selected.requestType.toUpperCase()],
                ["Amount", `GH₵${selected.amount.toLocaleString()}`],
                ["Tier", `${selected.currentTier} → ${selected.requestedTier}`],
                ["Renewal Window", selected.renewalWindow ? "Yes" : "No (requires approval)"],
              ].map(([k, v]) => (
                <div key={k} className="p-3 rounded-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{k}</p>
                  <p className="font-medium text-white">{v}</p>
                </div>
              ))}
            </div>
            {selected.notes && (
              <div className="p-3 rounded-sm text-sm" style={{ background: "rgba(198,168,75,0.08)", border: "1px solid rgba(198,168,75,0.2)", color: "var(--color-gold)" }}>
                <p className="text-[10px] uppercase mb-1">Member Notes</p>
                {selected.notes}
              </div>
            )}
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>
              Admin Notes
            </label>
            <Textarea
              value={adminNotes}
              onChange={e => setAdminNotes(e.target.value)}
              rows={3}
              placeholder="Optional notes for internal records…"
            />
            {selected.status === "Pending" ? (
              <div className="flex gap-3 pt-2">
                <Button variant="gold" disabled={processing} onClick={() => process("Approved")}>
                  {processing ? <i className="fa-solid fa-spinner fa-spin" /> : <i className="fa-solid fa-check" />}
                  Approve
                </Button>
                <Button variant="danger" disabled={processing} onClick={() => process("Declined")}>
                  Decline
                </Button>
              </div>
            ) : (
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
                Processed {selected.processedAt ? new Date(selected.processedAt).toLocaleString() : ""} by {selected.processedBy || "admin"}
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
