"use client";

import { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import toast from "react-hot-toast";
import { FormSection, FormField, FormInput, FormGrid } from "@/components/forms/ModernForm";

type AppearanceSettings = {
  menuNavBg: string;
  menuNavText: string;
  menuNavHoverBg: string;
  menuDropdownBg: string;
  menuDropdownText: string;
  menuDropdownHoverBg: string;
  cardLightBg: string;
  cardLightText: string;
  cardLightBorder: string;
  cardDarkBg: string;
  cardDarkText: string;
  cardDarkBorder: string;
  lightBgPrimary: string;
  lightBgCard: string;
  lightTextPrimary: string;
  lightTextMuted: string;
  lightNavBg: string;
  lightAccentColor: string;
  darkBgPrimary: string;
  darkBgCard: string;
  darkTextPrimary: string;
  darkTextMuted: string;
  darkNavBg: string;
  darkAccentColor: string;
};

const DEFAULTS: AppearanceSettings = {
  menuNavBg: "#E30613",
  menuNavText: "#FFFFFF",
  menuNavHoverBg: "rgba(255,255,255,0.12)",
  menuDropdownBg: "#FFFFFF",
  menuDropdownText: "#000000",
  menuDropdownHoverBg: "#F6F6F6",
  cardLightBg: "#FFFFFF",
  cardLightText: "#000000",
  cardLightBorder: "#E1E1E1",
  cardDarkBg: "#1C1829",
  cardDarkText: "#F8FAFC",
  cardDarkBorder: "rgba(255,255,255,0.08)",
  lightBgPrimary: "#F6F6F6",
  lightBgCard: "#FFFFFF",
  lightTextPrimary: "#000000",
  lightTextMuted: "#72767E",
  lightNavBg: "#E30613",
  lightAccentColor: "#E30613",
  darkBgPrimary: "#0C0B12",
  darkBgCard: "#1C1829",
  darkTextPrimary: "#F8FAFC",
  darkTextMuted: "#8B93A3",
  darkNavBg: "#151925",
  darkAccentColor: "#E30613",
};

function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <FormField label={label}>
      <div className="flex gap-2 items-center">
        <input
          type="color"
          value={value?.startsWith("#") ? value.slice(0, 7) : "#EF0107"}
          onChange={e => onChange(e.target.value)}
          className="w-10 h-10 rounded cursor-pointer border-0 p-0"
        />
        <FormInput value={value} onChange={e => onChange(e.target.value)} placeholder="#hex or rgba(...)" />
      </div>
    </FormField>
  );
}

