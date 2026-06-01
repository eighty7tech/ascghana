"use client";
import { useState } from "react";
import { useApp } from "@/context/AppContext";
import toast from "react-hot-toast";
import { FormInsertBox, FormGroup } from "@/components/admin/FormInsertBox";

const ICON_STYLES = [
  { id:"solid",   label:"Solid",   prefix:"fa-solid",   sample:"fa-shield-halved" },
  { id:"regular", label:"Regular", prefix:"fa-regular", sample:"fa-circle" },
  { id:"light",   label:"Light",   prefix:"fa-light",   sample:"fa-star" },
  { id:"thin",    label:"Thin",    prefix:"fa-thin",    sample:"fa-bell" },
  { id:"duotone", label:"Duotone", prefix:"fa-duotone", sample:"fa-shield-halved" },
  { id:"brands",  label:"Brands",  prefix:"fa-brands",  sample:"fa-instagram" },
];

const SAMPLE_ICONS = [
  "fa-shield-halved","fa-trophy","fa-futbol","fa-star","fa-ticket","fa-calendar",
  "fa-users","fa-crown","fa-bolt","fa-fire","fa-heart","fa-flag",
  "fa-bell","fa-lock","fa-gear","fa-chart-line","fa-circle-check","fa-arrow-right",
];

const PRESET_COLORS = [
  "#EF0107","#C6A84B","#023474","#10B981","#F59E0B","#8B5CF6",
  "#EC4899","#06B6D4","#FFFFFF","#000000","#374151","#9CA3AF",
];

