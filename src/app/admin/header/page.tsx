"use client";
import { useState } from "react";
import { Save, Plus, Trash2, RefreshCw, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
import { useApp } from "@/context/AppContext";
import FaIconPicker from "@/components/admin/FaIconPicker";

export default function AdminHeaderPage() {
  const { settings, updateSettings } = useApp();
  const [navItems, setNavItems] = useState(settings.topBarItems?.map(i=>({...i}))||[]);
  const [topBarBg, setTopBarBg] = useState(settings.topBarBg||"#6B0000");
  const [navBg, setNavBg] = useState(settings.navBg||"#1A0A0A");
  const [headerType, setHeaderType] = useState((settings as any).headerType||"type1");
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<number|null>(null);

  const HEADER_TYPES = [
    { id:"type1", label:"Type 1 — Arsenal Standard", desc:"3-layer: dark top bar + ticker + main nav" },
    { id:"type2", label:"Type 2 — Bold Red", desc:"Red top bar, centered logo option" },
    { id:"type3", label:"Type 3 — Minimal", desc:"Single compact nav row" },
    { id:"type4", label:"Type 4 — Full-width", desc:"Wide nav with mega menus" },
  ];

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r=>setTimeout(r,600));
    updateSettings({ topBarItems:navItems, topBarBg, navBg, headerType } as any);
    setSaving(false);
    toast.success("Header settings saved — changes visible on frontend!");
  };

  const addItem = () => setNavItems(p=>[...p,{id:Date.now(),label:"New Link",href:"/",icon:"fa-solid fa-link"}]);
  const removeItem = (i:number) => setNavItems(p=>p.filter((_,j)=>j!==i));
  const updateItem = (i:number, k:string, v:string) => setNavItems(p=>p.map((x,j)=>j===i?{...x,[k]:v}:x));

  const inp = "input-arsenal w-full text-sm";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white" style={{fontFamily:"var(--font-display)"}}>HEADER & NAVIGATION</h1>
          <p className="text-xs mt-0.5" style={{color:"rgba(255,255,255,0.4)",fontFamily:"var(--font-body)"}}>Configure the site header — changes reflect instantly on frontend</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-arsenal flex items-center gap-2 px-5 py-2.5 text-sm">
          {saving?<RefreshCw size={14} className="animate-spin"/>:<Save size={14}/>}Save & Apply
        </button>
      </div>

      {/* Header type */}
      <div className="p-5 rounded-sm space-y-4" style={{background:"#16213E",border:"1px solid rgba(255,255,255,0.06)"}}>
        <h2 className="text-sm font-bold uppercase tracking-wider text-white" style={{fontFamily:"var(--font-heading)"}}>Header Style</h2>
        <div className="grid grid-cols-2 gap-3">
          {HEADER_TYPES.map(ht=>(
            <button key={ht.id} onClick={()=>setHeaderType(ht.id)}
              className="p-4 rounded-sm text-left transition-all"
              style={{background:headerType===ht.id?"rgba(239,1,7,0.1)":"rgba(255,255,255,0.03)",border:`1px solid ${headerType===ht.id?"var(--color-red)":"rgba(255,255,255,0.06)"}`}}>
              <div className="h-5 rounded-sm mb-2" style={{background:headerType===ht.id?"rgba(239,1,7,0.4)":"rgba(255,255,255,0.06)"}}/>
              <p className="text-xs font-bold text-white" style={{fontFamily:"var(--font-heading)"}}>{ht.label}</p>
              <p className="text-[10px] mt-0.5" style={{color:"rgba(255,255,255,0.4)"}}>{ht.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Colors */}
      <div className="p-5 rounded-sm space-y-4" style={{background:"#16213E",border:"1px solid rgba(255,255,255,0.06)"}}>
        <h2 className="text-sm font-bold uppercase tracking-wider text-white" style={{fontFamily:"var(--font-heading)"}}>Header Colors</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{color:"rgba(255,255,255,0.4)",fontFamily:"var(--font-heading)"}}>
              <i className="fa-solid fa-palette text-[10px] mr-1" style={{color:"var(--color-red)"}}/>Top Bar Background
            </label>
            <div className="flex gap-2">
              <input type="color" value={topBarBg} onChange={e=>setTopBarBg(e.target.value)} className="w-10 h-9 rounded border border-white/10 p-1 cursor-pointer" style={{background:"transparent"}}/>
              <input value={topBarBg} onChange={e=>setTopBarBg(e.target.value)} className={inp+" flex-1"}/>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{color:"rgba(255,255,255,0.4)",fontFamily:"var(--font-heading)"}}>
              <i className="fa-solid fa-palette text-[10px] mr-1" style={{color:"var(--color-red)"}}/>Main Nav Background
            </label>
            <div className="flex gap-2">
              <input type="color" value={navBg} onChange={e=>setNavBg(e.target.value)} className="w-10 h-9 rounded border border-white/10 p-1 cursor-pointer" style={{background:"transparent"}}/>
              <input value={navBg} onChange={e=>setNavBg(e.target.value)} className={inp+" flex-1"}/>
            </div>
          </div>
        </div>
        {/* Preview */}
        <div className="rounded-sm overflow-hidden" style={{border:"1px solid rgba(255,255,255,0.06)"}}>
          <div className="h-6 flex items-center px-3 gap-2 text-[10px] text-white/50" style={{background:topBarBg}}>
            <i className="fa-solid fa-shield text-[10px]" style={{color:"rgba(255,255,255,0.6)"}}/>Victoria Concordia Crescit
          </div>
          <div className="h-12 flex items-center px-4 gap-4" style={{background:navBg}}>
            <div className="w-8 h-8 rounded-full bg-red-600 flex-shrink-0"/>
            <div className="flex gap-4 flex-1">
              {["Home","Club","Events","Gallery","Shop"].map(l=><span key={l} className="text-xs text-white/60">{l}</span>)}
            </div>
          </div>
        </div>
      </div>

      {/* Top bar items (CRUD) */}
      <div className="p-5 rounded-sm space-y-3" style={{background:"#16213E",border:"1px solid rgba(255,255,255,0.06)"}}>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white" style={{fontFamily:"var(--font-heading)"}}>Top Bar Items</h2>
          <button onClick={addItem} className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-white/10 hover:border-white/30 transition-colors" style={{color:"rgba(255,255,255,0.5)",fontFamily:"var(--font-heading)"}}>
            <Plus size={11}/>Add Item
          </button>
        </div>
        {navItems.map((item,i)=>(
          <div key={item.id} className="p-3 rounded-sm space-y-2" style={{background:"rgba(0,0,0,0.2)"}}>
            <div className="flex items-center gap-2">
              <input value={item.label} onChange={e=>updateItem(i,"label",e.target.value)} className="form-input flex-1 text-sm" placeholder="Label"/>
              <input value={item.href} onChange={e=>updateItem(i,"href",e.target.value)} className="form-input w-36 text-sm" placeholder="/path or URL"/>
              <button onClick={()=>removeItem(i)} className="text-white/20 hover:text-red-400 transition-colors p-1"><Trash2 size={13}/></button>
            </div>
            <FaIconPicker value={item.icon || ""} onChange={(v) => updateItem(i, "icon", v)} />
          </div>
        ))}
        <p className="text-[11px]" style={{color:"rgba(255,255,255,0.3)"}}>These items appear in the top utility bar. Use Font Awesome class names for icons.</p>
      </div>
    </div>
  );
}
