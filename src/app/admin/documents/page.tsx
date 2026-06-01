"use client";
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, Button, FormGroup, Input, Select, Modal, EmptyState, Badge, PageHeader, Switch, RichTextField } from "@/components/ui";
import toast from "react-hot-toast";

const CATEGORIES = ["Constitution","Membership","Finance","Events","Minutes","Forms","Policies","General"];
const FILE_TYPES = ["pdf","doc","docx","xlsx","pptx","jpg","png","other"];
const EMPTY = { title:"", description:"", fileUrl:"", fileType:"pdf", category:"General", isPublic:true, sortOrder:0 };

export default function AdminDocumentsPage() {
  const [docs, setDocs]     = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number|null>(null);
  const [form, setForm]     = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/documents?admin=1");
      const d   = await res.json();
      if (d.success) setDocs(d.documents);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  const openAdd  = () => { setForm(EMPTY); setEditId(null); setShowForm(true); };
  const openEdit = (d: any) => {
    setForm({ title:d.title, description:d.description||"", fileUrl:d.file_url, fileType:d.file_type||"pdf", category:d.category||"General", isPublic:d.is_public!==0, sortOrder:d.sort_order||0 });
    setEditId(d.id); setShowForm(true);
  };

  const save = async () => {
    if (!form.title || !form.fileUrl) { toast.error("Title and file URL required"); return; }
    setSaving(true);
    try {
      const method = editId ? "PUT" : "POST";
      const body   = editId ? { id:editId, ...form } : form;
      const res    = await fetch("/api/documents", { method, headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) });
      const d      = await res.json();
      if (d.success) { toast.success(editId ? "Updated" : "Added"); setShowForm(false); load(); }
      else toast.error(d.error || "Failed");
    } finally { setSaving(false); }
  };

  const del = async (id: number) => {
    if (!confirm("Delete this document?")) return;
    await fetch(`/api/documents?id=${id}`, { method:"DELETE" });
    toast.success("Deleted"); load();
  };

  const TYPE_ICON: Record<string,string> = { pdf:"fa-file-pdf", doc:"fa-file-word", docx:"fa-file-word", xlsx:"fa-file-excel", pptx:"fa-file-powerpoint" };
  const TYPE_COLOR: Record<string,string> = { pdf:"#EF4444", doc:"#2563EB", docx:"#2563EB", xlsx:"#16A34A", pptx:"#EA580C" };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <PageHeader title="Club Documents" subtitle="Manage club documents and resources" actions={
        <Button onClick={openAdd} className="btn-arsenal"><i className="fa-solid fa-plus mr-2"/>Add Document</Button>
      }/>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i=><div key={i} className="skeleton h-20 rounded-xl"/>)}</div>
      ) : docs.length === 0 ? (
        <EmptyState icon="fa-folder-open" title="No documents yet" desc="Upload club documents, constitution, forms etc." action={<Button onClick={openAdd} className="btn-arsenal">Add Document</Button>}/>
      ) : (
        <Card>
          <div className="divide-y" style={{ borderColor:"var(--border-color)" }}>
            {docs.map(doc => {
              const icon  = TYPE_ICON[doc.file_type] || "fa-file";
              const color = TYPE_COLOR[doc.file_type] || "#6B7280";
              return (
                <div key={doc.id} className="flex items-center gap-4 p-4 hover:bg-[var(--bg-card-hover)] transition-colors">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background:`${color}12` }}>
                    <i className={`fa-solid ${icon} text-xl`} style={{ color }}/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color:"var(--text-primary)", fontFamily:"var(--font-heading)" }}>{doc.title}</p>
                    {doc.description && <p className="text-xs truncate" style={{ color:"var(--text-muted)" }}>{doc.description}</p>}
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="default">{doc.category}</Badge>
                      <Badge variant={doc.is_public ? "success" : "warning"}>{doc.is_public ? "Public" : "Members Only"}</Badge>
                      <span className="text-xs" style={{ color:"var(--text-muted)" }}><i className="fa-solid fa-download mr-1"/>{doc.download_count} downloads</span>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <a href={doc.file_url} target="_blank" rel="noreferrer"
                      className="text-xs px-3 py-1.5 rounded" style={{ background:"rgba(59,130,246,0.08)", color:"#2563EB" }}>View</a>
                    <button onClick={() => openEdit(doc)} className="text-xs px-3 py-1.5 rounded" style={{ background:"rgba(198,168,75,0.08)", color:"var(--color-gold)" }}>Edit</button>
                    <button onClick={() => del(doc.id)} className="text-xs px-3 py-1.5 rounded" style={{ background:"rgba(239,68,68,0.08)", color:"#EF4444" }}>Del</button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editId ? "Edit Document" : "Add Document"} size="md">
        <div className="p-5 space-y-4">
          <FormGroup label="Title"><Input value={form.title} onChange={e=>set("title",e.target.value)} placeholder="e.g. Club Constitution 2025"/></FormGroup>
          <FormGroup label="Description (optional)"><RichTextField value={form.description} onChange={v=>set("description",v)} minHeight={120} placeholder="Brief description…"/></FormGroup>
          <FormGroup label="File URL (Google Drive, Dropbox, direct link)">
            <Input value={form.fileUrl} onChange={e=>set("fileUrl",e.target.value)} placeholder="https://…"/>
          </FormGroup>
          <div className="grid md:grid-cols-3 gap-3">
            <FormGroup label="File Type">
              <Select value={form.fileType} onChange={e=>set("fileType",e.target.value)}>
                {FILE_TYPES.map(t=><option key={t} value={t}>{t.toUpperCase()}</option>)}
              </Select>
            </FormGroup>
            <FormGroup label="Category">
              <Select value={form.category} onChange={e=>set("category",e.target.value)}>
                {CATEGORIES.map(c=><option key={c}>{c}</option>)}
              </Select>
            </FormGroup>
            <FormGroup label="Sort Order"><Input type="number" min={0} value={form.sortOrder} onChange={e=>set("sortOrder",Number(e.target.value))}/></FormGroup>
          </div>
          <FormGroup label="Visibility">
            <Switch checked={form.isPublic} onChange={v=>set("isPublic",v)} label={form.isPublic ? "Public (everyone can see)" : "Members only"}/>
          </FormGroup>
          <div className="flex gap-3 pt-2">
            <Button onClick={save} disabled={saving} className="btn-arsenal flex-1">{saving?"Saving…":"Save Document"}</Button>
            <Button variant="secondary" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
