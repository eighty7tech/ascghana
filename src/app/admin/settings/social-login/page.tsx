"use client";
import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Card, CardHeader, CardTitle, CardContent, Button, Input, FormGroup, Alert, Switch, Badge } from "@/components/ui";
import toast from "react-hot-toast";

export default function SocialLoginSettingsPage() {
  const { settings, updateSettings } = useApp();
  const [googleId, setGoogleId] = useState(settings.googleClientId||"");
  const [fbId, setFbId] = useState(settings.facebookAppId||"");
  const [googleEnabled, setGoogleEnabled] = useState(!!settings.googleClientId);
  const [fbEnabled, setFbEnabled] = useState(!!settings.facebookAppId);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true); await new Promise(r=>setTimeout(r,700));
    updateSettings({ googleClientId:googleEnabled?googleId:"", facebookAppId:fbEnabled?fbId:"" });
    setSaving(false); toast.success("Social login settings saved");
  };

  const PROVIDERS = [
    { name:"Google", id:"google", icon:"fa-brands fa-google", color:"#DB4437", enabled:googleEnabled, setEnabled:setGoogleEnabled, val:googleId, setVal:setGoogleId, placeholder:"123456789012-xxxxxxxx.apps.googleusercontent.com", docs:"https://console.cloud.google.com" },
    { name:"Facebook", id:"facebook", icon:"fa-brands fa-facebook-f", color:"#1877F2", enabled:fbEnabled, setEnabled:setFbEnabled, val:fbId, setVal:setFbId, placeholder:"1234567890123456", docs:"https://developers.facebook.com" },
  ];

  return (
    <div className="max-w-2xl space-y-5">
      <div><h1 className="text-2xl font-black text-white" style={{ fontFamily:"var(--font-display)" }}>SOCIAL LOGIN</h1>
      <p className="text-xs mt-0.5" style={{ color:"rgba(255,255,255,0.4)" }}>Allow members to sign in using their social media accounts</p></div>
      <Alert variant="info" title="How Social Login Works">Members can sign in via Google or Facebook. Their account is matched by email address. An existing membership is still required for member features.</Alert>
      {PROVIDERS.map(p=>(
        <Card key={p.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background:`${p.color}20` }}>
                  <i className={`${p.icon} text-lg`} style={{ color:p.color }} />
                </div>
                <div><CardTitle>{p.name} Login</CardTitle>
                <p className="text-xs mt-0.5" style={{ color:"rgba(255,255,255,0.4)" }}>Allow sign in with {p.name}</p></div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={p.enabled?"success":"default"}>{p.enabled?"Enabled":"Disabled"}</Badge>
                <Switch checked={p.enabled} onChange={()=>p.setEnabled(!p.enabled)} />
              </div>
            </div>
          </CardHeader>
          {p.enabled && (
            <CardContent className="space-y-3">
              <FormGroup label={`${p.name} App / Client ID`} icon="fa-solid fa-key" hint={`Get from ${p.docs}`}>
                <Input value={p.val} onChange={e=>p.setVal(e.target.value)} placeholder={p.placeholder} />
              </FormGroup>
              <a href={p.docs} target="_blank" rel="noopener noreferrer">
                <Button variant="secondary" size="sm"><i className="fa-solid fa-up-right-from-square" />{p.name} Developer Console</Button>
              </a>
            </CardContent>
          )}
        </Card>
      ))}
      <Button onClick={save} disabled={saving} className="w-full">
        {saving?<><i className="fa-solid fa-spinner fa-spin" />Saving...</>:<><i className="fa-solid fa-save" />Save Social Login Settings</>}
      </Button>
    </div>
  );
}
