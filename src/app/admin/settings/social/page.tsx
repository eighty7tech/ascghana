"use client";
import { useState } from "react";
import { Save, RefreshCw, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { useApp } from "@/context/AppContext";
import FaIconPicker from "@/components/admin/FaIconPicker";

const PRESET_PLATFORMS = [
  { key: "Facebook",    icon: "fa-brands fa-facebook-f",   color: "#1877F2", ph: "https://facebook.com/ascghana" },
  { key: "Instagram",   icon: "fa-brands fa-instagram",    color: "#E1306C", ph: "https://instagram.com/ascghana" },
  { key: "Twitter/X",   icon: "fa-brands fa-x-twitter",    color: "#1DA1F2", ph: "https://twitter.com/ascghana" },
  { key: "YouTube",     icon: "fa-brands fa-youtube",      color: "#FF0000", ph: "https://youtube.com/@ascghana" },
  { key: "TikTok",      icon: "fa-brands fa-tiktok",       color: "#69C9D0", ph: "https://tiktok.com/@ascghana" },
  { key: "WhatsApp",    icon: "fa-brands fa-whatsapp",     color: "#25D366", ph: "https://chat.whatsapp.com/xxxxxx" },
  { key: "LinkedIn",    icon: "fa-brands fa-linkedin-in",  color: "#0A66C2", ph: "https://linkedin.com/company/ascghana" },
  { key: "Telegram",    icon: "fa-brands fa-telegram",     color: "#26A5E4", ph: "https://t.me/ascghana" },
  { key: "Snapchat",    icon: "fa-brands fa-snapchat",     color: "#FFFC00", ph: "https://snapchat.com/add/ascghana" },
  { key: "Pinterest",   icon: "fa-brands fa-pinterest",    color: "#BD081C", ph: "https://pinterest.com/ascghana" },
  { key: "Threads",     icon: "fa-brands fa-threads",      color: "#000000", ph: "https://threads.net/@ascghana" },
];

interface SocialLink { 
  key: string; 
  icon: string; 
  color: string; 
  url: string; 
}

export default function SocialSettingsPage() {
  const { settings, updateSettings } = useApp();

  // Initialize from saved socialLinks — merge with presets for known ones
  const init: SocialLink[] = settings?.socialLinks && settings.socialLinks.length > 0
    ? settings.socialLinks.map((s: any) => ({
        key: s.platform || s.key || "custom",
        icon: s.icon || PRESET_PLATFORMS.find(p => p.key === (s.platform || s.key))?.icon || "fa-solid fa-globe",
        color: s.color || "#EF0107",
        url: s.url || "",
      }))
    : PRESET_PLATFORMS.slice(0, 5).map(p => ({
        key: p.key,
        icon: p.icon,
        color: p.color,
        url: ""
      }));

  const [links, setLinks] = useState<SocialLink[]>(init);
  const [saving, setSaving] = useState(false);

  // Custom platform form
  const [showCustom, setShowCustom] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customIcon, setCustomIcon] = useState("fa-solid fa-globe");
  const [customColor, setCustomColor] = useState("#EF0107");

  const update = (idx: number, field: keyof SocialLink, val: string) =>
    setLinks(prev => prev.map((l, i) => i === idx ? { ...l, [field]: val } : l));

  const removePlatform = (idx: number) => setLinks(prev => prev.filter((_, i) => i !== idx));

  const addPreset = (p: typeof PRESET_PLATFORMS[0]) => {
    if (links.find(l => l.key === p.key)) { 
      toast.error(`${p.key} already added`); 
      return; 
    }
    setLinks(prev => [...prev, { key: p.key, icon: p.icon, color: p.color, url: "" }]);
  };

  const addCustom = () => {
    if (!customName.trim()) { 
      toast.error("Platform name required"); 
      return; 
    }
    setLinks(prev => [...prev, { key: customName.trim(), icon: customIcon, color: customColor, url: "" }]);
    setCustomName(""); 
    setCustomIcon("fa-solid fa-globe"); 
    setCustomColor("#EF0107");
    setShowCustom(false);
    toast.success("Custom platform added");
  };

  const handleSave = async () => {
    setSaving(true);
    // Mimic API delay
    await new Promise(r => setTimeout(r, 500));
    
    // Map internal types accurately back into the app data layout format
    const newSocials = links.map(l => ({
      platform: l.key,
      url: l.url || "",
      icon: l.icon || "fa-solid fa-globe",
      color: l.color || "#EF0107",
      iconBgColor: ""
    }));

    updateSettings({ socialLinks: newSocials });
    setSaving(false);
    
    const activeCount = newSocials.filter(s => s.url.trim()).length;
    toast.success(`Saved! ${activeCount} active link${activeCount !== 1 ? "s" : ""} will show in the footer.`);
  };

  const inp = "input-arsenal w-full text-sm";
  const notAdded = PRESET_PLATFORMS.filter(p => !links.find(l => l.key === p.key));

  return (
    <div className="space-y-5 max-w-xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white" style={{ fontFamily: "var(--font-display)" }}>SOCIAL MEDIA</h1>
          <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>Animated square icons shown in the footer. Leave URL blank to hide.</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-arsenal flex items-center gap-2 px-5 py-2.5 text-sm">
          {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}Save
        </button>
      </div>

      {/* Active platforms */}
      <div className="space-y-2">
        {links.map((l, i) => (
          <div key={`${l.key}-${i}`} className="p-4 rounded-sm" style={{ background: "#16213E", border: `1px solid ${l.color}20` }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-sm flex items-center justify-center flex-shrink-0" style={{ background: `${l.color}20`, color: l.color }}>
                <i className={`${l.icon} text-base`} />
              </div>
              <span className="text-sm font-bold flex-1" style={{ color: l.color, fontFamily: "var(--font-heading)" }}>{l.key}</span>
              {l.url && <span className="text-[10px] px-2 py-0.5 rounded-sm font-bold" style={{ background: "rgba(16,185,129,0.15)", color: "#10B981" }}>Active</span>}
              <button onClick={() => removePlatform(i)} className="w-7 h-7 flex items-center justify-center rounded hover:bg-red-500/15 transition-colors" style={{ color: "rgba(255,255,255,0.3)" }}>
                <Trash2 size={12} />
              </button>
            </div>
            <div className="flex gap-2 mb-2">
              <input type="url" value={l.url} onChange={e => update(i, "url", e.target.value)} className={inp + " flex-1"} placeholder="https://..." />
              <input type="color" value={l.color} onChange={e => update(i, "color", e.target.value)} className="w-9 h-9 rounded border border-white/10 p-1 cursor-pointer flex-shrink-0" style={{ background: "transparent" }} />
            </div>
            <FaIconPicker value={l.icon || ""} onChange={(v) => update(i, "icon", v)} />
          </div>
        ))}
      </div>

      {/* Add preset platforms */}
      {notAdded.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-heading)" }}>
            <i className="fa-solid fa-plus mr-1.5" style={{ color: "var(--color-red)" }} />Add More Platforms
          </p>
          <div className="flex flex-wrap gap-2">
            {notAdded.map(p => (
              <button key={p.key} onClick={() => addPreset(p)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-sm transition-all hover:scale-105"
                style={{ background: `${p.color}15`, color: p.color, border: `1px solid ${p.color}30`, fontFamily: "var(--font-heading)" }}>
                <i className={`${p.icon} text-xs`} />{p.key}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Custom platform */}
      <div>
        <button onClick={() => setShowCustom(v => !v)}
          className="flex items-center gap-2 text-sm font-bold transition-colors"
          style={{ color: showCustom ? "var(--color-red)" : "rgba(255,255,255,0.5)", fontFamily: "var(--font-heading)" }}>
          <Plus size={14} /> {showCustom ? "Cancel" : "Add Custom Social Platform"}
        </button>
        {showCustom && (
          <div className="mt-3 p-4 rounded-sm space-y-3" style={{ background: "rgba(239,1,7,0.06)", border: "1px solid rgba(239,1,7,0.15)" }}>
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.5)", fontFamily: "var(--font-heading)" }}>Custom Platform</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase mb-1" style={{ color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-heading)" }}>Platform Name</label>
                <input value={customName} onChange={e => setCustomName(e.target.value)} className={inp} placeholder="e.g. Discord, Clubhouse" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase mb-1" style={{ color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-heading)" }}>Icon Class</label>
                <input value={customIcon} onChange={e => setCustomIcon(e.target.value)} className={inp} placeholder="fa-brands fa-discord" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase mb-1" style={{ color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-heading)" }}>Brand Color</label>
                <div className="flex gap-2">
                  <input type="color" value={customColor} onChange={e => setCustomColor(e.target.value)} className="w-9 h-9 rounded border border-white/10 p-1 cursor-pointer" style={{ background: "transparent" }} />
                  <input value={customColor} onChange={e => setCustomColor(e.target.value)} className={inp + " flex-1"} />
                </div>
              </div>
              <div className="flex items-end">
                <button onClick={addCustom} className="btn-arsenal w-full py-2 text-sm"><Plus size={12} />Add Platform</button>
              </div>
            </div>
            <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
              Use Font Awesome 6 class names. Browse at <a href="https://fontawesome.com/icons" target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-red)" }}>fontawesome.com/icons</a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}