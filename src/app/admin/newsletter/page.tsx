"use client";
import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Card, CardHeader, CardTitle, CardContent, Button, FormGroup, Input, Select, Modal, Table, Thead, Th, Tbody, Tr, Td, EmptyState, Badge, RichTextField } from "@/components/ui";
import toast from "react-hot-toast";

interface Subscriber { id:string; email:string; name:string; isActive:boolean; source:string; subscribedAt:string; }

export default function AdminNewsletterPage() {
  const { members, settings, updateSettings } = useApp();
  const [tab, setTab] = useState<"compose"|"subscribers"|"settings">("compose");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [showAddSub, setShowAddSub] = useState(false);
  const [subForm, setSubForm] = useState({ email:"", name:"" });
  const [smtpForm, setSmtpForm] = useState({
    provider: settings.newsletterProvider||"smtp",
    apiKey: settings.newsletterApiKey||"",
    fromEmail: settings.newsletterFromEmail||"newsletter@arsenalghana.com",
    fromName: settings.newsletterFromName||"Arsenal Ghana",
  });
  const [saving, setSaving] = useState(false);

  const activeMembers = members.filter(m=>m.status==="Active" && m.email);
  const activeSubscribers = subscribers.filter(s=>s.isActive);
  const totalRecipients = new Set([...activeMembers.map(m=>m.email), ...activeSubscribers.map(s=>s.email)]).size;

  const addSubscriber = () => {
    if (!subForm.email || !/\S+@\S+\.\S+/.test(subForm.email)) { toast.error("Valid email required"); return; }
    if (subscribers.find(s=>s.email===subForm.email)) { toast.error("Email already subscribed"); return; }
    const newSub: Subscriber = { id:Date.now().toString(), email:subForm.email, name:subForm.name, isActive:true, source:"admin", subscribedAt:new Date().toISOString() };
    setSubscribers(p=>[...p,newSub]);
    toast.success("Subscriber added");
    setShowAddSub(false); setSubForm({email:"",name:""});
  };

  const toggleSub = (id:string) => setSubscribers(p=>p.map(s=>s.id===id?{...s,isActive:!s.isActive}:s));
  const deleteSub = (id:string) => { setSubscribers(p=>p.filter(s=>s.id!==id)); toast.success("Removed"); };
  const importMembers = () => {
    const existing = new Set(subscribers.map(s=>s.email));
    const toAdd = activeMembers.filter(m=>!existing.has(m.email)).map(m=>({
      id:Date.now().toString()+m.id, email:m.email, name:`${m.firstName} ${m.lastName}`,
      isActive:true, source:"members", subscribedAt:new Date().toISOString()
    }));
    if (!toAdd.length) { toast("All active members already subscribed"); return; }
    setSubscribers(p=>[...p,...toAdd]);
    toast.success(`${toAdd.length} members imported`);
  };

  const handleSend = async () => {
    if (!subject || !body) { toast.error("Subject and message required"); return; }
    setSending(true); await new Promise(r=>setTimeout(r,2000)); setSending(false);
    toast.success(`Newsletter queued for ${totalRecipients} recipients`);
    setSubject(""); setBody("");
  };

  const saveSettings = async () => {
    setSaving(true);
    updateSettings({ newsletterProvider:smtpForm.provider as any, newsletterApiKey:smtpForm.apiKey, newsletterFromEmail:smtpForm.fromEmail, newsletterFromName:smtpForm.fromName });
    setSaving(false); toast.success("Email settings saved");
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-white" style={{ fontFamily:"var(--font-display)" }}>NEWSLETTER</h1>
          <p className="text-xs mt-0.5" style={{ color:"rgba(255,255,255,0.4)" }}>
            {totalRecipients} recipients · {activeMembers.length} members + {activeSubscribers.length} subscribers
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-sm" style={{ background:"rgba(255,255,255,0.04)", width:"fit-content" }}>
        {[["compose","Compose"],["subscribers","Subscribers"],["settings","Email Settings"]].map(([val,label])=>(
          <button key={val} onClick={()=>setTab(val as any)}
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-sm transition-all"
            style={{ background:tab===val?"var(--color-red)":"transparent", color:tab===val?"white":"rgba(255,255,255,0.4)", fontFamily:"var(--font-heading)" }}>
            {label}
          </button>
        ))}
      </div>

      {tab==="compose" && (
        <div className="max-w-2xl space-y-4">
          <Card>
            <CardHeader><CardTitle><i className="fa-solid fa-envelope mr-2" style={{ color:"var(--color-red)" }}/>Compose Newsletter</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <FormGroup label="Subject *" icon="fa-solid fa-heading"><Input value={subject} onChange={e=>setSubject(e.target.value)} placeholder="Newsletter subject line"/></FormGroup>
              <FormGroup label="Message Body *" icon="fa-solid fa-align-left" hint="Variables: [MEMBER_NAME], [MEMBERSHIP_NUMBER], [TIER]">
                <RichTextField value={body} onChange={setBody} placeholder="Write your newsletter content…" minHeight={260} />
              </FormGroup>
              <div className="p-3 rounded-sm text-xs" style={{ background:"rgba(198,168,75,0.06)", border:"1px solid rgba(198,168,75,0.15)" }}>
                <p className="font-bold mb-1" style={{ color:"var(--color-gold)", fontFamily:"var(--font-heading)" }}>Recipients</p>
                <p style={{ color:"rgba(255,255,255,0.5)" }}>{activeMembers.length} active members + {activeSubscribers.length} newsletter subscribers = <strong style={{ color:"white" }}>{totalRecipients} unique emails</strong></p>
              </div>
              <Button onClick={handleSend} disabled={sending||!subject||!body} className="w-full">
                {sending?<><i className="fa-solid fa-spinner fa-spin"/>Sending…</>:<><i className="fa-solid fa-paper-plane"/>Send to {totalRecipients} Recipients</>}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {tab==="subscribers" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <CardTitle><i className="fa-solid fa-users mr-2" style={{ color:"var(--color-red)" }}/>Subscribers ({subscribers.length})</CardTitle>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={importMembers}><i className="fa-solid fa-download"/>Import Active Members</Button>
                <Button size="sm" onClick={()=>setShowAddSub(true)}><i className="fa-solid fa-plus"/>Add Subscriber</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {subscribers.length===0 ? (
              <EmptyState icon="fa-solid fa-envelope" title="No subscribers yet" desc="Add subscribers or import active members"
                action={<Button size="sm" onClick={importMembers}><i className="fa-solid fa-download"/>Import Members</Button>}/>
            ) : (
              <Table>
                <Thead><Th>Email</Th><Th>Name</Th><Th>Source</Th><Th>Status</Th><Th>Actions</Th></Thead>
                <Tbody>
                  {subscribers.map(s=>(
                    <Tr key={s.id}>
                      <Td className="text-sm text-white">{s.email}</Td>
                      <Td className="text-xs">{s.name||"—"}</Td>
                      <Td><span className="text-xs capitalize" style={{ color:"rgba(255,255,255,0.4)" }}>{s.source}</span></Td>
                      <Td><Badge variant={s.isActive?"success":"default"}>{s.isActive?"Subscribed":"Unsubscribed"}</Badge></Td>
                      <Td>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={()=>toggleSub(s.id)} title={s.isActive?"Unsubscribe":"Resubscribe"}>
                            <i className={`fa-solid ${s.isActive?"fa-toggle-on":"fa-toggle-off"} text-xs`} style={{ color:s.isActive?"#10B981":"#6B7280" }}/>
                          </Button>
                          <Button variant="ghost" size="icon" onClick={()=>deleteSub(s.id)} className="hover:bg-red-500/15 hover:text-red-400">
                            <i className="fa-solid fa-trash text-xs"/>
                          </Button>
                        </div>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {tab==="settings" && (
        <div className="max-w-xl space-y-4">
          <Card>
            <CardHeader><CardTitle><i className="fa-solid fa-gear mr-2" style={{ color:"var(--color-gold)" }}/>Email Provider Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <FormGroup label="Provider" icon="fa-solid fa-server">
                <Select value={smtpForm.provider} onChange={e=>setSmtpForm(p=>({...p,provider:e.target.value}))}>
                  <option value="smtp">SMTP (self-hosted)</option>
                  <option value="mailchimp">Mailchimp</option>
                  <option value="sendgrid">SendGrid</option>
                  <option value="mailgun">Mailgun</option>
                  <option value="brevo">Brevo (Sendinblue)</option>
                </Select>
              </FormGroup>
              {smtpForm.provider!=="smtp" && (
                <FormGroup label="API Key" icon="fa-solid fa-key"><Input type="password" value={smtpForm.apiKey} onChange={e=>setSmtpForm(p=>({...p,apiKey:e.target.value}))} placeholder="Your API key"/></FormGroup>
              )}
              <div className="grid grid-cols-2 gap-3">
                <FormGroup label="From Name" icon="fa-solid fa-user"><Input value={smtpForm.fromName} onChange={e=>setSmtpForm(p=>({...p,fromName:e.target.value}))} placeholder="Arsenal Ghana"/></FormGroup>
                <FormGroup label="From Email" icon="fa-solid fa-envelope"><Input type="email" value={smtpForm.fromEmail} onChange={e=>setSmtpForm(p=>({...p,fromEmail:e.target.value}))} placeholder="newsletter@arsenalghana.com"/></FormGroup>
              </div>
              <Button onClick={saveSettings} disabled={saving}>
                {saving?<><i className="fa-solid fa-spinner fa-spin"/>Saving…</>:<><i className="fa-solid fa-floppy-disk"/>Save Settings</>}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <Modal open={showAddSub} onClose={()=>setShowAddSub(false)} title="Add Subscriber" size="sm">
        <div className="p-5 space-y-3">
          <FormGroup label="Email Address *" icon="fa-solid fa-envelope"><Input type="email" value={subForm.email} onChange={e=>setSubForm(p=>({...p,email:e.target.value}))} placeholder="subscriber@email.com"/></FormGroup>
          <FormGroup label="Name (optional)" icon="fa-solid fa-user"><Input value={subForm.name} onChange={e=>setSubForm(p=>({...p,name:e.target.value}))} placeholder="Subscriber name"/></FormGroup>
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <Button onClick={addSubscriber}><i className="fa-solid fa-plus"/>Add Subscriber</Button>
          <Button variant="secondary" onClick={()=>setShowAddSub(false)}>Cancel</Button>
        </div>
      </Modal>
    </div>
  );
}
