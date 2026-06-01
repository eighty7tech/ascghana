"use client";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { Card, CardHeader, CardTitle, CardContent, Button, FormGroup, Input, Select, Switch, Modal } from "@/components/ui";
import ImageUploadField from "@/components/ImageUploadField";
import toast from "react-hot-toast";

type NavChild = { label: string; href: string; desc?: string };
type NavItem  = { id: number; label: string; href: string; icon?: string; children?: NavChild[] };
type TopBarItem = { id: number; label: string; href: string; icon: string };

const ICON_SUGGESTIONS = [
  "fa-solid fa-phone","fa-solid fa-envelope","fa-solid fa-location-dot",
  "fa-brands fa-facebook-f","fa-brands fa-x-twitter","fa-brands fa-instagram",
  "fa-brands fa-whatsapp","fa-solid fa-rss","fa-solid fa-store",
  "fa-solid fa-calendar","fa-solid fa-ticket","fa-solid fa-users",
];

export default function NavbarSettingsPage() {
  const { settings, updateSettings } = useApp();
  const s = settings as any;
  const [saving, setSaving] = useState(false);

  // Logo / branding
  const [logoUrl,      setLogoUrl]      = useState<string>(settings.logoUrl || "");
  const [logoSize,     setLogoSize]     = useState<number>(s.navLogoSize ?? 36);
  const [siteName,     setSiteName]     = useState<string>(settings.siteName || "Arsenal SC Ghana");
  const [tagline,      setTagline]      = useState<string>(settings.tagline || "Victoria Concordia Crescit");

  // Top bar
  const [showTopBar,   setShowTopBar]   = useState<boolean>(s.navShowTopBar !== false);
  const [topBarBg,     setTopBarBg]     = useState<string>(settings.topBarBg || "#EF0107");
  const [topBarItems,  setTopBarItems]  = useState<TopBarItem[]>([...(settings.topBarItems || [])]);
  const [editTopBar,   setEditTopBar]   = useState<TopBarItem | null>(null);
  const [topBarModal,  setTopBarModal]  = useState(false);
  const emptyTB: TopBarItem = { id: 0, label: "", href: "", icon: "fa-solid fa-link" };
  const [tbForm,       setTbForm]       = useState<TopBarItem>(emptyTB);

  // Nav appearance
  const [navBg,        setNavBg]        = useState<string>(settings.navBg || "#FFFFFF");
  const [navStyle,     setNavStyle]     = useState<string>(s.navStyle || "light");
  const [navSticky,    setNavSticky]    = useState<string>(s.navStickyMode || "always");

  // CTA button
  const [ctaShow,      setCtaShow]      = useState<boolean>(s.navCTAShow !== false);
  const [ctaLabel,     setCtaLabel]     = useState<string>(s.navCTALabel || "Join Now");
  const [ctaHref,      setCtaHref]      = useState<string>(s.navCTAHref || "/membership/register");

  // Nav items
  const [navItems,     setNavItems]     = useState<NavItem[]>([...(s.navItems || [])]);
  const [navModal,     setNavModal]     = useState(false);
  const [editNav,      setEditNav]      = useState<NavItem | null>(null);
  const emptyNav: NavItem = { id: 0, label: "", href: "", icon: "", children: [] };
  const [navForm,      setNavForm]      = useState<NavItem>(emptyNav);
  const [childInput,   setChildInput]   = useState<NavChild>({ label: "", href: "", desc: "" });
  const [dragging,     setDragging]     = useState<number | null>(null);

  const handleSave = () => {
    setSaving(true);
    updateSettings({
      logoUrl, siteName, tagline,
      navLogoSize: logoSize,
      navShowTopBar: showTopBar,
      topBarBg,
      topBarItems,
      navBg,
      navStyle: navStyle as "light"|"dark"|"transparent",
      navStickyMode: navSticky as "always"|"scroll"|"none",
      navCTAShow: ctaShow,
      navCTALabel: ctaLabel,
      navCTAHref: ctaHref,
      navItems,
    } as any);
    setTimeout(() => { setSaving(false); toast.success("Navbar settings saved!"); }, 300);
  };

  // Top bar CRUD
  const openTB = (item?: TopBarItem) => {
    setEditTopBar(item || null);
    setTbForm(item ? { ...item } : { ...emptyTB, id: Date.now() });
    setTopBarModal(true);
  };
  const saveTB = () => {
    if (!tbForm.label || !tbForm.href) { toast.error("Label and href required"); return; }
    if (editTopBar) setTopBarItems(prev => prev.map(t => t.id === editTopBar.id ? tbForm : t));
    else            setTopBarItems(prev => [...prev, { ...tbForm, id: Date.now() }]);
    setTopBarModal(false);
  };
  const deleteTB = (id: number) => setTopBarItems(prev => prev.filter(t => t.id !== id));

  // Nav item CRUD
  const openNav = (item?: NavItem) => {
    setEditNav(item || null);
    setNavForm(item ? { ...item, children: [...(item.children||[])] } : { ...emptyNav, id: Date.now() });
    setChildInput({ label:"", href:"", desc:"" });
    setNavModal(true);
  };
  const saveNav = () => {
    if (!navForm.label || !navForm.href) { toast.error("Label and href required"); return; }
    if (editNav) setNavItems(prev => prev.map(n => n.id === editNav.id ? navForm : n));
    else         setNavItems(prev => [...prev, { ...navForm, id: Date.now() }]);
    setNavModal(false);
  };
  const deleteNav = (id: number) => setNavItems(prev => prev.filter(n => n.id !== id));

  const addChild = () => {
    if (!childInput.label || !childInput.href) { toast.error("Child label and href required"); return; }
    setNavForm(p => ({ ...p, children: [...(p.children||[]), { ...childInput }] }));
    setChildInput({ label:"", href:"", desc:"" });
  };
  const removeChild = (idx: number) => setNavForm(p => ({ ...p, children: (p.children||[]).filter((_,i)=>i!==idx) }));

  // Drag-to-reorder nav items
  const handleDragStart = (id: number) => setDragging(id);
  const handleDragOver  = (e: React.DragEvent, overId: number) => {
    e.preventDefault();
    if (dragging === null || dragging === overId) return;
    setNavItems(prev => {
      const from = prev.findIndex(n => n.id === dragging);
      const to   = prev.findIndex(n => n.id === overId);
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  const inp = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" };
  const sec = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" } as const;

  return (
    <div className="space-y-6 max-w-4xl">
      <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white" style={{ fontFamily:"var(--font-display)" }}>NAVBAR SETTINGS</h1>
          <p className="text-xs mt-0.5 text-white/40">Manage logo, top bar, navigation links, and appearance — all DB-driven</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <><i className="fa-solid fa-spinner fa-spin mr-1.5"/>Saving…</> : <><i className="fa-solid fa-save mr-1.5"/>Save All</>}
        </Button>
      </motion.div>

      {/* ── Logo & Branding ── */}
      <Card>
        <CardHeader><CardTitle><i className="fa-solid fa-image mr-2" style={{ color:"var(--color-red)" }}/>Logo & Branding</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <ImageUploadField label="Club Logo" value={logoUrl} onChange={setLogoUrl} folder="logo" previewHeight={80}
            hint="Upload PNG/SVG with transparency. Leave blank for text-only logo." />
          <div className="grid grid-cols-2 gap-3">
            <FormGroup label="Site Name">
              <Input value={siteName} onChange={e => setSiteName(e.target.value)} placeholder="Arsenal SC Ghana" />
            </FormGroup>
            <FormGroup label="Tagline">
              <Input value={tagline} onChange={e => setTagline(e.target.value)} placeholder="Victoria Concordia Crescit" />
            </FormGroup>
          </div>
          <FormGroup label={`Logo Size in Nav: ${logoSize}px`}>
            <input type="range" min={24} max={80} value={logoSize} onChange={e => setLogoSize(Number(e.target.value))} className="w-full" />
          </FormGroup>
        </CardContent>
      </Card>

      {/* ── Nav Appearance ── */}
      <Card>
        <CardHeader><CardTitle><i className="fa-solid fa-palette mr-2" style={{ color:"var(--color-red)" }}/>Navigation Appearance</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <FormGroup label="Nav Style">
              <Select value={navStyle} onChange={e => setNavStyle(e.target.value)}>
                <option value="light">Light (white bg)</option>
                <option value="dark">Dark (dark bg)</option>
                <option value="transparent">Transparent (over hero)</option>
              </Select>
            </FormGroup>
            <FormGroup label="Sticky Behaviour">
              <Select value={navSticky} onChange={e => setNavSticky(e.target.value)}>
                <option value="always">Always sticky</option>
                <option value="scroll">Sticky on scroll</option>
                <option value="none">Not sticky</option>
              </Select>
            </FormGroup>
            <FormGroup label="Nav Background Colour">
              <div className="flex gap-2">
                <input type="color" value={navBg} onChange={e => setNavBg(e.target.value)} className="w-10 h-9 rounded cursor-pointer border border-white/10 bg-transparent" />
                <Input value={navBg} onChange={e => setNavBg(e.target.value)} placeholder="#FFFFFF" />
              </div>
            </FormGroup>
          </div>
        </CardContent>
      </Card>

      {/* ── CTA Button ── */}
      <Card>
        <CardHeader><CardTitle><i className="fa-solid fa-hand-pointer mr-2" style={{ color:"var(--color-red)" }}/>CTA Button</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-sm" style={sec}>
            <div><p className="text-sm font-medium text-white">Show CTA Button</p><p className="text-xs text-white/40">Primary action button in the top-right of the navbar</p></div>
            <Switch checked={ctaShow} onChange={() => setCtaShow(p => !p)} />
          </div>
          {ctaShow && (
            <div className="grid grid-cols-2 gap-3">
              <FormGroup label="Button Label"><Input value={ctaLabel} onChange={e => setCtaLabel(e.target.value)} placeholder="Join Now" /></FormGroup>
              <FormGroup label="Button Link"><Input value={ctaHref} onChange={e => setCtaHref(e.target.value)} placeholder="/membership/register" /></FormGroup>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Top Bar ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle><i className="fa-solid fa-bars mr-2" style={{ color:"var(--color-red)" }}/>Red Top Bar</CardTitle>
            <Switch checked={showTopBar} onChange={() => setShowTopBar(p => !p)} />
          </div>
        </CardHeader>
        {showTopBar && (
          <CardContent className="space-y-4">
            <FormGroup label="Top Bar Background Colour">
              <div className="flex gap-2">
                <input type="color" value={topBarBg} onChange={e => setTopBarBg(e.target.value)} className="w-10 h-9 rounded cursor-pointer border border-white/10 bg-transparent" />
                <Input value={topBarBg} onChange={e => setTopBarBg(e.target.value)} />
              </div>
            </FormGroup>
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-white/50 uppercase tracking-wider" style={{ fontFamily:"var(--font-heading)" }}>Top Bar Links ({topBarItems.length})</p>
                <Button size="sm" onClick={() => openTB()}><i className="fa-solid fa-plus mr-1"/>Add Link</Button>
              </div>
              {topBarItems.length === 0 && <p className="text-xs text-white/30 text-center py-4">No top bar links. Add shortcuts like phone, social, or quick links.</p>}
              <div className="space-y-2">
                {topBarItems.map(item => (
                  <div key={item.id} className="flex items-center gap-3 p-3 rounded-sm" style={sec}>
                    <i className={`${item.icon || "fa-solid fa-link"} text-xs`} style={{ color:"var(--color-gold)", width:16 }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">{item.label}</p>
                      <p className="text-xs text-white/40 truncate">{item.href}</p>
                    </div>
                    <button onClick={() => openTB(item)} className="p-1.5 text-white/30 hover:text-white rounded transition-colors"><i className="fa-solid fa-pen text-xs"/></button>
                    <button onClick={() => deleteTB(item.id)} className="p-1.5 text-white/30 hover:text-red-400 rounded transition-colors"><i className="fa-solid fa-trash text-xs"/></button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* ── Nav Items ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle><i className="fa-solid fa-list mr-2" style={{ color:"var(--color-red)" }}/>Navigation Links ({navItems.length})</CardTitle>
            <Button size="sm" onClick={() => openNav()}><i className="fa-solid fa-plus mr-1"/>Add Link</Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-white/30 mb-3">Drag to reorder links. Add child items to create dropdown menus.</p>
          {navItems.length === 0 && <p className="text-xs text-white/30 text-center py-4">No navigation links. Add your first link above.</p>}
          <div className="space-y-2">
            {navItems.map((item, idx) => (
              <div key={item.id}
                draggable onDragStart={() => handleDragStart(item.id)}
                onDragOver={e => handleDragOver(e, item.id)} onDragEnd={() => setDragging(null)}
                className="flex items-center gap-3 p-3 rounded-sm transition-all cursor-grab active:cursor-grabbing"
                style={{ ...sec, opacity: dragging === item.id ? 0.5 : 1, border: dragging === item.id ? "1px solid var(--color-red)" : "1px solid rgba(255,255,255,0.06)" }}>
                <i className="fa-solid fa-grip-lines text-xs text-white/20" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white" style={{ fontFamily:"var(--font-heading)" }}>{item.label}</p>
                  <p className="text-xs text-white/40">{item.href}{item.children?.length ? ` · ${item.children.length} dropdown item${item.children.length>1?"s":""}` : ""}</p>
                </div>
                {item.children?.length ? <i className="fa-solid fa-chevron-down text-xs text-white/20" /> : null}
                <button onClick={() => openNav(item)} className="p-1.5 text-white/30 hover:text-white rounded transition-colors"><i className="fa-solid fa-pen text-xs"/></button>
                <button onClick={() => deleteNav(item.id)} className="p-1.5 text-white/30 hover:text-red-400 rounded transition-colors"><i className="fa-solid fa-trash text-xs"/></button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Live Preview ── */}
      <Card>
        <CardHeader><CardTitle><i className="fa-solid fa-eye mr-2" style={{ color:"var(--color-red)" }}/>Live Preview</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-hidden rounded-b-sm">
            {/* Top bar preview */}
            {showTopBar && (
              <div className="flex items-center justify-between px-4 py-1.5" style={{ background: topBarBg, height: 36 }}>
                <div className="flex gap-4">
                  {topBarItems.slice(0,3).map(t => (
                    <span key={t.id} className="flex items-center gap-1.5 text-white text-[11px] font-bold uppercase tracking-wide">
                      <i className={`${t.icon} text-[9px]`}/>{t.label}
                    </span>
                  ))}
                </div>
                <span className="text-white/70 text-[11px] font-bold uppercase tracking-wide">Member Login</span>
              </div>
            )}
            {/* Nav preview */}
            <div className="flex items-center gap-4 px-4" style={{ background: navStyle==="dark" ? "#1A0A0A" : navBg, height: 56, borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
              {logoUrl
                ? <img src={logoUrl} alt="Logo" style={{ height: logoSize, objectFit:"contain" }} />
                : <span style={{ fontFamily:"var(--font-display)", fontWeight:900, fontSize:16, color:"var(--color-red)" }}>{siteName}</span>
              }
              <div className="flex gap-2 flex-1">
                {navItems.slice(0,6).map(n => (
                  <span key={n.id} style={{ fontFamily:"var(--font-heading)", fontWeight:900, fontSize:11, letterSpacing:"0.1em", textTransform:"uppercase", color: navStyle==="dark" ? "rgba(255,255,255,0.8)" : "#1A0909", padding:"4px 8px", whiteSpace:"nowrap" }}>
                    {n.label}{n.children?.length ? " ▾" : ""}
                  </span>
                ))}
              </div>
              {ctaShow && (
                <span style={{ background:"var(--color-red)", color:"#fff", fontFamily:"var(--font-heading)", fontWeight:900, fontSize:11, letterSpacing:"0.12em", textTransform:"uppercase", padding:"8px 16px", borderRadius:2, whiteSpace:"nowrap" }}>
                  {ctaLabel}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Top Bar Modal ── */}
      <Modal open={topBarModal} onClose={() => setTopBarModal(false)} title={editTopBar ? "Edit Top Bar Link" : "Add Top Bar Link"}>
        <div className="space-y-3">
          <FormGroup label="Label *"><Input value={tbForm.label} onChange={e => setTbForm(p=>({...p,label:e.target.value}))} placeholder="Phone" /></FormGroup>
          <FormGroup label="URL *"><Input value={tbForm.href} onChange={e => setTbForm(p=>({...p,href:e.target.value}))} placeholder="tel:+233200000000" /></FormGroup>
          <FormGroup label="Icon (Font Awesome class)">
            <Input value={tbForm.icon} onChange={e => setTbForm(p=>({...p,icon:e.target.value}))} placeholder="fa-solid fa-phone" />
            <div className="flex gap-1.5 flex-wrap mt-2">
              {ICON_SUGGESTIONS.slice(0,8).map(ic => (
                <button key={ic} onClick={() => setTbForm(p=>({...p,icon:ic}))} className="px-2 py-1 text-xs rounded-sm transition-all"
                  style={{ background: tbForm.icon===ic?"rgba(239,1,7,0.15)":"rgba(255,255,255,0.04)", border:`1px solid ${tbForm.icon===ic?"rgba(239,1,7,0.4)":"rgba(255,255,255,0.08)"}`, color: tbForm.icon===ic?"var(--color-red)":"rgba(255,255,255,0.4)" }}>
                  <i className={`${ic} text-[10px]`} />
                </button>
              ))}
            </div>
          </FormGroup>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="ghost" size="sm" onClick={() => setTopBarModal(false)}>Cancel</Button>
            <Button size="sm" onClick={saveTB}>{editTopBar ? "Update" : "Add Link"}</Button>
          </div>
        </div>
      </Modal>

      {/* ── Nav Item Modal ── */}
      <Modal open={navModal} onClose={() => setNavModal(false)} title={editNav ? "Edit Nav Link" : "Add Nav Link"} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormGroup label="Label *"><Input value={navForm.label} onChange={e => setNavForm(p=>({...p,label:e.target.value}))} placeholder="Events" /></FormGroup>
            <FormGroup label="URL *"><Input value={navForm.href} onChange={e => setNavForm(p=>({...p,href:e.target.value}))} placeholder="/events" /></FormGroup>
          </div>
          <FormGroup label="Icon (optional)"><Input value={navForm.icon||""} onChange={e => setNavForm(p=>({...p,icon:e.target.value}))} placeholder="fa-solid fa-calendar-days" /></FormGroup>

          {/* Dropdown children */}
          <div>
            <p className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2" style={{ fontFamily:"var(--font-heading)" }}>Dropdown Items (optional)</p>
            {(navForm.children||[]).map((child, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2 mb-1 rounded-sm" style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)" }}>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white">{child.label}</p>
                  <p className="text-[10px] text-white/40">{child.href}{child.desc ? ` — ${child.desc}` : ""}</p>
                </div>
                <button onClick={() => removeChild(idx)} className="p-1 text-white/30 hover:text-red-400 transition-colors"><i className="fa-solid fa-times text-xs"/></button>
              </div>
            ))}
            <div className="grid grid-cols-3 gap-2 mt-2">
              <Input value={childInput.label} onChange={e => setChildInput(p=>({...p,label:e.target.value}))} placeholder="Sub-label" className="text-xs" />
              <Input value={childInput.href} onChange={e => setChildInput(p=>({...p,href:e.target.value}))} placeholder="/sub-page" className="text-xs" />
              <Input value={childInput.desc||""} onChange={e => setChildInput(p=>({...p,desc:e.target.value}))} placeholder="Short desc" className="text-xs" />
            </div>
            <button onClick={addChild} className="mt-2 text-xs font-bold transition-colors" style={{ color:"var(--color-red)", fontFamily:"var(--font-heading)" }}>
              <i className="fa-solid fa-plus mr-1"/>Add Dropdown Item
            </button>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button variant="ghost" size="sm" onClick={() => setNavModal(false)}>Cancel</Button>
            <Button size="sm" onClick={saveNav}>{editNav ? "Update Link" : "Add Link"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
