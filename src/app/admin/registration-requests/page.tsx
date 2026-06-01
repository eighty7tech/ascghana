"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, Table, Thead, Th, Tbody, Tr, Td } from "@/components/ui";

type App = {
  id: number;
  application_ref: string;
  tier: string;
  amount: number;
  currency: string;
  payment_status: "unpaid" | "paid" | "failed";
  payment_gateway: string | null;
  payment_ref: string | null;
  application_status: "awaiting_payment" | "pending_review" | "approved" | "rejected";
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  created_at: string;
};

const STATUS_BADGE: Record<string, any> = {
  awaiting_payment: { label: "Awaiting Payment", variant: "warning" },
  pending_review: { label: "Pending Review", variant: "info" },
  approved: { label: "Approved", variant: "success" },
  rejected: { label: "Rejected", variant: "danger" },
};

export default function AdminRegistrationRequestsPage() {
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending_review" | "awaiting_payment" | "approved" | "rejected" | "all">("pending_review");

  const load = async () => {
    setLoading(true);
    try {
      const qs = filter === "all" ? "" : `?status=${filter}`;
      const res = await fetch(`/api/admin/registration-requests${qs}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load applications");
      setApps(data.applications || []);
    } catch (e: any) {
      toast.error(e?.message || "Could not load applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const counts = useMemo(() => {
    const by: Record<string, number> = { awaiting_payment: 0, pending_review: 0, approved: 0, rejected: 0 };
    for (const a of apps) by[a.application_status] = (by[a.application_status] || 0) + 1;
    return by;
  }, [apps]);

  const act = async (id: number, action: "approve" | "reject") => {
    try {
      const res = await fetch("/api/admin/registration-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");
      toast.success(action === "approve" ? "Approved" : "Rejected");
      await load();
    } catch (e: any) {
      toast.error(e?.message || "Action failed");
    }
  };

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-white" style={{ fontFamily: "var(--font-display)" }}>
            REGISTRATION REQUESTS
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-body)" }}>
            New member applications are created only after payment is verified.
          </p>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          {[
            { id: "pending_review", label: "Pending", color: "#3B82F6" },
            { id: "awaiting_payment", label: "Awaiting Payment", color: "#F59E0B" },
            { id: "approved", label: "Approved", color: "#22C55E" },
            { id: "rejected", label: "Rejected", color: "#EF4444" },
            { id: "all", label: "All", color: "rgba(255,255,255,0.35)" },
          ].map((x) => (
            <button
              key={x.id}
              onClick={() => setFilter(x.id as any)}
              className="text-xs px-3 py-2 rounded-sm font-bold"
              style={{
                border: `1px solid ${filter === x.id ? `${x.color}55` : "rgba(255,255,255,0.08)"}`,
                background: filter === x.id ? `${x.color}1A` : "rgba(255,255,255,0.03)",
                color: filter === x.id ? x.color : "rgba(255,255,255,0.55)",
                fontFamily: "var(--font-heading)",
              }}
            >
              {x.label}
              {x.id !== "all" && (
                <span className="ml-2 text-[10px] opacity-70">
                  {counts[x.id] ?? 0}
                </span>
              )}
            </button>
          ))}
          <Button variant="outline" size="sm" onClick={load}>
            <i className="fa-solid fa-rotate" />Refresh
          </Button>
        </div>
      </motion.div>

      <Card>
        <CardHeader>
          <CardTitle>
            <i className="fa-solid fa-user-plus mr-2" style={{ color: "var(--color-red)" }} />
            Applications
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <Thead>
              <Th>Ref</Th>
              <Th>Name</Th>
              <Th>Tier</Th>
              <Th>Payment</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </Thead>
            <Tbody>
              {loading && (
                <Tr>
                  <Td colSpan={6} className="py-10 text-center text-white/40">
                    Loading…
                  </Td>
                </Tr>
              )}
              {!loading && apps.length === 0 && (
                <Tr>
                  <Td colSpan={6} className="py-10 text-center text-white/30">
                    No applications found.
                  </Td>
                </Tr>
              )}
              {!loading &&
                apps.map((a) => {
                  const badge = STATUS_BADGE[a.application_status] || { label: a.application_status, variant: "default" };
                  return (
                    <Tr key={a.id}>
                      <Td className="font-mono text-xs" style={{ color: "var(--color-gold)" }}>
                        {a.application_ref}
                      </Td>
                      <Td>
                        <div>
                          <p className="text-sm font-medium text-white">
                            {a.first_name} {a.last_name}
                          </p>
                          <p className="text-xs text-white/35">{a.email}</p>
                        </div>
                      </Td>
                      <Td>
                        <Badge variant="gold" style={{ background: "rgba(198,168,75,0.12)", color: "var(--color-gold)" }}>
                          {a.tier}
                        </Badge>
                      </Td>
                      <Td className="text-xs text-white/55">
                        <div>
                          <p>
                            {a.currency} {Number(a.amount).toFixed(2)}
                          </p>
                          <p className="text-[10px] opacity-70">
                            {a.payment_gateway || "—"} · {a.payment_status}
                          </p>
                        </div>
                      </Td>
                      <Td>
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      </Td>
                      <Td>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => act(a.id, "approve")} disabled={a.application_status !== "pending_review"}>
                            <i className="fa-solid fa-circle-check" />Approve
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => act(a.id, "reject")} disabled={a.application_status === "approved"}>
                            <i className="fa-solid fa-circle-xmark" />Reject
                          </Button>
                        </div>
                      </Td>
                    </Tr>
                  );
                })}
            </Tbody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

