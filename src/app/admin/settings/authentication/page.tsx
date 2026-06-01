"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { Card, CardHeader, CardTitle, CardContent, Button, FormGroup, Input, Switch, Select } from "@/components/ui";
import toast from "react-hot-toast";

export default function AuthSettingsPage() {
  const { settings, updateSettings } = useApp();
  const s = settings as any;

  const [twoFaEnabled,         setTwoFaEnabled]         = useState<boolean>(s.twoFaEnabled ?? false);
  const [authMethod,           setAuthMethod]           = useState<string>(s.authMethod || "email");
  const [memberTwoFa,          setMemberTwoFa]          = useState<boolean>(s.memberTwoFaEnabled ?? false);
  const [memberTwoFaMethod,    setMemberTwoFaMethod]    = useState<string>(s.memberTwoFaMethod || "email");
  const [googleEnabled,        setGoogleEnabled]        = useState<boolean>(s.googleEnabled ?? false);
  const [facebookEnabled,      setFacebookEnabled]      = useState<boolean>(s.facebookEnabled ?? false);
  const [googleClientId,       setGoogleClientId]       = useState<string>(settings.googleClientId || "");
  const [facebookAppId,        setFacebookAppId]        = useState<string>(settings.facebookAppId || "");
  const [sessionHours,         setSessionHours]         = useState<number>(s.sessionHours ?? 12);
  const [memberSessionDays,    setMemberSessionDays]    = useState<number>(s.memberSessionDays ?? 30);
  const [maxLoginAttempts,     setMaxLoginAttempts]     = useState<number>(s.maxLoginAttempts ?? 5);
  const [lockoutMinutes,       setLockoutMinutes]       = useState<number>(s.lockoutMinutes ?? 30);
  const [requirePasswordChange,setRequirePasswordChange]= useState<boolean>(s.requirePasswordChange ?? false);
  const [passwordMinLength,    setPasswordMinLength]    = useState<number>(s.passwordMinLength ?? 8);
  // Email & SMS auth provider settings
  const [smtpHost,     setSmtpHost]     = useState<string>(s.smtpHost || "");
  const [smtpPort,     setSmtpPort]     = useState<string>(String(s.smtpPort || 587));
  const [smtpUser,     setSmtpUser]     = useState<string>(s.smtpUser || "");
  const [smtpPass,     setSmtpPass]     = useState<string>(s.smtpPassword || "");
  const [smtpFrom,     setSmtpFrom]     = useState<string>(s.smtpFrom || "");
  const [smtpSecure,   setSmtpSecure]   = useState<boolean>(s.smtpSecure ?? true);
  const [emailProvider,setEmailProvider]= useState<string>(s.emailProvider || "smtp");
  const [sendgridKey,  setSendgridKey]  = useState<string>(s.sendgridApiKey || "");
  const [mailgunKey,   setMailgunKey]   = useState<string>(s.mailgunApiKey || "");
  const [mailgunDomain,setMailgunDomain]= useState<string>(s.mailgunDomain || "");
  // SMS providers
  const [smsProvider,  setSmsProvider]  = useState<string>(s.smsAuthProvider || "twilio");
  const [twilioSid,    setTwilioSid]    = useState<string>(s.twilioAccountSid || "");
  const [twilioToken,  setTwilioToken]  = useState<string>(s.twilioAuthToken || "");
  const [twilioFrom,   setTwilioFrom]   = useState<string>(s.twilioPhoneNumber || "");
  const [hubtelId,     setHubtelId]     = useState<string>(s.hubtelClientId || "");
  const [hubtelSecret, setHubtelSecret] = useState<string>(s.hubtelClientSecret || "");
  const [hubtelFrom,   setHubtelFrom]   = useState<string>(s.hubtelSenderId || "ASCGhana");
  const [saving, setSaving] = useState(false);

  // Sync local state when settings load from DB (async fetch)
  const [synced, setSynced] = useState(false);
  useEffect(() => {
    if (synced) return; // Only sync once from DB load, not on every settings change
    const hasData = s.smtpHost || s.twilioAccountSid || s.smtpPort || s.emailProvider;
    if (!hasData) return;
    setSynced(true);
    if (s.smtpHost)         setSmtpHost(s.smtpHost);
    if (s.smtpPort)         setSmtpPort(String(s.smtpPort));
    if (s.smtpUser)         setSmtpUser(s.smtpUser);
    if (s.smtpPassword)     setSmtpPass(s.smtpPassword);
    if (s.smtpFrom)         setSmtpFrom(s.smtpFrom);
    if (s.smtpSecure !== undefined) setSmtpSecure(s.smtpSecure);
    if (s.emailProvider)    setEmailProvider(s.emailProvider);
    if (s.sendgridApiKey)   setSendgridKey(s.sendgridApiKey);
    if (s.mailgunApiKey)    setMailgunKey(s.mailgunApiKey);
    if (s.mailgunDomain)    setMailgunDomain(s.mailgunDomain);
    if (s.smsAuthProvider)  setSmsProvider(s.smsAuthProvider);
    if (s.twilioAccountSid) setTwilioSid(s.twilioAccountSid);
    if (s.twilioAuthToken)  setTwilioToken(s.twilioAuthToken);
    if (s.twilioPhoneNumber)setTwilioFrom(s.twilioPhoneNumber);
    if (s.hubtelClientId)   setHubtelId(s.hubtelClientId);
    if (s.hubtelClientSecret)setHubtelSecret(s.hubtelClientSecret);
    if (s.hubtelSenderId)   setHubtelFrom(s.hubtelSenderId);
    if (s.twoFaEnabled !== undefined) setTwoFaEnabled(s.twoFaEnabled);
    if (s.googleClientId)   setGoogleClientId(s.googleClientId);
    if (s.facebookAppId)    setFacebookAppId(s.facebookAppId);
  }, [settings, synced]); // eslint-disable-line

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save everything through updateSettings so it persists to app_state DB
      updateSettings({
        twoFaEnabled,
        authMethod: authMethod as "email"|"sms"|"none",
        memberTwoFaEnabled: memberTwoFa,
        memberTwoFaMethod: memberTwoFaMethod as "email"|"sms",
        googleEnabled,
        facebookEnabled,
        googleClientId,
        facebookAppId,
        sessionHours,
        memberSessionDays,
        maxLoginAttempts,
        lockoutMinutes,
        requirePasswordChange,
        passwordMinLength,
        // Email provider
        emailProvider, smtpHost, smtpPort: Number(smtpPort), smtpUser, smtpPassword: smtpPass,
        smtpFrom, smtpSecure, sendgridApiKey: sendgridKey, mailgunApiKey: mailgunKey, mailgunDomain,
        // SMS provider
        smsAuthProvider: smsProvider, twilioAccountSid: twilioSid, twilioAuthToken: twilioToken,
        twilioPhoneNumber: twilioFrom, hubtelClientId: hubtelId, hubtelClientSecret: hubtelSecret,
        hubtelSenderId: hubtelFrom,
      } as any);
      toast.success("Authentication settings saved!");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const sec = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" };

  return (
    <div className="space-y-6 max-w-3xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white" style={{ fontFamily: "var(--font-display)" }}>AUTHENTICATION SETTINGS</h1>
          <p className="text-xs mt-0.5 text-white/40">Configure 2FA, social login, sessions and security policies — all settings persist to database</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <><i className="fa-solid fa-spinner fa-spin mr-1.5" />Saving…</> : <><i className="fa-solid fa-save mr-1.5" />Save Settings</>}
        </Button>
      </motion.div>

      {/* Admin 2FA */}
      <Card>
        <CardHeader><CardTitle><i className="fa-solid fa-shield-halved mr-2" style={{ color: "var(--color-red)" }} />Admin Two-Factor Authentication</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-sm" style={sec}>
            <div>
              <p className="text-sm font-medium text-white">Enable 2FA for Admin Logins</p>
              <p className="text-xs text-white/40 mt-0.5">Require a verification code when admins log in</p>
            </div>
            <Switch checked={twoFaEnabled} onChange={() => setTwoFaEnabled(p => !p)} />
          </div>
          {twoFaEnabled && (
            <div className="p-4 rounded-sm space-y-3" style={sec}>
              <FormGroup label="Verification Method">
                <Select value={authMethod} onChange={e => setAuthMethod(e.target.value)}>
                  <option value="email">Email OTP (6-digit code sent to email)</option>
                  <option value="sms">SMS OTP (requires SMS provider)</option>
                  <option value="none">None (disabled)</option>
                </Select>
              </FormGroup>
              <div className="flex items-start gap-2 p-3 rounded-sm" style={{ background: "rgba(198,168,75,0.08)", border: "1px solid rgba(198,168,75,0.2)" }}>
                <i className="fa-solid fa-circle-info mt-0.5 text-xs" style={{ color: "#C6A84B" }} />
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>
                  {authMethod === "email" ? "Codes sent via SMTP. Configure SMTP in Email / Newsletter settings." : "SMS provider integration required. Contact developer."}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Member 2FA */}
      <Card>
        <CardHeader><CardTitle><i className="fa-solid fa-mobile-screen-button mr-2" style={{ color: "var(--color-red)" }} />Member Two-Factor Authentication</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-sm" style={sec}>
            <div>
              <p className="text-sm font-medium text-white">Enable 2FA for Member Logins</p>
              <p className="text-xs text-white/40 mt-0.5">Members can optionally enable 2FA in Profile → Settings → Security</p>
            </div>
            <Switch checked={memberTwoFa} onChange={() => setMemberTwoFa(p => !p)} />
          </div>
          {memberTwoFa && (
            <FormGroup label="Member 2FA Method">
              <Select value={memberTwoFaMethod} onChange={e => setMemberTwoFaMethod(e.target.value)}>
                <option value="email">Email OTP</option>
                <option value="sms">SMS OTP</option>
              </Select>
            </FormGroup>
          )}
        </CardContent>
      </Card>

      {/* Social Login */}
      <Card>
        <CardHeader><CardTitle><i className="fa-brands fa-google mr-2" style={{ color: "#4285F4" }} />Social Login (OAuth)</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-sm space-y-3" style={sec}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <i className="fa-brands fa-google text-sm" style={{ color: "#4285F4" }} />
                <div>
                  <p className="text-sm font-medium text-white">Google Sign-In</p>
                  <p className="text-xs text-white/40">Allow members to sign in with Google</p>
                </div>
              </div>
              <Switch checked={googleEnabled} onChange={() => setGoogleEnabled(p => !p)} />
            </div>
            {googleEnabled && (
              <FormGroup label="Google Client ID">
                <Input value={googleClientId} onChange={e => setGoogleClientId(e.target.value)} placeholder="xxxx.apps.googleusercontent.com" />
              </FormGroup>
            )}
          </div>
          <div className="p-4 rounded-sm space-y-3" style={sec}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <i className="fa-brands fa-facebook-f text-sm" style={{ color: "#1877F2" }} />
                <div>
                  <p className="text-sm font-medium text-white">Facebook Login</p>
                  <p className="text-xs text-white/40">Allow members to sign in with Facebook</p>
                </div>
              </div>
              <Switch checked={facebookEnabled} onChange={() => setFacebookEnabled(p => !p)} />
            </div>
            {facebookEnabled && (
              <FormGroup label="Facebook App ID">
                <Input value={facebookAppId} onChange={e => setFacebookAppId(e.target.value)} placeholder="1234567890" />
              </FormGroup>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Session & Security */}
      <Card>
        <CardHeader><CardTitle><i className="fa-solid fa-clock mr-2" style={{ color: "var(--color-red)" }} />Session & Security Policy</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormGroup label="Admin Session Duration (hours)">
              <Input type="number" min={1} max={168} value={sessionHours} onChange={e => setSessionHours(Number(e.target.value))} />
            </FormGroup>
            <FormGroup label="Member Session Duration (days)">
              <Input type="number" min={1} max={90} value={memberSessionDays} onChange={e => setMemberSessionDays(Number(e.target.value))} />
            </FormGroup>
            <FormGroup label="Max Login Attempts">
              <Input type="number" min={1} max={20} value={maxLoginAttempts} onChange={e => setMaxLoginAttempts(Number(e.target.value))} />
            </FormGroup>
            <FormGroup label="Account Lockout (minutes)">
              <Input type="number" min={5} max={1440} value={lockoutMinutes} onChange={e => setLockoutMinutes(Number(e.target.value))} />
            </FormGroup>
          </div>
          <div className="flex items-center justify-between p-4 rounded-sm" style={sec}>
            <div>
              <p className="text-sm font-medium text-white">Require Password Change on First Login</p>
              <p className="text-xs text-white/40 mt-0.5">New members must change their admin-set password</p>
            </div>
            <Switch checked={requirePasswordChange} onChange={() => setRequirePasswordChange(p => !p)} />
          </div>
          <FormGroup label="Minimum Password Length">
            <div className="flex items-center gap-3">
              <input type="range" min={6} max={24} value={passwordMinLength} onChange={e => setPasswordMinLength(Number(e.target.value))} className="flex-1" />
              <span className="text-sm font-bold text-white w-14 text-right">{passwordMinLength} chars</span>
            </div>
          </FormGroup>
        </CardContent>
      </Card>

      {/* Email Auth Provider */}
      <Card>
        <CardHeader><CardTitle><i className="fa-solid fa-envelope mr-2" style={{ color:"#3B82F6" }}/>Email Auth Provider</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <FormGroup label="Email Provider">
            <Select value={emailProvider} onChange={e=>setEmailProvider(e.target.value)}>
              <option value="smtp">SMTP (Generic)</option>
              <option value="sendgrid">SendGrid</option>
              <option value="mailgun">Mailgun</option>
            </Select>
          </FormGroup>
          {emailProvider === "smtp" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <FormGroup label="SMTP Host"><Input value={smtpHost} onChange={e=>setSmtpHost(e.target.value)} placeholder="smtp.gmail.com"/></FormGroup>
                <FormGroup label="SMTP Port"><Input type="number" value={smtpPort} onChange={e=>setSmtpPort(e.target.value)} placeholder="587"/></FormGroup>
                <FormGroup label="SMTP Username"><Input value={smtpUser} onChange={e=>setSmtpUser(e.target.value)} placeholder="user@domain.com"/></FormGroup>
                <FormGroup label="SMTP Password"><Input type="password" value={smtpPass} onChange={e=>setSmtpPass(e.target.value)} placeholder="••••••••"/></FormGroup>
              </div>
              <FormGroup label="From Address (sender)"><Input value={smtpFrom} onChange={e=>setSmtpFrom(e.target.value)} placeholder="noreply@arsenalghana.com"/></FormGroup>
              <div className="flex items-center gap-3">
                <Switch checked={smtpSecure} onChange={setSmtpSecure}/>
                <div><p className="text-sm font-medium text-white">Use TLS/SSL</p><p className="text-xs text-white/40">Recommended for port 465 (SSL) or 587 (STARTTLS)</p></div>
              </div>
            </div>
          )}
          {emailProvider === "sendgrid" && (
            <FormGroup label="SendGrid API Key">
              <Input type="password" value={sendgridKey} onChange={e=>setSendgridKey(e.target.value)} placeholder="SG.xxxxxxxx"/>
              <p className="text-[10px] mt-1 text-white/30">Used for sending OTP codes and transactional emails. <a href="https://sendgrid.com" target="_blank" rel="noopener noreferrer" className="underline text-blue-400">sendgrid.com ↗</a></p>
            </FormGroup>
          )}
          {emailProvider === "mailgun" && (
            <div className="grid grid-cols-2 gap-3">
              <FormGroup label="Mailgun API Key"><Input type="password" value={mailgunKey} onChange={e=>setMailgunKey(e.target.value)} placeholder="key-xxxxxxxx"/></FormGroup>
              <FormGroup label="Mailgun Domain"><Input value={mailgunDomain} onChange={e=>setMailgunDomain(e.target.value)} placeholder="mg.arsenalghana.com"/></FormGroup>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SMS Auth Provider */}
      <Card>
        <CardHeader><CardTitle><i className="fa-solid fa-mobile-screen mr-2" style={{ color:"#10B981" }}/>SMS Auth Provider</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <FormGroup label="SMS Provider">
            <Select value={smsProvider} onChange={e=>setSmsProvider(e.target.value)}>
              <option value="twilio">Twilio (International)</option>
              <option value="hubtel">Hubtel (Ghana)</option>
            </Select>
          </FormGroup>
          {smsProvider === "twilio" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <FormGroup label="Account SID"><Input value={twilioSid} onChange={e=>setTwilioSid(e.target.value)} placeholder="ACxxxxxxxxxxxxxxxx"/></FormGroup>
                <FormGroup label="Auth Token"><Input type="password" value={twilioToken} onChange={e=>setTwilioToken(e.target.value)} placeholder="••••••••"/></FormGroup>
              </div>
              <FormGroup label="From Number"><Input value={twilioFrom} onChange={e=>setTwilioFrom(e.target.value)} placeholder="+12025551234"/></FormGroup>
            </div>
          )}
          {smsProvider === "hubtel" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <FormGroup label="Client ID"><Input value={hubtelId} onChange={e=>setHubtelId(e.target.value)} placeholder="Hubtel Client ID"/></FormGroup>
                <FormGroup label="Client Secret"><Input type="password" value={hubtelSecret} onChange={e=>setHubtelSecret(e.target.value)} placeholder="••••••••"/></FormGroup>
              </div>
              <FormGroup label="Sender ID"><Input value={hubtelFrom} onChange={e=>setHubtelFrom(e.target.value)} placeholder="ASCGhana"/></FormGroup>
              <div className="p-3 rounded-sm" style={{background:"rgba(16,185,129,0.08)",border:"1px solid rgba(16,185,129,0.2)"}}>
                <p className="text-xs font-bold mb-0.5" style={{color:"#10B981",fontFamily:"var(--font-heading)"}}>
                  <i className="fa-solid fa-circle-info mr-1"/>Ghana-local SMS
                </p>
                <p className="text-[10px] text-white/40">Hubtel supports MTN, Vodafone/Telecel, and AirtelTigo. Ideal for Ghana-based member OTP. <a href="https://developers.hubtel.com" target="_blank" rel="noopener noreferrer" className="underline text-green-400">docs ↗</a></p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status summary */}
      <Card>
        <CardHeader><CardTitle><i className="fa-solid fa-circle-check mr-2" style={{ color: "#10B981" }} />Current Status</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Admin 2FA",    active: twoFaEnabled,    detail: twoFaEnabled ? authMethod : "Disabled" },
              { label: "Member 2FA",   active: memberTwoFa,     detail: memberTwoFa ? memberTwoFaMethod : "Disabled" },
              { label: "Google OAuth", active: googleEnabled,   detail: googleEnabled && googleClientId ? "Configured" : googleEnabled ? "Key missing" : "Disabled" },
              { label: "Facebook",     active: facebookEnabled, detail: facebookEnabled && facebookAppId ? "Configured" : facebookEnabled ? "App ID missing" : "Disabled" },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3 p-3 rounded-sm" style={sec}>
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: item.active ? "#10B981" : "#6B7280" }} />
                <div>
                  <p className="text-xs font-bold text-white">{item.label}</p>
                  <p className="text-[10px] capitalize" style={{ color: "rgba(255,255,255,0.4)" }}>{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
