"use client";
import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, Select, EmptyState, Table, Thead, Th, Tbody, Tr, Td, Modal, FormGroup, Input } from "@/components/ui";
import toast from "react-hot-toast";

const STATUS_OPTS = ["New","Under Review","Implemented","Dismissed"] as const;
const STATUS_V: Record<string,"default"|"warning"|"info"|"success"> = {
  "New":"warning","Under Review":"info","Implemented":"success","Dismissed":"default"
};

export default function AdminSuggestionsPage() {
  const { suggestions, updateSuggestion, deleteSuggestion, addSuggestion } = useApp();
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({ memberName:"", memberNumber:"", tier:"Gold", subject:"", message:"" });
  const [replyModal, setReplyModal] = useState<any>(null);
  const [replyText, setReplyText] = useState("");
  const [filter, setFilter] = useState("All");

  const filtered = filter==="All" ? suggestions : suggestions.filter(s=>s.status===filter);

  const handleReply = (status: string) => {
    if (!replyModal) return;
    updateSuggestion(replyModal.id, { status:status as any, adminReply:replyText||undefined });
    toast.success(`Suggestion ${status.toLowerCase()}`);
    setReplyModal(null); setReplyText("");
  };

  const handleDelete = (id:string) => {
    if (!confirm("Archive this suggestion?")) return;
    deleteSuggestion(id);
    toast.success("Suggestion archived");
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white" style={{ fontFamily:"var(--font-display)" }}>MEMBER SUGGESTIONS</h1>
          <p className="text-xs mt-0.5" style={{ color:"rgba(255,255,255,0.4)" }}>
            {suggestions.filter(s=>s.status==="New").length} new · {suggestions.length} total
          </p>
        </div>
        <Button size="sm" onClick={()=>setShowNew(true)}><i className="fa-solid fa-plus"/>New Suggestion</Button>
        <Select value={filter} onChange={e=>setFilter(e.target.value)} className="w-40">
          <option value="All">All</option>
          {STATUS_OPTS.map(s=><option key={s} value={s}>{s}</option>)}
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <EmptyState icon="fa-solid fa-comment-dots" title="No suggestions" desc="Member suggestions will appear here" />
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {filtered.map(s => (
                <div key={s.id} className="p-5">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background:"rgba(239,1,7,0.1)" }}>
                        <i className="fa-solid fa-comment-dots text-sm" style={{ color:"var(--color-red)" }} />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-white" style={{ fontFamily:"var(--font-heading)" }}>{s.subject}</p>
                        <p className="text-xs mt-0.5" style={{ color:"rgba(255,255,255,0.4)" }}>
                          {s.memberName} · #{s.memberNumber} · {s.tier} ·{" "}
                          {new Date(s.submittedAt).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})}
                        </p>
                      </div>
                    </div>
                    <Badge variant={STATUS_V[s.status]||"default"}>{s.status}</Badge>
                  </div>
                  <p className="text-sm pl-12 mb-3" style={{ color:"rgba(255,255,255,0.6)", fontFamily:"var(--font-body)", lineHeight:1.6 }}>
                    {s.message}
                  </p>
                  {s.adminReply && (
                    <div className="ml-12 mb-3 p-3 rounded-sm text-xs" style={{ background:"rgba(239,1,7,0.06)", borderLeft:"2px solid rgba(239,1,7,0.3)" }}>
                      <p className="font-bold mb-1" style={{ color:"var(--color-red)", fontFamily:"var(--font-heading)" }}>Your Response:</p>
                      <p style={{ color:"rgba(255,255,255,0.6)" }}>{s.adminReply}</p>
                    </div>
                  )}
                  <div className="flex gap-2 pl-12">
                    <Button variant="outline" size="sm" onClick={() => { setReplyModal(s); setReplyText(s.adminReply||""); }}>
                      <i className="fa-solid fa-reply text-xs" />Reply
                    </Button>
                    {s.status==="New" && (
                      <Button variant="secondary" size="sm" onClick={() => updateSuggestion(s.id,{status:"Under Review"})}>
                        Mark Reviewed
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(s.id)}
                      className="hover:bg-red-500/10 hover:text-red-400">
                      <i className="fa-solid fa-archive text-xs" />Archive
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* New suggestion modal */}
      <Modal open={showNew} onClose={()=>setShowNew(false)} title="Add Suggestion (on behalf of member)" size="md">
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <FormGroup label="Member Name" icon="fa-solid fa-user"><Input value={newForm.memberName} onChange={e=>setNewForm(p=>({...p,memberName:e.target.value}))} placeholder="Member's full name"/></FormGroup>
            <FormGroup label="Membership #" icon="fa-solid fa-id-card"><Input value={newForm.memberNumber} onChange={e=>setNewForm(p=>({...p,memberNumber:e.target.value}))} placeholder="00001"/></FormGroup>
          </div>
          <FormGroup label="Subject" icon="fa-solid fa-heading"><Input value={newForm.subject} onChange={e=>setNewForm(p=>({...p,subject:e.target.value}))} placeholder="Suggestion subject"/></FormGroup>
          <FormGroup label="Message" icon="fa-solid fa-comment">
            <textarea value={newForm.message} onChange={e=>setNewForm(p=>({...p,message:e.target.value}))} rows={4}
              className="w-full px-3 py-2.5 text-sm bg-white/5 border border-white/10 rounded-sm text-white placeholder-white/25 outline-none focus:border-[#EF0107] resize-y"/>
          </FormGroup>
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <Button onClick={()=>{
            if(!newForm.subject||!newForm.message){toast.error("Subject and message required");return;}
            addSuggestion({memberId:"admin",memberName:newForm.memberName||"Admin",memberNumber:newForm.memberNumber||"admin",tier:newForm.tier,subject:newForm.subject,message:newForm.message});
            toast.success("Suggestion added");setShowNew(false);setNewForm({memberName:"",memberNumber:"",tier:"Gold",subject:"",message:""});
          }}><i className="fa-solid fa-check"/>Add Suggestion</Button>
          <Button variant="secondary" onClick={()=>setShowNew(false)}>Cancel</Button>
        </div>
      </Modal>

      {/* Reply modal */}
      <Modal open={!!replyModal} onClose={() => setReplyModal(null)} title="Reply to Suggestion" size="md">
        {replyModal && (
          <div className="p-5 space-y-4">
            <div className="p-3 rounded-sm text-sm" style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.06)" }}>
              <p className="font-bold text-white mb-1" style={{ fontFamily:"var(--font-heading)" }}>{replyModal.subject}</p>
              <p style={{ color:"rgba(255,255,255,0.6)" }}>{replyModal.message}</p>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color:"rgba(255,255,255,0.4)", fontFamily:"var(--font-heading)" }}>
                Your Response (optional)
              </label>
              <textarea value={replyText} onChange={e=>setReplyText(e.target.value)} rows={4}
                placeholder="Write your response to this suggestion..."
                className="w-full px-3 py-2.5 text-sm bg-white/5 border border-white/10 rounded-sm text-white placeholder-white/25 outline-none focus:border-[#EF0107] resize-y" />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button onClick={()=>handleReply("Implemented")}>
                <i className="fa-solid fa-check" />Mark Implemented
              </Button>
              <Button variant="secondary" onClick={()=>handleReply("Under Review")}>
                <i className="fa-solid fa-eye" />Mark Under Review
              </Button>
              <Button variant="danger" onClick={()=>handleReply("Dismissed")}>
                Dismiss
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
