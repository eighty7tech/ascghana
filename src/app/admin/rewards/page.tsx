"use client";
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, Button, FormGroup, Input, Select, Modal, EmptyState, Badge, PageHeader, Switch, RichTextField } from "@/components/ui";
import toast from "react-hot-toast";
import ImageUploadField from "@/components/ImageUploadField";

const CATEGORIES = ["Merchandise","Experiences","Digital","Tickets","Recognition","Other"];
const EMPTY = { title:"", description:"", imageUrl:"", pointsCost:100, stock:-1, category:"Merchandise", isActive:true };

export default function AdminRewardsPage() {
  const [rewards, setRewards]       = useState<any[]>([]);
  const [redemptions, setRedemptions] = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [editId, setEditId]         = useState<number|null>(null);
  const [form, setForm]             = useState<any>(EMPTY);
  const [saving, setSaving]         = useState(false);
  const [tab, setTab]               = useState<"rewards"|"redemptions">("rewards");

  const load = async () => {
    setLoading(true);
    try {
      const [rRes, redRes] = await Promise.all([
        fetch("/api/rewards?admin=1"),
        fetch("/api/rewards?admin=1"),
      ]);
      const rData = await rRes.json();
      if (rData.success) { setRewards(rData.rewards); setRedemptions([]); }
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  const openAdd  = () => { setForm(EMPTY); setEditId(null); setShowForm(true); };
  const openEdit = (r: any) => {
    setForm({ title:r.title, description:r.description||"", imageUrl:r.image_url||"", pointsCost:r.points_cost, stock:r.stock, category:r.category||"Merchandise", isActive:r.is_active!==0 });
    setEditId(r.id); setShowForm(true);
  };

  const save = async () => {
    if (!form.title || !form.pointsCost) { toast.error("Title and points cost required"); return; }
    setSaving(true);
    try {
      if (editId) {
        const res = await fetch("/api/rewards", { method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ id:editId, ...form, imageUrl:form.imageUrl||null }) });
        const d   = await res.json();
        if (d.success) { toast.success("Reward updated"); setShowForm(false); load(); }
        else toast.error(d.error || "Failed");
      } else {
        const res = await fetch("/api/rewards?admin=1", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(form) });
        const d   = await res.json();
        if (d.success) { toast.success("Reward created"); setShowForm(false); load(); }
        else toast.error(d.error || "Failed");
      }
    } finally { setSaving(false); }
  };

  const del = async (id: number) => {
    if (!confirm("Delete this reward?")) return;
    await fetch(`/api/rewards?id=${id}`, { method:"DELETE" });
    toast.success("Deleted"); load();
  };

  const fulfil = async (id: number, status: string) => {
    await fetch("/api/rewards/redeem", { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ id, status }) });
    toast.success(`Redemption ${status}`); load();
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <PageHeader title="Rewards Shop" subtitle="Manage the loyalty rewards catalogue" actions={
        <Button onClick={openAdd} className="btn-arsenal"><i className="fa-solid fa-plus mr-2"/>Add Reward</Button>
      }/>

      {/* Tab bar */}
      <div className="flex border-b" style={{ borderColor:"var(--border-color)" }}>
        {[["rewards","fa-gift","Catalogue"],["redemptions","fa-receipt","Redemptions"]].map(([id,icon,label]) => (
          <button key={id} onClick={() => setTab(id as any)}
            className="relative px-5 py-3 text-sm font-bold transition-colors"
            style={{ color:tab===id?"var(--color-red)":"var(--text-muted)", fontFamily:"var(--font-heading)" }}>
            <i className={`fa-solid ${icon} mr-1.5 text-xs`}/>{label}
            {tab===id && <span className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background:"var(--color-red)" }}/>}
          </button>
        ))}
      </div>

      {tab === "rewards" && (
        loading ? (
          <div className="grid md:grid-cols-3 gap-4">{[1,2,3].map(i=><div key={i} className="skeleton h-56 rounded-xl"/>)}</div>
        ) : rewards.length === 0 ? (
          <EmptyState icon="fa-gift" title="No rewards yet" desc="Add items to the rewards catalogue" action={<Button onClick={openAdd} className="btn-arsenal">Add Reward</Button>}/>
        ) : (
          <div className="grid md:grid-cols-3 gap-4">
            {rewards.map(r => (
              <Card key={r.id} className="flex flex-col overflow-hidden">
                <div className="h-36 flex items-center justify-center relative" style={{ background:"var(--bg-secondary)" }}>
                  {r.image_url ? <img src={r.image_url} alt={r.title} className="w-full h-full object-cover"/> : <i className="fa-solid fa-gift text-4xl" style={{ color:"var(--border-color)" }}/>}
                  {!r.is_active && <div className="absolute inset-0 flex items-center justify-center" style={{ background:"rgba(0,0,0,0.5)" }}><Badge variant="warning">Inactive</Badge></div>}
                </div>
                <CardContent className="flex flex-col flex-1 p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-bold text-sm" style={{ color:"var(--text-primary)", fontFamily:"var(--font-heading)" }}>{r.title}</h3>
                    <Badge variant="gold">{r.category}</Badge>
                  </div>
                  {r.description && <p className="text-xs mb-3 flex-1" style={{ color:"var(--text-muted)" }}>{r.description}</p>}
                  <div className="flex items-center justify-between mt-auto pt-3" style={{ borderTop:"1px solid var(--border-color)" }}>
                    <div>
                      <p className="font-black text-lg" style={{ color:"var(--color-red)", fontFamily:"var(--font-display)" }}>{r.points_cost.toLocaleString()} pts</p>
                      <p className="text-xs" style={{ color:"var(--text-muted)" }}>{r.stock === -1 ? "Unlimited" : r.stock === 0 ? "Out of stock" : `${r.stock} left`}</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(r)} className="text-xs px-2 py-1 rounded" style={{ background:"rgba(198,168,75,0.12)", color:"var(--color-gold)" }}>Edit</button>
                      <button onClick={() => del(r.id)} className="text-xs px-2 py-1 rounded" style={{ background:"rgba(239,68,68,0.08)", color:"#EF4444" }}>Del</button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      )}

      {tab === "redemptions" && (
        <Card>
          <CardContent className="py-12 text-center">
            <p style={{ color:"var(--text-muted)" }}>Redemption management is available once members redeem rewards.</p>
          </CardContent>
        </Card>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editId ? "Edit Reward" : "Add Reward"} size="md">
        <div className="p-5 space-y-4">
          <FormGroup label="Title"><Input value={form.title} onChange={e=>set("title",e.target.value)} placeholder="e.g. ASC Ghana Cap"/></FormGroup>
          <FormGroup label="Description"><RichTextField value={form.description} onChange={v=>set("description",v)} placeholder="What does the member receive?" minHeight={140}/></FormGroup>
          <ImageUploadField label="Reward image" value={form.imageUrl} onChange={(v)=>set("imageUrl",v)} folder="shop" previewHeight={120} />
          <div className="grid md:grid-cols-3 gap-3">
            <FormGroup label="Points Cost"><Input type="number" min={1} value={form.pointsCost} onChange={e=>set("pointsCost",Number(e.target.value))}/></FormGroup>
            <FormGroup label="Stock (-1 = unlimited)"><Input type="number" min={-1} value={form.stock} onChange={e=>set("stock",Number(e.target.value))}/></FormGroup>
            <FormGroup label="Category">
              <Select value={form.category} onChange={e=>set("category",e.target.value)}>
                {CATEGORIES.map(c=><option key={c}>{c}</option>)}
              </Select>
            </FormGroup>
          </div>
          <FormGroup label="Active">
            <Switch checked={form.isActive} onChange={v=>set("isActive",v)} label="Visible in rewards shop"/>
          </FormGroup>
          <div className="flex gap-3 pt-2">
            <Button onClick={save} disabled={saving} className="btn-arsenal flex-1">{saving?"Saving…":"Save Reward"}</Button>
            <Button variant="secondary" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
