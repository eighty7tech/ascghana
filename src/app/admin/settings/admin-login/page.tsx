"use client";
import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { Card, CardHeader, CardTitle, CardContent, Button, FormGroup, Input, Switch } from "@/components/ui";
import toast from "react-hot-toast";
import { uploadLocalImage, type ImageFolder } from "@/lib/clientUploads";

const PRESET_GRADIENTS = [
  { label: "Arsenal Dark",  value: "linear-gradient(135deg, #07060F 0%, #1A0A0A 100%)" },
  { label: "Red & Black",   value: "linear-gradient(135deg, #1A0A0A 0%, #6B0000 50%, #07060F 100%)" },
  { label: "Deep Space",    value: "linear-gradient(135deg, #0F0C29 0%, #302B63 50%, #24243E 100%)" },
  { label: "Night Forest",  value: "linear-gradient(135deg, #0a3d0a 0%, #07060F 100%)" },
  { label: "Gunners Red",   value: "linear-gradient(135deg, #6B0000 0%, #EF0107 50%, #1A0A0A 100%)" },
];

const BG_TYPES = [
  { id: "color",    label: "Solid Colour", icon: "fa-solid fa-square" },
  { id: "gradient", label: "Gradient",     icon: "fa-solid fa-swatchbook" },
  { id: "image",    label: "Image",        icon: "fa-solid fa-image" },
];

