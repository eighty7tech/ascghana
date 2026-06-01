"use client";
import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Card, CardHeader, CardTitle, CardContent, Button, FormGroup, Input, Switch } from "@/components/ui";
import ImageUploadField from "@/components/ImageUploadField";
import toast from "react-hot-toast";

type PageKey = "shop"|"gallery"|"events"|"blog"|"sponsors"|"about"|"contact"|"membership"|"members";

const PAGES: { key: PageKey; label: string; icon: string; defaultTitle: string; defaultSub: string }[] = [
  { key:"shop",       label:"Shop",             icon:"fa-bag-shopping",    defaultTitle:"ARSENAL STORE",         defaultSub:"Official merchandise" },
  { key:"gallery",    label:"Gallery",          icon:"fa-images",          defaultTitle:"MOMENTS & MEMORIES",    defaultSub:"Relive our greatest moments" },
  { key:"events",     label:"Events",           icon:"fa-calendar-days",   defaultTitle:"EVENTS & WATCH PARTIES",defaultSub:"Join us for the action" },
  { key:"blog",       label:"Blog & News",      icon:"fa-newspaper",       defaultTitle:"NEWS & UPDATES",        defaultSub:"Latest from Arsenal SC Ghana" },
  { key:"sponsors",   label:"Sponsors",         icon:"fa-handshake",       defaultTitle:"PARTNERS & SPONSORS",   defaultSub:"Our valued partners" },
  { key:"about",      label:"About",            icon:"fa-circle-info",     defaultTitle:"ABOUT US",              defaultSub:"Our story and mission" },
  { key:"contact",    label:"Contact",          icon:"fa-envelope",        defaultTitle:"GET IN TOUCH",          defaultSub:"We'd love to hear from you" },
  { key:"membership", label:"Membership",       icon:"fa-id-card",         defaultTitle:"JOIN OUR CLUB",         defaultSub:"Become a member today" },
  { key:"members",    label:"Members Area",     icon:"fa-users",           defaultTitle:"MEMBER PORTAL",         defaultSub:"Your membership hub" },
];

interface PageHeaderConfig {
  title: string;
  subtitle: string;
  bgImage: string;
  bgColor: string;
  textColor: string;
  showBreadcrumbs: boolean;
  height: string;
}

