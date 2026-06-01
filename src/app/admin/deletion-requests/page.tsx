"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, Button, Badge, EmptyState, StatCard } from "@/components/ui";
import { useApp } from "@/context/AppContext";
import toast from "react-hot-toast";

export default function DeletionRequestsPage() {
  const { members, setMembers, addAdminNotification } = useApp();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Pending");
  const [processing, setProcessing] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    fetch("/api/member-deletion-requests")
      .then(r => r.json())
      .then(d => setRequests(d.requests || []))
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleProcess = async (req: any, status: "Approved" | "Declined") => {
    setProcessing(req.id);
    try {
      await fetch("/api/member-deletion-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: req.id, status, adminUsername: "admin" }),
      });
      if (status === "Approved") {
        // Delete member
        await fetch(`/api/admin/members/${req.member_id}`, { method: "DELETE" });
        setMembers(members.filter((m: any) => String(m.id) !== String(req.member_id)));
        addAdminNotification("Member Deleted", `${req.member_name}'s account was deleted per their request.`, "warning");
        toast.success("Member deleted and request approved");
      } else {
        toast.success("Deletion request declined");
      }
      load();
    } catch { toast.error("Failed to process request"); }
    finally { setProcessing(null); }
  };

  const pending = requests.filter(r => r.status === "Pending");
  const filtered = filter === "all" ? requests : requests.filter(r => r.status === filter);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white" style={{ fontFamily: "var(--font-display)" }}>DELETION REQUESTS</h1>
          <p className="text-xs mt-0.5 text-white/40">Member-submitted account deletion requests — only admins can delete profiles</p>
        </div>
        <Button variant="secondary" size="sm" onClick={load}><i className="fa-solid fa-rotate mr-1.5" />Refresh</Button>
      </motion.div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Pending" value={requests.filter(r => r.status === "Pending").length} icon="fa-solid fa-clock" color="#F59E0B" />
        <StatCard label="Approved" value={requests.filter(r => r.status === "Approved").length} icon="fa-solid fa-check" color="#10B981" />
        <StatCard label="Declined" value={requests.filter(r => r.status === "Declined").length} icon="fa-solid fa-xmark" color="#EF4444" />
      </div>

      {pending.length > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-sm" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)" }}>
          <i className="fa-solid fa-triangle-exclamation mt-0.5" style={{ color: "#F59E0B" }} />
          <div>
            <p className="text-sm font-bold" style={{ color: "#F59E0B", fontFamily: "var(--font-heading)" }}>{pending.length} Pending Deletion Request{pending.length !== 1 ? "s" : ""}</p>
            <p className="text-xs text-white/50 mt-0.5">These members have requested their accounts be deleted. Review and action each request.</p>
          </div>
        </div>
      )}

      <div className="flex gap-1">
        {["Pending", "Approved", "Declined", "all"].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className="px-3 py-1.5 text-xs font-bold rounded-sm transition-all uppercase tracking-wider"
            style={{ fontFamily: "var(--font-heading)", background: filter === s ? "rgba(239,1,7,0.15)" : "rgba(255,255,255,0.04)", color: filter === s ? "var(--color-red)" : "rgba(255,255,255,0.4)", border: `1px solid ${filter === s ? "rgba(239,1,7,0.3)" : "rgba(255,255,255,0.08)"}` }}>
            {s}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center"><i className="fa-solid fa-spinner fa-spin text-2xl" style={{ color: "var(--color-red)" }} /></div>
          ) : filtered.length === 0 ? (
            <EmptyState icon="fa-solid fa-user-slash" title="No deletion requests" desc="Member account deletion requests will appear here." />
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {filtered.map((req: any) => (
                <motion.div key={req.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex items-start gap-4 p-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-black text-sm"
                    style={{ background: "rgba(239,68,68,0.15)", color: "#EF4444" }}>
                    {req.member_name?.[0] || "?"}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-white">{req.member_name}</p>
                      <span className="text-xs text-white/35">#{req.membership_number}</span>
                      <Badge variant={req.status === "Pending" ? "warning" : req.status === "Approved" ? "success" : "danger"}>{req.status}</Badge>
                    </div>
                    <p className="text-xs text-white/50 mt-1">
                      <strong>Reason:</strong> {req.reason || "No reason provided"}
                    </p>
                    <p className="text-[10px] text-white/30 mt-1">
                      Requested: {new Date(req.requested_at).toLocaleString()}
                      {req.processed_at && ` · Processed: ${new Date(req.processed_at).toLocaleString()} by ${req.processed_by}`}
                    </p>
                  </div>
                  {req.status === "Pending" && (
                    <div className="flex gap-2 flex-shrink-0">
                      <Button variant="secondary" size="sm" onClick={() => handleProcess(req, "Declined")} disabled={processing === req.id}>
                        Decline
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => handleProcess(req, "Approved")} disabled={processing === req.id}>
                        {processing === req.id ? "Processing…" : "Approve & Delete"}
                      </Button>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
