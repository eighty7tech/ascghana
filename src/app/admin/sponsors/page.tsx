"use client";
import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Button, Input, Modal, FormGroup, Badge } from "@/components/ui";
import toast from "react-hot-toast";
import ImageUploadField from "@/components/ImageUploadField";
import type { Sponsor } from "@/context/AppContext";

const TIERS = [
  { value:"title",   label:"Title Sponsor",    color:"#C6A84B" },
  { value:"gold",    label:"Gold Partner",      color:"#FFD700" },
  { value:"silver",  label:"Silver Partner",    color:"#A8A9AD" },
  { value:"bronze",  label:"Bronze Partner",    color:"#CD7F32" },
  { value:"partner", label:"Official Partner",  color:"#EF0107" },
] as const;

const EMPTY_SPONSOR: Omit<Sponsor,"id"> = {
  name:"", logoUrl:"", website:"", tier:"partner",
  description:"", active:true, order:0,
};

export default function SponsorsAdminPage() {
  const { settings, updateSettings, addAdminNotification } = useApp();
  const sponsors = settings.sponsors || [];
  const [addModal,  setAddModal]  = useState(false);
  const [editId,    setEditId]    = useState<number|null>(null);
  const [form, setForm] = useState<Omit<Sponsor,"id">>(EMPTY_SPONSOR);
  const [pageTitle, setPageTitle] = useState(settings.sponsorsPageTitle || "Our Partners & Sponsors");
  const [pageSub, setPageSub]   = useState(settings.sponsorsPageSubtitle || "");
  const [showHome, setShowHome]   = useState(settings.showSponsorsOnHome ?? true);

  const openAdd = () => { setForm({...EMPTY_SPONSOR, order:sponsors.length}); setAddModal(true); };
  const openEdit = (s: Sponsor) => { const { id:_, ...rest } = s; setForm(rest); setEditId(s.id); };

  const save = async () => {
    if (!form.name.trim()) { toast.error("Sponsor name required"); return; }
    if (editId !== null) {
      updateSettings({ sponsors: sponsors.map(s => s.id === editId ? { ...form, id:editId } : s) });
      addAdminNotification("Sponsor Updated", `${form.name} has been updated.`, "info");
      await fetch("/api/sponsors", { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({id:editId,...form}) }).catch(()=>{});
    } else {
      const newS: Sponsor = { ...form, id: (sponsors.length > 0 ? Math.max(...sponsors.map((x: any) => typeof x.id === "number" ? x.id : 0)) + 1 : 1) };
      updateSettings({ sponsors: [...sponsors, newS] });
      addAdminNotification("Sponsor Added", `${form.name} added as ${form.tier} sponsor.`, "success");
      await fetch("/api/sponsors", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(form) }).catch(()=>{});
    }
    setAddModal(false); setEditId(null);
    toast.success(editId !== null ? "Sponsor updated" : "Sponsor added");
  };

  const remove = async (id: number) => {
    if (!confirm("Remove this sponsor?")) return;
    const sp = sponsors.find(s => s.id === id);
    updateSettings({ sponsors: sponsors.filter(s => s.id !== id) });
    if (sp) addAdminNotification("Sponsor Removed", `${sp.name} removed.`, "warning");
    await fetch("/api/sponsors", { method:"DELETE", headers:{"Content-Type":"application/json"}, body:JSON.stringify({id}) }).catch(()=>{});
    toast.success("Sponsor removed");
  };

  const toggle = async (id: number) => {
    const sp = sponsors.find(s=>s.id===id);
    updateSettings({ sponsors: sponsors.map(s => s.id === id ? { ...s, active:!s.active } : s) });
    await fetch("/api/sponsors", { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({id, active:!sp?.active}) }).catch(()=>{});
  };

  const savePageSettings = () => {
    updateSettings({ sponsorsPageTitle:pageTitle, sponsorsPageSubtitle:pageSub, showSponsorsOnHome:showHome });
    toast.success("Page settings saved");
  };

  const tierColor = (t: string) => TIERS.find(x => x.value === t)?.color || "#EF0107";

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <span className="section-red-line" />
          <h1 className="text-3xl font-black" style={{ fontFamily:"var(--font-display)", color:"var(--text-primary)" }}>
            SPONSORS & PARTNERS
          </h1>
          <p className="text-sm mt-1" style={{ color:"var(--text-muted)" }}>
            Manage club sponsors and partners displayed on the website.
          </p>
        </div>
        <Button onClick={openAdd}><i className="fa-solid fa-plus" />Add Sponsor</Button>
      </div>

      {/* Page settings */}
      <div className="arsenal-card rounded-sm p-5 mb-6">
        <h2 className="text-sm font-bold mb-4 pb-2" style={{ fontFamily:"var(--font-heading)", color:"var(--text-primary)", borderBottom:"1px solid var(--border-subtle)" }}>
          <i className="fa-solid fa-gear mr-2" style={{ color:"var(--color-red)" }} />Page Settings
        </h2>
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <FormGroup label="Page Title">
            <Input value={pageTitle} onChange={e => setPageTitle(e.target.value)} placeholder="Our Partners & Sponsors" />
          </FormGroup>
          <FormGroup label="Page Subtitle">
            <Input value={pageSub} onChange={e => setPageSub(e.target.value)} placeholder="Partners who make ASC Ghana possible" />
          </FormGroup>
        </div>
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-3 cursor-pointer">
            <div onClick={() => setShowHome(v => !v)}
              className="w-10 h-5 rounded-full relative transition-colors"
              style={{ background:showHome ? "var(--color-red)" : "rgba(255,255,255,0.15)" }}>
              <div className="w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all"
                style={{ left:showHome ? "22px" : "2px" }} />
            </div>
            <span className="text-sm" style={{ color:"var(--text-secondary)" }}>Show sponsors section on Homepage</span>
          </label>
          <Button size="sm" onClick={savePageSettings}><i className="fa-solid fa-save" />Save Settings</Button>
        </div>
      </div>

      {/* Sponsors list */}
      {sponsors.length === 0 ? (
        <div className="text-center py-20" style={{ color:"var(--text-muted)" }}>
          <i className="fa-solid fa-handshake text-4xl mb-4 block opacity-20" />
          <p className="font-bold mb-1" style={{ fontFamily:"var(--font-heading)" }}>No sponsors yet</p>
          <p className="text-sm mb-4">Add your first sponsor or partner above.</p>
          <Button onClick={openAdd}><i className="fa-solid fa-plus" />Add First Sponsor</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {[...sponsors].sort((a,b) => a.order - b.order).map(sp => (
            <div key={sp.id} className="arsenal-card rounded-sm p-4 flex items-center gap-4"
              style={{ opacity:sp.active ? 1 : 0.5 }}>
              {/* Logo preview */}
              <div className="w-16 h-12 flex-shrink-0 flex items-center justify-center rounded-sm"
                style={{ background:"rgba(255,255,255,0.04)", border:"1px solid var(--border-subtle)" }}>
                {sp.logoUrl
                  ? <img src={sp.logoUrl} alt={sp.name} className="max-w-full max-h-full object-contain" />
                  : <i className="fa-solid fa-image text-lg" style={{ color:"var(--text-disabled)" }} />
                }
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-bold text-sm" style={{ fontFamily:"var(--font-heading)", color:"var(--text-primary)" }}>{sp.name}</span>
                  <span className="text-[9px] px-1.5 py-0.5 font-bold uppercase rounded-sm"
                    style={{ background:`${tierColor(sp.tier)}18`, color:tierColor(sp.tier), fontFamily:"var(--font-heading)" }}>
                    {TIERS.find(t => t.value === sp.tier)?.label}
                  </span>
                  {!sp.active && <Badge variant="default">Hidden</Badge>}
                </div>
                {sp.description && <p className="text-xs truncate" style={{ color:"var(--text-muted)" }}>{sp.description}</p>}
                {sp.website && <p className="text-[10px] mt-0.5" style={{ color:"var(--color-red)" }}>{sp.website}</p>}
              </div>
              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => toggle(sp.id)}
                  className="text-xs px-2 py-1 rounded-sm transition-colors"
                  style={{ background:"rgba(255,255,255,0.05)", color:"var(--text-muted)", border:"1px solid var(--border-subtle)" }}
                  title={sp.active ? "Hide" : "Show"}>
                  <i className={`fa-solid ${sp.active ? "fa-eye-slash" : "fa-eye"} text-xs`} />
                </button>
                <button onClick={() => openEdit(sp)}
                  className="text-xs px-2 py-1 rounded-sm transition-colors"
                  style={{ background:"rgba(59,130,246,0.1)", color:"#3B82F6", border:"1px solid rgba(59,130,246,0.2)" }}>
                  <i className="fa-solid fa-pen text-xs" />
                </button>
                <button onClick={() => remove(sp.id)}
                  className="text-xs px-2 py-1 rounded-sm transition-colors"
                  style={{ background:"rgba(239,1,7,0.1)", color:"var(--color-red)", border:"1px solid rgba(239,1,7,0.2)" }}>
                  <i className="fa-solid fa-trash text-xs" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal open={addModal || editId !== null} onClose={() => { setAddModal(false); setEditId(null); }}
        title={editId !== null ? "Edit Sponsor" : "Add Sponsor"} size="md">
        <div className="p-5 space-y-4">
          <FormGroup label="Sponsor / Partner Name *">
            <Input value={form.name} onChange={e => setForm(p=>({...p,name:e.target.value}))} placeholder="Company name" />
          </FormGroup>
          <div className="grid grid-cols-2 gap-4">
            <FormGroup label="Tier / Level">
              <select value={form.tier} onChange={e => setForm(p=>({...p,tier:e.target.value as Sponsor["tier"]}))}
                className="input-arsenal text-sm w-full">
                {TIERS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </FormGroup>
            <FormGroup label="Display Order">
              <Input type="number" min={0} value={form.order}
                onChange={e => setForm(p=>({...p,order:parseInt(e.target.value)||0}))} />
            </FormGroup>
          </div>
          <ImageUploadField
            label="Sponsor logo"
            value={form.logoUrl}
            onChange={(logoUrl) => setForm((p) => ({ ...p, logoUrl }))}
            folder="sponsors"
            hint="Upload a logo or paste a URL. Recommended: transparent PNG on light background."
            previewHeight={80}
          />
          <FormGroup label="Website URL">
            <Input value={form.website} onChange={e => setForm(p=>({...p,website:e.target.value}))}
              placeholder="https://www.example.com" />
          </FormGroup>
          <FormGroup label="Short Description (optional)">
            <Input value={form.description||""} onChange={e => setForm(p=>({...p,description:e.target.value}))}
              placeholder="Brief description of partnership" />
          </FormGroup>
          <label className="flex items-center gap-3 cursor-pointer">
            <div onClick={() => setForm(p=>({...p,active:!p.active}))}
              className="w-10 h-5 rounded-full relative transition-colors"
              style={{ background:form.active?"var(--color-red)":"rgba(255,255,255,0.15)" }}>
              <div className="w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all"
                style={{ left:form.active?"22px":"2px" }} />
            </div>
            <span className="text-sm" style={{ color:"var(--text-secondary)" }}>Active (visible on website)</span>
          </label>
        </div>
        <div className="px-5 py-4 flex justify-end gap-3" style={{ borderTop:"1px solid var(--border-subtle)" }}>
          <Button variant="secondary" onClick={() => { setAddModal(false); setEditId(null); }}>Cancel</Button>
          <Button onClick={save}><i className="fa-solid fa-save" />{editId !== null ? "Save Changes" : "Add Sponsor"}</Button>
        </div>
      </Modal>
    </div>
  );
}
