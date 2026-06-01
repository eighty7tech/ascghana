"use client";
import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Card, CardHeader, CardTitle, CardContent, Button, FormGroup, Input, Switch } from "@/components/ui";
import toast from "react-hot-toast";
import RichTextEditor from "@/components/RichTextEditor";

export default function SecurityMaintenancePage() {
  const { settings, updateSettings } = useApp();
  const s = settings as any;
  const [saving, setSaving] = useState(false);

  /* ── Maintenance Mode ── */
  const [maintenanceOn,    setMaintenanceOn]    = useState<boolean>(settings.maintenanceMode || false);
  const [maintenanceMsg,   setMaintenanceMsg]   = useState(settings.maintenanceMessage || "");
  const [allowAdmin,       setAllowAdmin]       = useState<boolean>(settings.maintenanceAllowAdmin !== false);
  const [maintenanceBg,    setMaintenanceBg]    = useState(s.maintenanceBgColor || "#07060F");
  const [maintenanceBgImg, setMaintenanceBgImg] = useState(s.maintenanceBgImage || "");
  const [maintenanceCountdown, setMaintenanceCountdown] = useState(s.maintenanceCountdownDate || "");
  const [showContact,      setShowContact]      = useState<boolean>(s.maintenanceShowContact !== false);
  const [showSocial,       setShowSocial]       = useState<boolean>(s.maintenanceShowSocial !== false);

  /* ── Security ── */
  const [maxAttempts, setMaxAttempts] = useState(String(settings.maxLoginAttempts || 5));
  const [lockout,     setLockout]     = useState(String(settings.lockoutMinutes || 30));
  const [session,     setSession]     = useState(String(settings.sessionHours || 12));
  const [ipWhitelist, setIpWhitelist] = useState(s.adminIpWhitelist || "");

  const save = async () => {
    setSaving(true);
    updateSettings({
      maintenanceMode:       maintenanceOn,
      maintenanceMessage:    maintenanceMsg,
      maintenanceAllowAdmin: allowAdmin,
      maxLoginAttempts:      Number(maxAttempts) || 5,
      lockoutMinutes:        Number(lockout) || 30,
      sessionHours:          Number(session) || 12,
      // extra fields stored via any cast
      ...(({
        maintenanceBgColor:     maintenanceBg,
        maintenanceBgImage:     maintenanceBgImg,
        maintenanceCountdownDate: maintenanceCountdown,
        maintenanceShowContact: showContact,
        maintenanceShowSocial:  showSocial,
        adminIpWhitelist:       ipWhitelist,
      }) as any),
    });
    // Set maintenance cookie so middleware can redirect non-admin pages server-side
    if (typeof document !== "undefined") {
      if (maintenanceOn) {
        document.cookie = "asc_maintenance=1; path=/; max-age=86400; SameSite=Strict";
      } else {
        document.cookie = "asc_maintenance=; path=/; max-age=0; SameSite=Strict";
      }
    }
    setSaving(false);
    toast.success(
      maintenanceOn
        ? "Maintenance mode ENABLED — frontend is now restricted"
        : "Maintenance mode DISABLED — site is live"
    );
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <span className="section-red-line" />
        <h1 className="text-3xl font-black" style={{ fontFamily:"var(--font-display)", color:"var(--text-primary)" }}>
          MAINTENANCE &amp; SECURITY
        </h1>
        <p className="text-sm mt-1" style={{ color:"var(--text-muted)" }}>Control site maintenance mode and admin security settings</p>
      </div>

      {/* ── MAINTENANCE MODE ── */}
      <Card>
        <CardHeader><CardTitle><i className="fa-solid fa-hammer mr-2" style={{color:"var(--color-red)"}}/>Maintenance Mode</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center gap-4 p-4 rounded-sm" style={{
            background: maintenanceOn ? "rgba(239,1,7,0.08)" : "rgba(255,255,255,0.03)",
            border: `1px solid ${maintenanceOn ? "rgba(239,1,7,0.3)" : "var(--border-color)"}`
          }}>
            <Switch checked={maintenanceOn} onChange={setMaintenanceOn} />
            <div>
              <p className="font-bold text-sm" style={{color:"var(--text-primary)"}}>
                {maintenanceOn ? "🔴 Maintenance Mode is ON" : "🟢 Site is Live"}
              </p>
              <p className="text-xs mt-0.5" style={{color:"var(--text-muted)"}}>
                {maintenanceOn ? "Only admins can access. All others see the maintenance page." : "All visitors can access the site normally."}
              </p>
            </div>
          </div>

          <FormGroup label="Maintenance Message (shown to visitors)">
            <RichTextEditor value={maintenanceMsg} onChange={setMaintenanceMsg} placeholder="We are performing scheduled maintenance…" minHeight={140} />
          </FormGroup>

          <div className="grid md:grid-cols-2 gap-4">
            <FormGroup label="Background Color">
              <div className="flex gap-2">
                <Input type="color" value={maintenanceBg} onChange={e=>setMaintenanceBg(e.target.value)} className="h-10 w-16 p-1"/>
                <Input value={maintenanceBg} onChange={e=>setMaintenanceBg(e.target.value)} placeholder="#07060F"/>
              </div>
            </FormGroup>
            <FormGroup label="Background Image URL (optional)">
              <Input value={maintenanceBgImg} onChange={e=>setMaintenanceBgImg(e.target.value)} placeholder="https://…"/>
            </FormGroup>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <FormGroup label="Countdown End Date & Time">
              <Input type="datetime-local" value={maintenanceCountdown} onChange={e=>setMaintenanceCountdown(e.target.value)}/>
            </FormGroup>
            <FormGroup label="Allow admin access during maintenance">
              <Switch checked={allowAdmin} onChange={setAllowAdmin}/>
              <p className="text-xs mt-1" style={{color:"var(--text-muted)"}}>Admins can still access all pages</p>
            </FormGroup>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <FormGroup label="Show contact info on page"><Switch checked={showContact} onChange={setShowContact}/></FormGroup>
            <FormGroup label="Show social links on page"><Switch checked={showSocial} onChange={setShowSocial}/></FormGroup>
          </div>
        </CardContent>
      </Card>

      {/* ── SECURITY ── */}
      <Card>
        <CardHeader><CardTitle><i className="fa-solid fa-shield-halved mr-2" style={{color:"var(--color-red)"}}/>Security Settings</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <div className="grid md:grid-cols-3 gap-4">
            <FormGroup label="Max Login Attempts">
              <Input type="number" min={1} max={20} value={maxAttempts} onChange={e=>setMaxAttempts(e.target.value)}/>
              <p className="text-xs mt-1" style={{color:"var(--text-muted)"}}>Attempts before lockout</p>
            </FormGroup>
            <FormGroup label="Lockout Duration (mins)">
              <Input type="number" min={1} value={lockout} onChange={e=>setLockout(e.target.value)}/>
            </FormGroup>
            <FormGroup label="Admin Session (hours)">
              <Input type="number" min={1} max={720} value={session} onChange={e=>setSession(e.target.value)}/>
            </FormGroup>
          </div>
          <FormGroup label="Admin IP Whitelist (comma-separated, optional)">
            <Input value={ipWhitelist} onChange={e=>setIpWhitelist(e.target.value)} placeholder="192.168.1.1, 10.0.0.0/24"/>
            <p className="text-xs mt-1" style={{color:"var(--text-muted)"}}>Leave empty to allow all IPs</p>
          </FormGroup>
        </CardContent>
      </Card>

      <Button onClick={save} disabled={saving} className="btn-arsenal w-full py-3 text-base">
        <i className="fa-solid fa-save mr-2"/>{saving ? "Saving…" : "Save Security & Maintenance Settings"}
      </Button>
    </div>
  );
}
