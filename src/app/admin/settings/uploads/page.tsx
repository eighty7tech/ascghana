"use client";
import { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { Switch } from "@/components/ui";
import toast from "react-hot-toast";

const IMAGE_TYPES = ["image/jpeg","image/png","image/webp","image/gif","image/svg+xml","image/avif"];

export default function UploadSettingsPage() {
  const { settings, updateSettings } = useApp();
  const s = settings as any;
  const [saving, setSaving] = useState(false);

  const [maxSizeMb,      setMaxSizeMb]      = useState(String(s.uploadMaxSizeMb || 5));
  const [allowedTypes,   setAllowedTypes]   = useState<string[]>(s.uploadAllowedTypes || ["image/jpeg","image/png","image/webp"]);
  const [convertWebp,    setConvertWebp]    = useState<boolean>(s.uploadConvertWebp !== false);
  const [maxDimension,   setMaxDimension]   = useState(String(s.uploadMaxDimension || 2000));
  const [quality,        setQuality]        = useState(String(s.uploadJpegQuality || 85));
  const [uploadProvider, setUploadProvider] = useState(s.uploadProvider || "local");
  // S3
  const [s3Bucket,  setS3Bucket]  = useState(s.s3Bucket || "");
  const [s3Region,  setS3Region]  = useState(s.s3Region || "us-east-1");
  const [s3Key,     setS3Key]     = useState(s.s3AccessKey || "");
  const [s3Secret,  setS3Secret]  = useState(s.s3SecretKey || "");
  const [cdnUrl,    setCdnUrl]    = useState(s.cdnUrl || "");
  // Cloudinary
  const [cloudName,   setCloudName]   = useState(s.cloudinaryCloudName || "");
  const [cloudApiKey, setCloudApiKey] = useState(s.cloudinaryApiKey || "");
  const [cloudSecret, setCloudSecret] = useState(s.cloudinaryApiSecret || "");
  const [cloudPreset, setCloudPreset] = useState(s.cloudinaryUploadPreset || "");
  const [cloudFolder, setCloudFolder] = useState(s.cloudinaryFolder || "ascghana");
  // ImgBB
  const [imgbbKey, setImgbbKey] = useState(s.imgbbApiKey || "");

  const toggleType = (t: string) =>
    setAllowedTypes(prev => prev.includes(t) ? prev.filter(x=>x!==t) : [...prev,t]);

  const save = async () => {
    setSaving(true);
    await updateSettings({
      uploadMaxSizeMb:    Number(maxSizeMb)||5,
      uploadAllowedTypes: allowedTypes,
      uploadConvertWebp:  convertWebp,
      uploadMaxDimension: Number(maxDimension)||2000,
      uploadJpegQuality:  Number(quality)||85,
      uploadProvider,
      s3Bucket, s3Region, s3AccessKey:s3Key, s3SecretKey:s3Secret, cdnUrl,
      cloudinaryCloudName:cloudName, cloudinaryApiKey:cloudApiKey,
      cloudinaryApiSecret:cloudSecret, cloudinaryUploadPreset:cloudPreset,
      cloudinaryFolder:cloudFolder,
      imgbbApiKey:imgbbKey,
    } as any);
    setSaving(false);
    toast.success("Upload settings saved!");
  };

  // Sync from DB when settings load async
  const [synced, setSynced] = useState(false);
  useEffect(() => {
    if (synced) return;
    const hasData = s.uploadProvider || s.cloudinaryCloudName || s.s3Bucket || s.imgbbApiKey;
    if (!hasData) return;
    setSynced(true);
    if (s.uploadMaxSizeMb)         setMaxSizeMb(String(s.uploadMaxSizeMb));
    if (s.uploadAllowedTypes)      setAllowedTypes(s.uploadAllowedTypes);
    if (s.uploadConvertWebp !== undefined) setConvertWebp(s.uploadConvertWebp);
    if (s.uploadMaxDimension)      setMaxDimension(String(s.uploadMaxDimension));
    if (s.uploadJpegQuality)       setQuality(String(s.uploadJpegQuality));
    if (s.uploadProvider)          setUploadProvider(s.uploadProvider);
    if (s.s3Bucket)                setS3Bucket(s.s3Bucket);
    if (s.s3Region)                setS3Region(s.s3Region);
    if (s.s3AccessKey)             setS3Key(s.s3AccessKey);
    if (s.s3SecretKey)             setS3Secret(s.s3SecretKey);
    if (s.cdnUrl)                  setCdnUrl(s.cdnUrl);
    if (s.cloudinaryCloudName)     setCloudName(s.cloudinaryCloudName);
    if (s.cloudinaryApiKey)        setCloudApiKey(s.cloudinaryApiKey);
    if (s.cloudinaryApiSecret)     setCloudSecret(s.cloudinaryApiSecret);
    if (s.cloudinaryUploadPreset)  setCloudPreset(s.cloudinaryUploadPreset);
    if (s.cloudinaryFolder)        setCloudFolder(s.cloudinaryFolder);
    if (s.imgbbApiKey)             setImgbbKey(s.imgbbApiKey);
  }, [settings, synced]); // eslint-disable-line

  const inp = "input-arsenal w-full text-sm";

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-black text-white" style={{fontFamily:"var(--font-display)"}}>STORAGE & UPLOADS</h1>
        <p className="text-xs mt-0.5" style={{color:"rgba(255,255,255,0.4)"}}>Configure image uploads and cloud storage providers</p>
      </div>

      {/* Provider Selector */}
      <div className="p-5 rounded-sm space-y-4" style={{background:"#16213E",border:"1px solid rgba(255,255,255,0.06)"}}>
        <h2 className="text-sm font-bold uppercase tracking-wider text-white" style={{fontFamily:"var(--font-heading)"}}>
          <i className="fa-solid fa-cloud mr-2" style={{color:"var(--color-red)"}}/>Storage Provider
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {id:"local",   icon:"fa-solid fa-server",     label:"Local Server",  color:"#6B7280"},
            {id:"cloudinary",icon:"fa-solid fa-cloud",    label:"Cloudinary",    color:"#3448C5"},
            {id:"s3",      icon:"fa-brands fa-aws",        label:"AWS S3",        color:"#FF9900"},
            {id:"imgbb",   icon:"fa-solid fa-image",       label:"ImgBB",         color:"#10B981"},
          ].map(p=>(
            <button key={p.id} onClick={()=>setUploadProvider(p.id)}
              className="p-4 rounded-sm text-center transition-all"
              style={{
                background:uploadProvider===p.id?`${p.color}15`:"rgba(255,255,255,0.03)",
                border:`1px solid ${uploadProvider===p.id?p.color:"rgba(255,255,255,0.06)"}`,
              }}>
              <i className={`${p.icon} text-xl mb-2 block`} style={{color:uploadProvider===p.id?p.color:"rgba(255,255,255,0.3)"}}/>
              <p className="text-xs font-bold" style={{color:uploadProvider===p.id?p.color:"rgba(255,255,255,0.5)",fontFamily:"var(--font-heading)"}}>{p.label}</p>
              {uploadProvider===p.id && <div className="w-4 h-0.5 mx-auto mt-2 rounded-full" style={{background:p.color}}/>}
            </button>
          ))}
        </div>

        {/* Cloudinary config */}
        {uploadProvider==="cloudinary" && (
          <div className="space-y-4 p-4 rounded-sm" style={{background:"rgba(52,72,197,0.08)",border:"1px solid rgba(52,72,197,0.2)"}}>
            <div className="flex items-center gap-2 mb-3">
              <i className="fa-solid fa-cloud text-sm" style={{color:"#3448C5"}}/>
              <span className="text-sm font-bold text-white" style={{fontFamily:"var(--font-heading)"}}>Cloudinary Configuration</span>
              <a href="https://cloudinary.com/console" target="_blank" rel="noopener noreferrer"
                className="ml-auto text-xs underline" style={{color:"#3448C5"}}>Open Console ↗</a>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase mb-1" style={{color:"rgba(255,255,255,0.4)",fontFamily:"var(--font-heading)"}}>Cloud Name *</label>
                <input value={cloudName} onChange={e=>setCloudName(e.target.value)} className={inp} placeholder="myapp123"/>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase mb-1" style={{color:"rgba(255,255,255,0.4)",fontFamily:"var(--font-heading)"}}>API Key *</label>
                <input value={cloudApiKey} onChange={e=>setCloudApiKey(e.target.value)} className={inp} placeholder="123456789012345"/>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase mb-1" style={{color:"rgba(255,255,255,0.4)",fontFamily:"var(--font-heading)"}}>API Secret *</label>
                <input type="password" value={cloudSecret} onChange={e=>setCloudSecret(e.target.value)} className={inp} placeholder="••••••••••••••••"/>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase mb-1" style={{color:"rgba(255,255,255,0.4)",fontFamily:"var(--font-heading)"}}>Upload Preset (for unsigned)</label>
                <input value={cloudPreset} onChange={e=>setCloudPreset(e.target.value)} className={inp} placeholder="ml_default"/>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase mb-1" style={{color:"rgba(255,255,255,0.4)",fontFamily:"var(--font-heading)"}}>Default Folder</label>
                <input value={cloudFolder} onChange={e=>setCloudFolder(e.target.value)} className={inp} placeholder="ascghana"/>
                <p className="text-[10px] mt-1" style={{color:"rgba(255,255,255,0.3)"}}>
                  Images will be organized under this folder in your Cloudinary media library. Sub-folders: ascghana/hero, ascghana/gallery, etc.
                </p>
              </div>
            </div>
            <div className="p-3 rounded-sm" style={{background:"rgba(52,72,197,0.08)",border:"1px solid rgba(52,72,197,0.15)"}}>
              <p className="text-xs font-bold mb-1" style={{color:"#3448C5",fontFamily:"var(--font-heading)"}}>
                <i className="fa-solid fa-circle-info mr-1"/>Server-side API Route
              </p>
              <p className="text-[10px]" style={{color:"rgba(255,255,255,0.4)"}}>
                Uploads route through <code className="text-[#3448C5]">/api/uploads</code> — the API secret never leaves the server.
                Client code uses the public Cloud Name and Upload Preset for direct unsigned uploads where applicable.
              </p>
            </div>
          </div>
        )}

        {/* S3 config */}
        {uploadProvider==="s3" && (
          <div className="space-y-3 p-4 rounded-sm" style={{background:"rgba(255,153,0,0.06)",border:"1px solid rgba(255,153,0,0.2)"}}>
            <div className="flex items-center gap-2 mb-2">
              <i className="fa-brands fa-aws" style={{color:"#FF9900"}}/>
              <span className="text-sm font-bold text-white" style={{fontFamily:"var(--font-heading)"}}>AWS S3 Configuration</span>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <div><label className="block text-xs font-bold uppercase mb-1" style={{color:"rgba(255,255,255,0.4)",fontFamily:"var(--font-heading)"}}>Bucket</label>
                <input value={s3Bucket} onChange={e=>setS3Bucket(e.target.value)} className={inp} placeholder="my-bucket"/></div>
              <div><label className="block text-xs font-bold uppercase mb-1" style={{color:"rgba(255,255,255,0.4)",fontFamily:"var(--font-heading)"}}>Region</label>
                <input value={s3Region} onChange={e=>setS3Region(e.target.value)} className={inp} placeholder="us-east-1"/></div>
              <div><label className="block text-xs font-bold uppercase mb-1" style={{color:"rgba(255,255,255,0.4)",fontFamily:"var(--font-heading)"}}>Access Key ID</label>
                <input value={s3Key} onChange={e=>setS3Key(e.target.value)} className={inp} placeholder="AKIA…"/></div>
              <div><label className="block text-xs font-bold uppercase mb-1" style={{color:"rgba(255,255,255,0.4)",fontFamily:"var(--font-heading)"}}>Secret Access Key</label>
                <input type="password" value={s3Secret} onChange={e=>setS3Secret(e.target.value)} className={inp} placeholder="••••••••"/></div>
            </div>
            <div><label className="block text-xs font-bold uppercase mb-1" style={{color:"rgba(255,255,255,0.4)",fontFamily:"var(--font-heading)"}}>CDN URL (optional)</label>
              <input value={cdnUrl} onChange={e=>setCdnUrl(e.target.value)} className={inp} placeholder="https://cdn.ascghana.com"/></div>
          </div>
        )}

        {/* ImgBB config */}
        {uploadProvider==="imgbb" && (
          <div className="p-4 rounded-sm space-y-3" style={{background:"rgba(16,185,129,0.06)",border:"1px solid rgba(16,185,129,0.2)"}}>
            <div className="flex items-center gap-2">
              <i className="fa-solid fa-image" style={{color:"#10B981"}}/>
              <span className="text-sm font-bold text-white" style={{fontFamily:"var(--font-heading)"}}>ImgBB Configuration</span>
              <a href="https://api.imgbb.com" target="_blank" rel="noopener noreferrer" className="ml-auto text-xs underline" style={{color:"#10B981"}}>Get API Key ↗</a>
            </div>
            <div><label className="block text-xs font-bold uppercase mb-1" style={{color:"rgba(255,255,255,0.4)",fontFamily:"var(--font-heading)"}}>ImgBB API Key</label>
              <input value={imgbbKey} onChange={e=>setImgbbKey(e.target.value)} className={inp} placeholder="abcdef1234567890…"/></div>
          </div>
        )}
      </div>

      {/* File restrictions */}
      <div className="p-5 rounded-sm space-y-4" style={{background:"#16213E",border:"1px solid rgba(255,255,255,0.06)"}}>
        <h2 className="text-sm font-bold uppercase tracking-wider text-white" style={{fontFamily:"var(--font-heading)"}}>
          <i className="fa-solid fa-shield-halved mr-2" style={{color:"var(--color-red)"}}/>File Restrictions
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase mb-1" style={{color:"rgba(255,255,255,0.4)",fontFamily:"var(--font-heading)"}}>Max File Size (MB)</label>
            <input type="number" min={1} max={50} value={maxSizeMb} onChange={e=>setMaxSizeMb(e.target.value)} className={inp}/>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase mb-1" style={{color:"rgba(255,255,255,0.4)",fontFamily:"var(--font-heading)"}}>Max Dimension (px)</label>
            <input type="number" min={200} max={8000} value={maxDimension} onChange={e=>setMaxDimension(e.target.value)} className={inp}/>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase mb-1" style={{color:"rgba(255,255,255,0.4)",fontFamily:"var(--font-heading)"}}>JPEG Quality (1–100)</label>
            <input type="number" min={1} max={100} value={quality} onChange={e=>setQuality(e.target.value)} className={inp}/>
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold uppercase mb-2" style={{color:"rgba(255,255,255,0.4)",fontFamily:"var(--font-heading)"}}>Allowed Image Types</label>
          <div className="flex flex-wrap gap-2">
            {IMAGE_TYPES.map(type=>{
              const label = type.replace("image/","").toUpperCase();
              const checked = allowedTypes.includes(type);
              return (
                <label key={type} className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-sm transition-all"
                  style={{background:checked?"rgba(239,1,7,0.1)":"rgba(255,255,255,0.03)",border:`1px solid ${checked?"rgba(239,1,7,0.3)":"rgba(255,255,255,0.06)"}`}}>
                  <input type="checkbox" checked={checked} onChange={()=>toggleType(type)} className="accent-red-500"/>
                  <span className="text-xs font-bold" style={{color:checked?"var(--color-red)":"rgba(255,255,255,0.5)",fontFamily:"var(--font-heading)"}}>{label}</span>
                </label>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Switch checked={convertWebp} onChange={setConvertWebp}/>
          <div>
            <p className="text-sm font-bold text-white" style={{fontFamily:"var(--font-heading)"}}>Auto-convert to WebP</p>
            <p className="text-xs" style={{color:"rgba(255,255,255,0.3)"}}>Smaller file sizes with better quality. Requires server support.</p>
          </div>
        </div>
      </div>

      <button onClick={save} disabled={saving}
        className="btn-arsenal w-full py-3 text-sm font-bold flex items-center justify-center gap-2">
        {saving?<><i className="fa-solid fa-spinner fa-spin"/>Saving…</>:<><i className="fa-solid fa-save"/>Save Upload Settings</>}
      </button>
    </div>
  );
}
