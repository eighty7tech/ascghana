"use client";
import { useState, useRef } from "react";
import { useApp } from "@/context/AppContext";
import { Card, CardHeader, CardTitle, CardContent, Button, Input, FormGroup, Alert, Switch, Badge, Modal, RichTextField } from "@/components/ui";
import toast from "react-hot-toast";
import { uploadLocalImage } from "@/lib/clientUploads";

export default function BirthdayEmailPage() {
  const { settings, updateSettings, members } = useApp();
  const template = settings.birthdayEmail;
  const [form, setForm] = useState({ ...template });
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const [headerImg, setHeaderImg] = useState(settings.birthdayEmail?.headerImage||"");
  const imgRef = useRef<HTMLInputElement>(null);
  const readImg = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if(!f) return;
    if(f.size>3*1024*1024){toast.error("Max 3MB");return;}
    try { setHeaderImg(await uploadLocalImage(f, "members")); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Upload failed"); }
  };
  const [sending, setSending] = useState(false);
  const sf = (k:string) => (e:React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>) => setForm(p=>({...p,[k]:e.target.value}));

  const today = new Date();
  const todayBirthdays = members.filter(m=>{
    if (!m.dateOfBirth) return false;
    const d=new Date(m.dateOfBirth); return d.getMonth()===today.getMonth()&&d.getDate()===today.getDate();
  });
  const upcomingBirthdays = members.filter(m=>{
    if (!m.dateOfBirth) return false;
    const d=new Date(m.dateOfBirth);
    const next=new Date(today.getFullYear(),d.getMonth(),d.getDate());
    const diff=Math.ceil((next.getTime()-today.getTime())/(1000*60*60*24));
    return diff>0&&diff<=30;
  }).sort((a,b)=>{
    const da=new Date(a.dateOfBirth), db=new Date(b.dateOfBirth);
    return new Date(today.getFullYear(),da.getMonth(),da.getDate()).getTime()-new Date(today.getFullYear(),db.getMonth(),db.getDate()).getTime();
  });

  const save = async ()=>{ setSaving(true);await new Promise(r=>setTimeout(r,700));updateSettings({birthdayEmail:form});setSaving(false);toast.success("Birthday template saved!"); };

  const emailHtml = (name="Kwame") => `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#1A0A0A;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#1A0A0A;padding:40px 20px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
<tr><td style="background:${form.bgColor};padding:35px 40px;text-align:center;border-radius:4px 4px 0 0;">
<p style="color:rgba(255,255,255,0.7);font-size:11px;letter-spacing:3px;text-transform:uppercase;margin:0 0 14px;">Arsenal Supporters Club Ghana</p>
<div style="font-size:56px;margin:0 0 14px;">🎂⚽</div>
<h1 style="color:${form.textColor};font-size:28px;font-weight:900;margin:0;text-transform:uppercase;letter-spacing:2px;">${form.greeting.replace("[MEMBER_NAME]",name)}</h1>
</td></tr>
<tr><td style="background:linear-gradient(135deg,#9B0000,#EF0107);height:5px;"></td></tr>
<tr><td style="background:#16132A;padding:40px;">
<p style="color:rgba(255,255,255,0.85);font-size:15px;line-height:1.8;margin:0 0 24px;white-space:pre-line;">${form.body.replace(/\[MEMBER_NAME\]/g,name).replace(/\n/g,"<br>")}</p>
<hr style="border:none;border-top:1px solid rgba(255,255,255,0.1);margin:24px 0;">
<p style="color:rgba(255,255,255,0.7);font-size:13px;white-space:pre-line;">${form.signoff}</p>
</td></tr>
<tr><td style="background:#0F0D13;padding:20px 40px;text-align:center;border-radius:0 0 4px 4px;">
<p style="color:rgba(255,255,255,0.3);font-size:11px;margin:0;">Victoria Concordia Crescit · Arsenal Supporters Club Ghana</p>
</td></tr>
</table></td></tr></table></body></html>`;

  return (
    <>
    <input ref={imgRef} type="file" accept="image/*" className="hidden" onChange={readImg} />
    
    <div className="max-w-5xl space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-white" style={{ fontFamily:"var(--font-display)" }}>BIRTHDAY EMAILS</h1>
          <p className="text-xs mt-0.5" style={{ color:"rgba(255,255,255,0.4)" }}>Arsenal-themed birthday greetings auto-sent to members on their birthday</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={()=>setPreview(true)}><i className="fa-solid fa-eye" />Preview</Button>
          <Button variant="secondary" onClick={async()=>{setSending(true);await new Promise(r=>setTimeout(r,1500));setSending(false);toast.success("Test birthday email sent!");}} disabled={sending}><i className="fa-solid fa-vial" />Test</Button>
          <Button onClick={save} disabled={saving}>{saving?<><i className="fa-solid fa-spinner fa-spin" />Saving...</>:<><i className="fa-solid fa-save" />Save</>}</Button>
        </div>
      </div>

      {todayBirthdays.length>0&&<Alert variant="success" title={`🎂 ${todayBirthdays.length} Birthday${todayBirthdays.length>1?"s":""} Today!`}>{todayBirthdays.map(m=>`${m.firstName} ${m.lastName}`).join(", ")} — <button onClick={async()=>{setSending(true);await new Promise(r=>setTimeout(r,1800));setSending(false);toast.success(`Sent to ${todayBirthdays.length} member(s)!`);}} className="underline" style={{color:"#22C55E"}}>Send birthday emails now</button></Alert>}

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle><i className="fa-solid fa-envelope-open-text mr-2" style={{ color:"var(--color-red)" }} />Email Template</CardTitle>
                <Switch checked={form.enabled} onChange={()=>setForm(p=>({...p,enabled:!p.enabled}))} label={form.enabled?"Auto-send ON":"Auto-send OFF"} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="info">Use <strong>[MEMBER_NAME]</strong> as placeholder — replaced with member's first name automatically.</Alert>
              <FormGroup label="Email Subject" icon="fa-solid fa-heading"><Input value={form.subject} onChange={sf("subject")} /></FormGroup>
              <FormGroup label="Greeting" icon="fa-solid fa-hand-wave" hint="Use [MEMBER_NAME]"><Input value={form.greeting} onChange={sf("greeting")} /></FormGroup>
              <FormGroup label="Body" icon="fa-solid fa-align-left" hint="Use [MEMBER_NAME]"><RichTextField value={form.body} onChange={v => setForm(p => ({...p, body: v}))} minHeight={200} /></FormGroup>
              <FormGroup label="Sign-off" icon="fa-solid fa-signature"><RichTextField value={form.signoff} onChange={v => setForm(p => ({...p, signoff: v}))} minHeight={100} /></FormGroup>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase tracking-wider mb-2 block" style={{ color:"rgba(255,255,255,0.4)",fontFamily:"var(--font-heading)" }}><i className="fa-solid fa-palette mr-1.5" style={{ color:"var(--color-red)" }} />Header Color</label>
                  <div className="flex items-center gap-3"><input type="color" value={form.bgColor} onChange={e=>setForm(p=>({...p,bgColor:e.target.value}))} className="w-12 h-10 rounded cursor-pointer border-0" /><span className="text-xs font-mono" style={{ color:"rgba(255,255,255,0.4)" }}>{form.bgColor}</span></div>
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider mb-2 block" style={{ color:"rgba(255,255,255,0.4)",fontFamily:"var(--font-heading)" }}><i className="fa-solid fa-font mr-1.5" style={{ color:"var(--color-red)" }} />Header Text Color</label>
                  <div className="flex items-center gap-3"><input type="color" value={form.textColor} onChange={e=>setForm(p=>({...p,textColor:e.target.value}))} className="w-12 h-10 rounded cursor-pointer border-0" /><span className="text-xs font-mono" style={{ color:"rgba(255,255,255,0.4)" }}>{form.textColor}</span></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle><i className="fa-solid fa-cake-candles mr-2" style={{ color:"var(--color-red)" }} />Upcoming (30 days)</CardTitle></CardHeader>
            <CardContent>
              {upcomingBirthdays.length===0
                ? <p className="text-xs text-center py-4" style={{ color:"rgba(255,255,255,0.3)" }}>No birthdays in next 30 days</p>
                : <div className="space-y-2">
                    {upcomingBirthdays.slice(0,8).map(m=>{
                      const d=new Date(m.dateOfBirth);
                      const days=Math.ceil((new Date(today.getFullYear(),d.getMonth(),d.getDate()).getTime()-today.getTime())/(1000*60*60*24));
                      return (
                        <div key={m.id} className="flex items-center gap-2.5 p-2.5 rounded-sm" style={{ background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)" }}>
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0" style={{ background:"rgba(239,1,7,0.15)",color:"var(--color-red)",fontFamily:"var(--font-heading)" }}>{m.firstName[0]}{m.lastName[0]}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-white truncate">{m.firstName} {m.lastName}</p>
                            <p className="text-[10px]" style={{ color:"rgba(255,255,255,0.4)" }}>{d.toLocaleDateString("en-GB",{day:"numeric",month:"short"})}</p>
                          </div>
                          <Badge variant={days<=7?"warning":"default"}>{days}d</Badge>
                        </div>
                      );
                    })}
                  </div>
              }
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color:"rgba(255,255,255,0.4)",fontFamily:"var(--font-heading)" }}>Stats</p>
              {[
                ["Members with DOB", members.filter(m=>m.dateOfBirth).length],
                ["Today's birthdays", todayBirthdays.length],
                ["Next 30 days", upcomingBirthdays.length],
                ["Auto-send", form.enabled?"Enabled":"Disabled"],
              ].map(([l,v])=>(
                <div key={l as string} className="flex justify-between text-xs">
                  <span style={{ color:"rgba(255,255,255,0.5)" }}>{l}</span>
                  <span className="font-bold" style={{ color:"var(--text-primary)",fontFamily:"var(--font-body)" }}>{v}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <Modal open={preview} onClose={()=>setPreview(false)} title="Birthday Email Preview" size="xl">
        <div className="p-5">
          <Badge variant="info" className="mb-3">Preview for: Kwame Asante</Badge>
          <div className="rounded-sm overflow-hidden border border-white/10">
            <iframe srcDoc={emailHtml("Kwame")} className="w-full" style={{ height:"560px",background:"#1A0A0A" }} title="Birthday email preview" />
          </div>
        </div>
      </Modal>
    </div>
    </>
  );
}
