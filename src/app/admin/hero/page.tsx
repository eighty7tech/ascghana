"use client";
import { useState, useRef } from "react";
import { Save, Plus, Trash2, RefreshCw, ChevronUp, ChevronDown, Image } from "lucide-react";
import toast from "react-hot-toast";
import { useApp } from "@/context/AppContext";
import { uploadLocalImage } from "@/lib/clientUploads";
import { RichTextField } from "@/components/ui";

const bgOptions = [
  "from-red-900 via-red-800 to-zinc-900",
  "from-zinc-900 via-red-900 to-red-800",
  "from-red-800 via-zinc-900 to-red-900",
  "from-red-900 via-[#1A0A0A] to-red-950",
  "from-[#1A0A0A] via-red-900 to-[#0F0D13]",
  "from-blue-900 via-red-800 to-zinc-900",
];

export default function AdminHeroPage() {
  const { settings, updateSettings } = useApp();
  const [slides, setSlides] = useState(settings.heroSlides.map(s=>({...s})));
  const [stats, setStats] = useState(settings.heroStats.map(s=>({...s})));
  const [saving, setSaving] = useState(false);

  const imgRefs = useRef<Record<number, HTMLInputElement|null>>({});
  const readImg = async (id: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if(!f) return;
    if(f.size>5*1024*1024){toast.error("Max 5MB");return;}
    try { up(id,"imageUrl", await uploadLocalImage(f, "hero")); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Upload failed"); }
  };
  const up = (id:number, k:string, v:string) => setSlides(p=>p.map(s=>s.id===id?{...s,[k]:v}:s));
  const remove = (id:number) => { if(slides.length<=1){toast.error("At least one slide required");return;} setSlides(p=>p.filter(s=>s.id!==id)); };
  const addSlide = () => setSlides(p=>[...p,{id:Date.now(),title:"NEW SLIDE",subtitle:"Subtitle here",description:"Description here.",cta:"Click Here",ctaLink:"/",bg:bgOptions[0]}]);
  const moveUp = (i:number) => { if(i===0)return; const a=[...slides]; [a[i-1],a[i]]=[a[i],a[i-1]]; setSlides(a); };
  const moveDown = (i:number) => { if(i===slides.length-1)return; const a=[...slides]; [a[i],a[i+1]]=[a[i+1],a[i]]; setSlides(a); };
  const upStat = (i:number, k:string, v:string) => setStats(p=>p.map((s,j)=>j===i?{...s,[k]:v}:s));

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r=>setTimeout(r,600));
    updateSettings({ heroSlides:slides, heroStats:stats });
    setSaving(false);
    toast.success("Hero section saved — frontend updated instantly!");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white" style={{fontFamily:'var(--font-display)'}}>HERO SECTION</h1>
          <p className="text-xs mt-0.5" style={{color:'rgba(255,255,255,0.4)',fontFamily:'var(--font-body)'}}>Edit slides, stats and background images — changes reflect on homepage instantly</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-arsenal flex items-center gap-2 px-5 py-2.5 text-sm">
          {saving?<RefreshCw size={14} className="animate-spin"/>:<Save size={14}/>}Save & Apply
        </button>
      </div>

      {/* Stats bar */}
      <div className="admin-card space-y-4">
        <h2 className="text-sm font-black text-white uppercase tracking-wider" style={{fontFamily:'var(--font-heading)'}}>Stats Bar (shown below hero text)</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.map((s,i)=>(
            <div key={i} className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider" style={{color:'rgba(255,255,255,0.4)',fontFamily:'var(--font-heading)'}}>
                <i className="fa-solid fa-tag text-[10px] mr-1" style={{color:'var(--color-red)'}}/>Label
              </label>
              <input value={s.label} onChange={e=>upStat(i,"label",e.target.value)} className="w-full text-xs" placeholder="Members"/>
              <label className="block text-xs font-bold uppercase tracking-wider" style={{color:'rgba(255,255,255,0.4)',fontFamily:'var(--font-heading)'}}>Value</label>
              <input value={s.value} onChange={e=>upStat(i,"value",e.target.value)} className="w-full text-xs font-bold" placeholder="2,400+"/>
            </div>
          ))}
        </div>
      </div>

      {/* Slides */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-white uppercase tracking-wider" style={{fontFamily:'var(--font-heading)'}}>{slides.length} Slides</h2>
          <button onClick={addSlide} className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-white/10 hover:border-white/30 transition-colors" style={{color:'rgba(255,255,255,0.5)',fontFamily:'var(--font-heading)'}}>
            <Plus size={12}/>Add Slide
          </button>
        </div>
        {slides.map((slide,i)=>(
          <div key={slide.id} className="admin-card space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider" style={{color:'rgba(255,255,255,0.35)',fontFamily:'var(--font-heading)'}}>Slide {i+1}</span>
              <div className="flex gap-1">
                <button onClick={()=>moveUp(i)} disabled={i===0} className="p-1.5 text-white/30 hover:text-white disabled:opacity-20 transition-colors"><ChevronUp size={14}/></button>
                <button onClick={()=>moveDown(i)} disabled={i===slides.length-1} className="p-1.5 text-white/30 hover:text-white disabled:opacity-20 transition-colors"><ChevronDown size={14}/></button>
                <button onClick={()=>remove(slide.id)} className="p-1.5 text-white/30 hover:text-red-400 ml-1 transition-colors"><Trash2 size={13}/></button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{color:'rgba(255,255,255,0.4)',fontFamily:'var(--font-heading)'}}>
                  <i className="fa-solid fa-heading text-[10px] mr-1" style={{color:'var(--color-red)'}}/>Title (displayed large)
                </label>
                <input value={slide.title} onChange={e=>up(slide.id,"title",e.target.value)} className="w-full font-bold"/>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{color:'rgba(255,255,255,0.4)',fontFamily:'var(--font-heading)'}}>
                  <i className="fa-solid fa-text-width text-[10px] mr-1" style={{color:'var(--color-red)'}}/>Subtitle (gold text)
                </label>
                <input value={slide.subtitle} onChange={e=>up(slide.id,"subtitle",e.target.value)} className="w-full"/>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{color:'rgba(255,255,255,0.4)',fontFamily:'var(--font-heading)'}}>
                  <i className="fa-solid fa-align-left text-[10px] mr-1" style={{color:'var(--color-red)'}}/>Description
                </label>
                <RichTextField value={slide.description||""} onChange={v=>up(slide.id,"description",v)} minHeight={100} placeholder="Slide caption…" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{color:'rgba(255,255,255,0.4)',fontFamily:'var(--font-heading)'}}>CTA Button Text</label>
                <input value={slide.cta} onChange={e=>up(slide.id,"cta",e.target.value)} className="w-full"/>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{color:'rgba(255,255,255,0.4)',fontFamily:'var(--font-heading)'}}>CTA Link</label>
                <input value={slide.ctaLink} onChange={e=>up(slide.id,"ctaLink",e.target.value)} className="w-full"/>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{color:'rgba(255,255,255,0.4)',fontFamily:'var(--font-heading)'}}>
                  <i className="fa-solid fa-image text-[10px] mr-1" style={{color:'var(--color-red)'}}/>Background Image (upload or URL)
                </label>
                <input ref={el=>{imgRefs.current[slide.id]=el}} type="file" accept="image/*" className="hidden" onChange={e=>readImg(slide.id,e)} />
                {slide.imageUrl && slide.imageUrl.startsWith('data:') ? (
                  <div className="relative h-24 rounded-sm overflow-hidden mb-2">
                    <img src={slide.imageUrl} alt="Slide bg" className="w-full h-full object-cover"/>
                    <button onClick={()=>up(slide.id,"imageUrl","")} className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs" style={{background:"rgba(239,1,7,0.9)",color:"white"}}>
                      <i className="fa-solid fa-xmark"/>
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input value={slide.imageUrl||""} onChange={e=>up(slide.id,"imageUrl",e.target.value)} className="flex-1" placeholder="https://... paste URL"/>
                    <button onClick={()=>imgRefs.current[slide.id]?.click()} className="px-3 py-1.5 rounded-sm text-xs font-bold flex items-center gap-1.5" style={{background:"rgba(239,1,7,0.15)",border:"1px solid rgba(239,1,7,0.3)",color:"var(--color-red)",fontFamily:"var(--font-heading)"}}>
                      <i className="fa-solid fa-upload text-[10px]"/>Upload
                    </button>
                  </div>
                )}
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{color:'rgba(255,255,255,0.4)',fontFamily:'var(--font-heading)'}}>Background Gradient</label>
                <div className="flex gap-2 flex-wrap">
                  {bgOptions.map(bg=>(
                    <button key={bg} onClick={()=>up(slide.id,"bg",bg)}
                      className={`h-8 w-24 rounded-sm bg-gradient-to-br ${bg} transition-all`}
                      style={{border:slide.bg===bg?"2px solid #EF0107":"2px solid transparent",opacity:slide.bg===bg?1:0.5}}/>
                  ))}
                </div>
              </div>
            </div>
            {/* Preview */}
            <div className={`h-14 rounded-sm bg-gradient-to-br ${slide.bg} flex items-center px-4 gap-3`}>
              {slide.imageUrl && <i className="fa-solid fa-image text-white/30 text-xs"/>}
              <div>
                <span className="text-sm font-black text-white" style={{fontFamily:'var(--font-display)'}}>{slide.title}</span>
                {slide.subtitle && <span className="text-xs ml-3" style={{color:'var(--color-gold)'}}>{slide.subtitle}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
