"use client";
import { useState } from "react";
import { useApp } from "@/context/AppContext";
import type { ExcoMember } from "@/context/AppContext";
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Select, Modal, Badge, FormGroup, EmptyState, Avatar } from "@/components/ui";
import toast from "react-hot-toast";

const COLORS = ["#EF0107","#C6A84B","#3B82F6","#10B981","#8B5CF6","#F59E0B","#EC4899","#06B6D4","#F97316","#A78BFA"];
const blank: Omit<ExcoMember,"id"> = { name:"",position:"",years:"",bio:"",initials:"",color:"#EF0107",type:"exco",photo:"",facebook:"",instagram:"",twitter:"" };

export default function AdminExcoPage() {
  const { exco, setExco, updateExco, deleteExco } = useApp();
  const [editId, setEditId] = useState<number|null>(null);
  const [form, setForm] = useState<Omit<ExcoMember,"id">>({ ...blank });
  const [showForm, setShowForm] = useState(false);
  const [tab, setTab] = useState<"exco"|"serving">("exco");

  const set = (k:string) => (e:React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const openAdd = (type:"exco"|"serving") => { setForm({ ...blank, type }); setEditId(null); setShowForm(true); };
  const openEdit = (m: ExcoMember) => { setForm({ ...m }); setEditId(m.id); setShowForm(true); };

  const handleSave = () => {
    if (!form.name || !form.position) { toast.error("Name and position required"); return; }
    const initials = form.name.split(" ").map(p=>p[0]).slice(0,2).join("").toUpperCase();
    const data = { ...form, initials:form.initials||initials };
    if (editId !== null) {
      updateExco(editId, data);
      toast.success("Exco member updated");
    } else {
      const newId = exco.length > 0 ? Math.max(...exco.map(e=>e.id)) + 1 : 1;
      setExco([...exco, { id:newId, ...data }]);
      toast.success("Exco member added");
    }
    setShowForm(false);
  };

  const handleDelete = (id:number) => {
    if (!confirm("Remove this member from the Exco page?")) return;
    deleteExco(id);
    toast.success("Removed");
  };

  const displayed = exco.filter(m => m.type === tab);
  const inp = "w-full h-9 px-3 text-sm bg-white/5 border border-white/10 rounded-sm text-white placeholder-white/25 outline-none focus:border-[#EF0107]";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white" style={{ fontFamily:"var(--font-display)" }}>EXCO MEMBERS</h1>
          <p className="text-xs mt-0.5" style={{ color:"rgba(255,255,255,0.4)" }}>Manage executive committee and serving members shown on the about/exco page</p>
        </div>
        <Button size="sm" onClick={() => openAdd(tab)}>
          <i className="fa-solid fa-plus" />Add {tab === "exco" ? "Exco" : "Serving"} Member
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-sm" style={{ background:"var(--bg-card)", width:"fit-content" }}>
        {([["exco","Executive Committee"],["serving","Serving Members"]] as const).map(([val,label]) => (
          <button key={val} onClick={() => setTab(val)}
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-sm transition-all"
            style={{ background:tab===val?"var(--color-red)":"transparent", color:tab===val?"white":"rgba(255,255,255,0.4)", fontFamily:"var(--font-heading)" }}>
            {label} ({exco.filter(e=>e.type===val).length})
          </button>
        ))}
      </div>

      {displayed.length === 0 ? (
        <Card><CardContent><EmptyState icon="fa-solid fa-user-tie" title={`No ${tab} members yet`} desc="Click Add above to get started"
          action={<Button size="sm" onClick={() => openAdd(tab)}><i className="fa-solid fa-plus" />Add Member</Button>} /></CardContent></Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {displayed.map(m => (
            <div key={m.id} className="p-5 rounded-sm text-center" style={{ background:"var(--bg-card)", border:`1px solid ${m.color}25` }}>
              <Avatar src={m.photo} fallback={m.initials} size={64} color={m.color} />
              <p className="font-bold text-sm mt-3" style={{ color:"var(--text-primary)", fontFamily:"var(--font-heading)" }}>{m.name}</p>
              <p className="text-xs font-bold mt-0.5" style={{ color:m.color, fontFamily:"var(--font-heading)" }}>{m.position}</p>
              <p className="text-xs mt-0.5" style={{ color:"rgba(255,255,255,0.35)" }}>{m.years}</p>
              {m.bio && <p className="text-xs mt-2 line-clamp-2" style={{ color:"rgba(255,255,255,0.5)" }}>{m.bio}</p>}
              <div className="flex gap-1.5 justify-center mt-3">
                {m.facebook && <a href={m.facebook} target="_blank" rel="noopener noreferrer" className="w-6 h-6 flex items-center justify-center rounded-sm" style={{ background:"rgba(24,119,242,0.15)", color:"#1877F2" }}><i className="fa-brands fa-facebook-f text-[10px]" /></a>}
                {m.instagram && <a href={m.instagram} target="_blank" rel="noopener noreferrer" className="w-6 h-6 flex items-center justify-center rounded-sm" style={{ background:"rgba(225,48,108,0.15)", color:"#E1306C" }}><i className="fa-brands fa-instagram text-[10px]" /></a>}
                {m.twitter && <a href={m.twitter} target="_blank" rel="noopener noreferrer" className="w-6 h-6 flex items-center justify-center rounded-sm" style={{ background:"rgba(29,161,242,0.15)", color:"#1DA1F2" }}><i className="fa-brands fa-x-twitter text-[10px]" /></a>}
              </div>
              <div className="flex gap-2 mt-3">
                <Button variant="secondary" size="sm" className="flex-1" onClick={() => openEdit(m)}><i className="fa-solid fa-pen-to-square text-xs" />Edit</Button>
                <Button variant="danger" size="sm" onClick={() => handleDelete(m.id)}><i className="fa-solid fa-trash text-xs" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editId!==null?"Edit Member":"Add Member"} size="md">
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <FormGroup label="Full Name *" icon="fa-solid fa-user">
              <input value={form.name} onChange={set("name")} placeholder="e.g. Kwame Asante" className={inp} />
            </FormGroup>
            <FormGroup label="Position *" icon="fa-solid fa-briefcase">
              <input value={form.position} onChange={set("position")} placeholder="e.g. President" className={inp} />
            </FormGroup>
            <FormGroup label="Years of Service" icon="fa-solid fa-calendar">
              <input value={form.years} onChange={set("years")} placeholder="e.g. 2018 – Present" className={inp} />
            </FormGroup>
            <FormGroup label="Type" icon="fa-solid fa-tag">
              <Select value={form.type} onChange={set("type")}>
                <option value="exco">Executive Committee</option>
                <option value="serving">Serving Member</option>
              </Select>
            </FormGroup>
          </div>
          <FormGroup label="Bio" icon="fa-solid fa-align-left">
            <textarea value={form.bio} onChange={set("bio")} rows={3} placeholder="Brief description..."
              className="w-full px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-sm text-white placeholder-white/25 outline-none focus:border-[#EF0107] resize-none" />
          </FormGroup>
          <FormGroup label="Profile Photo URL" icon="fa-solid fa-image">
            <input value={form.photo||""} onChange={set("photo")} placeholder="https://... or /uploads/..." className={inp} />
          </FormGroup>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color:"rgba(255,255,255,0.4)", fontFamily:"var(--font-heading)" }}>
              <i className="fa-solid fa-palette mr-1.5 text-[10px]" style={{ color:"var(--color-red)" }} />Badge Color
            </label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => setForm(p=>({...p,color:c}))}
                  className="w-8 h-8 rounded-full transition-all hover:scale-110 flex items-center justify-center"
                  style={{ background:c, outline:form.color===c?`3px solid white`:"3px solid transparent", outlineOffset:2 }}>
                  {form.color===c && <i className="fa-solid fa-check text-[10px] text-white drop-shadow" />}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <FormGroup label="Facebook URL" icon="fa-brands fa-facebook-f">
              <input value={form.facebook||""} onChange={set("facebook")} placeholder="https://..." className={inp} />
            </FormGroup>
            <FormGroup label="Instagram URL" icon="fa-brands fa-instagram">
              <input value={form.instagram||""} onChange={set("instagram")} placeholder="https://..." className={inp} />
            </FormGroup>
            <FormGroup label="Twitter/X URL" icon="fa-brands fa-x-twitter">
              <input value={form.twitter||""} onChange={set("twitter")} placeholder="https://..." className={inp} />
            </FormGroup>
          </div>
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <Button onClick={handleSave}><i className="fa-solid fa-check" />{editId!==null?"Save Changes":"Add Member"}</Button>
          <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
        </div>
      </Modal>
    </div>
  );
}