export default function AdminLoginSettingsPage() {
  const { settings, updateSettings } = useApp();
  const s = settings as any;

  // Read initial state from settings (which are loaded from DB on mount)
  const [logoUrl,          setLogoUrl]          = useState<string>(settings.logoUrl || "");
  const [logoSize,         setLogoSize]         = useState<number>(s.loginLogoSize ?? 64);
  const [showLogo,         setShowLogo]         = useState<boolean>(s.loginShowLogo !== false);
  const [showSiteName,     setShowSiteName]     = useState<boolean>(s.loginShowSiteName !== false);
  const [bgType,           setBgType]           = useState<string>(s.loginBgType || "color");
  const [bgColor,          setBgColor]          = useState<string>(s.loginBgColor || "#07060F");
  const [bgImageUrl,       setBgImageUrl]       = useState<string>(settings.loginBgImage || "");
  const [bgOverlay,        setBgOverlay]        = useState<number>(settings.loginBgOverlay ?? 0.7);
  const [bgGradient,       setBgGradient]       = useState<string>(s.loginBgGradient || PRESET_GRADIENTS[0].value);
  const [cardBg,           setCardBg]           = useState<string>(s.loginCardBg || "rgba(12,10,20,0.9)");
  const [cardBorder,       setCardBorder]       = useState<string>(s.loginCardBorder || "rgba(198,168,75,0.2)");
  const [showPattern,      setShowPattern]      = useState<boolean>(s.loginShowPattern !== false);
  const [welcomeTitle,     setWelcomeTitle]     = useState<string>(s.loginWelcomeTitle || "ADMIN PANEL");
  const [welcomeSubtitle,  setWelcomeSubtitle]  = useState<string>(s.loginWelcomeSubtitle || settings.siteName || "Arsenal Supporters Club Ghana");
  const [allowRememberMe,  setAllowRememberMe]  = useState<boolean>(s.loginAllowRememberMe !== false);
  const [maxAttempts,      setMaxAttempts]      = useState<number>(s.maxLoginAttempts ?? 5);
  const [lockoutMins,      setLockoutMins]      = useState<number>(s.lockoutMinutes ?? 30);
  const [sessionHrs,       setSessionHrs]       = useState<number>(s.sessionHours ?? 12);

  const [saving,   setSaving]   = useState(false);
  const bgImgRef = useRef<HTMLInputElement>(null);
  const logoRef  = useRef<HTMLInputElement>(null);

  const upload = async (e: React.ChangeEvent<HTMLInputElement>, setter: (u: string) => void, folder: ImageFolder) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { toast.error("Max 5 MB"); return; }
    try { const url = await uploadLocalImage(f, folder); setter(url); toast.success("Uploaded"); }
    catch { toast.error("Upload failed"); }
  };

  const handleSave = () => {
    setSaving(true);
    // All saved through updateSettings → app_state DB via /api/app-state
    updateSettings({
      logoUrl,
      loginBgImage:       bgImageUrl,
      loginBgOverlay:     bgOverlay,
      loginLogoSize:      logoSize,
      loginShowLogo:      showLogo,
      loginShowSiteName:  showSiteName,
      loginBgType:        bgType as "color"|"gradient"|"image",
      loginBgColor:       bgColor,
      loginBgGradient:    bgGradient,
      loginCardBg:        cardBg,
      loginCardBorder:    cardBorder,
      loginShowPattern:   showPattern,
      loginWelcomeTitle:  welcomeTitle,
      loginWelcomeSubtitle: welcomeSubtitle,
      loginAllowRememberMe: allowRememberMe,
      maxLoginAttempts:   maxAttempts,
      lockoutMinutes:     lockoutMins,
      sessionHours:       sessionHrs,
    } as any);
    setTimeout(() => { setSaving(false); toast.success("Admin login settings saved!"); }, 300);
  };

  // Live preview background
  const previewBg =
    bgType === "gradient" ? bgGradient :
    bgType === "image" && bgImageUrl ? undefined :
    bgColor;

  const btnTab = (id: string) => ({
    background: bgType === id ? "rgba(239,1,7,0.15)" : "rgba(255,255,255,0.04)",
    color:      bgType === id ? "var(--color-red)"   : "rgba(255,255,255,0.45)",
    border:     `1px solid ${bgType === id ? "rgba(239,1,7,0.4)" : "rgba(255,255,255,0.08)"}`,
    fontFamily: "var(--font-heading)",
  });

  return (
    <div className="space-y-6 max-w-5xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white" style={{ fontFamily: "var(--font-display)" }}>ADMIN LOGIN PAGE SETTINGS</h1>
          <p className="text-xs mt-0.5 text-white/40">Customise the admin login page — all changes persist to the database</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <><i className="fa-solid fa-spinner fa-spin mr-1.5" />Saving…</> : <><i className="fa-solid fa-save mr-1.5" />Save Settings</>}
        </Button>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* ── Left: controls ── */}
        <div className="space-y-5">

          {/* Logo & Branding */}
          <Card>
            <CardHeader><CardTitle><i className="fa-solid fa-image mr-2" style={{ color: "var(--color-red)" }} />Logo & Branding</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-medium text-white">Show Logo</p><p className="text-xs text-white/40">Display logo on login page</p></div>
                <Switch checked={showLogo} onChange={() => setShowLogo(p => !p)} />
              </div>
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-medium text-white">Show Site Name</p><p className="text-xs text-white/40">Display name text below logo</p></div>
                <Switch checked={showSiteName} onChange={() => setShowSiteName(p => !p)} />
              </div>
              <FormGroup label="Logo URL (leave blank = no logo)">
                <div className="flex gap-2">
                  <Input value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://… or /images/logo/logo.png" className="flex-1" />
                  <Button variant="secondary" size="sm" onClick={() => logoRef.current?.click()}>
                    <i className="fa-solid fa-upload" />
                  </Button>
                </div>
                <input ref={logoRef} type="file" accept="image/*" className="hidden"
                  onChange={e => upload(e, setLogoUrl, "logo")} />
              </FormGroup>
              {logoUrl && (
                <div className="flex items-center gap-3 p-3 rounded-sm" style={{ background: "rgba(0,0,0,0.3)" }}>
                  <img src={logoUrl} alt="Preview" className="max-h-12 object-contain" />
                  <button onClick={() => setLogoUrl("")} className="text-xs text-red-400 hover:text-red-300">Remove</button>
                </div>
              )}
              <FormGroup label={`Logo Size: ${logoSize}px`}>
                <input type="range" min={32} max={120} value={logoSize} onChange={e => setLogoSize(Number(e.target.value))} className="w-full" />
              </FormGroup>
              <FormGroup label="Welcome Title">
                <Input value={welcomeTitle} onChange={e => setWelcomeTitle(e.target.value)} placeholder="ADMIN PANEL" />
              </FormGroup>
              <FormGroup label="Welcome Subtitle">
                <Input value={welcomeSubtitle} onChange={e => setWelcomeSubtitle(e.target.value)} placeholder="Arsenal Supporters Club Ghana" />
              </FormGroup>
            </CardContent>
          </Card>

          {/* Background */}
          <Card>
            <CardHeader><CardTitle><i className="fa-solid fa-swatchbook mr-2" style={{ color: "var(--color-red)" }} />Background</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                {BG_TYPES.map(bt => (
                  <button key={bt.id} onClick={() => setBgType(bt.id)}
                    className="flex-1 py-2 text-xs font-bold rounded-sm transition-all flex items-center justify-center gap-1.5"
                    style={btnTab(bt.id)}>
                    <i className={`${bt.icon} text-[10px]`} />{bt.label}
                  </button>
                ))}
              </div>

              {bgType === "color" && (
                <FormGroup label="Background Colour">
                  <div className="flex gap-2">
                    <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)}
                      className="w-10 h-9 rounded cursor-pointer border border-white/10 bg-transparent" />
                    <Input value={bgColor} onChange={e => setBgColor(e.target.value)} />
                  </div>
                </FormGroup>
              )}

              {bgType === "gradient" && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    {PRESET_GRADIENTS.map(pg => (
                      <button key={pg.label} onClick={() => setBgGradient(pg.value)}
                        className="h-9 rounded-sm text-[10px] font-bold border transition-all"
                        style={{ background: pg.value, border: bgGradient === pg.value ? "2px solid #C6A84B" : "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.85)", fontFamily: "var(--font-heading)" }}>
                        {pg.label}
                      </button>
                    ))}
                  </div>
                  <FormGroup label="Custom Gradient CSS">
                    <Input value={bgGradient} onChange={e => setBgGradient(e.target.value)} placeholder="linear-gradient(135deg,…)" />
                  </FormGroup>
                </>
              )}

              {bgType === "image" && (
                <>
                  <FormGroup label="Background Image URL">
                    <div className="flex gap-2">
                      <Input value={bgImageUrl} onChange={e => setBgImageUrl(e.target.value)} placeholder="/images/hero/…" className="flex-1" />
                      <Button variant="secondary" size="sm" onClick={() => bgImgRef.current?.click()}>
                        <i className="fa-solid fa-upload" />
                      </Button>
                    </div>
                    <input ref={bgImgRef} type="file" accept="image/*" className="hidden"
                      onChange={e => upload(e, setBgImageUrl, "hero")} />
                  </FormGroup>
                  <FormGroup label={`Overlay Darkness: ${Math.round(bgOverlay * 100)}%`}>
                    <input type="range" min={0} max={100} value={Math.round(bgOverlay * 100)}
                      onChange={e => setBgOverlay(Number(e.target.value) / 100)} className="w-full" />
                  </FormGroup>
                </>
              )}

              <FormGroup label="Card Background (CSS colour / rgba)">
                <Input value={cardBg} onChange={e => setCardBg(e.target.value)} placeholder="rgba(12,10,20,0.9)" />
              </FormGroup>
              <FormGroup label="Card Border">
                <Input value={cardBorder} onChange={e => setCardBorder(e.target.value)} placeholder="rgba(198,168,75,0.2)" />
              </FormGroup>
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-medium text-white">Pattern Overlay</p><p className="text-xs text-white/40">Subtle diagonal grid on background</p></div>
                <Switch checked={showPattern} onChange={() => setShowPattern(p => !p)} />
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card>
            <CardHeader><CardTitle><i className="fa-solid fa-shield-halved mr-2" style={{ color: "var(--color-red)" }} />Login Security</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-medium text-white">Allow Remember Me</p><p className="text-xs text-white/40">Let admins stay logged in</p></div>
                <Switch checked={allowRememberMe} onChange={() => setAllowRememberMe(p => !p)} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <FormGroup label="Max Attempts">
                  <Input type="number" min={1} max={20} value={maxAttempts} onChange={e => setMaxAttempts(Number(e.target.value))} />
                </FormGroup>
                <FormGroup label="Lockout (mins)">
                  <Input type="number" min={5} value={lockoutMins} onChange={e => setLockoutMins(Number(e.target.value))} />
                </FormGroup>
                <FormGroup label="Session (hours)">
                  <Input type="number" min={1} max={168} value={sessionHrs} onChange={e => setSessionHrs(Number(e.target.value))} />
                </FormGroup>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Right: live preview ── */}
        <div className="lg:sticky lg:top-6 self-start">
          <Card>
            <CardHeader><CardTitle><i className="fa-solid fa-eye mr-2" style={{ color: "var(--color-red)" }} />Live Preview</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="relative rounded-b-sm overflow-hidden" style={{ minHeight: 440 }}>
                {/* Background */}
                <div className="absolute inset-0" style={{
                  background: previewBg,
                  ...(bgType === "image" && bgImageUrl ? {
                    backgroundImage: `url(${bgImageUrl})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  } : {}),
                }} />
                {bgType === "image" && bgImageUrl && (
                  <div className="absolute inset-0" style={{ background: `rgba(0,0,0,${bgOverlay})` }} />
                )}
                {showPattern && (
                  <div className="absolute inset-0" style={{
                    opacity: 0.04,
                    backgroundImage: "repeating-linear-gradient(45deg,rgba(239,1,7,0.3) 0,rgba(239,1,7,0.3) 1px,transparent 0,transparent 50%)",
                    backgroundSize: "10px 10px",
                  }} />
                )}
                {/* Content */}
                <div className="relative flex flex-col items-center justify-center p-8 min-h-[440px] gap-4">
                  {showLogo && (logoUrl
                    ? <img src={logoUrl} alt="Logo" style={{ width: logoSize, height: logoSize }} className="object-contain" />
                    : <div className="rounded-full flex items-center justify-center text-lg font-black" style={{ width: logoSize, height: logoSize, background: "rgba(239,1,7,0.3)", color: "white", border: "1px solid rgba(239,1,7,0.4)" }}>A</div>
                  )}
                  <div className="text-center">
                    <p className="text-xl font-black text-white tracking-widest" style={{ fontFamily: "var(--font-display)" }}>{welcomeTitle || "ADMIN PANEL"}</p>
                    {showSiteName && <p className="text-xs mt-1 text-white/60">{welcomeSubtitle}</p>}
                  </div>
                  <div className="w-full max-w-[260px] rounded-sm p-5 space-y-3"
                    style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
                    {["Username","Password"].map(ph => (
                      <div key={ph} className="h-8 rounded-sm px-3 flex items-center text-xs text-white/30"
                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>{ph}</div>
                    ))}
                    <div className="h-8 rounded-sm" style={{ background: "var(--color-red)" }} />
                    {allowRememberMe && (
                      <p className="text-[10px] text-center text-white/30">☐ Remember me</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
