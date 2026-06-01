"use client";
import { useState } from "react";
import { Save, RefreshCw } from "lucide-react";
import { useApp, ShopCategory } from "@/context/AppContext";
import { Button, Input, Textarea, Select, Modal, FormGroup, Switch, Badge, StatCard, RichTextField } from "@/components/ui";
import toast from "react-hot-toast";

const EMPTY_CAT: Omit<ShopCategory,"id"> = { name:"", slug:"", description:"", image:"", sortOrder:1, isActive:true };
const TABS = [
  { key:"general",    label:"General",     icon:"fa-solid fa-gear" },
  { key:"categories", label:"Categories",  icon:"fa-solid fa-folder-tree" },
  { key:"shipping",   label:"Shipping",    icon:"fa-solid fa-truck" },
  { key:"payments",   label:"Payments",    icon:"fa-solid fa-credit-card" },
  { key:"display",    label:"Display",     icon:"fa-solid fa-palette" },
  { key:"policies",   label:"Policies",    icon:"fa-solid fa-file-contract" },
];
const GATEWAY_OPTS = [
  { id:"paystack",  label:"Paystack",  icon:"fa-solid fa-credit-card" },
  { id:"mtn",       label:"MTN MoMo",  icon:"fa-solid fa-mobile-screen-button" },
  { id:"telecel",   label:"Telecel Cash",icon:"fa-solid fa-mobile-screen-button" },
  { id:"at",        label:"AT Cash",   icon:"fa-solid fa-mobile-screen-button" },
  { id:"hubtel",    label:"Hubtel",    icon:"fa-solid fa-wallet" },
  { id:"bank",      label:"Bank Transfer",icon:"fa-solid fa-building-columns" },
  { id:"cash",      label:"Cash/In-Person",icon:"fa-solid fa-money-bill" },
];

