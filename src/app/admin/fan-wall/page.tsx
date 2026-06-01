"use client";
import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, Input, Modal, Alert, EmptyState, Table, Thead, Th, Tbody, Tr, Td, TabBar, PageHeader } from "@/components/ui";
import toast from "react-hot-toast";

const TYPE_COLORS: Record<string, string> = { text:"default", photo:"info", matchday:"warning", celebration:"gold" };

export default function AdminFanWallPage() {
  const [posts, setPosts]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all"|"flagged"|"pending">("all");
  const [search, setSearch] = useState("");
  const [delConfirm, setDelConfirm] = useState<any>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/fan-wall?limit=100&admin=1");
      const d   = await res.json();
      if (d.success) setPosts(d.posts);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const action = async (postId: number, act: string) => {
    await fetch("/api/fan-wall", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ postId, action: act }) });
    toast.success(`Post ${act}d`);
    load();
  };

  const del = async () => {
    if (!delConfirm) return;
    await fetch(`/api/fan-wall?id=${delConfirm.id}`, { method: "DELETE" });
    toast.success("Post deleted");
    setDelConfirm(null);
    load();
  };

  const filtered = posts.filter(p => {
    const matchFilter = filter === "all" || (filter === "flagged" && p.is_flagged) || (filter === "pending" && !p.is_approved);
    const matchSearch = !search || p.member_name?.toLowerCase().includes(search.toLowerCase()) || p.content?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const stats = { total: posts.length, flagged: posts.filter(p=>p.is_flagged).length, pending: posts.filter(p=>!p.is_approved).length, pinned: posts.filter(p=>p.is_pinned).length };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <PageHeader title="Fan Wall" subtitle="Moderate community posts" actions={
        <Button size="sm" variant="secondary" onClick={load}><i className="fa-solid fa-rotate mr-1"/>Refresh</Button>
      }/>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label:"Total Posts",  value:stats.total,   icon:"fa-comments",         color:"#3B82F6" },
          { label:"Flagged",      value:stats.flagged,  icon:"fa-flag",             color:"#EF4444" },
          { label:"Pending",      value:stats.pending,  icon:"fa-clock",            color:"#F59E0B" },
          { label:"Pinned",       value:stats.pinned,   icon:"fa-thumbtack",        color:"#8B5CF6" },
        ].map(s => (
          <div key={s.label} className="rounded-md border p-4" style={{ background:"var(--bg-card)", borderColor:"var(--border-color)", borderTop:`2px solid ${s.color}` }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color:"var(--text-muted)", fontFamily:"var(--font-heading)" }}>{s.label}</p>
              <i className={`fa-solid ${s.icon} text-sm`} style={{ color:s.color }} />
            </div>
            <p className="text-2xl font-black" style={{ fontFamily:"var(--font-display)", color:"var(--text-primary)" }}>{s.value}</p>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle>Posts</CardTitle>
            <div className="flex gap-2">
              <Input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search…" className="w-48"/>
              <select value={filter} onChange={e=>setFilter(e.target.value as any)}
                className="h-10 rounded border px-3 text-sm" style={{ background:"var(--bg-input)", borderColor:"var(--border-color)", color:"var(--text-primary)" }}>
                <option value="all">All</option>
                <option value="flagged">Flagged</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center" style={{ color:"var(--text-muted)" }}><i className="fa-solid fa-spinner fa-spin text-2xl" /></div>
          ) : filtered.length === 0 ? (
            <EmptyState icon="fa-comments" title="No posts found" />
          ) : (
            <Table>
              <Thead>
                <Th>Member</Th><Th>Content</Th><Th>Type</Th><Th>Likes</Th><Th>Status</Th><Th>Date</Th><Th>Actions</Th>
              </Thead>
              <Tbody>
                {filtered.map(p => (
                  <Tr key={p.id}>
                    <Td><span className="font-semibold" style={{ color:"var(--text-primary)" }}>{p.member_name}</span></Td>
                    <Td><span className="line-clamp-2 text-xs max-w-xs block">{p.content}</span></Td>
                    <Td><Badge variant={TYPE_COLORS[p.post_type] as any}>{p.post_type}</Badge></Td>
                    <Td>{p.likes}</Td>
                    <Td>
                      <div className="flex flex-wrap gap-1">
                        {p.is_pinned   ? <Badge variant="gold">Pinned</Badge>   : null}
                        {p.is_flagged  ? <Badge variant="danger">Flagged</Badge> : null}
                        {!p.is_approved? <Badge variant="warning">Hidden</Badge> : <Badge variant="success">Live</Badge>}
                      </div>
                    </Td>
                    <Td className="text-xs">{new Date(p.created_at).toLocaleDateString("en-GB")}</Td>
                    <Td>
                      <div className="flex gap-1 flex-wrap">
                        {p.is_approved
                          ? <button onClick={() => action(p.id,"remove")} className="text-xs px-2 py-1 rounded" style={{ background:"rgba(245,158,11,0.1)", color:"#B45309" }}>Hide</button>
                          : <button onClick={() => action(p.id,"approve")} className="text-xs px-2 py-1 rounded" style={{ background:"rgba(16,185,129,0.1)", color:"#10B981" }}>Approve</button>}
                        {p.is_pinned
                          ? <button onClick={() => action(p.id,"unpin")} className="text-xs px-2 py-1 rounded" style={{ background:"rgba(139,92,246,0.1)", color:"#8B5CF6" }}>Unpin</button>
                          : <button onClick={() => action(p.id,"pin")} className="text-xs px-2 py-1 rounded" style={{ background:"rgba(139,92,246,0.1)", color:"#8B5CF6" }}>Pin</button>}
                        <button onClick={() => setDelConfirm(p)} className="text-xs px-2 py-1 rounded" style={{ background:"rgba(239,68,68,0.08)", color:"#EF4444" }}>Delete</button>
                      </div>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Modal open={!!delConfirm} onClose={() => setDelConfirm(null)} title="Delete Post" size="sm">
        <div className="p-5 space-y-4">
          <Alert variant="error">This will permanently delete the post and all its comments. This cannot be undone.</Alert>
          <p className="text-sm p-3 rounded" style={{ background:"var(--bg-secondary)", color:"var(--text-secondary)" }}>
            "{delConfirm?.content?.slice(0,120)}{(delConfirm?.content?.length||0) > 120 ? "…" : ""}"
          </p>
          <div className="flex gap-3">
            <Button variant="danger" onClick={del} className="flex-1">Delete Post</Button>
            <Button variant="secondary" onClick={() => setDelConfirm(null)} className="flex-1">Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
