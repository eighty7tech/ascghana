"use client";
import { useState, useEffect, useRef } from "react";
import { Save, Plus, Trash2, RefreshCw, Upload } from "lucide-react";
import toast from "react-hot-toast";
import { useApp } from "@/context/AppContext";

const KNOWN_PLATFORMS = [
  { name:"Facebook",   icon:"fa-brands fa-facebook-f",  default:"#1877F2" },
  { name:"Instagram",  icon:"fa-brands fa-instagram",   default:"#E1306C" },
  { name:"Twitter/X",  icon:"fa-brands fa-x-twitter",   default:"#1DA1F2" },
  { name:"YouTube",    icon:"fa-brands fa-youtube",     default:"#FF0000" },
  { name:"WhatsApp",   icon:"fa-brands fa-whatsapp",    default:"#25D366" },
  { name:"TikTok",     icon:"fa-brands fa-tiktok",      default:"#69C9D0" },
];
const POSITION_OPTIONS = [
  { value:"first", label:"First", desc:"Social strip above main footer" },
  { value:"middle", label:"Middle", desc:"Social strip between columns and copyright" },
  { value:"last", label:"Last (default)", desc:"Social strip at bottom" },
];

export default function AdminFooterPage() {
  const { settings, updateSettings } = useApp();
  const [tagline, setTagline] = useState(settings.footerTagline);
  const [motto, setMotto] = useState(settings.footerMotto);
  const [copyright, setCopyright] = useState(settings.footerCopyright);
  const [socials, setSocials] = useState(settings.socialLinks.map(s=>({...s})));
  const [columns, setColumns] = useState(settings.footerColumns.map(c=>({...c,links:[...c.links]})));
  const [socialPosition, setSocialPosition] = useState<"first"|"middle"|"last">((settings.socialPosition as any)||"last");
  const [newsItems, setNewsItems] = useState((settings.newsTickerItems||[]).join("\n"));
  const [footerBgColor, setFooterBgColor] = useState((settings as any).footerBgColor||"#0A0812");
  const [footerHeadingFont, setFooterHeadingFont] = useState((settings as any).footerHeadingFont||"Chapman");
  const [footerHeadingSize, setFooterHeadingSize] = useState((settings as any).footerHeadingSize||"14");
  const [footerHeadingColor, setFooterHeadingColor] = useState((settings as any).footerHeadingColor||"#FFFFFF");
  const [footerBodyFont, setFooterBodyFont] = useState((settings as any).footerBodyFont||"Barlow");
  const [footerBodySize, setFooterBodySize] = useState((settings as any).footerBodySize||"13");
  const [footerBodyColor, setFooterBodyColor] = useState((settings as any).footerBodyColor||"rgba(255,255,255,0.55)");
  const [saving, setSaving] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r=>setTimeout(r,600));
    updateSettings({
      footerTagline:tagline, footerMotto:motto, footerCopyright:copyright,
      socialLinks:socials, footerColumns:columns, socialPosition:socialPosition as any,
      newsTickerItems: newsItems.split("\n").map(s=>s.trim()).filter(Boolean),
      footerBgColor, footerHeadingFont, footerHeadingSize, footerHeadingColor,
      footerBodyFont, footerBodySize, footerBodyColor,
    } as any);
    // Apply CSS vars immediately
    document.documentElement.style.setProperty("--footer-bg", footerBgColor);
    document.documentElement.style.setProperty("--footer-heading-color", footerHeadingColor);
    document.documentElement.style.setProperty("--footer-body-color", footerBodyColor);
    setSaving(false);
    toast.success("Footer saved — changes live on frontend!");
  };

  const updSocial = (i:number, k:string, v:string) => setSocials(p=>p.map((s,j)=>j===i?{...s,[k]:v}:s));
  const addSocial = (platform:typeof KNOWN_PLATFORMS[0]) => {
    if (socials.find(s=>s.platform===platform.name)) return;
    setSocials(p=>[...p,{platform:platform.name,url:"",icon:platform.icon,color:platform.default,iconBgColor:""}]);
  };
  const removeSocial = (i:number) => setSocials(p=>p.filter((_,j)=>j!==i));
  const updateColTitle = (i:number, v:string) => setColumns(p=>p.map((c,j)=>j===i?{...c,title:v}:c));
  const updateLink = (ci:number, li:number, k:string, v:string) => setColumns(p=>p.map((c,j)=>j===ci?{...c,links:c.links.map((l,k2)=>k2===li?{...l,[k]:v}:l)}:c));
  const addLink = (ci:number) => setColumns(p=>p.map((c,j)=>j===ci?{...c,links:[...c.links,{label:"New Link",href:"/"}]}:c));
  const removeLink = (ci:number, li:number) => setColumns(p=>p.map((c,j)=>j===ci?{...c,links:c.links.filter((_,k)=>k!==li)}:c));

  const inp = "w-full text-sm";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white" style={{fontFamily:'var(--font-display)'}}>FOOTER SETTINGS</h1>
          <p className="text-xs mt-0.5" style={{color:'rgba(255,255,255,0.4)',fontFamily:'var(--font-body)'}}>All changes reflect instantly on the frontend footer</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-arsenal flex items-center gap-2 px-5 py-2.5 text-sm">
          {saving?<RefreshCw size={14} className="animate-spin"/>:<Save size={14}/>}Save & Apply
        </button>
      </div>

      {/* Brand text */}
      <div className="admin-card space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-white" style={{fontFamily:'var(--font-heading)'}}>Brand & Legal</h2>
        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{color:'rgba(255,255,255,0.4)',fontFamily:'var(--font-heading)'}}>
              <i className="fa-solid fa-align-left text-[10px] mr-1" style={{color:'var(--color-red)'}}/>Footer Tagline
            </label>
            <input value={tagline} onChange={e=>setTagline(e.target.value)} className={inp}/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{color:'rgba(255,255,255,0.4)',fontFamily:'var(--font-heading)'}}>Motto (gold italic)</label>
              <input value={motto} onChange={e=>setMotto(e.target.value)} className={inp}/>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{color:'rgba(255,255,255,0.4)',fontFamily:'var(--font-heading)'}}>Copyright text</label>
              <input value={copyright} onChange={e=>setCopyright(e.target.value)} className={inp}/>
            </div>
          </div>
        </div>
      </div>

      {/* News ticker */}
      <div className="admin-card space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-white" style={{fontFamily:'var(--font-heading)'}}>News Ticker Items</h2>
        <p className="text-xs" style={{color:'rgba(255,255,255,0.4)'}}>One item per line — shown scrolling across the top of the site</p>
        <textarea value={newsItems} onChange={e=>setNewsItems(e.target.value)} rows={5}
          className="w-full text-sm resize-none"
          placeholder={"🔴 Arsenal vs Chelsea – Watch Party Saturday 5:30pm\n🏆 Annual Awards Night – Nominations open\n📢 Renewal window opens April 1"}/>
      </div>

      {/* Social position */}
      <div className="admin-card space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-white" style={{fontFamily:'var(--font-heading)'}}>Social Links Strip — Position</h2>
        <div className="flex gap-3 flex-wrap">
          {POSITION_OPTIONS.map(opt=>(
            <button key={opt.value} onClick={()=>setSocialPosition(opt.value as "first"|"middle"|"last")}
              className="flex-1 p-3 rounded-sm text-left transition-all"
              style={{background:socialPosition===opt.value?"rgba(239,1,7,0.1)":"rgba(255,255,255,0.03)",border:`1px solid ${socialPosition===opt.value?"var(--color-red)":"rgba(255,255,255,0.06)"}`}}>
              <p className="text-xs font-bold text-white" style={{fontFamily:'var(--font-heading)'}}>{opt.label}</p>
              <p className="text-[10px] mt-0.5" style={{color:'rgba(255,255,255,0.4)'}}>{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Social links */}
      <div className="admin-card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white" style={{fontFamily:'var(--font-heading)'}}>Social Media Links (animated square icons)</h2>
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          {KNOWN_PLATFORMS.filter(p=>!socials.find(s=>s.platform===p.name)).map(p=>(
            <button key={p.name} onClick={()=>addSocial(p)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-sm transition-all"
              style={{background:`${p.default}15`,color:p.default,border:`1px solid ${p.default}30`,fontFamily:'var(--font-heading)'}}>
              <i className={`${p.icon} text-xs`}/>{p.name}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          {socials.map((s,i)=>(
            <div key={i} className="flex items-center gap-3 p-3 rounded-sm" style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)'}}>
              <div className="w-8 h-8 rounded-sm flex items-center justify-center flex-shrink-0" style={{background:`${s.color}20`,color:s.color}}>
                <i className={`${s.icon} text-sm`}/>
              </div>
              <span className="text-xs font-bold w-24 flex-shrink-0" style={{color:s.color,fontFamily:'var(--font-heading)'}}>{s.platform}</span>
              <input value={s.url} onChange={e=>updSocial(i,"url",e.target.value)} className="flex-1 text-sm" placeholder={`https://...`}/>
              <input type="color" value={s.color} onChange={e=>updSocial(i,"color",e.target.value)} className="w-8 h-8 rounded border border-white/10 cursor-pointer p-0.5" style={{background:'transparent'}}/>
              <button onClick={()=>removeSocial(i)} className="text-white/20 hover:text-red-400 transition-colors p-1"><Trash2 size={13}/></button>
            </div>
          ))}
        </div>
      </div>

      {/* Footer columns */}
      <div className="admin-card space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-white" style={{fontFamily:'var(--font-heading)'}}>Footer Navigation Columns</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {columns.map((col,ci)=>(
            <div key={col.id} className="space-y-2">
              <input value={col.title} onChange={e=>updateColTitle(ci,e.target.value)} className="w-full text-xs font-bold" placeholder="Column Title"/>
              {col.links.map((link,li)=>(
                <div key={li} className="flex gap-1.5">
                  <input value={link.label} onChange={e=>updateLink(ci,li,"label",e.target.value)} className="flex-1 text-xs" placeholder="Label"/>
                  <input value={link.href} onChange={e=>updateLink(ci,li,"href",e.target.value)} className="w-20 text-xs" placeholder="/path"/>
                  <button onClick={()=>removeLink(ci,li)} className="text-white/20 hover:text-red-400 transition-colors flex-shrink-0"><Trash2 size={11}/></button>
                </div>
              ))}
              <button onClick={()=>addLink(ci)} className="text-xs text-white/30 hover:text-white/60 transition-colors flex items-center gap-1">
                <Plus size={11}/>Add link
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Footer typography */}
      <div className="admin-card space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-white" style={{fontFamily:'var(--font-heading)'}}>Footer Typography & Background</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{color:'rgba(255,255,255,0.4)',fontFamily:'var(--font-heading)'}}>Footer Background Color</label>
            <div className="flex gap-2">
              <input type="color" value={footerBgColor} onChange={e=>setFooterBgColor(e.target.value)} className="w-10 h-9 rounded border border-white/10 p-1 cursor-pointer" style={{background:'transparent'}}/>
              <input value={footerBgColor} onChange={e=>setFooterBgColor(e.target.value)} className="flex-1 text-sm"/>
            </div>
          </div>
          {[
            ["Heading Font",footerHeadingFont,setFooterHeadingFont],
            ["Body Font",footerBodyFont,setFooterBodyFont],
          ].map(([label,val,setter]: any[])=>(
            <div key={label}>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{color:'rgba(255,255,255,0.4)',fontFamily:'var(--font-heading)'}}>{label}</label>
              <select value={val} onChange={e=>setter(e.target.value)} className="w-full text-sm">
                {["Chapman","Northbank","Barlow","Oswald","Inter","Montserrat","Raleway","Poppins","Open Sans"].map(f=><option key={f}>{f}</option>)}
              </select>
            </div>
          ))}
          {[
            ["Heading Size (px)",footerHeadingSize,setFooterHeadingSize],
            ["Body Size (px)",footerBodySize,setFooterBodySize],
          ].map(([label,val,setter]: any[])=>(
            <div key={label}>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{color:'rgba(255,255,255,0.4)',fontFamily:'var(--font-heading)'}}>{label}</label>
              <select value={val} onChange={e=>setter(e.target.value)} className="w-full text-sm">
                {["11","12","13","14","15","16","17","18","20"].map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
          ))}
          {[
            ["Heading Color",footerHeadingColor,setFooterHeadingColor],
            ["Body Text Color",footerBodyColor,setFooterBodyColor],
          ].map(([label,val,setter]: any[])=>(
            <div key={label}>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{color:'rgba(255,255,255,0.4)',fontFamily:'var(--font-heading)'}}>{label}</label>
              <div className="flex gap-2">
                <input type="color" value={val.startsWith("#")?val:"#ffffff"} onChange={e=>setter(e.target.value)} className="w-10 h-9 rounded border border-white/10 p-1 cursor-pointer" style={{background:'transparent'}}/>
                <input value={val} onChange={e=>setter(e.target.value)} className="flex-1 text-sm"/>
              </div>
            </div>
          ))}
        </div>
        {/* Preview */}
        <div className="p-4 rounded-sm" style={{background:footerBgColor,border:'1px solid rgba(255,255,255,0.1)'}}>
          <p className="font-bold mb-1" style={{fontFamily:footerHeadingFont,fontSize:`${footerHeadingSize}px`,color:footerHeadingColor}}>Club</p>
          <p style={{fontFamily:footerBodyFont,fontSize:`${footerBodySize}px`,color:footerBodyColor}}>About Us · Exco · History · Contact</p>
        </div>
      </div>

    </div>
  );
}
