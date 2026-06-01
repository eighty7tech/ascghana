"use client";
import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Switch } from "@/components/ui";
import toast from "react-hot-toast";
import { ARSENAL_CSS_PRESETS, DEFAULT_BUTTON_STYLES } from "@/lib/buttonDefaults";
import { FormInsertBox, FormGroup } from "@/components/admin/FormInsertBox";

const CLIP_PRESETS = [
  { id:"none",        label:"None",         clip:"none" },
  { id:"chamfer",     label:"Chamfer",      clip:"polygon(8px 0%,100% 0%,100% calc(100% - 8px),calc(100% - 8px) 100%,0% 100%,0% 8px)" },
  { id:"arrow-r",     label:"Arrow →",      clip:"polygon(0% 0%,calc(100% - 12px) 0%,100% 50%,calc(100% - 12px) 100%,0% 100%)" },
  { id:"arrow-l",     label:"← Arrow",      clip:"polygon(12px 0%,100% 0%,100% 100%,12px 100%,0% 50%)" },
  { id:"chevron",     label:"Chevron",      clip:"polygon(0% 0%,calc(100% - 14px) 0%,100% 50%,calc(100% - 14px) 100%,0% 100%,14px 50%)" },
  { id:"double-cut",  label:"Double Cut",   clip:"polygon(12px 0%,100% 0%,calc(100% - 12px) 100%,0% 100%)" },
  { id:"skew-r",      label:"Skew →",       clip:"polygon(0% 0%,100% 0%,calc(100% - 8px) 100%,0% 100%)" },
  { id:"stadium",     label:"Stadium",      clip:"polygon(50% 0%,100% 50%,50% 100%,0% 50%)" },
  { id:"pill",        label:"Pill",         clip:"none" },
  { id:"badge",       label:"Badge Cut",    clip:"polygon(0 0,calc(100% - 10px) 0,100% 10px,100% 100%,10px 100%,0 calc(100% - 10px))" },
];

const SECTIONS = [
  { id:"hero",       label:"Hero / Banner" },
  { id:"nav",        label:"Navigation / Header" },
  { id:"stats",      label:"Stats Section" },
  { id:"countdown",  label:"Match Countdown" },
  { id:"bulletin",   label:"News Bulletin" },
  { id:"spotlight",  label:"Spotlight" },
  { id:"events",     label:"Events Section" },
  { id:"membership", label:"Membership CTA" },
  { id:"blog",       label:"Blog Section" },
  { id:"shop",       label:"Shop Section" },
  { id:"sponsors",   label:"Sponsors" },
  { id:"tiers",      label:"Membership Tiers" },
  { id:"members-update", label:"Members Update" },
  { id:"gallery",    label:"Gallery / Social" },
  { id:"poll",       label:"Community Poll" },
  { id:"fixtures",   label:"Fixtures" },
];

interface ButtonStyle {
  id: string; label: string;
  cssClass?: string;
  bg: string; hoverBg: string; textColor: string; hoverTextColor: string;
  borderColor: string; borderWidth: number;
  paddingX: number; paddingY: number;
  fontSize: string; fontFamily: string; fontWeight: string;
  letterSpacing: string;
  clipPreset: string; borderRadius: number;
  textTransform: string; useGradient: boolean;
  gradientFrom: string; gradientTo: string;
}

const defaultStyle: ButtonStyle = {
  id:"", label:"",
  bg:"#EF0107", hoverBg:"#C0090D", textColor:"#FFFFFF", hoverTextColor:"#FFFFFF",
  borderColor:"transparent", borderWidth:0,
  paddingX:20, paddingY:10,
  fontSize:"14px", fontFamily:"var(--font-heading)", fontWeight:"700",
  letterSpacing:"0.05em",
  clipPreset:"chamfer", borderRadius:0,
  textTransform:"uppercase", useGradient:false,
  gradientFrom:"#EF0107", gradientTo:"#8B0000",
};

