"use client";
import { useState } from "react";
import { Save, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { useApp } from "@/context/AppContext";

const FONT_OPTIONS = ["Northbank","Chapman","Oswald","Raleway","Inter","Montserrat","Poppins","Open Sans","Lato","Playfair Display","Bebas Neue","Barlow Condensed","Barlow","DM Sans","Nunito","Roboto Condensed","Anton","Georgia","Roboto","Source Sans Pro","Ubuntu"];
const FONT_SIZES   = ["10","11","12","13","14","15","16","17","18","20","22","24","28","32","36","40","48","56","64"];
const FONT_WEIGHTS = ["100","200","300","400","500","600","700","800","900"];
const WEIGHT_LABELS: Record<string,string> = {"100":"Thin","200":"Extra-Light","300":"Light","400":"Regular","500":"Medium","600":"Semi-Bold","700":"Bold","800":"Extra-Bold","900":"Black"};
const COLOR_PRESETS = ["#FFFFFF","#F4F4F0","#C6A84B","#EF0107","#A8A9AD","#1A1A2E","#0F0D13","#22C55E","#3B82F6","#F59E0B","#EF4444"];
const LETTER_SPACINGS = ["normal","0.02em","0.04em","0.06em","0.08em","0.1em","0.12em","0.15em","0.2em"];

export default function FontsSettingsPage() {
  const { settings, updateSettings } = useApp();
  const s = settings as any;
  const [saving, setSaving] = useState(false);

  // — Display (Hero, H1) —
  const [displayFont,   setDisplayFont]   = useState(settings.displayFont   || "Northbank");
  const [displaySize,   setDisplaySize]   = useState(s.displayFontSize      || "48");
  const [displayWeight, setDisplayWeight] = useState(s.displayFontWeight    || "900");
  const [displayColor,  setDisplayColor]  = useState(s.displayFontColor     || "#FFFFFF");
  const [displaySpacing,setDisplaySpacing]= useState(s.displayLetterSpacing || "0.06em");
  const [displayUpper,  setDisplayUpper]  = useState(s.displayUppercase     !== false);

  // — Heading (H2-H4, section titles) —
  const [headingFont,   setHeadingFont]   = useState(settings.headingFont   || "Chapman");
  const [headingSize,   setHeadingSize]   = useState(s.headingFontSize      || "24");
  const [headingWeight, setHeadingWeight] = useState(s.headingFontWeight    || "700");
  const [headingColor,  setHeadingColor]  = useState(s.headingFontColor     || "#FFFFFF");
  const [headingSpacing,setHeadingSpacing]= useState(s.headingLetterSpacing || "0.04em");
  const [headingUpper,  setHeadingUpper]  = useState(s.headingUppercase     !== false);

  // — Body —
  const [bodyFont,   setBodyFont]   = useState(settings.bodyFont   || "Barlow");
  const [bodySize,   setBodySize]   = useState(String(settings.baseFontSize || 15));
  const [bodyWeight, setBodyWeight] = useState(s.bodyFontWeight    || "400");
  const [bodyColor,  setBodyColor]  = useState(s.bodyFontColor     || "rgba(255,255,255,0.75)");
  const [lineHeight, setLineHeight] = useState(s.bodyLineHeight    || "1.7");

  // — Navigation —
  const [navFont,    setNavFont]    = useState(s.navFont           || "Chapman");
  const [navSize,    setNavSize]    = useState(s.navFontSize        || "13");
  const [navWeight,  setNavWeight]  = useState(s.navFontWeight      || "700");
  const [navColor,   setNavColor]   = useState(s.navFontColor       || "#FFFFFF");
  const [navSpacing, setNavSpacing] = useState(s.navLetterSpacing   || "0.08em");
  const [navUpper,   setNavUpper]   = useState(s.navUppercase       !== false);

  // — Button —
  const [btnFont,    setBtnFont]    = useState(s.btnFont            || "Chapman");
  const [btnSize,    setBtnSize]    = useState(s.btnFontSize         || "13");
  const [btnWeight,  setBtnWeight]  = useState(s.btnFontWeight       || "700");
  const [btnSpacing, setBtnSpacing] = useState(s.btnLetterSpacing    || "0.1em");
  const [btnUpper,   setBtnUpper]   = useState(s.btnUppercase        !== false);

  // — Label / Caption —
  const [labelFont,   setLabelFont]   = useState(s.labelFont       || "Barlow");
  const [labelSize,   setLabelSize]   = useState(s.labelFontSize    || "11");
  const [labelWeight, setLabelWeight] = useState(s.labelFontWeight  || "500");

  // — Global bold weight override —
  const [boldWeight,  setBoldWeight]  = useState(s.boldFontWeight   || "700");

  const save = async () => {
    setSaving(true);
    await new Promise(r=>setTimeout(r,600));
    const updates: any = {
      displayFont, displayFontSize:displaySize, displayFontWeight:displayWeight,
      displayFontColor:displayColor, displayLetterSpacing:displaySpacing, displayUppercase:displayUpper,
      headingFont, headingFontSize:headingSize, headingFontWeight:headingWeight,
      headingFontColor:headingColor, headingLetterSpacing:headingSpacing, headingUppercase:headingUpper,
      bodyFont, baseFontSize:parseInt(bodySize), bodyFontWeight:bodyWeight,
      bodyFontColor:bodyColor, bodyLineHeight:lineHeight,
      navFont, navFontSize:navSize, navFontWeight:navWeight,
      navFontColor:navColor, navLetterSpacing:navSpacing, navUppercase:navUpper,
      btnFont, btnFontSize:btnSize, btnFontWeight:btnWeight,
      btnLetterSpacing:btnSpacing, btnUppercase:btnUpper,
      labelFont, labelFontSize:labelSize, labelFontWeight:labelWeight,
      boldFontWeight:boldWeight,
    };
    updateSettings(updates);

    // Apply live CSS vars immediately
    const root = document.documentElement;
    root.style.setProperty("--font-display",   `"${displayFont}", sans-serif`);
    root.style.setProperty("--font-heading",   `"${headingFont}", sans-serif`);
    root.style.setProperty("--font-body",      `"${bodyFont}", sans-serif`);
    root.style.setProperty("--font-nav",       `"${navFont}", sans-serif`);
    root.style.setProperty("--font-size-body", `${bodySize}px`);
    root.style.setProperty("--font-weight-heading", headingWeight);
    root.style.setProperty("--font-weight-body",    bodyWeight);
    root.style.setProperty("--font-weight-nav",     navWeight);
    root.style.setProperty("--font-weight-bold",    boldWeight);

    setSaving(false);
    toast.success("Typography saved and applied!");
  };

  const SectionBox = ({ title, children }: { title:string; children:React.ReactNode }) => (
    <div className="rounded-sm overflow-hidden" style={{ border:"1px solid rgba(255,255,255,0.08)" }}>
      <div className="px-5 py-3 flex items-center gap-2" style={{ background:"rgba(239,1,7,0.08)", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
        <i className="fa-solid fa-text-height text-sm" style={{ color:"var(--color-red)" }} />
        <h2 className="text-sm font-black uppercase tracking-wider text-white" style={{ fontFamily:"var(--font-heading)" }}>{title}</h2>
      </div>
      <div className="p-5 space-y-4" style={{ background:"rgba(255,255,255,0.02)" }}>{children}</div>
    </div>
  );

  const Row3 = ({ children }: { children:React.ReactNode }) => (
    <div className="grid sm:grid-cols-3 gap-3">{children}</div>
  );

  const FontSelect = ({ label, value, onChange }: { label:string; value:string; onChange:(v:string)=>void }) => (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color:"rgba(255,255,255,0.4)", fontFamily:"var(--font-heading)" }}>{label}</label>
      <select value={value} onChange={e=>onChange(e.target.value)} className="input-arsenal w-full text-sm">
        {FONT_OPTIONS.map(o=><option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  const SizePicker = ({ label, value, onChange }: { label:string; value:string; onChange:(v:string)=>void }) => (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color:"rgba(255,255,255,0.4)", fontFamily:"var(--font-heading)" }}>{label}</label>
      <select value={value} onChange={e=>onChange(e.target.value)} className="input-arsenal w-full text-sm">
        {FONT_SIZES.map(s=><option key={s} value={s}>{s}px</option>)}
      </select>
    </div>
  );

  const WeightPicker = ({ label, value, onChange }: { label:string; value:string; onChange:(v:string)=>void }) => (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color:"rgba(255,255,255,0.4)", fontFamily:"var(--font-heading)" }}>{label}</label>
      <select value={value} onChange={e=>onChange(e.target.value)} className="input-arsenal w-full text-sm">
        {FONT_WEIGHTS.map(w=><option key={w} value={w}>{w} — {WEIGHT_LABELS[w]}</option>)}
      </select>
    </div>
  );

  const ColorRow = ({ label, value, onChange }: { label:string; value:string; onChange:(v:string)=>void }) => (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color:"rgba(255,255,255,0.4)", fontFamily:"var(--font-heading)" }}>{label}</label>
      <div className="flex gap-1.5 items-center flex-wrap">
        {COLOR_PRESETS.map(c=>(
          <button key={c} type="button" onClick={()=>onChange(c)} title={c}
            className="w-6 h-6 rounded-sm transition-transform hover:scale-110"
            style={{ background:c, outline:value===c?"2px solid white":"1px solid rgba(255,255,255,0.15)", outlineOffset:1 }} />
        ))}
        <input type="color" value={value.startsWith("#")?value:"#FFFFFF"} onChange={e=>onChange(e.target.value)}
          title="Custom" className="w-6 h-6 rounded-sm cursor-pointer border-0 bg-transparent" />
        <input type="text" value={value} onChange={e=>onChange(e.target.value)}
          className="flex-1 min-w-[90px] px-2 py-1 text-xs rounded-sm text-white bg-white/5 border border-white/10 outline-none focus:border-red-500 font-mono" />
      </div>
    </div>
  );

  const SpacingSelect = ({ label, value, onChange }: { label:string; value:string; onChange:(v:string)=>void }) => (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color:"rgba(255,255,255,0.4)", fontFamily:"var(--font-heading)" }}>{label}</label>
      <select value={value} onChange={e=>onChange(e.target.value)} className="input-arsenal w-full text-sm">
        {LETTER_SPACINGS.map(s=><option key={s} value={s}>{s}</option>)}
      </select>
    </div>
  );

  const ToggleRow = ({ label, value, onChange }: { label:string; value:boolean; onChange:()=>void }) => (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs" style={{ color:"rgba(255,255,255,0.5)", fontFamily:"var(--font-body)" }}>{label}</span>
      <button onClick={onChange} className="relative w-10 h-5 rounded-full transition-colors"
        style={{ background:value?"var(--color-red)":"rgba(255,255,255,0.1)" }}>
        <span className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all"
          style={{ left:value?"22px":"2px" }} />
      </button>
    </div>
  );

  // Live preview
  const Preview = () => (
    <div className="p-5 rounded-sm space-y-3" style={{ background:"rgba(0,0,0,0.3)", border:"1px solid rgba(255,255,255,0.06)" }}>
      <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color:"rgba(255,255,255,0.3)", fontFamily:"var(--font-heading)" }}>Live Preview</p>
      <p style={{ fontFamily:`"${displayFont}"`, fontSize:`${displaySize}px`, fontWeight:parseInt(displayWeight), color:displayColor, letterSpacing:displaySpacing, textTransform:displayUpper?"uppercase":"none", lineHeight:1.1 }}>ARSENAL SC GHANA</p>
      <p style={{ fontFamily:`"${headingFont}"`, fontSize:`${headingSize}px`, fontWeight:parseInt(headingWeight), color:headingColor, letterSpacing:headingSpacing, textTransform:headingUpper?"uppercase":"none" }}>Upcoming Matches & Events</p>
      <p style={{ fontFamily:`"${bodyFont}"`, fontSize:`${bodySize}px`, fontWeight:parseInt(bodyWeight), color:bodyColor, lineHeight:parseFloat(lineHeight) }}>
        Arsenal Supporters Club Ghana brings together Gooners from across Ghana. Victoria Concordia Crescit — Victory Through Harmony.
      </p>
      <div className="flex gap-2 flex-wrap">
        <span style={{ fontFamily:`"${navFont}"`, fontSize:`${navSize}px`, fontWeight:parseInt(navWeight), color:navColor, letterSpacing:navSpacing, textTransform:navUpper?"uppercase":"none" }}>Events</span>
        <span style={{ fontFamily:`"${navFont}"`, fontSize:`${navSize}px`, fontWeight:parseInt(navWeight), color:navColor, letterSpacing:navSpacing, textTransform:navUpper?"uppercase":"none" }}>Members</span>
        <span style={{ fontFamily:`"${navFont}"`, fontSize:`${navSize}px`, fontWeight:parseInt(navWeight), color:navColor, letterSpacing:navSpacing, textTransform:navUpper?"uppercase":"none" }}>Blog</span>
        <span style={{ fontFamily:`"${navFont}"`, fontSize:`${navSize}px`, fontWeight:parseInt(navWeight), color:navColor, letterSpacing:navSpacing, textTransform:navUpper?"uppercase":"none" }}>Shop</span>
      </div>
      <button style={{ fontFamily:`"${btnFont}"`, fontSize:`${btnSize}px`, fontWeight:parseInt(btnWeight), letterSpacing:btnSpacing, textTransform:btnUpper?"uppercase":"none", background:"var(--color-red)", color:"white", padding:"8px 20px", borderRadius:"2px", border:"none" }}>
        Join Now
      </button>
    </div>
  );

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white" style={{ fontFamily:"var(--font-display)" }}>TYPOGRAPHY</h1>
          <p className="text-xs mt-0.5" style={{ color:"rgba(255,255,255,0.4)" }}>Full control over every text style — applied site-wide on save</p>
        </div>
        <button onClick={save} disabled={saving} className="btn-arsenal flex items-center gap-2 px-5 py-2.5 text-sm">
          {saving?<RefreshCw size={14} className="animate-spin"/>:<Save size={14}/>}Save All
        </button>
      </div>

      {/* Arsenal fonts note */}
      <div className="p-4 rounded-sm flex items-start gap-3" style={{ background:"rgba(198,168,75,0.08)", border:"1px solid rgba(198,168,75,0.2)" }}>
        <i className="fa-solid fa-shield-check mt-0.5" style={{ color:"var(--color-gold)" }}/>
        <div>
          <p className="text-sm font-bold" style={{ color:"var(--color-gold)", fontFamily:"var(--font-heading)" }}>Self-hosted Arsenal Fonts Available</p>
          <p className="text-xs mt-1" style={{ color:"rgba(255,255,255,0.5)" }}>
            <strong>Northbank</strong> (display) and <strong>Chapman</strong> (heading) are authentic Arsenal fonts in <code className="px-1 rounded" style={{ background:"rgba(255,255,255,0.08)" }}>public/fonts/</code>. All other options load from Google Fonts.
          </p>
        </div>
      </div>

      {/* Global Bold Weight */}
      <div className="p-4 rounded-sm flex items-center gap-4" style={{ background:"rgba(239,1,7,0.06)", border:"1px solid rgba(239,1,7,0.15)" }}>
        <i className="fa-solid fa-bold text-xl" style={{ color:"var(--color-red)" }}/>
        <div className="flex-1">
          <p className="text-sm font-bold text-white" style={{ fontFamily:"var(--font-heading)" }}>Global Bold Weight Override</p>
          <p className="text-xs" style={{ color:"rgba(255,255,255,0.4)" }}>Controls all font-bold utility class weight. Recommended: 500–700 for clean look (default: 500).</p>
        </div>
        <select value={boldWeight} onChange={e=>setBoldWeight(e.target.value)} className="input-arsenal text-sm" style={{ width:180 }}>
          {FONT_WEIGHTS.map(w=><option key={w} value={w}>{w} — {WEIGHT_LABELS[w]}</option>)}
        </select>
      </div>

      {/* Display */}
      <SectionBox title="Display Font (Hero, Page Titles, H1)">
        <Row3>
          <FontSelect label="Font Family" value={displayFont} onChange={setDisplayFont} />
          <SizePicker label="Size" value={displaySize} onChange={setDisplaySize} />
          <WeightPicker label="Weight" value={displayWeight} onChange={setDisplayWeight} />
        </Row3>
        <ColorRow label="Color" value={displayColor} onChange={setDisplayColor} />
        <Row3>
          <SpacingSelect label="Letter Spacing" value={displaySpacing} onChange={setDisplaySpacing} />
          <div className="sm:col-span-2">
            <ToggleRow label="All Caps (UPPERCASE)" value={displayUpper} onChange={()=>setDisplayUpper(v=>!v)} />
          </div>
        </Row3>
      </SectionBox>

      {/* Heading */}
      <SectionBox title="Heading Font (H2, H3, H4, Section Titles)">
        <Row3>
          <FontSelect label="Font Family" value={headingFont} onChange={setHeadingFont} />
          <SizePicker label="Size" value={headingSize} onChange={setHeadingSize} />
          <WeightPicker label="Weight" value={headingWeight} onChange={setHeadingWeight} />
        </Row3>
        <ColorRow label="Color" value={headingColor} onChange={setHeadingColor} />
        <Row3>
          <SpacingSelect label="Letter Spacing" value={headingSpacing} onChange={setHeadingSpacing} />
          <div className="sm:col-span-2">
            <ToggleRow label="All Caps (UPPERCASE)" value={headingUpper} onChange={()=>setHeadingUpper(v=>!v)} />
          </div>
        </Row3>
      </SectionBox>

      {/* Body */}
      <SectionBox title="Body Font (Paragraphs, Descriptions, Captions)">
        <Row3>
          <FontSelect label="Font Family" value={bodyFont} onChange={setBodyFont} />
          <SizePicker label="Base Size" value={bodySize} onChange={setBodySize} />
          <WeightPicker label="Weight" value={bodyWeight} onChange={setBodyWeight} />
        </Row3>
        <Row3>
          <ColorRow label="Color" value={bodyColor} onChange={setBodyColor} />
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color:"rgba(255,255,255,0.4)", fontFamily:"var(--font-heading)" }}>Line Height</label>
            <select value={lineHeight} onChange={e=>setLineHeight(e.target.value)} className="input-arsenal w-full text-sm">
              {["1.2","1.4","1.5","1.6","1.7","1.8","2.0"].map(v=><option key={v} value={v}>{v}</option>)}
            </select>
          </div>
        </Row3>
      </SectionBox>

      {/* Navigation */}
      <SectionBox title="Navigation Font (Nav Links, Menu Items, Top Bar)">
        <Row3>
          <FontSelect label="Font Family" value={navFont} onChange={setNavFont} />
          <SizePicker label="Size" value={navSize} onChange={setNavSize} />
          <WeightPicker label="Weight" value={navWeight} onChange={setNavWeight} />
        </Row3>
        <ColorRow label="Nav Text Color" value={navColor} onChange={setNavColor} />
        <Row3>
          <SpacingSelect label="Letter Spacing" value={navSpacing} onChange={setNavSpacing} />
          <div className="sm:col-span-2">
            <ToggleRow label="All Caps" value={navUpper} onChange={()=>setNavUpper(v=>!v)} />
          </div>
        </Row3>
      </SectionBox>

      {/* Buttons */}
      <SectionBox title="Button Font (CTA Buttons, Action Buttons)">
        <Row3>
          <FontSelect label="Font Family" value={btnFont} onChange={setBtnFont} />
          <SizePicker label="Size" value={btnSize} onChange={setBtnSize} />
          <WeightPicker label="Weight" value={btnWeight} onChange={setBtnWeight} />
        </Row3>
        <Row3>
          <SpacingSelect label="Letter Spacing" value={btnSpacing} onChange={setBtnSpacing} />
          <div className="sm:col-span-2">
            <ToggleRow label="All Caps" value={btnUpper} onChange={()=>setBtnUpper(v=>!v)} />
          </div>
        </Row3>
      </SectionBox>

      {/* Labels */}
      <SectionBox title="Label / Caption Font (Form Labels, Badges, Small Text)">
        <Row3>
          <FontSelect label="Font Family" value={labelFont} onChange={setLabelFont} />
          <SizePicker label="Size" value={labelSize} onChange={setLabelSize} />
          <WeightPicker label="Weight" value={labelWeight} onChange={setLabelWeight} />
        </Row3>
      </SectionBox>

      {/* Live Preview */}
      <Preview />
    </div>
  );
}