export default function PageHeaderSettingsPage() {
  const { settings, updateSettings } = useApp();
  const s = settings as any;
  const [saving, setSaving] = useState(false);
  const [activeKey, setActiveKey] = useState<PageKey>("shop");

  const getConfig = (key: PageKey): PageHeaderConfig => {
    const stored = s.pageHeaders?.[key] || {};
    const page = PAGES.find(p => p.key === key)!;
    return {
      title:          stored.title          ?? page.defaultTitle,
      subtitle:       stored.subtitle       ?? page.defaultSub,
      bgImage:        stored.bgImage        ?? "",
      bgColor:        stored.bgColor        ?? "#07060F",
      textColor:      stored.textColor      ?? "#FFFFFF",
      showBreadcrumbs:stored.showBreadcrumbs ?? true,
      height:         stored.height         ?? "280px",
    };
  };

  const [configs, setConfigs] = useState<Record<PageKey, PageHeaderConfig>>(
    Object.fromEntries(PAGES.map(p => [p.key, getConfig(p.key)])) as Record<PageKey, PageHeaderConfig>
  );

  const update = (key: PageKey, field: keyof PageHeaderConfig, value: any) =>
    setConfigs(prev => ({ ...prev, [key]: { ...prev[key], [field]: value } }));

  const save = async () => {
    setSaving(true);
    await updateSettings({ pageHeaders: configs } as any);
    setSaving(false);
    toast.success("Page header settings saved");
  };

  const active = PAGES.find(p => p.key === activeKey)!;
  const cfg = configs[activeKey];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <span className="section-red-line" />
        <h1 className="text-3xl font-black" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>PAGE HEADER SETTINGS</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Customise the hero banner shown at the top of each page</p>
      </div>

      <div className="grid md:grid-cols-[220px_1fr] gap-6">
        {/* Page list */}
        <div className="space-y-1">
          {PAGES.map(p => (
            <button key={p.key} onClick={() => setActiveKey(p.key)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-left transition-all"
              style={{
                background: activeKey === p.key ? "rgba(239,1,7,0.1)" : "rgba(255,255,255,0.02)",
                border: `1px solid ${activeKey === p.key ? "rgba(239,1,7,0.3)" : "transparent"}`,
                color: activeKey === p.key ? "white" : "var(--text-muted)",
              }}>
              <i className={`fa-solid ${p.icon} text-sm`} style={{ color: activeKey === p.key ? "var(--color-red)" : "inherit", width: 16 }} />
              <span className="text-sm" style={{ fontFamily: "var(--font-heading)" }}>{p.label}</span>
            </button>
          ))}
        </div>

        {/* Config panel */}
        <div className="space-y-5">
          {/* Preview */}
          <div className="relative h-32 rounded-sm overflow-hidden flex items-center justify-center"
            style={{ background: cfg.bgImage ? `url(${cfg.bgImage}) center/cover` : cfg.bgColor }}>
            {cfg.bgImage && <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.5)" }} />}
            <div className="relative text-center px-4">
              <p className="text-xl font-black" style={{ color: cfg.textColor, fontFamily: "var(--font-display)" }}>{cfg.title}</p>
              {cfg.subtitle && <p className="text-sm mt-1" style={{ color: cfg.textColor, opacity: 0.7 }}>{cfg.subtitle}</p>}
              {cfg.showBreadcrumbs && (
                <p className="text-xs mt-2 opacity-50" style={{ color: cfg.textColor }}>Home / {active.label}</p>
              )}
            </div>
          </div>

          <Card>
            <CardHeader><CardTitle><i className={`fa-solid ${active.icon} mr-2`} style={{ color: "var(--color-red)" }} />{active.label} Header</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <FormGroup label="Title">
                  <Input value={cfg.title} onChange={e => update(activeKey, "title", e.target.value)} />
                </FormGroup>
                <FormGroup label="Subtitle">
                  <Input value={cfg.subtitle} onChange={e => update(activeKey, "subtitle", e.target.value)} />
                </FormGroup>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <FormGroup label="Background Color">
                  <div className="flex gap-2">
                    <Input type="color" value={cfg.bgColor} onChange={e => update(activeKey, "bgColor", e.target.value)} className="h-10 w-12 p-0.5" />
                    <Input value={cfg.bgColor} onChange={e => update(activeKey, "bgColor", e.target.value)} />
                  </div>
                </FormGroup>
                <FormGroup label="Text Color">
                  <div className="flex gap-2">
                    <Input type="color" value={cfg.textColor} onChange={e => update(activeKey, "textColor", e.target.value)} className="h-10 w-12 p-0.5" />
                    <Input value={cfg.textColor} onChange={e => update(activeKey, "textColor", e.target.value)} />
                  </div>
                </FormGroup>
                <FormGroup label="Min Height">
                  <Input value={cfg.height} onChange={e => update(activeKey, "height", e.target.value)} placeholder="280px" />
                </FormGroup>
              </div>
              <FormGroup label="Background Image (optional)">
                <ImageUploadField
                  value={cfg.bgImage}
                  onChange={(url) => update(activeKey, "bgImage", url)}
                  folder="hero"
                  hint="Upload or paste URL. Image overlays the background colour."
                />
              </FormGroup>
              <FormGroup label="Show Breadcrumbs">
                <Switch checked={cfg.showBreadcrumbs} onChange={v => update(activeKey, "showBreadcrumbs", v)} />
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Show "Home / Page" navigation trail</p>
              </FormGroup>
            </CardContent>
          </Card>
        </div>
      </div>

      <Button onClick={save} disabled={saving} className="btn-arsenal w-full py-3 text-base">
        <i className="fa-solid fa-save mr-2" />{saving ? "Saving…" : "Save All Page Header Settings"}
      </Button>
    </div>
  );
}