export default function ButtonStylesPage() {
  const { settings, updateSettings } = useApp();
  const s = settings as any;
  const [buttons, setButtons] = useState<ButtonStyle[]>(
    s.buttonStyles?.length ? s.buttonStyles : DEFAULT_BUTTON_STYLES
  );
  const [activeButtonId, setActiveButtonId] = useState<string>(s.activeButtonId || buttons[0]?.id || "");
  const [sectionButtonIds, setSectionButtonIds] = useState<Record<string,string>>(s.sectionButtonIds || {});
  const [selected, setSelected] = useState<string>(buttons[0]?.id || "");
  const [saving, setSaving] = useState(false);
  const [hover, setHover] = useState(false);
  const [tab, setTab] = useState<"editor"|"sections">("editor");

  const current = buttons.find(b=>b.id===selected) || buttons[0];

  const update = (field: keyof ButtonStyle, val: string|number|boolean) => {
    setButtons(prev=>prev.map(b=>b.id===selected?{...b,[field]:val}:b));
  };

  const addButton = () => {
    const newId = Date.now().toString();
    setButtons(prev=>[...prev,{...defaultStyle,id:newId,label:`Button ${prev.length+1}`}]);
    setSelected(newId);
  };

  const deleteButton = (id: string) => {
    setButtons(prev=>{
      const next=prev.filter(b=>b.id!==id);
      if(selected===id) setSelected(next[0]?.id||"");
      if(activeButtonId===id) setActiveButtonId(next[0]?.id||"");
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    const aid = activeButtonId || buttons[0]?.id || "";
    await updateSettings({ buttonStyles: buttons, activeButtonId: aid, sectionButtonIds } as any);
    setActiveButtonId(aid);
    setSaving(false);
    toast.success("Button styles saved & applied to frontend!");
  };

  const getClipPath = (preset: string) => CLIPS[preset] || "none";
  const CLIPS: Record<string,string> = Object.fromEntries(CLIP_PRESETS.map(c=>[c.id,c.clip]));

  const getStyle = (b: ButtonStyle, isHover: boolean): React.CSSProperties => ({
    background: b.useGradient
      ? `linear-gradient(135deg,${b.gradientFrom},${b.gradientTo})`
      : isHover ? b.hoverBg : b.bg,
    color: isHover ? b.hoverTextColor : b.textColor,
    border: b.borderWidth > 0 ? `${b.borderWidth}px solid ${b.borderColor}` : "none",
    padding: `${b.paddingY}px ${b.paddingX}px`,
    fontSize: b.fontSize,
    fontFamily: b.fontFamily,
    fontWeight: b.fontWeight,
    letterSpacing: b.letterSpacing,
    clipPath: b.clipPreset !== "pill" ? getClipPath(b.clipPreset) : undefined,
    borderRadius: b.clipPreset === "pill" ? "999px" : `${b.borderRadius}px`,
    textTransform: b.textTransform as any,
    transition: "all 0.2s ease",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    textDecoration: "none",
    minHeight: "40px",
  });

  const inp = "input-arsenal w-full text-sm";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white" style={{fontFamily:"var(--font-display)"}}>BUTTON STYLES</h1>
          <p className="text-xs mt-0.5" style={{color:"rgba(255,255,255,0.4)"}}>Create button styles, set a global default, and override per section</p>
        </div>
        <div className="flex gap-2">
          <button onClick={addButton} className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-sm transition-all"
            style={{background:"rgba(198,168,75,0.1)",border:"1px solid rgba(198,168,75,0.3)",color:"var(--color-gold)",fontFamily:"var(--font-heading)"}}>
            <i className="fa-solid fa-plus"/>New Button
          </button>
          <button onClick={save} disabled={saving} className="btn-arsenal flex items-center gap-2 px-5 py-2 text-sm">
            {saving?<><i className="fa-solid fa-spinner fa-spin"/>Saving…</>:<><i className="fa-solid fa-save"/>Save & Apply</>}
          </button>
        </div>
      </div>

      {/* Active button banner */}
      <div className="p-3 rounded-sm flex items-center gap-3" style={{background:"rgba(239,1,7,0.07)",border:"1px solid rgba(239,1,7,0.25)"}}>
        <i className="fa-solid fa-circle-check" style={{color:"#EF0107"}}/>
        <span className="text-sm" style={{color:"rgba(255,255,255,0.7)"}}>
          <strong style={{color:"#fff"}}>Global default button:</strong>{" "}
          {buttons.find(b=>b.id===activeButtonId)?.label || "None selected — pick one below"}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-sm w-fit" style={{background:"rgba(255,255,255,0.05)"}}>
        {([["editor","Button Editor"],["sections","Section Assignments"]] as [string,string][]).map(([key,lbl])=>(
          <button key={key} onClick={()=>setTab(key as any)}
            className="px-4 py-2 text-xs font-bold rounded-sm transition-all"
            style={{
              background:tab===key?"#EF0107":"transparent",
              color:tab===key?"#fff":"rgba(255,255,255,0.5)",
              fontFamily:"var(--font-heading)",
            }}>
            {lbl}
          </button>
        ))}
      </div>

      {tab === "editor" && (
        <div className="grid md:grid-cols-4 gap-4">
          {/* Left: button list */}
          <div className="md:col-span-1 space-y-2">
            {buttons.map(b=>(
              <div key={b.id} className="rounded-sm overflow-hidden" style={{border:`1px solid ${selected===b.id?"rgba(239,1,7,0.4)":"rgba(255,255,255,0.06)"}`}}>
                <div onClick={()=>setSelected(b.id)}
                  className="p-3 cursor-pointer transition-all flex items-center gap-2"
                  style={{background:selected===b.id?"rgba(239,1,7,0.1)":"rgba(255,255,255,0.03)"}}>
                  {/* Mini preview swatch */}
                  <div className="w-8 h-5 rounded-sm flex-shrink-0 text-[8px] font-bold flex items-center justify-center"
                    style={{
                      background:b.useGradient?`linear-gradient(135deg,${b.gradientFrom},${b.gradientTo})`:b.bg,
                      color:b.textColor,
                      clipPath:b.clipPreset!=="pill"?(CLIPS[b.clipPreset]||"none"):undefined,
                      borderRadius:b.clipPreset==="pill"?"999px":`${b.borderRadius}px`,
                      border:b.borderWidth>0?`1px solid ${b.borderColor}`:undefined,
                    }}>BTN</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate" style={{color:selected===b.id?"var(--color-red)":"rgba(255,255,255,0.7)",fontFamily:"var(--font-heading)"}}>{b.label}</p>
                  </div>
                  {buttons.length>1 && (
                    <button onClick={e=>{e.stopPropagation();deleteButton(b.id);}} className="w-5 h-5 flex items-center justify-center rounded hover:text-red-400 transition-colors flex-shrink-0"
                      style={{color:"rgba(255,255,255,0.2)"}}>
                      <i className="fa-solid fa-xmark text-[10px]"/>
                    </button>
                  )}
                </div>
                {/* Set as global default */}
                <button onClick={()=>setActiveButtonId(b.id)}
                  className="w-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 justify-center"
                  style={{
                    background:activeButtonId===b.id?"rgba(239,1,7,0.15)":"rgba(255,255,255,0.02)",
                    borderTop:"1px solid rgba(255,255,255,0.05)",
                    color:activeButtonId===b.id?"#EF0107":"rgba(255,255,255,0.3)",
                    fontFamily:"var(--font-heading)",
                  }}>
                  <i className={`fa-solid ${activeButtonId===b.id?"fa-circle-check":"fa-circle"} text-[10px]`}/>
                  {activeButtonId===b.id?"✓ Global Default":"Set as Default"}
                </button>
              </div>
            ))}
          </div>

          {/* Right: editor */}
          {current && (
            <div className="md:col-span-3 space-y-4">
              {/* Live Preview */}
              <div className="p-6 rounded-sm flex items-center justify-center gap-6"
                style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",minHeight:"100px"}}>
                <button style={getStyle(current,false)} onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}>
                  <i className="fa-solid fa-shield-halved"/>Preview Button
                </button>
                <button style={getStyle(current,true)}>
                  <i className="fa-solid fa-shield-halved"/>Hovered
                </button>
              </div>

              <FormInsertBox title="Style editor" description="Changes apply site-wide after Save. Use Arsenal CSS presets or customize colors and shape below.">
                <FormGroup label="Button name">
                  <input value={current.label} onChange={e=>update("label",e.target.value)} className={inp} placeholder="Button name"/>
                </FormGroup>

                <FormGroup label="Arsenal CSS preset (optional)">
                  <select
                    value={current.cssClass || ""}
                    onChange={e=>update("cssClass", e.target.value)}
                    className="input-arsenal w-full text-sm">
                    <option value="">Custom (use fields below)</option>
                    {ARSENAL_CSS_PRESETS.map(p=>(
                      <option key={p.cssClass} value={`${p.cssClass} btn-md`}>{p.label}</option>
                    ))}
                    <option value="btn-hero-full">Hero — Large CTA</option>
                  </select>
                </FormGroup>

                {/* Colors */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[{label:"Background",field:"bg"},{label:"Hover BG",field:"hoverBg"},{label:"Text Color",field:"textColor"},{label:"Hover Text",field:"hoverTextColor"}].map(({label,field})=>(
                    <div key={field}>
                      <label className="block text-xs font-bold uppercase mb-1" style={{color:"rgba(255,255,255,0.4)",fontFamily:"var(--font-heading)"}}>{label}</label>
                      <div className="flex gap-1.5">
                        <input type="color" value={(current as any)[field]==="transparent"?"#000000":(current as any)[field]} onChange={e=>update(field as any,e.target.value)}
                          className="w-9 h-9 rounded border border-white/10 p-1 cursor-pointer flex-shrink-0" style={{background:"transparent"}}/>
                        <input value={(current as any)[field]} onChange={e=>update(field as any,e.target.value)} className="input-arsenal flex-1 text-xs"/>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Gradient */}
                <div className="flex items-center gap-3">
                  <Switch checked={current.useGradient} onChange={v=>update("useGradient",v)}/>
                  <span className="text-sm" style={{color:"rgba(255,255,255,0.6)"}}>Use Gradient Background</span>
                  {current.useGradient && (
                    <div className="flex gap-2 ml-2">
                      <input type="color" value={current.gradientFrom} onChange={e=>update("gradientFrom",e.target.value)} className="w-9 h-9 rounded border border-white/10 p-1 cursor-pointer" style={{background:"transparent"}}/>
                      <input type="color" value={current.gradientTo} onChange={e=>update("gradientTo",e.target.value)} className="w-9 h-9 rounded border border-white/10 p-1 cursor-pointer" style={{background:"transparent"}}/>
                    </div>
                  )}
                </div>

                {/* Border */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase mb-1" style={{color:"rgba(255,255,255,0.4)",fontFamily:"var(--font-heading)"}}>Border Color</label>
                    <div className="flex gap-1.5">
                      <input type="color" value={current.borderColor==="transparent"?"#000000":current.borderColor} onChange={e=>update("borderColor",e.target.value)}
                        className="w-9 h-9 rounded border border-white/10 p-1 cursor-pointer" style={{background:"transparent"}}/>
                      <input value={current.borderColor} onChange={e=>update("borderColor",e.target.value)} className="input-arsenal flex-1 text-xs"/>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase mb-1" style={{color:"rgba(255,255,255,0.4)",fontFamily:"var(--font-heading)"}}>Border Width (px)</label>
                    <input type="number" min={0} max={8} value={current.borderWidth} onChange={e=>update("borderWidth",Number(e.target.value))} className={inp}/>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase mb-1" style={{color:"rgba(255,255,255,0.4)",fontFamily:"var(--font-heading)"}}>Border Radius (px)</label>
                    <input type="number" min={0} max={50} value={current.borderRadius} onChange={e=>update("borderRadius",Number(e.target.value))} className={inp}/>
                  </div>
                </div>

                {/* Spacing */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase mb-1" style={{color:"rgba(255,255,255,0.4)",fontFamily:"var(--font-heading)"}}>Padding X (px)</label>
                    <input type="number" min={4} max={80} value={current.paddingX} onChange={e=>update("paddingX",Number(e.target.value))} className={inp}/>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase mb-1" style={{color:"rgba(255,255,255,0.4)",fontFamily:"var(--font-heading)"}}>Padding Y (px)</label>
                    <input type="number" min={2} max={40} value={current.paddingY} onChange={e=>update("paddingY",Number(e.target.value))} className={inp}/>
                  </div>
                </div>

                {/* Typography */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase mb-1" style={{color:"rgba(255,255,255,0.4)",fontFamily:"var(--font-heading)"}}>Font Size</label>
                    <select value={current.fontSize} onChange={e=>update("fontSize",e.target.value)} className="input-arsenal w-full text-sm">
                      {["11px","12px","13px","14px","15px","16px","18px","20px"].map(s=><option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase mb-1" style={{color:"rgba(255,255,255,0.4)",fontFamily:"var(--font-heading)"}}>Font Family</label>
                    <select value={current.fontFamily} onChange={e=>update("fontFamily",e.target.value)} className="input-arsenal w-full text-sm">
                      {["var(--font-display)","var(--font-heading)","var(--font-body)","var(--font-mono)"].map(f=><option key={f} value={f}>{f.replace("var(--font-","").replace(")","")}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase mb-1" style={{color:"rgba(255,255,255,0.4)",fontFamily:"var(--font-heading)"}}>Font Weight</label>
                    <select value={current.fontWeight} onChange={e=>update("fontWeight",e.target.value)} className="input-arsenal w-full text-sm">
                      {["400","500","600","700","800","900"].map(w=><option key={w}>{w}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase mb-1" style={{color:"rgba(255,255,255,0.4)",fontFamily:"var(--font-heading)"}}>Text Transform</label>
                    <select value={current.textTransform} onChange={e=>update("textTransform",e.target.value)} className="input-arsenal w-full text-sm">
                      {["uppercase","lowercase","capitalize","none"].map(t=><option key={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                {/* Letter spacing */}
                <div>
                  <label className="block text-xs font-bold uppercase mb-1" style={{color:"rgba(255,255,255,0.4)",fontFamily:"var(--font-heading)"}}>Letter Spacing</label>
                  <select value={current.letterSpacing} onChange={e=>update("letterSpacing",e.target.value)} className="input-arsenal w-full text-sm">
                    {["0","0.025em","0.05em","0.075em","0.1em","0.15em","0.2em"].map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>

                {/* Clip presets */}
                <div>
                  <label className="block text-xs font-bold uppercase mb-2" style={{color:"rgba(255,255,255,0.4)",fontFamily:"var(--font-heading)"}}>Shape / Clip Preset</label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {CLIP_PRESETS.map(c=>(
                      <button key={c.id} onClick={()=>update("clipPreset",c.id)}
                        className="p-2 text-center rounded-sm transition-all"
                        style={{
                          background:current.clipPreset===c.id?"rgba(239,1,7,0.1)":"rgba(255,255,255,0.03)",
                          border:`1px solid ${current.clipPreset===c.id?"rgba(239,1,7,0.5)":"rgba(255,255,255,0.06)"}`,
                        }}>
                        <div className="w-full h-7 flex items-center justify-center mb-1">
                          <div className="w-16 h-5 text-[10px] flex items-center justify-center font-bold"
                            style={{
                              background:"#EF0107",color:"#fff",
                              clipPath:c.clip!=="none"?c.clip:undefined,
                              borderRadius:c.id==="pill"?"999px":c.id==="none"?"3px":undefined,
                            }}>BTN</div>
                        </div>
                        <p className="text-[9px] font-bold" style={{color:current.clipPreset===c.id?"var(--color-red)":"rgba(255,255,255,0.4)",fontFamily:"var(--font-heading)"}}>{c.label}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </FormInsertBox>
            </div>
          )}
        </div>
      )}

      {tab === "sections" && (
        <div className="space-y-3">
          <p className="text-xs" style={{color:"rgba(255,255,255,0.4)"}}>
            Override which button style is used on specific frontend sections. Leave on <em>Global Default</em> to follow the active button.
          </p>
          <div className="grid md:grid-cols-2 gap-3">
            {SECTIONS.map(sec=>(
              <div key={sec.id} className="p-4 rounded-sm flex items-center gap-4" style={{background:"#16213E",border:"1px solid rgba(255,255,255,0.06)"}}>
                <div className="flex-1">
                  <p className="text-sm font-bold text-white" style={{fontFamily:"var(--font-heading)"}}>{sec.label}</p>
                  <p className="text-[10px] mt-0.5" style={{color:"rgba(255,255,255,0.3)"}}>Section: <code className="text-[10px]">{sec.id}</code></p>
                </div>
                <select
                  value={sectionButtonIds[sec.id] || ""}
                  onChange={e=>setSectionButtonIds(prev=>({...prev,[sec.id]:e.target.value}))}
                  className="input-arsenal text-xs"
                  style={{minWidth:"160px"}}>
                  <option value="">— Global Default —</option>
                  {buttons.map(b=>(
                    <option key={b.id} value={b.id}>{b.label}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <button onClick={save} disabled={saving} className="btn-arsenal flex items-center gap-2 px-5 py-2 text-sm">
            {saving?<><i className="fa-solid fa-spinner fa-spin"/>Saving…</>:<><i className="fa-solid fa-save"/>Save Section Assignments</>}
          </button>
        </div>
      )}
    </div>
  );
}
