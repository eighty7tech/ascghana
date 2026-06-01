"use client";
import { useState, useRef } from "react";
import { useApp, GalleryAlbum } from "@/context/AppContext";
import { Card, CardHeader, CardTitle, CardContent, Button, Modal, FormGroup, Input, Select, EmptyState, Badge } from "@/components/ui";
import toast from "react-hot-toast";
import { uploadLocalImage } from "@/lib/clientUploads";

const CATS = ["Events","Watch Parties","Membership","Charity","Meetings","Awards","Travel"];
const GRADS = ["from-red-900 to-amber-800","from-zinc-900 to-red-900","from-green-900 to-teal-800","from-amber-900 to-red-800","from-blue-900 to-indigo-800","from-purple-900 to-red-800"];
const EMPTY = { name:"", category:"Events", description:"", date_label:"" };

export default function AdminGalleryPage() {
  const { settings, updateSettings } = useApp();
  const albums: GalleryAlbum[] = (settings as any).galleryAlbums || [];

  const save = (updated: GalleryAlbum[]) =>
    updateSettings({ galleryAlbums: updated } as any);

  const [showAlbumModal, setShowAlbumModal] = useState(false);
  const [editId, setEditId] = useState<number|null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [activeAlbum, setActiveAlbum] = useState<GalleryAlbum|null>(null);
  const [catFilter, setCatFilter] = useState("All");
  const [uploading, setUploading] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);
  const imgRef = useRef<HTMLInputElement>(null);

  const uf = (k:string) => (e:React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) =>
    setForm(p=>({...p,[k]:e.target.value}));

  const openNew  = () => { setForm({...EMPTY}); setEditId(null); setShowAlbumModal(true); };
  const openEdit = (a:GalleryAlbum) => {
    setForm({ name:a.name, category:a.category||"Events", description:a.description||"", date_label:(a as any).date_label||"" });
    setEditId(a.id); setShowAlbumModal(true);
  };

  const saveAlbum = () => {
    if (!form.name.trim()) { toast.error("Album name required"); return; }
    if (editId !== null) {
      const updated = albums.map(a => a.id===editId ? {...a,...form} : a);
      save(updated); toast.success("Album updated");
    } else {
      const newAlbum: GalleryAlbum = {
        id: Date.now(), name:form.name, category:form.category,
        description:form.description, coverColor:GRADS[albums.length % GRADS.length],
        imageCount:0, createdAt:new Date().toISOString(), images:[]
      };
      save([...albums, newAlbum]); toast.success("Album created");
    }
    setShowAlbumModal(false);
  };

  const deleteAlbum = (id:number) => {
    if (!confirm("Delete this album and all its photos?")) return;
    save(albums.filter(a=>a.id!==id));
    if (activeAlbum?.id===id) setActiveAlbum(null);
    toast.success("Album deleted");
  };

  const deleteSelected = () => {
    if (!selected.length || !confirm(`Delete ${selected.length} album${selected.length>1?"s":""}?`)) return;
    save(albums.filter(a=>!selected.includes(a.id)));
    setSelected([]); toast.success(`${selected.length} album${selected.length>1?"s":""} deleted`);
  };

  // Image upload — batch upload all files then save once
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!activeAlbum) return;
    const files = Array.from(e.target.files||[]);
    if (!files.length) return;
    setUploading(true);
    const newImages: any[] = [];
    let failed = 0;
    // Upload all files in parallel (max 3 at a time)
    const chunks = [];
    for (let i = 0; i < files.length; i += 3) chunks.push(files.slice(i, i + 3));
    for (const chunk of chunks) {
      await Promise.all(chunk.map(async file => {
        if (file.size > 5*1024*1024) { toast.error(`${file.name} exceeds 5MB`); failed++; return; }
        try {
          const url = await uploadLocalImage(file, "gallery");
          newImages.push({ id: Date.now() + Math.random(), url, filename: file.name, title: file.name.replace(/\.[^/.]+$/, ""), size: String(file.size), isWebp: false });
        } catch {
          failed++;
          toast.error(`Upload failed: ${file.name}`);
        }
      }));
    }
    // Save all new images at once
    if (newImages.length > 0) {
      const updated = albums.map(a => a.id === activeAlbum.id
        ? { ...a, images: [...(a.images||[]), ...newImages], imageCount: (a.imageCount||0) + newImages.length }
        : a
      );
      save(updated);
      setActiveAlbum(updated.find(a => a.id === activeAlbum.id) || null);
      toast.success(`${newImages.length} image${newImages.length > 1 ? "s" : ""} uploaded${failed ? ` (${failed} failed)` : ""}`);
    }
    setUploading(false);
    e.target.value = "";
  };

  const deleteImage = (imgId: number|string) => {
    if (!activeAlbum) return;
    const updated = albums.map(a => a.id===activeAlbum.id
      ? { ...a, images:(a.images||[]).filter((i:any)=>i.id!==imgId), imageCount:Math.max(0,(a.imageCount||1)-1) }
      : a
    );
    save(updated);
    setActiveAlbum(updated.find(a=>a.id===activeAlbum.id)||null);
    toast.success("Image deleted");
  };

  const toggleSelect = (id:number) => setSelected(s => s.includes(id) ? s.filter(x=>x!==id) : [...s,id]);
  const filteredAlbums = albums.filter(a => catFilter==="All" || a.category===catFilter);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-white" style={{ fontFamily:"var(--font-display)" }}>
            {activeAlbum ? `📁 ${activeAlbum.name}` : "GALLERY"}
          </h1>
          <p className="text-xs mt-0.5" style={{ color:"rgba(255,255,255,0.4)" }}>
            {activeAlbum ? `${activeAlbum.images?.length||0} photos` : `${albums.length} albums`}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {activeAlbum ? (
            <>
              <Button variant="secondary" size="sm" onClick={()=>setActiveAlbum(null)}>← Albums</Button>
              <input ref={imgRef} type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload}/>
              <Button size="sm" onClick={()=>imgRef.current?.click()} disabled={uploading}>
                {uploading ? <><i className="fa-solid fa-spinner fa-spin"/>Uploading…</> : <><i className="fa-solid fa-upload"/>Upload Photos</>}
              </Button>
            </>
          ) : (
            <>
              {selected.length > 0 && (
                <Button variant="danger" size="sm" onClick={deleteSelected}>
                  <i className="fa-solid fa-trash"/>Delete {selected.length}
                </Button>
              )}
              <Button size="sm" onClick={openNew}><i className="fa-solid fa-folder-plus"/>New Album</Button>
            </>
          )}
        </div>
      </div>

      {!activeAlbum ? (
        <>
          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            {["All",...CATS].map(c=>(
              <button key={c} onClick={()=>setCatFilter(c)}
                className="px-3 py-1.5 text-xs font-bold rounded-sm transition-all"
                style={{ background:catFilter===c?"var(--color-red)":"rgba(255,255,255,0.05)", color:catFilter===c?"white":"rgba(255,255,255,0.5)", border:`1px solid ${catFilter===c?"transparent":"rgba(255,255,255,0.08)"}`, fontFamily:"var(--font-heading)" }}>
                {c}
              </button>
            ))}
          </div>

          {filteredAlbums.length===0 ? (
            <EmptyState icon="fa-solid fa-images" title="No albums yet" desc="Create your first gallery album"
              action={<Button size="sm" onClick={openNew}><i className="fa-solid fa-folder-plus"/>New Album</Button>}/>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAlbums.map((album,i)=>{
                const cover = album.images?.[0]?.url;
                const isSel = selected.includes(album.id);
                return (
                  <div key={album.id} className="rounded-sm overflow-hidden group"
                    style={{ background:"#16213E", border:`1px solid ${isSel?"var(--color-red)":"rgba(255,255,255,0.06)"}` }}>
                    <div className="h-36 relative overflow-hidden cursor-pointer" onClick={()=>setActiveAlbum(album)}>
                      {cover
                        ? <img src={cover} alt={album.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                        : <div className={`absolute inset-0 bg-gradient-to-br ${album.coverColor||GRADS[i%GRADS.length]} flex items-center justify-center`}>
                            <i className="fa-solid fa-images text-3xl text-white/20"/>
                          </div>
                      }
                      <div className="absolute top-2 right-2">
                        <input type="checkbox" checked={isSel} onChange={e=>{e.stopPropagation();toggleSelect(album.id);}}
                          onClick={e=>e.stopPropagation()} className="accent-red-600 w-4 h-4"/>
                      </div>
                      {(album.images?.length||0) > 0 && (
                        <span className="absolute bottom-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded"
                          style={{ background:"rgba(0,0,0,0.7)", color:"white" }}>
                          {album.images?.length} photos
                        </span>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="font-bold text-sm text-white truncate" style={{ fontFamily:"var(--font-heading)" }}>{album.name}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] px-2 py-0.5 rounded-sm font-bold"
                          style={{ background:"rgba(239,1,7,0.1)", color:"var(--color-red)", fontFamily:"var(--font-heading)" }}>
                          {album.category}
                        </span>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={()=>openEdit(album)}><i className="fa-solid fa-pen-to-square text-xs"/></Button>
                          <Button variant="ghost" size="icon" onClick={()=>deleteAlbum(album.id)} className="hover:bg-red-500/15 hover:text-red-400"><i className="fa-solid fa-trash text-xs"/></Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* Album images grid */
        <>
          {(!activeAlbum.images?.length) ? (
            <div className="text-center py-16" style={{ color:"rgba(255,255,255,0.4)" }}>
              <i className="fa-solid fa-upload text-4xl mb-4 block opacity-20"/>
              <p className="font-bold" style={{ fontFamily:"var(--font-heading)" }}>No photos yet</p>
              <p className="text-sm mt-1">Click "Upload Photos" to add images</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {activeAlbum.images.map((img:any) => (
                <div key={img.id} className="group relative aspect-square rounded-sm overflow-hidden"
                  style={{ background:"rgba(255,255,255,0.04)" }}>
                  {img.url
                    ? <img src={img.url} alt={img.title||""} className="w-full h-full object-cover"/>
                    : <div className="w-full h-full flex items-center justify-center"><i className="fa-solid fa-image text-2xl opacity-20"/></div>
                  }
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                    {img.title && <p className="text-white text-[10px] font-bold text-center px-2 line-clamp-2">{img.title}</p>}
                    <button onClick={()=>deleteImage(img.id)}
                      className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-sm"
                      style={{ background:"rgba(239,68,68,0.8)", color:"white" }}>
                      <i className="fa-solid fa-trash text-[10px]"/>Delete
                    </button>
                  </div>
                </div>
              ))}
              {/* Add more tile */}
              <label className="aspect-square rounded-sm border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:border-red-500 transition-colors"
                style={{ borderColor:"rgba(255,255,255,0.15)" }}>
                <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload}/>
                <i className="fa-solid fa-plus text-xl mb-1" style={{ color:"rgba(255,255,255,0.3)" }}/>
                <span className="text-xs" style={{ color:"rgba(255,255,255,0.3)" }}>Add</span>
              </label>
            </div>
          )}
        </>
      )}

      {/* Album modal */}
      <Modal open={showAlbumModal} onClose={()=>setShowAlbumModal(false)} title={editId!==null?"Edit Album":"New Album"} size="sm">
        <div className="p-5 space-y-3">
          <FormGroup label="Album Name *" icon="fa-solid fa-folder"><Input value={form.name} onChange={uf("name")} placeholder="e.g. Watch Party — Chelsea Jan 2025"/></FormGroup>
          <FormGroup label="Category" icon="fa-solid fa-tag">
            <Select value={form.category} onChange={uf("category")}>
              {CATS.map(c=><option key={c} value={c}>{c}</option>)}
            </Select>
          </FormGroup>
          <FormGroup label="Date Label (optional)" icon="fa-solid fa-calendar"><Input value={form.date_label} onChange={uf("date_label")} placeholder="e.g. January 2025"/></FormGroup>
          <FormGroup label="Description (optional)" icon="fa-solid fa-align-left">
            <textarea value={form.description} onChange={uf("description")} rows={2}
              className="input-arsenal w-full resize-none" placeholder="Brief description of this album"/>
          </FormGroup>
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <Button onClick={saveAlbum}><i className="fa-solid fa-check"/>{editId!==null?"Save":"Create"}</Button>
          <Button variant="secondary" onClick={()=>setShowAlbumModal(false)}>Cancel</Button>
        </div>
      </Modal>
    </div>
  );
}