export default function ShopSettingsPage() {
  const { settings, updateSettings, products } = useApp();
  const shopS = (settings as any).shopSettings || {};
  const [tab, setTab] = useState("general");
  const [saving, setSaving] = useState(false);

  // General
  const [allowGuest,    setAllowGuest]    = useState(shopS.allowGuestCheckout ?? true);
  const [discountPct,   setDiscountPct]   = useState(String(shopS.memberDiscountPct ?? 10));
  const [currency,      setCurrency]      = useState(shopS.currency || "GHS");
  const [currSymbol,    setCurrSymbol]    = useState(shopS.currencySymbol || "GH₵");
  const [reviewsEnabled,setReviewsEnabled]= useState(shopS.reviewsEnabled ?? false);
  const [featuredSection,setFeaturedSection] = useState(shopS.featuredSection ?? true);
  const [checkoutNote,  setCheckoutNote]  = useState(shopS.checkoutNote || "");
  // Inventory
  const [invTracking,   setInvTracking]   = useState(shopS.inventoryTracking ?? true);
  const [lowStockThr,   setLowStockThr]   = useState(String(shopS.lowStockThreshold ?? 5));
  const [showOOS,       setShowOOS]       = useState(shopS.showOutOfStock ?? true);
  const [backorders,    setBackorders]    = useState(shopS.allowBackorders ?? false);
  // Shipping
  const [shippingEnabled,setShippingEnabled] = useState(shopS.shippingEnabled ?? true);
  const [shippingFlat,  setShippingFlat]  = useState(String(shopS.shippingFlatRate ?? 30));
  const [shippingFree,  setShippingFree]  = useState(String(shopS.shippingFreeThreshold ?? 500));
  const [shippingNote,  setShippingNote]  = useState(shopS.shippingNote || "");
  // Tax
  const [taxEnabled,    setTaxEnabled]    = useState(shopS.taxEnabled ?? false);
  const [taxRate,       setTaxRate]       = useState(String(shopS.taxRate ?? 0));
  const [taxLabel,      setTaxLabel]      = useState(shopS.taxLabel || "VAT");
  // Gateways
  const [enabledGW,     setEnabledGW]     = useState<string[]>(shopS.paymentGateways || ["paystack","mtn","bank"]);
  // Display
  const [heroTitle,     setHeroTitle]     = useState(shopS.heroTitle || "OFFICIAL MERCHANDISE");
  const [heroSubtitle,  setHeroSubtitle]  = useState(shopS.heroSubtitle || "Gear up for Arsenal Ghana");
  const [heroBg,        setHeroBg]        = useState(shopS.heroBg || "from-red-900 via-[#1A0A0A] to-red-950");
  // Policies
  const [returnPolicy,  setReturnPolicy]  = useState(shopS.returnPolicy || "Items can be returned within 7 days of receipt in original condition.");
  // Categories
  const cats: ShopCategory[] = (settings as any).shopCategories || [];
  const [showCatForm,   setShowCatForm]   = useState(false);
  const [editCatId,     setEditCatId]     = useState<number|null>(null);
  const [catForm,       setCatForm]       = useState<Omit<ShopCategory,"id">>({...EMPTY_CAT});

  const toggleGW = (id: string) => setEnabledGW(p => p.includes(id) ? p.filter(x=>x!==id) : [...p,id]);

  const saveCat = () => {
    if (!catForm.name.trim()) { toast.error("Category name required"); return; }
    const slug = catForm.slug || catForm.name.toLowerCase().replace(/\s+/g,"-");
    let updated: ShopCategory[];
    if (editCatId) {
      updated = cats.map(c=>c.id===editCatId?{...c,...catForm,slug}:c);
      toast.success("Category updated");
    } else {
      updated = [...cats,{...catForm,slug,id:Date.now()}];
      toast.success("Category added");
    }
    updateSettings({ shopCategories:updated } as any);
    setShowCatForm(false); setEditCatId(null); setCatForm({...EMPTY_CAT});
  };
  const deleteCat = (id:number) => {
    if (!confirm("Delete category?")) return;
    updateSettings({ shopCategories:cats.filter(c=>c.id!==id) } as any);
    toast.success("Deleted");
  };

  const saveAll = async () => {
    setSaving(true);
    await new Promise(r=>setTimeout(r,600));
    const newShopS = {
      allowGuestCheckout:allowGuest, memberDiscountPct:parseFloat(discountPct)||10,
      currency, currencySymbol:currSymbol, reviewsEnabled, featuredSection, checkoutNote,
      inventoryTracking:invTracking, lowStockThreshold:parseInt(lowStockThr)||5,
      showOutOfStock:showOOS, allowBackorders:backorders,
      shippingEnabled, shippingFlatRate:parseFloat(shippingFlat)||30,
      shippingFreeThreshold:parseFloat(shippingFree)||500, shippingNote,
      taxEnabled, taxRate:parseFloat(taxRate)||0, taxLabel,
      paymentGateways:enabledGW,
      heroTitle, heroSubtitle, heroBg, returnPolicy,
      categories:cats,
    };
    updateSettings({ shopSettings:newShopS } as any);
    setSaving(false);
    toast.success("Shop settings saved!");
  };

  const inp = "input-arsenal w-full";
  const statTotal  = products.length;
  const statActive = products.filter(p=>p.inStock).length;
  const statValue  = products.reduce((a,p)=>a+p.price*(p.stock||0),0);
  const statLow    = products.filter(p=>p.stock>0&&p.stock<(parseInt(lowStockThr)||5)).length;

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-white" style={{ fontFamily:"var(--font-display)" }}>SHOP SETTINGS</h1>
          <p className="text-xs mt-0.5" style={{ color:"rgba(255,255,255,0.4)" }}>Full e-commerce configuration — categories, shipping, payments, display</p>
        </div>
        <button onClick={saveAll} disabled={saving} className="btn-arsenal flex items-center gap-2 px-5 py-2.5 text-sm">
          {saving?<RefreshCw size={14} className="animate-spin"/>:<Save size={14}/>}Save Settings
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Products"   value={statTotal}                     icon="fa-solid fa-bag-shopping"        color="#EF0107" />
        <StatCard label="In Stock"   value={statActive}                    icon="fa-solid fa-boxes-stacked"       color="#22C55E" />
        <StatCard label="Inventory"  value={`GH₵${statValue.toLocaleString()}`} icon="fa-solid fa-coins"        color="#C6A84B" />
        <StatCard label="Low Stock"  value={statLow}                       icon="fa-solid fa-triangle-exclamation"color="#F59E0B" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 flex-wrap p-1 rounded-sm" style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)" }}>
        {TABS.map(t=>(
          <button key={t.key} onClick={()=>setTab(t.key)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-sm transition-all"
            style={{ background:tab===t.key?"var(--color-red)":"transparent", color:tab===t.key?"white":"rgba(255,255,255,0.5)", fontFamily:"var(--font-heading)" }}>
            <i className={`${t.icon} text-[10px]`} />{t.label}
          </button>
        ))}
      </div>

      {/* ── GENERAL ─────────────────────────────────────────────────────────── */}
      {tab==="general" && (
        <div className="space-y-4">
          <div className="p-5 rounded-sm space-y-4" style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)" }}>
            <h3 className="text-sm font-black uppercase tracking-wider text-white" style={{ fontFamily:"var(--font-heading)" }}>General Settings</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <FormGroup label="Default Currency Code" icon="fa-solid fa-coins">
                <select value={currency} onChange={e=>setCurrency(e.target.value)} className={inp}>
                  <option value="GHS">GHS (Ghana Cedi)</option>
                  <option value="USD">USD (US Dollar)</option>
                  <option value="GBP">GBP (British Pound)</option>
                  <option value="EUR">EUR (Euro)</option>
                </select>
              </FormGroup>
              <FormGroup label="Currency Symbol" icon="fa-solid fa-circle-dollar-to-slot">
                <Input value={currSymbol} onChange={e=>setCurrSymbol(e.target.value)} placeholder="GH₵" />
              </FormGroup>
              <FormGroup label="Member Discount %" icon="fa-solid fa-percent">
                <Input type="number" value={discountPct} onChange={e=>setDiscountPct(e.target.value)} min="0" max="100" placeholder="10" />
              </FormGroup>
              <FormGroup label="Low Stock Threshold" icon="fa-solid fa-triangle-exclamation">
                <Input type="number" value={lowStockThr} onChange={e=>setLowStockThr(e.target.value)} min="1" placeholder="5" />
              </FormGroup>
              <FormGroup label="Checkout Note" icon="fa-solid fa-note-sticky" className="sm:col-span-2">
                <Textarea value={checkoutNote} onChange={e=>setCheckoutNote(e.target.value)} rows={2} placeholder="Message shown on checkout..." className="resize-none" />
              </FormGroup>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <Switch checked={allowGuest}     onChange={()=>setAllowGuest((v: boolean)=>!v)}     label="Allow Guest Checkout" />
              <Switch checked={invTracking}    onChange={()=>setInvTracking((v: boolean)=>!v)}    label="Track Inventory" />
              <Switch checked={showOOS}        onChange={()=>setShowOOS((v: boolean)=>!v)}        label="Show Out-of-Stock Items" />
              <Switch checked={backorders}     onChange={()=>setBackorders((v: boolean)=>!v)}     label="Allow Backorders" />
              <Switch checked={featuredSection}onChange={()=>setFeaturedSection((v: boolean)=>!v)}label="Featured Products Section" />
              <Switch checked={reviewsEnabled} onChange={()=>setReviewsEnabled((v: boolean)=>!v)} label="Product Reviews" />
            </div>
          </div>
        </div>
      )}

      {/* ── CATEGORIES ──────────────────────────────────────────────────────── */}
      {tab==="categories" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm" style={{ color:"rgba(255,255,255,0.5)" }}>{cats.length} categories — used to filter products in the shop</p>
            <Button onClick={()=>{setCatForm({...EMPTY_CAT,sortOrder:cats.length+1});setEditCatId(null);setShowCatForm(true);}}>
              <i className="fa-solid fa-plus mr-1.5" />Add Category
            </Button>
          </div>
          <div className="space-y-2">
            {cats.sort((a,b)=>a.sortOrder-b.sortOrder).map(c=>(
              <div key={c.id} className="flex items-center gap-4 p-3 rounded-sm" style={{ background:"rgba(255,255,255,0.03)", border:`1px solid ${c.isActive?"rgba(255,255,255,0.08)":"rgba(255,255,255,0.03)"}`, opacity:c.isActive?1:0.5 }}>
                {c.image ? <img src={c.image} alt="" className="w-9 h-9 rounded-sm object-cover flex-shrink-0" /> : (
                  <div className="w-9 h-9 rounded-sm flex items-center justify-center flex-shrink-0" style={{ background:"rgba(239,1,7,0.12)" }}>
                    <i className="fa-solid fa-folder text-sm" style={{ color:"var(--color-red)" }} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white" style={{ fontFamily:"var(--font-heading)" }}>{c.name}</p>
                  <p className="text-[10px]" style={{ color:"rgba(255,255,255,0.35)" }}>/{c.slug} · Order {c.sortOrder} · {products.filter(p=>p.category===c.name).length} products</p>
                </div>
                <Badge variant={c.isActive?"success":"default"}>{c.isActive?"Active":"Hidden"}</Badge>
                <div className="flex gap-1">
                  <button onClick={()=>{ setCatForm({name:c.name,slug:c.slug,description:c.description||"",image:c.image||"",sortOrder:c.sortOrder,isActive:c.isActive}); setEditCatId(c.id); setShowCatForm(true); }}
                    className="w-8 h-8 rounded-sm flex items-center justify-center" style={{ background:"rgba(255,255,255,0.05)", color:"rgba(255,255,255,0.5)" }}>
                    <i className="fa-solid fa-pen text-xs" />
                  </button>
                  <button onClick={()=>deleteCat(c.id)}
                    className="w-8 h-8 rounded-sm flex items-center justify-center hover:bg-red-500/20" style={{ background:"rgba(255,255,255,0.05)", color:"rgba(239,1,7,0.6)" }}>
                    <i className="fa-solid fa-trash text-xs" />
                  </button>
                </div>
              </div>
            ))}
            {cats.length===0 && <p className="text-center py-8 text-sm" style={{ color:"rgba(255,255,255,0.3)" }}>No categories yet — products will show without category filters</p>}
          </div>
        </div>
      )}

      {/* ── SHIPPING ────────────────────────────────────────────────────────── */}
      {tab==="shipping" && (
        <div className="p-5 rounded-sm space-y-4" style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)" }}>
          <h3 className="text-sm font-black uppercase tracking-wider text-white" style={{ fontFamily:"var(--font-heading)" }}>Shipping Configuration</h3>
          <Switch checked={shippingEnabled} onChange={()=>setShippingEnabled((v: boolean)=>!v)} label="Enable Shipping" />
          {shippingEnabled && (
            <div className="grid sm:grid-cols-2 gap-4">
              <FormGroup label={`Flat Shipping Rate (${currSymbol})`} icon="fa-solid fa-truck">
                <Input type="number" value={shippingFlat} onChange={e=>setShippingFlat(e.target.value)} min="0" placeholder="30" />
              </FormGroup>
              <FormGroup label={`Free Shipping Threshold (${currSymbol})`} icon="fa-solid fa-gift">
                <Input type="number" value={shippingFree} onChange={e=>setShippingFree(e.target.value)} min="0" placeholder="500" />
              </FormGroup>
              <FormGroup label="Shipping Note" icon="fa-solid fa-note-sticky" className="sm:col-span-2">
                <Textarea value={shippingNote} onChange={e=>setShippingNote(e.target.value)} rows={2} placeholder="e.g. Free delivery in Accra on orders above GH₵500" className="resize-none" />
              </FormGroup>
            </div>
          )}
          <div className="pt-4" style={{ borderTop:"1px solid rgba(255,255,255,0.06)" }}>
            <h4 className="text-xs font-bold uppercase tracking-wider mb-3 text-white" style={{ fontFamily:"var(--font-heading)" }}>Tax Settings</h4>
            <Switch checked={taxEnabled} onChange={()=>setTaxEnabled((v: boolean)=>!v)} label="Enable Tax" />
            {taxEnabled && (
              <div className="grid sm:grid-cols-2 gap-4 mt-3">
                <FormGroup label="Tax Rate (%)" icon="fa-solid fa-percent"><Input type="number" value={taxRate} onChange={e=>setTaxRate(e.target.value)} min="0" max="100" placeholder="0" /></FormGroup>
                <FormGroup label="Tax Label" icon="fa-solid fa-tag"><Input value={taxLabel} onChange={e=>setTaxLabel(e.target.value)} placeholder="VAT" /></FormGroup>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── PAYMENTS ────────────────────────────────────────────────────────── */}
      {tab==="payments" && (
        <div className="space-y-3">
          <p className="text-sm" style={{ color:"rgba(255,255,255,0.5)" }}>Select which payment methods are available in the shop checkout</p>
          {GATEWAY_OPTS.map(gw=>(
            <button key={gw.id} onClick={()=>toggleGW(gw.id)} className="w-full flex items-center gap-4 p-4 rounded-sm text-left transition-all"
              style={{ background:enabledGW.includes(gw.id)?"rgba(239,1,7,0.06)":"rgba(255,255,255,0.02)", border:`1px solid ${enabledGW.includes(gw.id)?"rgba(239,1,7,0.3)":"rgba(255,255,255,0.06)"}` }}>
              <i className={`${gw.icon} text-lg w-6 text-center`} style={{ color:enabledGW.includes(gw.id)?"var(--color-red)":"rgba(255,255,255,0.3)" }} />
              <span className="flex-1 text-sm font-bold" style={{ color:"rgba(255,255,255,0.8)", fontFamily:"var(--font-heading)" }}>{gw.label}</span>
              <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ border:`2px solid ${enabledGW.includes(gw.id)?"var(--color-red)":"rgba(255,255,255,0.2)"}`, background:enabledGW.includes(gw.id)?"var(--color-red)":"transparent" }}>
                {enabledGW.includes(gw.id)&&<i className="fa-solid fa-check text-white text-[8px]" />}
              </div>
            </button>
          ))}
          <p className="text-xs" style={{ color:"rgba(255,255,255,0.3)", fontFamily:"var(--font-body)" }}>
            Configure gateway API keys in <strong className="text-white">Admin → Settings → Payments</strong>
          </p>
        </div>
      )}

      {/* ── DISPLAY ─────────────────────────────────────────────────────────── */}
      {tab==="display" && (
        <div className="p-5 rounded-sm space-y-4" style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)" }}>
          <h3 className="text-sm font-black uppercase tracking-wider text-white" style={{ fontFamily:"var(--font-heading)" }}>Shop Hero Display</h3>
          <FormGroup label="Hero Title" icon="fa-solid fa-heading"><Input value={heroTitle} onChange={e=>setHeroTitle(e.target.value)} placeholder="OFFICIAL MERCHANDISE" /></FormGroup>
          <FormGroup label="Hero Subtitle" icon="fa-solid fa-align-left"><Input value={heroSubtitle} onChange={e=>setHeroSubtitle(e.target.value)} placeholder="Gear up for Arsenal Ghana" /></FormGroup>
          <FormGroup label="Hero Background (Tailwind gradient)" icon="fa-solid fa-palette">
            <Input value={heroBg} onChange={e=>setHeroBg(e.target.value)} placeholder="from-red-900 via-[#1A0A0A] to-red-950" />
          </FormGroup>
          {/* Preview */}
          <div className={`p-6 rounded-sm flex flex-col items-center justify-center text-center bg-gradient-to-br ${heroBg}`} style={{ minHeight:120 }}>
            <p className="text-2xl font-black text-white" style={{ fontFamily:"var(--font-display)" }}>{heroTitle||"Shop Title"}</p>
            <p className="text-sm mt-1" style={{ color:"rgba(255,255,255,0.6)", fontFamily:"var(--font-body)" }}>{heroSubtitle||"Subtitle"}</p>
          </div>
        </div>
      )}

      {/* ── POLICIES ────────────────────────────────────────────────────────── */}
      {tab==="policies" && (
        <div className="p-5 rounded-sm space-y-4" style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)" }}>
          <h3 className="text-sm font-black uppercase tracking-wider text-white" style={{ fontFamily:"var(--font-heading)" }}>Shop Policies</h3>
          <FormGroup label="Return & Refund Policy" icon="fa-solid fa-rotate-left">
            <RichTextField value={returnPolicy} onChange={setReturnPolicy} placeholder="Describe your return and refund policy…" minHeight={200} />
          </FormGroup>
        </div>
      )}

      {/* Category Modal */}
      <Modal open={showCatForm} onClose={()=>setShowCatForm(false)} title={editCatId?"Edit Category":"Add Category"} size="sm">
        <div className="p-5 space-y-4">
          <FormGroup label="Category Name *" icon="fa-solid fa-folder"><Input value={catForm.name} onChange={e=>setCatForm(p=>({...p,name:e.target.value}))} placeholder="e.g. Jerseys" /></FormGroup>
          <FormGroup label="URL Slug" icon="fa-solid fa-link" hint="Auto-generated from name if blank"><Input value={catForm.slug} onChange={e=>setCatForm(p=>({...p,slug:e.target.value.toLowerCase().replace(/\s+/g,"-")}))} placeholder="jerseys" /></FormGroup>
          <FormGroup label="Description" icon="fa-solid fa-align-left"><Textarea value={catForm.description||""} onChange={e=>setCatForm(p=>({...p,description:e.target.value}))} rows={2} className="resize-none" /></FormGroup>
          <FormGroup label="Sort Order" icon="fa-solid fa-sort"><Input type="number" value={catForm.sortOrder} onChange={e=>setCatForm(p=>({...p,sortOrder:parseInt(e.target.value)||1}))} min="1" /></FormGroup>
          <Switch checked={catForm.isActive} onChange={()=>setCatForm(p=>({...p,isActive:!p.isActive}))} label="Active (visible in shop)" />
        </div>
        <div className="px-5 py-4 flex justify-end gap-3" style={{ borderTop:"1px solid rgba(255,255,255,0.06)" }}>
          <Button variant="secondary" onClick={()=>setShowCatForm(false)}>Cancel</Button>
          <Button onClick={saveCat}><i className="fa-solid fa-save mr-1.5" />{editCatId?"Update":"Add Category"}</Button>
        </div>
      </Modal>
    </div>
  );
}
