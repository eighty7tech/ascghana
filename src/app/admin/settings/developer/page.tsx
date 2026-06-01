"use client";

import { useState } from "react";
import { Save, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { useApp } from "@/context/AppContext";

export default function DeveloperSettingsPage() {
  const { settings, updateSettings } = useApp();
  const [website, setWebsite] = useState(settings.developerWebsite || "https://eighty7tech.com");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 600));
    updateSettings({ developerWebsite: website });
    setSaving(false);
    toast.success("Developer settings saved!");
  };

  return (
    <div className="max-w-lg space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white" style={{ fontFamily:"var(--font-display)" }}>DEVELOPER & CREDITS</h1>
          <p className="text-xs mt-0.5" style={{ color:"rgba(255,255,255,0.4)" }}>Configure the developer credit shown in the site footer</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-arsenal flex items-center gap-2 px-4 py-2.5 text-sm">
          {saving ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}Save
        </button>
      </div>

      <div className="p-5 rounded-sm space-y-4" style={{ background:"#16213E", border:"1px solid rgba(255,255,255,0.06)" }}>
        <h2 className="text-xs font-black text-white uppercase tracking-wider" style={{ fontFamily:"var(--font-heading)" }}>
          <i className="fa-solid fa-code mr-2" style={{ color:"var(--color-red)" }} />Footer Credit
        </h2>
        <div>
          <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color:"rgba(255,255,255,0.5)", fontFamily:"var(--font-heading)" }}>
            <i className="fa-solid fa-globe mr-1.5 text-[10px]" style={{ color:"var(--color-red)" }} />Developer Website URL
          </label>
          <input type="url" value={website} onChange={e=>setWebsite(e.target.value)}
            className="input-arsenal text-sm" placeholder="https://eighty7tech.com" />
          <p className="text-[10px] mt-1.5" style={{ color:"rgba(255,255,255,0.3)" }}>
            This URL is linked from the "Developed by Eighty7Tech" credit in the footer.
          </p>
        </div>
        <div className="p-3 rounded-sm" style={{ background:"#0A0A14", border:"1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-[10px] mb-2 uppercase tracking-widest" style={{ color:"rgba(255,255,255,0.25)", fontFamily:"var(--font-heading)" }}>Preview</p>
          <a href={website} target="_blank" rel="noopener noreferrer"
            className="text-[11px] flex items-center gap-1.5" style={{ color:"rgba(255,255,255,0.25)" }}>
            <i className="fa-solid fa-code text-[9px]" style={{ color:"rgba(198,168,75,0.5)" }} />
            Developed by
            <span style={{ color:"rgba(198,168,75,0.7)", fontWeight:600 }}>Eighty7Tech</span>
            <i className="fa-solid fa-arrow-up-right-from-square text-[8px]" />
          </a>
        </div>
      </div>
    </div>
  );
}