export default function IconSettingsPage() {
  const { settings, updateSettings } = useApp();
  const s = settings as any;
  const [iconSettings, setIconSettings] = useState(s.iconSettings || { size: 18, color: "#EF0107", style: "solid" });
  const [saving, setSaving] = useState(false);
  const [previewIcon, setPreviewIcon] = useState("fa-shield-halved");

  const update = (field: string, val: any) => setIconSettings((prev: any) => ({ ...prev, [field]: val }));

  const save = async () => {
    setSaving(true);
    await updateSettings({ iconSettings } as any);
    setSaving(false);
    toast.success("Icon settings saved!");
  };

  const currentStyle = ICON_STYLES.find(s => s.id === iconSettings.style) || ICON_STYLES[0];
  const iconClass = `${currentStyle.prefix} ${previewIcon}`;

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white" style={{ fontFamily: "var(--font-display)" }}>ICON SETTINGS</h1>
          <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>Configure global icon size, color, and style for FontAwesome icons</p>
        </div>
        <button onClick={save} disabled={saving} className="btn-arsenal flex items-center gap-2 px-5 py-2 text-sm">
          {saving ? <><i className="fa-solid fa-spinner fa-spin" />Saving…</> : <><i className="fa-solid fa-save" />Save</>}
        </button>
      </div>

      {/* Live Preview */}
      <div className="p-8 rounded-sm flex flex-col items-center justify-center gap-6"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <p className="text-xs uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-heading)" }}>Live Preview</p>
        <div className="flex items-end gap-8">
          {[0.75, 1, 1.5, 2].map(mult => (
            <div key={mult} className="flex flex-col items-center gap-2">
              <i
                className={iconClass}
                style={{
                  fontSize: `${Math.round(iconSettings.size * mult)}px`,
                  color: iconSettings.color,
                }}
              />
              <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-heading)" }}>
                {Math.round(iconSettings.size * mult)}px
              </span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3 flex-wrap justify-center">
          {SAMPLE_ICONS.slice(0, 8).map(ico => (
            <button key={ico} onClick={() => setPreviewIcon(ico)}
              className="w-10 h-10 rounded-sm flex items-center justify-center transition-all"
              style={{
                background: previewIcon === ico ? "rgba(239,1,7,0.15)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${previewIcon === ico ? "rgba(239,1,7,0.5)" : "rgba(255,255,255,0.08)"}`,
              }}>
              <i className={`${currentStyle.prefix} ${ico}`} style={{ color: iconSettings.color, fontSize: `${iconSettings.size}px` }} />
            </button>
          ))}
        </div>
        <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>Click an icon above to preview</p>
      </div>

      <FormInsertBox title="Global icon defaults" description="Applies to SiteIcon / FaIcon components and CSS variable --site-icon-size / --site-icon-color on the public site.">

        <FormGroup label="Icon style (FontAwesome variant)">
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {ICON_STYLES.map(style => (
              <button key={style.id} onClick={() => update("style", style.id)}
                className="p-3 rounded-sm text-center transition-all"
                style={{
                  background: iconSettings.style === style.id ? "rgba(239,1,7,0.12)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${iconSettings.style === style.id ? "rgba(239,1,7,0.5)" : "rgba(255,255,255,0.07)"}`,
                }}>
                <i className={`${style.prefix} ${style.sample} block text-lg mb-1`}
                  style={{ color: iconSettings.style === style.id ? "#EF0107" : "rgba(255,255,255,0.5)" }} />
                <p className="text-[9px] font-bold uppercase tracking-wider"
                  style={{ color: iconSettings.style === style.id ? "#EF0107" : "rgba(255,255,255,0.35)", fontFamily: "var(--font-heading)" }}>
                  {style.label}
                </p>
              </button>
            ))}
          </div>
          <p className="text-[10px] mt-2" style={{ color: "rgba(255,255,255,0.25)" }}>
            Note: Light, Thin, and Duotone require FontAwesome Pro. Solid and Regular work with the free CDN.
          </p>
        </FormGroup>

        <FormGroup label={`Base icon size — ${iconSettings.size}px`}>
          <div className="flex items-center gap-4">
            <input
              type="range" min={10} max={48} step={1}
              value={iconSettings.size}
              onChange={e => update("size", Number(e.target.value))}
              className="flex-1 accent-[#EF0107]"
            />
            <input
              type="number" min={10} max={48}
              value={iconSettings.size}
              onChange={e => update("size", Number(e.target.value))}
              className="input-arsenal w-20 text-sm text-center"
            />
          </div>
          <div className="flex gap-2 mt-2 flex-wrap">
            {[12, 14, 16, 18, 20, 24, 28, 32].map(sz => (
              <button key={sz} onClick={() => update("size", sz)}
                className="px-2 py-1 text-[10px] font-bold rounded transition-all"
                style={{
                  background: iconSettings.size === sz ? "rgba(239,1,7,0.15)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${iconSettings.size === sz ? "rgba(239,1,7,0.4)" : "rgba(255,255,255,0.08)"}`,
                  color: iconSettings.size === sz ? "#EF0107" : "rgba(255,255,255,0.4)",
                  fontFamily: "var(--font-heading)",
                }}>
                {sz}px
              </button>
            ))}
          </div>
        </FormGroup>

        <FormGroup label="Default icon color">
          <div className="flex items-center gap-3 mb-3">
            <input
              type="color"
              value={iconSettings.color}
              onChange={e => update("color", e.target.value)}
              className="w-12 h-12 rounded border border-white/10 p-1 cursor-pointer"
              style={{ background: "transparent" }}
            />
            <input
              value={iconSettings.color}
              onChange={e => update("color", e.target.value)}
              className="input-arsenal w-40 text-sm"
              placeholder="#EF0107"
            />
            <div className="w-10 h-10 rounded-sm flex items-center justify-center"
              style={{ background: `${iconSettings.color}20`, border: `1px solid ${iconSettings.color}40` }}>
              <i className={iconClass} style={{ color: iconSettings.color, fontSize: `${iconSettings.size}px` }} />
            </div>
          </div>
          {/* Preset colors */}
          <div className="flex gap-2 flex-wrap">
            {PRESET_COLORS.map(c => (
              <button key={c} onClick={() => update("color", c)}
                className="w-8 h-8 rounded-sm border-2 transition-all hover:scale-110"
                style={{
                  background: c,
                  borderColor: iconSettings.color === c ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.1)",
                }}
                title={c}
              />
            ))}
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {[
              { label:"Arsenal Red",  val:"#EF0107" },
              { label:"Club Gold",    val:"#C6A84B" },
              { label:"Arsenal Navy", val:"#023474" },
              { label:"Inherit Text", val:"currentColor" },
            ].map(({ label, val }) => (
              <button key={val} onClick={() => update("color", val)}
                className="px-2 py-1.5 text-[10px] font-bold rounded-sm transition-all text-left flex items-center gap-1.5"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  color: "rgba(255,255,255,0.5)",
                  fontFamily: "var(--font-heading)",
                }}>
                {val !== "currentColor" && (
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: val }} />
                )}
                {label}
              </button>
            ))}
          </div>
        </FormGroup>

        <FormGroup label="Icon gallery (click to preview)">
          <div className="grid grid-cols-6 md:grid-cols-9 gap-2">
            {SAMPLE_ICONS.map(ico => (
              <button key={ico} onClick={() => setPreviewIcon(ico)}
                className="aspect-square rounded-sm flex items-center justify-center transition-all"
                style={{
                  background: previewIcon === ico ? "rgba(239,1,7,0.12)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${previewIcon === ico ? "rgba(239,1,7,0.4)" : "rgba(255,255,255,0.07)"}`,
                }}>
                <i className={`${currentStyle.prefix} ${ico}`}
                  style={{ color: previewIcon === ico ? "#EF0107" : iconSettings.color, fontSize: `${iconSettings.size}px` }} />
              </button>
            ))}
          </div>
        </FormGroup>
      </FormInsertBox>

      {/* Usage note */}
      <div className="p-4 rounded-sm" style={{ background: "rgba(198,168,75,0.07)", border: "1px solid rgba(198,168,75,0.2)" }}>
        <p className="text-xs font-bold mb-1" style={{ color: "var(--color-gold)", fontFamily: "var(--font-heading)" }}>
          <i className="fa-solid fa-circle-info mr-2" />How icon settings work
        </p>
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
          These settings define the global default icon style used across the site. Individual components may override the color for their own context.
          The base size controls how large icons appear at their standard 1× scale — section icons and stat cards scale proportionally.
        </p>
      </div>
    </div>
  );
}
