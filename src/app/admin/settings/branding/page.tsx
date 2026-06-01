"use client";
import { useState, useRef } from "react";
import { useApp } from "@/context/AppContext";
import { Card, CardHeader, CardTitle, CardContent, Button, FormGroup, Switch, Alert, RichTextField } from "@/components/ui";
import toast from "react-hot-toast";
import { uploadLocalImage } from "@/lib/clientUploads";

const FONT_WEIGHTS = ["100","200","300","400","500","600","700","800","900"];

export default function BrandingSettingsPage() {
  const { settings, updateSettings } = useApp();
  const s = settings as any;

  const [logoPreview, setLogoPreview] = useState(settings.logoUrl||"");
  const [loginBgPreview, setLoginBgPreview] = useState(settings.loginBgImage||"");
  const [loginBgOverlay, setLoginBgOverlay] = useState(settings.loginBgOverlay||0.6);

  // Dark theme
  const [accentColor, setAccent] = useState(settings.accentColor||"#EF0107");
  const [goldColor, setGold] = useState(settings.goldColor||"#C6A84B");
  const [navBg, setNavBg] = useState(settings.navBg||"#1A0A0A");
  const [topBarBg, setTopBarBg] = useState(settings.topBarBg||"#6B0000");
  const [bgPrimary, setBgPrimary] = useState(s.darkBgPrimary||"#0F0D13");
  const [bgCard, setBgCard] = useState(s.darkBgCard||"#1C1829");

  // Light theme
  const [lightBgPrimary, setLightBgPrimary] = useState(s.lightBgPrimary||"#F6F6F6");
  const [lightBgCard, setLightBgCard] = useState(s.lightBgCard||"#FFFFFF");
  const [lightTextPrimary, setLightTextPrimary] = useState(s.lightTextPrimary||"#1A0A0A");
  const [lightAccentColor, setLightAccent] = useState(s.lightAccentColor||"#EF0107");
  const [lightNavBg, setLightNavBg] = useState(s.lightNavBg||"#EF0107");

  // Font weights
  const [headingFontWeight, setHFW] = useState(s.headingFontWeight||"700");
  const [bodyFontWeight, setBFW] = useState(s.bodyFontWeight||"400");
  const [navFontWeight, setNFW] = useState(s.navFontWeight||"700");

  // Club info
  const [siteName, setSiteName] = useState(settings.siteName);
  const [tagline, setTagline] = useState(settings.tagline);
  const [clubRegNumber, setRegNum] = useState(settings.clubRegNumber||"84594504054");
  const [clubFounded, setFounded] = useState(settings.clubFounded||"2003");
  const [clubApprovedYear, setApproved] = useState(settings.clubApprovedYear||"2008");
  const [clubAbout, setAbout] = useState(settings.clubAbout||"");
  const [adminPanelBg, setAdminPanelBg]     = useState((settings as any).adminPanelBg   || "#07060F");
  const [adminPanelText, setAdminPanelText] = useState((settings as any).adminPanelText || "#FFFFFF");
  const [adminSidebarBg, setAdminSidebarBg] = useState((settings as any).adminSidebarBg || "#0A0812");
  const [adminHeaderBg, setAdminHeaderBg]   = useState((settings as any).adminHeaderBg  || "#0D0B18");
  const [adminAccent, setAdminAccent]       = useState((settings as any).adminAccent    || "#EF0107");
  const [saving, setSaving] = useState(false);

  const logoRef = useRef<HTMLInputElement>(null);
  const loginBgRef = useRef<HTMLInputElement>(null);

  const readFile = async (e:React.ChangeEvent<HTMLInputElement>, setter:(v:string)=>void, folder: "logo" | "hero") => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size > 3*1024*1024) { toast.error("File must be under 3MB"); return; }
    try { setter(await uploadLocalImage(file, folder)); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Upload failed"); }
  };

  const handleSave = () => {
    setSaving(true);
    updateSettings({
      logoUrl:logoPreview, loginBgImage:loginBgPreview, loginBgOverlay,
      accentColor, goldColor, navBg, topBarBg, siteName, tagline,
      clubRegNumber, clubFounded, clubApprovedYear, clubAbout,
      lightBgPrimary, lightBgCard, lightTextPrimary, lightAccentColor, lightNavBg,
      headingFontWeight, bodyFontWeight, navFontWeight,
      adminPanelBg, adminPanelText, adminSidebarBg, adminHeaderBg, adminAccent,
    } as any);
    // Apply immediately
    document.documentElement.style.setProperty("--color-red", accentColor);
    document.documentElement.style.setProperty("--color-gold", goldColor);
    document.documentElement.style.setProperty("--bg-nav", navBg);
    document.documentElement.style.setProperty("--color-red-deep", topBarBg);
    setTimeout(() => { setSaving(false); toast.success("Branding saved — applied site-wide!"); }, 400);
  };

  const inp = "w-full h-9 text-sm";
  const colorRow = (label:string, val:string, set:(v:string)=>void) => (
    <div key={label}>
      <FormGroup label={label} icon="fa-solid fa-circle">
        <div className="flex gap-2">
          <input type="color" value={val.startsWith("#")?val:"#ef0107"} onChange={e=>set(e.target.value)} className="h-9 w-12 rounded-sm border border-white/10 p-1 cursor-pointer bg-transparent"/>
          <input value={val} onChange={e=>set(e.target.value)} className={`${inp} flex-1`} placeholder="#000000"/>
        </div>
      </FormGroup>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white" style={{ fontFamily:"var(--font-display)" }}>LOGO & BRANDING</h1>
          <p className="text-xs mt-0.5" style={{ color:"rgba(255,255,255,0.4)" }}>Colors, logo, fonts weights, club info — applied instantly</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <><i className="fa-solid fa-spinner fa-spin"/>Saving…</> : <><i className="fa-solid fa-floppy-disk"/>Save Changes</>}
        </Button>
      </div>

      {/* Club identity */}
      <Card>
        <CardHeader><CardTitle><i className="fa-solid fa-shield-halved mr-2" style={{ color:"var(--color-red)" }}/>Club Identity</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><FormGroup label="Club Name" icon="fa-solid fa-font"><input value={siteName} onChange={e=>setSiteName(e.target.value)} className={inp}/></FormGroup></div>
          <FormGroup label="Tagline" icon="fa-solid fa-quote-left"><input value={tagline} onChange={e=>setTagline(e.target.value)} className={inp}/></FormGroup>
          <FormGroup label="Registration #" icon="fa-solid fa-hashtag"><input value={clubRegNumber} onChange={e=>setRegNum(e.target.value)} className={inp} placeholder="84594504054"/></FormGroup>
          <FormGroup label="Year Founded" icon="fa-solid fa-calendar"><input value={clubFounded} onChange={e=>setFounded(e.target.value)} className={inp} placeholder="2003"/></FormGroup>
          <FormGroup label="Arsenal Approval Year" icon="fa-solid fa-star"><input value={clubApprovedYear} onChange={e=>setApproved(e.target.value)} className={inp} placeholder="2008"/></FormGroup>
          <div className="col-span-2">
            <FormGroup label="About the Club (shown on About page)" icon="fa-solid fa-align-left">
              <RichTextField value={clubAbout} onChange={setAbout} placeholder="Club introduction for the About page…" minHeight={160} />
            </FormGroup>
          </div>
        </CardContent>
      </Card>

      {/* Logo */}
      <Card>
        <CardHeader><CardTitle><i className="fa-solid fa-image mr-2" style={{ color:"var(--color-gold)" }}/>Logo</CardTitle></CardHeader>
        <CardContent>
          <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={e=>readFile(e,setLogoPreview,"logo")}/>
          {logoPreview ? (
            <div className="flex items-center gap-4 mb-3">
              <img src={logoPreview} alt="Logo" className="h-16 object-contain rounded-sm" style={{ background:"rgba(255,255,255,0.05)", padding:8 }}/>
              <Button variant="secondary" size="sm" onClick={()=>setLogoPreview("")}>Remove</Button>
            </div>
          ) : (
            <div className="border-2 border-dashed rounded-sm flex flex-col items-center justify-center py-8 mb-3 cursor-pointer hover:border-[var(--color-red)] transition-colors"
              style={{ borderColor:"rgba(255,255,255,0.15)" }} onClick={()=>logoRef.current?.click()}>
              <i className="fa-solid fa-cloud-arrow-up text-2xl mb-2" style={{ color:"rgba(255,255,255,0.3)" }}/>
              <p className="text-sm" style={{ color:"rgba(255,255,255,0.5)" }}>Click to upload logo</p>
              <p className="text-xs mt-1" style={{ color:"rgba(255,255,255,0.3)" }}>PNG, SVG, WebP · Max 3MB</p>
            </div>
          )}
          <Button variant="secondary" size="sm" onClick={()=>logoRef.current?.click()}>
            <i className="fa-solid fa-upload"/>{logoPreview?"Replace":"Upload Logo"}
          </Button>
        </CardContent>
      </Card>

      {/* Dark theme colors */}
      <Card>
        <CardHeader><CardTitle><i className="fa-solid fa-moon mr-2" style={{ color:"#8B5CF6" }}/>Dark Theme Colors</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          {[
            ["Primary Accent (red)",accentColor,setAccent],
            ["Gold Accent",goldColor,setGold],
            ["Navigation Background",navBg,setNavBg],
            ["Top Bar Background",topBarBg,setTopBarBg],
          ].map(([l,v,s]: any[]) => colorRow(l,v,s))}
        </CardContent>
      </Card>

      {/* Light theme colors */}
      <Card>
        <CardHeader>
          <CardTitle><i className="fa-solid fa-sun mr-2" style={{ color:"#F59E0B" }}/>Light Theme Colors (when user switches to light mode)</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="info" title="Light theme">These colors apply when users toggle to light mode via the sun icon in the navbar.</Alert>
          <div className="grid grid-cols-2 gap-4 mt-4">
            {[
              ["Page Background",lightBgPrimary,setLightBgPrimary],
              ["Card Background",lightBgCard,setLightBgCard],
              ["Primary Text Color",lightTextPrimary,setLightTextPrimary],
              ["Accent (red) Color",lightAccentColor,setLightAccent],
              ["Navigation Background",lightNavBg,setLightNavBg],
            ].map(([l,v,s]: any[]) => colorRow(l,v,s))}
          </div>
        </CardContent>
      </Card>

      {/* Font weights */}
      <Card>
        <CardHeader><CardTitle><i className="fa-solid fa-bold mr-2" style={{ color:"var(--color-gold)" }}/>Font Weights</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-3 gap-4">
          {[
            ["Heading Weight",headingFontWeight,setHFW,"H1, H2, section titles"],
            ["Body Weight",bodyFontWeight,setBFW,"Paragraphs, descriptions"],
            ["Navigation Weight",navFontWeight,setNFW,"Nav links, buttons, labels"],
          ].map(([label,val,setter,desc]: any[]) => (
            <div key={label}>
              <FormGroup label={label} icon="fa-solid fa-font">
                <select value={val} onChange={e=>setter(e.target.value)} className="w-full h-9 text-sm">
                  {FONT_WEIGHTS.map(w=><option key={w} value={w}>{w} — {w==="100"?"Thin":w==="300"?"Light":w==="400"?"Regular":w==="500"?"Medium":w==="600"?"Semi-Bold":w==="700"?"Bold":w==="800"?"Extra-Bold":"Black"}</option>)}
                </select>
              </FormGroup>
              <p className="text-[10px] mt-1" style={{ color:"rgba(255,255,255,0.3)" }}>{desc}</p>
              <p className="mt-2" style={{ fontWeight:parseInt(val), color:"rgba(255,255,255,0.6)", fontSize:14 }}>Arsenal Ghana Preview</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Login page bg */}
      <Card>
        <CardHeader><CardTitle><i className="fa-solid fa-lock mr-2" style={{ color:"var(--color-gold)" }}/>Login Page Background</CardTitle></CardHeader>
        <CardContent>
          <input ref={loginBgRef} type="file" accept="image/*" className="hidden" onChange={e=>readFile(e,setLoginBgPreview,"hero")}/>
          {loginBgPreview ? (
            <div className="flex items-center gap-4 mb-3">
              <img src={loginBgPreview} alt="Login BG" className="h-16 w-24 object-cover rounded-sm"/>
              <Button variant="secondary" size="sm" onClick={()=>setLoginBgPreview("")}>Remove</Button>
            </div>
          ) : (
            <div className="border-2 border-dashed rounded-sm flex flex-col items-center justify-center py-6 mb-3 cursor-pointer hover:border-[var(--color-red)] transition-colors"
              style={{ borderColor:"rgba(255,255,255,0.15)" }} onClick={()=>loginBgRef.current?.click()}>
              <i className="fa-solid fa-image text-xl mb-2" style={{ color:"rgba(255,255,255,0.3)" }}/>
              <p className="text-sm" style={{ color:"rgba(255,255,255,0.5)" }}>Upload login background image</p>
            </div>
          )}
          {loginBgPreview && (
            <div className="mt-3">
              <FormGroup label={`Overlay opacity: ${Math.round(loginBgOverlay*100)}%`} icon="fa-solid fa-layer-group">
                <input type="range" min="0" max="1" step="0.05" value={loginBgOverlay} onChange={e=>setLoginBgOverlay(parseFloat(e.target.value))} className="w-full accent-red-600"/>
              </FormGroup>
            </div>
          )}
          <Button variant="secondary" size="sm" onClick={()=>loginBgRef.current?.click()}>
            <i className="fa-solid fa-upload"/>Upload Background
          </Button>
        </CardContent>
      </Card>

      {/* Admin Panel Appearance */}
      <Card>
        <CardHeader><CardTitle><i className="fa-solid fa-desktop mr-2" style={{ color:"#8B5CF6" }}/>Admin Panel Appearance</CardTitle></CardHeader>
        <CardContent>
          <p className="text-xs mb-4" style={{ color:"rgba(255,255,255,0.4)" }}>Changes apply immediately when saved — reload the admin panel to see them.</p>
          <div className="grid grid-cols-2 gap-4">
            {[
              ["Main Background",   adminPanelBg,   setAdminPanelBg,   "Page/content area background"],
              ["Sidebar Background",adminSidebarBg, setAdminSidebarBg, "Left nav sidebar"],
              ["Header Background", adminHeaderBg,  setAdminHeaderBg,  "Top bar"],
              ["Panel Text Color",  adminPanelText, setAdminPanelText, "All text in admin"],
              ["Admin Accent Color",adminAccent,    setAdminAccent,    "Active nav & highlights"],
            ].map(([label,val,setter,desc]: any[]) => (
              <div key={label}>
                <FormGroup label={label} icon="fa-solid fa-palette">
                  <div className="flex gap-2">
                    <input type="color" value={val.startsWith("#")?val:"#000000"} onChange={e=>setter(e.target.value)} className="h-9 w-12 rounded-sm border border-white/10 p-1 cursor-pointer bg-transparent"/>
                    <input value={val} onChange={e=>setter(e.target.value)} className="flex-1 text-sm" placeholder="#000000"/>
                  </div>
                </FormGroup>
                <p className="text-[10px] mt-0.5" style={{ color:"rgba(255,255,255,0.3)" }}>{desc}</p>
              </div>
            ))}
          </div>
          {/* Preview */}
          <div className="mt-4 p-3 rounded-sm" style={{ background:adminPanelBg, border:"1px solid rgba(255,255,255,0.1)" }}>
            <div className="flex gap-2 items-center">
              <div className="w-20 h-16 rounded-sm flex flex-col justify-center px-2 gap-1" style={{ background:adminSidebarBg }}>
                {[adminAccent,"rgba(255,255,255,0.3)","rgba(255,255,255,0.3)"].map((c,i)=>(
                  <div key={i} className="h-1.5 rounded-full" style={{ background:c, width:i===0?"100%":"70%" }}/>
                ))}
              </div>
              <div className="flex-1">
                <div className="h-4 rounded-sm mb-1" style={{ background:adminHeaderBg }}/>
                <div className="h-8 rounded-sm" style={{ background:"rgba(255,255,255,0.04)" }}>
                  <p className="text-[9px] px-2 pt-1" style={{ color:adminPanelText, fontFamily:"var(--font-heading)" }}>Preview text</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