export default function AppearanceSettingsPage() {
  const { settings, updateSettings } = useApp();
  const s = settings as Record<string, string>;
  const [form, setForm] = useState<AppearanceSettings>(DEFAULTS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      ...DEFAULTS,
      menuNavBg: s.menuNavBg || DEFAULTS.menuNavBg,
      menuNavText: s.menuNavText || DEFAULTS.menuNavText,
      menuNavHoverBg: s.menuNavHoverBg || DEFAULTS.menuNavHoverBg,
      menuDropdownBg: s.menuDropdownBg || DEFAULTS.menuDropdownBg,
      menuDropdownText: s.menuDropdownText || DEFAULTS.menuDropdownText,
      menuDropdownHoverBg: s.menuDropdownHoverBg || DEFAULTS.menuDropdownHoverBg,
      cardLightBg: s.cardLightBg || DEFAULTS.cardLightBg,
      cardLightText: s.cardLightText || DEFAULTS.cardLightText,
      cardLightBorder: s.cardLightBorder || DEFAULTS.cardLightBorder,
      cardDarkBg: s.cardDarkBg || DEFAULTS.cardDarkBg,
      cardDarkText: s.cardDarkText || DEFAULTS.cardDarkText,
      cardDarkBorder: s.cardDarkBorder || DEFAULTS.cardDarkBorder,
      lightBgPrimary: s.lightBgPrimary || DEFAULTS.lightBgPrimary,
      lightBgCard: s.lightBgCard || DEFAULTS.lightBgCard,
      lightTextPrimary: s.lightTextPrimary || DEFAULTS.lightTextPrimary,
      lightTextMuted: s.lightTextMuted || DEFAULTS.lightTextMuted,
      lightNavBg: s.lightNavBg || DEFAULTS.lightNavBg,
      lightAccentColor: s.lightAccentColor || DEFAULTS.lightAccentColor,
      darkBgPrimary: s.darkBgPrimary || DEFAULTS.darkBgPrimary,
      darkBgCard: s.darkBgCard || DEFAULTS.darkBgCard,
      darkTextPrimary: s.darkTextPrimary || DEFAULTS.darkTextPrimary,
      darkTextMuted: s.darkTextMuted || DEFAULTS.darkTextMuted,
      darkNavBg: s.darkNavBg || DEFAULTS.darkNavBg,
      darkAccentColor: s.darkAccentColor || DEFAULTS.darkAccentColor,
    });
  }, [settings]);

  const set = (k: keyof AppearanceSettings, v: string) => setForm(p => ({ ...p, [k]: v }));

  const save = async () => {
    setSaving(true);
    updateSettings(form as Partial<typeof settings>);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...settings, ...form }),
      });
      if (!res.ok) throw new Error("Save failed");
      toast.success("Appearance & theme settings saved");
    } catch {
      toast.error("Saved locally — database save failed");
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-white" style={{ fontFamily: "var(--font-display)" }}>
            THEME & APPEARANCE
          </h1>
          <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
            Menu, submenu, cards, and light/dark frontend colors — all database-driven
          </p>
        </div>
        <button onClick={save} disabled={saving} className="btn-arsenal px-5 py-2 text-sm">
          {saving ? "Saving…" : "Save All"}
        </button>
      </div>

      <FormSection title="Main navigation bar" icon="fa-solid fa-bars" description="Top site menu colors">
        <FormGrid>
          <ColorRow label="Nav background" value={form.menuNavBg} onChange={v => set("menuNavBg", v)} />
          <ColorRow label="Nav link text" value={form.menuNavText} onChange={v => set("menuNavText", v)} />
          <ColorRow label="Nav hover background" value={form.menuNavHoverBg} onChange={v => set("menuNavHoverBg", v)} />
        </FormGrid>
      </FormSection>

      <FormSection title="Dropdown / submenu" icon="fa-solid fa-chevron-down">
        <FormGrid>
          <ColorRow label="Dropdown background" value={form.menuDropdownBg} onChange={v => set("menuDropdownBg", v)} />
          <ColorRow label="Dropdown text" value={form.menuDropdownText} onChange={v => set("menuDropdownText", v)} />
          <ColorRow label="Dropdown hover" value={form.menuDropdownHoverBg} onChange={v => set("menuDropdownHoverBg", v)} />
        </FormGrid>
      </FormSection>

      <FormSection title="Cards — light theme" icon="fa-solid fa-sun">
        <FormGrid>
          <ColorRow label="Card background" value={form.cardLightBg} onChange={v => set("cardLightBg", v)} />
          <ColorRow label="Card text" value={form.cardLightText} onChange={v => set("cardLightText", v)} />
          <ColorRow label="Card border" value={form.cardLightBorder} onChange={v => set("cardLightBorder", v)} />
        </FormGrid>
      </FormSection>

      <FormSection title="Cards — dark theme" icon="fa-solid fa-moon">
        <FormGrid>
          <ColorRow label="Card background" value={form.cardDarkBg} onChange={v => set("cardDarkBg", v)} />
          <ColorRow label="Card text" value={form.cardDarkText} onChange={v => set("cardDarkText", v)} />
          <ColorRow label="Card border" value={form.cardDarkBorder} onChange={v => set("cardDarkBorder", v)} />
        </FormGrid>
      </FormSection>

      <FormSection title="Light theme (site-wide)" icon="fa-solid fa-sun">
        <FormGrid>
          <ColorRow label="Page background" value={form.lightBgPrimary} onChange={v => set("lightBgPrimary", v)} />
          <ColorRow label="Card / panel bg" value={form.lightBgCard} onChange={v => set("lightBgCard", v)} />
          <ColorRow label="Primary text" value={form.lightTextPrimary} onChange={v => set("lightTextPrimary", v)} />
          <ColorRow label="Muted text" value={form.lightTextMuted} onChange={v => set("lightTextMuted", v)} />
          <ColorRow label="Navigation bg" value={form.lightNavBg} onChange={v => set("lightNavBg", v)} />
          <ColorRow label="Accent (Arsenal red)" value={form.lightAccentColor} onChange={v => set("lightAccentColor", v)} />
        </FormGrid>
      </FormSection>

      <FormSection title="Dark theme (site-wide)" icon="fa-solid fa-moon">
        <FormGrid>
          <ColorRow label="Page background" value={form.darkBgPrimary} onChange={v => set("darkBgPrimary", v)} />
          <ColorRow label="Card / panel bg" value={form.darkBgCard} onChange={v => set("darkBgCard", v)} />
          <ColorRow label="Primary text" value={form.darkTextPrimary} onChange={v => set("darkTextPrimary", v)} />
          <ColorRow label="Muted text" value={form.darkTextMuted} onChange={v => set("darkTextMuted", v)} />
          <ColorRow label="Navigation bg" value={form.darkNavBg} onChange={v => set("darkNavBg", v)} />
          <ColorRow label="Accent" value={form.darkAccentColor} onChange={v => set("darkAccentColor", v)} />
        </FormGrid>
      </FormSection>

      <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>
        Menu item CRUD lives under{" "}
        <a href="/admin/settings/menu" className="underline" style={{ color: "var(--color-gold)" }}>
          Menu & Navigation
        </a>
        . Run <strong>Backup & Database → Upgrade to v2.0.0</strong> if tables are missing.
      </p>
    </div>
  );
}
