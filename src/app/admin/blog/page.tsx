"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, Input, Select, Label, Modal, SearchInput, TabBar, Table, Thead, Th, Tbody, Tr, Td, EmptyState, FormGroup, Switch, StatCard } from "@/components/ui";
import toast from "react-hot-toast";
import ImageUploadField from "@/components/ImageUploadField";
import { RichTextField } from "@/components/ui";

const CATEGORIES = ["Club News","Membership","Tickets","Events","Community","Arsenal News","Charity"];
const FONTS = ["Chapman","Northbank","Inter","Oswald","Raleway","Montserrat","Playfair Display","Bebas Neue"];

export default function AdminBlogPage() {
  const { posts, updatePost, deletePost, setPosts, addAdminNotification } = useApp();
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number|null>(null);
  const [preview, setPreview] = useState<any>(null);
  const [form, setForm] = useState({ title:"",excerpt:"",content:"",category:"Club News",status:"Draft" as "Draft"|"Published",featured:false,fontFamily:"Chapman",fontSize:"16",image:"" });
  const sf = (k:string) => (e:React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) => setForm(p=>({...p,[k]:e.target.value}));

  const filtered = posts.filter(p=>{
    const s = search.toLowerCase();
    const matchSearch = p.title.toLowerCase().includes(s)||p.category.toLowerCase().includes(s)||p.author.toLowerCase().includes(s);
    const matchTab = tab==="all"||p.status.toLowerCase()===tab||( tab==="featured"&&p.featured);
    return matchSearch && matchTab;
  });

  const openAdd = () => { setForm({ title:"",excerpt:"",content:"",category:"Club News",status:"Draft",featured:false,fontFamily:"Chapman",fontSize:"16",image:"" }); setEditId(null); setShowForm(true); };
  const openEdit = (p:any) => { setForm({ title:p.title,excerpt:p.excerpt,content:p.content,category:p.category,status:p.status,featured:p.featured,fontFamily:p.fontFamily||"Chapman",fontSize:p.fontSize||"16",image:p.image||"" }); setEditId(p.id); setShowForm(true); };

  const save = () => {
    if (!form.title||!form.content) { toast.error("Title and content are required"); return; }
    const slug = form.title.toLowerCase().replace(/\s+/g,"-").replace(/[^a-z0-9-]/g,"");
    if (editId) { updatePost(editId,{ ...form,slug }); toast.success("Post updated"); }
    else { setPosts([...posts,{ id:Date.now(),slug,author:"Admin",date:new Date().toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"}),views:0,...form }]); toast.success("Post created"); }
    setShowForm(false);
  };

  const toggleStatus = (id:number,current:string) => {
    updatePost(id,{ status:current==="Published"?"Draft":"Published" });
    toast.success(current==="Published"?"Post unpublished":"Post published");
  };

  const deleteConfirm = (id:number,title:string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    deletePost(id); toast.success("Post deleted");
    addAdminNotification("Post Deleted", "A blog post has been removed.", "danger");
  };

  const published = posts.filter(p=>p.status==="Published").length;
  const drafts = posts.filter(p=>p.status==="Draft").length;
  const featured = posts.filter(p=>p.featured).length;

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity:0,y:-10 }} animate={{ opacity:1,y:0 }} className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-white" style={{ fontFamily:"var(--font-display)" }}>BLOG & UPDATES</h1>
          <p className="text-xs mt-0.5" style={{ color:"rgba(255,255,255,0.4)",fontFamily:"var(--font-body)" }}>Create, edit and manage all club news, updates and announcements</p>
        </div>
        <Button onClick={openAdd}><i className="fa-solid fa-plus" />New Post</Button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Published" value={published} icon="fa-solid fa-globe" color="#22C55E" />
        <StatCard label="Drafts" value={drafts} icon="fa-solid fa-pen-to-square" color="#F59E0B" />
        <StatCard label="Featured" value={featured} icon="fa-solid fa-star" color="#C6A84B" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput value={search} onChange={v=>{setSearch(v);}} placeholder="Search posts..." />
        <div className="flex gap-0 border-b border-white/8">
          {[{id:"all",label:"All Posts",count:posts.length},{id:"published",label:"Published",count:published},{id:"draft",label:"Drafts",count:drafts},{id:"featured",label:"Featured",count:featured}].map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} className="px-4 py-2 text-xs font-medium relative whitespace-nowrap transition-colors"
              style={{ color:tab===t.id?"white":"rgba(255,255,255,0.4)",fontFamily:"var(--font-heading)" }}>
              {t.label} <span className="ml-1 px-1.5 py-0.5 text-[9px] rounded-full" style={{ background:tab===t.id?"var(--color-red)":"rgba(255,255,255,0.1)" }}>{t.count}</span>
              {tab===t.id&&<span className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background:"var(--color-red)" }} />}
            </button>
          ))}
        </div>
      </div>

      {/* Posts grid */}
      {filtered.length===0
        ? <EmptyState icon="fa-solid fa-newspaper" title="No posts found" desc="Start by creating your first post" action={<Button onClick={openAdd}><i className="fa-solid fa-plus mr-2" />New Post</Button>} />
        : <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((post,i)=>(
              <motion.div key={post.id} initial={{ opacity:0,y:16 }} animate={{ opacity:1,y:0 }} transition={{ delay:i*0.05 }}>
                <Card className="group h-full flex flex-col overflow-hidden hover:-translate-y-1 transition-transform duration-300">
                  {/* Cover */}
                  <div className="h-28 relative overflow-hidden" style={{ background:"linear-gradient(135deg,#9B0000,#1A1A2E)" }}>
                    {post.image ? <img src={post.image} alt={post.title} className="absolute inset-0 w-full h-full object-cover" /> : <div className="absolute inset-0 flex items-center justify-center opacity-10"><i className="fa-solid fa-newspaper text-6xl text-white" /></div>}
                    <div className="absolute inset-0 flex items-end p-3 gap-2">
                      <Badge variant={post.status==="Published"?"success":"warning"}>{post.status}</Badge>
                      {post.featured && <Badge variant="gold"><i className="fa-solid fa-star text-[9px] mr-1" />Featured</Badge>}
                    </div>
                  </div>
                  <CardContent className="flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline">{post.category}</Badge>
                      <span className="text-[11px]" style={{ color:"rgba(255,255,255,0.3)" }}>{post.date}</span>
                    </div>
                    <h3 className="font-bold text-white text-sm mb-1 leading-snug flex-1" style={{ fontFamily:"var(--font-heading)" }}>{post.title}</h3>
                    <p className="text-xs mb-4 line-clamp-2" style={{ color:"rgba(255,255,255,0.45)" }}>{post.excerpt}</p>
                    <div className="flex items-center justify-between pt-3 border-t border-white/6">
                      <span className="text-xs flex items-center gap-1.5" style={{ color:"rgba(255,255,255,0.35)" }}>
                        <i className="fa-solid fa-eye text-[10px]" />{post.views.toLocaleString()} views
                      </span>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={()=>setPreview(post)} title="Preview"><i className="fa-solid fa-eye text-xs" /></Button>
                        <Button variant="ghost" size="icon" onClick={()=>openEdit(post)} title="Edit"><i className="fa-solid fa-pen text-xs" /></Button>
                        <Button variant="ghost" size="icon" onClick={()=>toggleStatus(post.id,post.status)} title={post.status==="Published"?"Unpublish":"Publish"}>
                          <i className={`fa-solid ${post.status==="Published"?"fa-eye-slash":"fa-globe"} text-xs`} />
                        </Button>
                        <Button variant="danger" size="icon" onClick={()=>deleteConfirm(post.id,post.title)} title="Delete"><i className="fa-solid fa-trash text-xs" /></Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
      }

      {/* Add/Edit Modal */}
      <Modal open={showForm} onClose={()=>setShowForm(false)} title={editId?"Edit Post":"New Blog Post"} size="xl">
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <FormGroup label="Post Title" icon="fa-solid fa-heading">
                <Input value={form.title} onChange={sf("title")} placeholder="e.g. Arsenal Ghana's Amazing Season Run" />
              </FormGroup>
            </div>
            <FormGroup label="Category" icon="fa-solid fa-tag">
              <Select value={form.category} onChange={sf("category")}>
                {CATEGORIES.map(c=><option key={c} style={{ background:"#1A1A2E" }}>{c}</option>)}
              </Select>
            </FormGroup>
            <FormGroup label="Status" icon="fa-solid fa-circle-dot">
              <Select value={form.status} onChange={sf("status")}>
                <option value="Draft" style={{ background:"#1A1A2E" }}>Draft</option>
                <option value="Published" style={{ background:"#1A1A2E" }}>Published</option>
              </Select>
            </FormGroup>
            <FormGroup label="Excerpt (Short Summary)" icon="fa-solid fa-align-left">
              <RichTextField value={form.excerpt} onChange={v => setForm((p:any) => ({...p, excerpt: v}))} placeholder="Brief summary for the blog listing…" minHeight={120} />
            </FormGroup>
            {/* Font Settings */}
            <div className="sm:col-span-2 p-4 rounded-sm" style={{ background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)" }}>
              <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color:"rgba(255,255,255,0.45)",fontFamily:"var(--font-heading)" }}>
                <i className="fa-solid fa-font mr-1.5" style={{ color:"var(--color-red)" }} />Content Font Settings
              </p>
              <div className="grid grid-cols-2 gap-3">
                <FormGroup label="Font Family" icon="fa-solid fa-font">
                  <Select value={form.fontFamily} onChange={sf("fontFamily")}>
                    {FONTS.map(f=><option key={f} style={{ background:"#1A1A2E" }}>{f}</option>)}
                  </Select>
                </FormGroup>
                <FormGroup label="Font Size (px)" icon="fa-solid fa-text-height">
                  <Input type="number" value={form.fontSize} onChange={sf("fontSize")} min="12" max="24" />
                </FormGroup>
              </div>
              <div className="mt-3 p-3 rounded-sm" style={{ background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-xs text-white/40 mb-1" style={{ fontFamily:"var(--font-heading)" }}>PREVIEW:</p>
                <p style={{ fontFamily:form.fontFamily, fontSize:`${form.fontSize}px`, color:"rgba(255,255,255,0.7)", lineHeight:1.6 }}>
                  Arsenal Supporters Club Ghana — Victoria Concordia Crescit
                </p>
              </div>
            </div>
            <div className="sm:col-span-2">
              <FormGroup label="Full Article Content" icon="fa-solid fa-align-left">
                <RichTextField value={form.content} onChange={v => setForm((p:any) => ({...p, content: v}))} placeholder="Write your full article content here..." minHeight={300} />
              </FormGroup>
            </div>
            <div className="sm:col-span-2">
              <ImageUploadField
                label="Cover image"
                value={form.image}
                onChange={(image) => setForm((p) => ({ ...p, image }))}
                folder="blog"
                previewHeight={140}
                hint="Featured image for blog cards and post header."
              />
            </div>
            <div className="sm:col-span-2 flex items-center justify-between p-3 rounded-sm" style={{ background:"rgba(198,168,75,0.08)",border:"1px solid rgba(198,168,75,0.2)" }}>
              <div>
                <p className="text-sm font-bold text-white" style={{ fontFamily:"var(--font-heading)" }}>Featured Post</p>
                <p className="text-xs" style={{ color:"rgba(255,255,255,0.45)" }}>Show this post prominently on the homepage</p>
              </div>
              <Switch checked={form.featured} onChange={()=>setForm(p=>({...p,featured:!p.featured}))} />
            </div>
          </div>
        </div>
        <div className="px-5 py-4 flex justify-end gap-3" style={{ borderTop:"1px solid rgba(255,255,255,0.06)" }}>
          <Button variant="secondary" onClick={()=>setShowForm(false)}>Cancel</Button>
          <Button onClick={save}><i className="fa-solid fa-save mr-1.5" />{editId?"Update Post":"Publish Post"}</Button>
        </div>
      </Modal>

      {/* Preview Modal */}
      <Modal open={!!preview} onClose={()=>setPreview(null)} title={preview?.title||""} size="lg">
        {preview && (
          <div className="p-6">
            <div className="flex gap-2 mb-4">
              <Badge variant={preview.status==="Published"?"success":"warning"}>{preview.status}</Badge>
              <Badge variant="outline">{preview.category}</Badge>
              {preview.featured && <Badge variant="gold"><i className="fa-solid fa-star text-[9px] mr-1" />Featured</Badge>}
            </div>
            <p className="text-sm mb-4" style={{ color:"rgba(255,255,255,0.5)",fontFamily:"var(--font-body)",lineHeight:1.6 }}>{preview.excerpt}</p>
            <div style={{ borderTop:"1px solid rgba(255,255,255,0.08)",paddingTop:"16px" }}>
              <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color:"rgba(255,255,255,0.7)",fontFamily:preview.fontFamily||"var(--font-body)",fontSize:`${preview.fontSize||16}px`,lineHeight:1.8 }}>{preview.content}</p>
            </div>
            <div className="flex gap-3 mt-5 pt-4" style={{ borderTop:"1px solid rgba(255,255,255,0.08)" }}>
              <Button variant="secondary" onClick={()=>setPreview(null)}>Close</Button>
              <Button onClick={()=>{ openEdit(preview); setPreview(null); }}><i className="fa-solid fa-pen mr-1.5" />Edit Post</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
