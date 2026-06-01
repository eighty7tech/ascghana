"use client";
import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Card, CardHeader, CardTitle, CardContent, Button, FormGroup, Input, Switch } from "@/components/ui";
import toast from "react-hot-toast";

export default function EmailSettingsPage() {
  const { settings, updateSettings } = useApp();
  const s = settings as any;
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const [host,        setHost]        = useState(s.smtpHost || "");
  const [port,        setPort]        = useState(String(s.smtpPort || 587));
  const [user,        setUser]        = useState(s.smtpUser || "");
  const [pass,        setPass]        = useState(s.smtpPass || "");
  const [fromName,    setFromName]    = useState(s.emailFromName || (settings.siteName || "Arsenal SC Ghana"));
  const [fromEmail,   setFromEmail]   = useState(s.emailFrom || "");
  const [replyTo,     setReplyTo]     = useState(s.emailReplyTo || "");
  const [secure,      setSecure]      = useState<boolean>(s.smtpSecure !== false);
  const [testEmail,   setTestEmail]   = useState("");

  const presets: Record<string, { host: string; port: number; secure: boolean }> = {
    Gmail:   { host: "smtp.gmail.com",       port: 587, secure: false },
    Outlook: { host: "smtp.office365.com",   port: 587, secure: false },
    Yahoo:   { host: "smtp.mail.yahoo.com",  port: 465, secure: true  },
    Zoho:    { host: "smtp.zoho.com",        port: 587, secure: false },
    Mailgun: { host: "smtp.mailgun.org",     port: 587, secure: false },
    SendGrid:{ host: "smtp.sendgrid.net",    port: 587, secure: false },
    Custom:  { host: "",                     port: 587, secure: false },
  };

  const applyPreset = (name: string) => {
    const p = presets[name];
    if (!p) return;
    setHost(p.host); setPort(String(p.port)); setSecure(p.secure);
    toast.success(`${name} SMTP preset applied`);
  };

  const save = async () => {
    if (!host || !user || !fromEmail) {
      toast.error("Host, username and From Email are required");
      return;
    }
    setSaving(true);
    await updateSettings({
      smtpHost: host, smtpPort: Number(port), smtpUser: user,
      smtpPass: pass, smtpSecure: secure,
      emailFromName: fromName, emailFrom: fromEmail, emailReplyTo: replyTo,
    } as any);
    setSaving(false);
    toast.success("Email settings saved");
  };

  const sendTest = async () => {
    if (!testEmail) { toast.error("Enter a test email address"); return; }
    setTesting(true);
    try {
      const res = await fetch("/api/admin/settings/email/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testEmail, host, port: Number(port), user, pass, secure, fromName, fromEmail }),
      });
      const d = await res.json();
      if (d.success) toast.success("Test email sent! Check your inbox.");
      else           toast.error(d.error || "Failed to send test email");
    } catch {
      toast.error("Network error sending test email");
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8">
      <div>
        <span className="section-red-line" />
        <h1 className="text-3xl font-black" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>EMAIL SETTINGS</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Configure SMTP for sending emails (notifications, renewals, 2FA, etc.)</p>
      </div>

      {/* Quick Presets */}
      <Card>
        <CardHeader><CardTitle><i className="fa-solid fa-bolt mr-2" style={{ color: "var(--color-red)" }} />Quick Presets</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.keys(presets).map(name => (
              <button key={name} onClick={() => applyPreset(name)}
                className="px-4 py-2 text-xs font-bold rounded-sm border transition-all hover:border-red-500"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--border-color)", color: "var(--text-secondary)", fontFamily: "var(--font-heading)" }}>
                {name}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* SMTP Config */}
      <Card>
        <CardHeader><CardTitle><i className="fa-solid fa-server mr-2" style={{ color: "var(--color-red)" }} />SMTP Server</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <FormGroup label="SMTP Host">
                <Input value={host} onChange={e => setHost(e.target.value)} placeholder="smtp.gmail.com" />
              </FormGroup>
            </div>
            <FormGroup label="Port">
              <Input type="number" value={port} onChange={e => setPort(e.target.value)} placeholder="587" />
            </FormGroup>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <FormGroup label="Username / Email">
              <Input value={user} onChange={e => setUser(e.target.value)} placeholder="you@gmail.com" />
            </FormGroup>
            <FormGroup label="Password / App Password">
              <div className="relative">
                <Input type={showPass ? "text" : "password"} value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••••••" />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
                  style={{ color: "var(--text-muted)" }}>
                  <i className={`fa-solid ${showPass ? "fa-eye-slash" : "fa-eye"}`} />
                </button>
              </div>
            </FormGroup>
          </div>
          <FormGroup label="Use TLS/SSL (secure)">
            <Switch checked={secure} onChange={setSecure} />
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Use port 465 for SSL, 587 for TLS/STARTTLS</p>
          </FormGroup>
        </CardContent>
      </Card>

      {/* Sender */}
      <Card>
        <CardHeader><CardTitle><i className="fa-solid fa-envelope mr-2" style={{ color: "var(--color-red)" }} />Sender Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <FormGroup label="From Name">
              <Input value={fromName} onChange={e => setFromName(e.target.value)} placeholder="Arsenal SC Ghana" />
            </FormGroup>
            <FormGroup label="From Email">
              <Input type="email" value={fromEmail} onChange={e => setFromEmail(e.target.value)} placeholder="info@ascghana.com" />
            </FormGroup>
          </div>
          <FormGroup label="Reply-To (optional)">
            <Input type="email" value={replyTo} onChange={e => setReplyTo(e.target.value)} placeholder="noreply@ascghana.com" />
          </FormGroup>
        </CardContent>
      </Card>

      {/* Test */}
      <Card>
        <CardHeader><CardTitle><i className="fa-solid fa-flask mr-2" style={{ color: "#10B981" }} />Send Test Email</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <div className="flex-1">
              <Input type="email" value={testEmail} onChange={e => setTestEmail(e.target.value)} placeholder="your@email.com" />
            </div>
            <Button onClick={sendTest} disabled={testing} className="flex-shrink-0 bg-emerald-600 hover:bg-emerald-700">
              {testing ? <><i className="fa-solid fa-spinner fa-spin mr-2" />Sending…</> : <><i className="fa-solid fa-paper-plane mr-2" />Send Test</>}
            </Button>
          </div>
          <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>Save settings first, then send a test to verify your SMTP config.</p>
        </CardContent>
      </Card>

      <Button onClick={save} disabled={saving} className="btn-arsenal w-full py-3 text-base">
        <i className="fa-solid fa-save mr-2" />{saving ? "Saving…" : "Save Email Settings"}
      </Button>
    </div>
  );
}
