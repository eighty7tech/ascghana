"use client";
import { useState, useEffect } from "react";
import { Save, RefreshCw, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import { useApp } from "@/context/AppContext";
import { FormGroup, Input, Switch, Select, Textarea } from "@/components/ui";

const GATEWAYS = [
  { id:"paystack",    name:"Paystack",         desc:"GHS & USD — card, mobile money, bank",   icon:"fa-solid fa-credit-card",        color:"#00C3F7",
    fields:[{key:"paystackPublicKey",label:"Public Key",ph:"pk_live_..."},{key:"paystackSecretKey",label:"Secret Key",ph:"sk_live_...",secret:true},{key:"paystackWebhookSecret",label:"Webhook Secret (optional)",ph:"whsec_...",secret:true,hint:"Used to verify webhook signatures from Paystack. Webhook URL: /api/payment/webhook/paystack"}] },
  { id:"mtn",         name:"MTN Mobile Money", desc:"Direct MTN MoMo integration",             icon:"fa-solid fa-mobile-screen-button",color:"#FFCC00",
    fields:[{key:"mtnNumber",label:"MTN Business Number",ph:"233241234567"},{key:"mtnApiKey",label:"API Key (optional)",ph:"...",secret:true}] },
  { id:"telecel",     name:"Telecel Cash",     desc:"Telecel (Vodafone) Cash payments",         icon:"fa-solid fa-mobile-screen-button",color:"#EF0107",
    fields:[{key:"telecelNumber",label:"Telecel Business Number",ph:"233201234567"}] },
  { id:"at",          name:"AT Cash (AirtelTigo)", desc:"AirtelTigo Cash payments",            icon:"fa-solid fa-mobile-screen-button",color:"#FF6B00",
    fields:[{key:"atNumber",label:"AirtelTigo Number",ph:"233271234567"}] },
  { id:"hubtel",      name:"Hubtel",           desc:"Ghana payment & SMS platform",             icon:"fa-solid fa-wallet",             color:"#FF6B00",
    fields:[{key:"hubtelClientId",label:"Client ID",ph:"..."},{key:"hubtelClientSecret",label:"Client Secret",ph:"...",secret:true},{key:"hubtelSenderName",label:"SMS Sender Name",ph:"ArsenalGH"}] },
  { id:"flutterwave", name:"Flutterwave",      desc:"Pan-African payment gateway",              icon:"fa-solid fa-globe",              color:"#F5A623",
    fields:[{key:"flutterwavePublicKey",label:"Public Key",ph:"FLWPUBK-..."},{key:"flutterwaveSecretKey",label:"Secret Key",ph:"FLWSECK-...",secret:true},{key:"flutterwaveWebhookHash",label:"Webhook Hash / Secret (optional)",ph:"your-secret-hash",secret:true,hint:"The secret hash used to verify Flutterwave webhooks. Webhook URL: /api/payment/webhook/flutterwave"}] },
  { id:"bank",        name:"Bank Transfer",    desc:"Direct bank deposit — manual verification",icon:"fa-solid fa-building-columns",   color:"#10B981",
    fields:[{key:"bankName",label:"Bank Name",ph:"GCB Bank"},{key:"bankAccountName",label:"Account Name",ph:"Arsenal Supporters Club Ghana"},{key:"bankAccount",label:"Account Number",ph:"1234567890"},{key:"bankBranch",label:"Branch",ph:"Accra Main"}] },
  { id:"cash",        name:"Cash / In-Person", desc:"At office, events or direct to officer",   icon:"fa-solid fa-money-bill-wave",    color:"#6B7280",
    fields:[{key:"cashInstructions",label:"Payment Instructions",ph:"Pay at our office or at any club event. Get an official receipt."}] },
];

const CURRENCY_OPTS = [
  { value:"GBP",  label:"Pounds (£) only",   icon:"fa-solid fa-sterling-sign" },
  { value:"GHS",  label:"Cedis (GH₵) only",  icon:"fa-solid fa-coins" },
  { value:"both", label:"Both £ and GH₵",    icon:"fa-solid fa-arrow-right-arrow-left" },
];

export default function PaymentsSettingsPage() {
  const { settings, updateSettings } = useApp();
  const s = settings as any;

  const [activeGateway, setActiveGateway] = useState(settings.activeGateway || "paystack");
  const [currMode, setCurrMode]   = useState<"GHS"|"GBP"|"both">(settings.ticketCurrencyMode || "both");
  const [gbpRate,  setGbpRate]   = useState(String(settings.gbpToGhsRate || 650));
  const [passCharges, setPassCharges] = useState(settings.paystackPassCharges !== false);
  const [mode, setMode]           = useState<"test"|"live">("live");
  const [showSecrets, setShowSecrets] = useState<Record<string,boolean>>({});
  const [saving, setSaving]       = useState(false);

  // Sync local state when settings load from database (fixes refresh reset)
  useEffect(() => {
    fetch("/api/settings", { cache: "no-store" })
      .then(r => (r.ok ? r.json() : null))
      .then(db => {
        if (!db || typeof db !== "object") return;
        if (db.ticketCurrencyMode) setCurrMode(db.ticketCurrencyMode);
        if (db.gbpToGhsRate != null) setGbpRate(String(db.gbpToGhsRate));
        if (db.activeGateway) setActiveGateway(db.activeGateway);
        if (db.paystackPassCharges !== undefined) setPassCharges(db.paystackPassCharges !== false);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (settings.ticketCurrencyMode) setCurrMode(settings.ticketCurrencyMode);
    if (settings.gbpToGhsRate != null) setGbpRate(String(settings.gbpToGhsRate));
    if (settings.activeGateway) setActiveGateway(settings.activeGateway);
    if (settings.paystackPassCharges !== undefined) setPassCharges(settings.paystackPassCharges !== false);
  }, [settings.ticketCurrencyMode, settings.gbpToGhsRate, settings.activeGateway, settings.paystackPassCharges]);

  // All gateway fields in one flat object, initialized from settings
  const [fields, setFields] = useState<Record<string,string>>({
    paystackPublicKey:  settings.paystackPublicKey || "",
    paystackSecretKey:  settings.paystackSecretKey || "",
    hubtelClientId:     settings.hubtelClientId || "",
    hubtelClientSecret: settings.hubtelClientSecret || "",
    hubtelSenderName:   settings.hubtelSenderName || "ArsenalGH",
    momoNumber:         (settings as any).momoNumber || "",
    momoName:           (settings as any).momoName || "Arsenal SC Ghana",
    bankName:           (settings as any).bankName || "GCB Bank",
    bankAccount:        (settings as any).bankAccount || "",
    bankBranch:         (settings as any).bankBranch || "Accra Main",
    bankAccountName:    (settings as any).bankAccountName || "Arsenal Supporters Club Ghana",
    cashInstructions:   (settings as any).cashInstructions || "",
    mtnNumber:          s.mtnNumber || "",
    mtnApiKey:          s.mtnApiKey || "",
    telecelNumber:      s.telecelNumber || "",
    atNumber:           s.atNumber || "",
    flutterwavePublicKey: s.flutterwavePublicKey || "",
    flutterwaveSecretKey: s.flutterwaveSecretKey || "",
    ...s.extraGatewayFields,
  });

  const upField = (k: string, v: string) => setFields(p => ({...p, [k]: v}));

  const save = async () => {
    setSaving(true);

    const rate = parseFloat(gbpRate);
    if (isNaN(rate) || rate <= 0) {
      toast.error("Enter a valid GBP → GHS rate"); setSaving(false); return;
    }

    const payload = {
      paystackPublicKey:  fields.paystackPublicKey,
      paystackSecretKey:  fields.paystackSecretKey,
      paystackPassCharges: passCharges,
      hubtelClientId:     fields.hubtelClientId,
      hubtelClientSecret: fields.hubtelClientSecret,
      hubtelSenderName:   fields.hubtelSenderName,
      activeGateway,
      ticketCurrencyMode: currMode,
      gbpToGhsRate: rate,
      momoNumber:      fields.momoNumber,
      momoName:        fields.momoName,
      bankName:        fields.bankName,
      bankAccount:     fields.bankAccount,
      bankBranch:      fields.bankBranch,
      bankAccountName: fields.bankAccountName,
      cashInstructions: fields.cashInstructions,
      mtnNumber: fields.mtnNumber, mtnApiKey: fields.mtnApiKey,
      telecelNumber: fields.telecelNumber, atNumber: fields.atNumber,
      flutterwavePublicKey: fields.flutterwavePublicKey,
      flutterwaveSecretKey: fields.flutterwaveSecretKey,
      extraGatewayFields: fields,
    };

    const merged = { ...settings, ...payload };
    updateSettings(payload as Partial<typeof settings>);

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(merged),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Settings save failed");
      }
      const saved = await res.json();
      if (saved.settings) updateSettings(saved.settings);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not persist to database — saved locally only");
    }

    setSaving(false);
    toast.success(`Payment settings saved! Active gateway: ${GATEWAYS.find(g=>g.id===activeGateway)?.name || activeGateway}`);
  };

  const inp = "w-full h-9 px-3 text-sm bg-white/5 border border-white/10 rounded-sm text-white placeholder-white/25 outline-none focus:border-[#EF0107] transition-colors";

  const activeGW = GATEWAYS.find(g => g.id === activeGateway);

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-white" style={{ fontFamily:"var(--font-display)" }}>PAYMENTS & CURRENCY</h1>
          <p className="text-xs mt-0.5" style={{ color:"rgba(255,255,255,0.4)" }}>Configure gateways and currency display for tickets and membership</p>
        </div>
        <button onClick={save} disabled={saving} className="btn-arsenal flex items-center gap-2 px-5 py-2.5 text-sm">
          {saving ? <RefreshCw size={14} className="animate-spin"/> : <Save size={14}/>} Save Settings
        </button>
      </div>

      {/* ── CURRENCY DISPLAY ─────────────────────────────────────────────────── */}
      <div className="p-5 rounded-sm space-y-5" style={{ background:"#16213E", border:"1px solid rgba(198,168,75,0.25)" }}>
        <h2 className="text-sm font-black uppercase tracking-wider flex items-center gap-2" style={{ color:"var(--color-gold)", fontFamily:"var(--font-heading)" }}>
          <i className="fa-solid fa-sterling-sign"/>Ticket & Membership Currency Display
        </h2>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color:"rgba(255,255,255,0.5)", fontFamily:"var(--font-heading)" }}>
            Show Ticket Prices In
          </label>
          <div className="grid grid-cols-3 gap-2">
            {CURRENCY_OPTS.map(opt => (
              <button key={opt.value} onClick={()=>setCurrMode(opt.value as any)}
                className="flex flex-col items-center gap-2 p-3 rounded-sm transition-all"
                style={{ border:`2px solid ${currMode===opt.value?"var(--color-gold)":"rgba(255,255,255,0.08)"}`, background:currMode===opt.value?"rgba(198,168,75,0.1)":"rgba(255,255,255,0.03)" }}>
                <i className={`${opt.icon} text-lg`} style={{ color:currMode===opt.value?"var(--color-gold)":"rgba(255,255,255,0.35)" }} />
                <span className="text-xs font-bold text-center leading-snug" style={{ color:currMode===opt.value?"var(--color-gold)":"rgba(255,255,255,0.5)", fontFamily:"var(--font-heading)" }}>
                  {opt.label}
                </span>
                {currMode===opt.value && <i className="fa-solid fa-circle-check text-xs" style={{ color:"var(--color-gold)" }} />}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color:"rgba(255,255,255,0.5)", fontFamily:"var(--font-heading)" }}>
            GBP → GHS Conversion Rate (£1 = GHS ?)
          </label>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-[200px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color:"rgba(255,255,255,0.4)" }}>£1 =</span>
              <input type="number" value={gbpRate} onChange={e=>setGbpRate(e.target.value)} min="1"
                className={`${inp} pl-12`} placeholder="650" step="1" />
            </div>
            <span className="text-sm" style={{ color:"rgba(255,255,255,0.4)" }}>GHS</span>
            <span className="text-xs px-2.5 py-1.5 rounded-sm" style={{ background:"rgba(198,168,75,0.12)", color:"var(--color-gold)", border:"1px solid rgba(198,168,75,0.2)", fontFamily:"var(--font-body)" }}>
              e.g. £60 = GH₵{(60*(parseFloat(gbpRate)||650)).toLocaleString()}
            </span>
          </div>
          <p className="text-[11px] mt-1.5" style={{ color:"rgba(255,255,255,0.3)", fontFamily:"var(--font-body)" }}>
            Arsenal ticket prices are in GBP. Update this rate regularly. Saved to database on click Save — persists across sessions.
          </p>
        </div>

        {/* MoMo quick setup */}
        <div className="pt-4" style={{ borderTop:"1px solid rgba(255,255,255,0.07)" }}>
          <label className="block text-xs font-bold uppercase tracking-wider mb-3" style={{ color:"rgba(255,255,255,0.5)", fontFamily:"var(--font-heading)" }}>
            <i className="fa-solid fa-mobile-screen mr-1.5" style={{ color:"var(--color-gold)" }}/>Mobile Money Display Details (shown on registration page)
          </label>
          <div className="grid sm:grid-cols-2 gap-3">
            <FormGroup label="MoMo Number" icon="fa-solid fa-phone">
              <input value={fields.momoNumber} onChange={e=>upField("momoNumber",e.target.value)} className={inp} placeholder="024-XXX-XXXX" />
            </FormGroup>
            <FormGroup label="Account Name" icon="fa-solid fa-user">
              <input value={fields.momoName} onChange={e=>upField("momoName",e.target.value)} className={inp} placeholder="Arsenal SC Ghana" />
            </FormGroup>
          </div>
        </div>

        {/* Bank quick setup */}
        <div className="pt-4" style={{ borderTop:"1px solid rgba(255,255,255,0.07)" }}>
          <label className="block text-xs font-bold uppercase tracking-wider mb-3" style={{ color:"rgba(255,255,255,0.5)", fontFamily:"var(--font-heading)" }}>
            <i className="fa-solid fa-building-columns mr-1.5" style={{ color:"var(--color-gold)" }}/>Bank Transfer Details (shown on registration page)
          </label>
          <div className="grid sm:grid-cols-2 gap-3">
            <FormGroup label="Bank Name" icon="fa-solid fa-building-columns">
              <input value={fields.bankName} onChange={e=>upField("bankName",e.target.value)} className={inp} placeholder="GCB Bank" />
            </FormGroup>
            <FormGroup label="Branch" icon="fa-solid fa-location-dot">
              <input value={fields.bankBranch} onChange={e=>upField("bankBranch",e.target.value)} className={inp} placeholder="Accra Main" />
            </FormGroup>
            <FormGroup label="Account Number" icon="fa-solid fa-hashtag">
              <input value={fields.bankAccount} onChange={e=>upField("bankAccount",e.target.value)} className={inp} placeholder="1234567890" />
            </FormGroup>
            <FormGroup label="Account Name" icon="fa-solid fa-user">
              <input value={fields.bankAccountName} onChange={e=>upField("bankAccountName",e.target.value)} className={inp} placeholder="Arsenal Supporters Club Ghana" />
            </FormGroup>
          </div>
        </div>
      </div>

      {/* ── GATEWAY SELECTION ────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-black uppercase tracking-wider flex items-center gap-2" style={{ color:"rgba(255,255,255,0.7)", fontFamily:"var(--font-heading)" }}>
            <i className="fa-solid fa-credit-card" style={{ color:"var(--color-red)" }}/>Payment Gateways
          </h2>
          <div className="flex rounded-sm overflow-hidden" style={{ border:"1px solid rgba(255,255,255,0.1)" }}>
            {(["test","live"] as const).map(m=>(
              <button key={m} onClick={()=>setMode(m)} className="px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-all"
                style={{ background:mode===m?(m==="live"?"#22C55E":"#F59E0B"):"transparent", color:mode===m?"#0D1629":"rgba(255,255,255,0.5)", fontFamily:"var(--font-heading)" }}>
                {m}
              </button>
            ))}
          </div>
        </div>

        {GATEWAYS.map(gw => (
          <div key={gw.id}>
            <button onClick={()=>setActiveGateway(gw.id)} className="w-full flex items-center gap-4 p-4 rounded-sm text-left transition-all"
              style={{ background:activeGateway===gw.id?"rgba(239,1,7,0.06)":"rgba(255,255,255,0.02)", border:`1px solid ${activeGateway===gw.id?"rgba(239,1,7,0.4)":"rgba(255,255,255,0.06)"}` }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background:`${gw.color}18` }}>
                <i className={`${gw.icon} text-lg`} style={{ color:gw.color }}/>
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-bold text-white text-sm" style={{ fontFamily:"var(--font-heading)" }}>{gw.name}</p>
                  {activeGateway===gw.id && <span className="text-[10px] px-2 py-0.5 rounded font-bold" style={{ background:"rgba(34,197,94,0.15)",color:"#22C55E" }}>Active</span>}
                </div>
                <p className="text-xs" style={{ color:"rgba(255,255,255,0.4)" }}>{gw.desc}</p>
              </div>
              <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center" style={{ border:`2px solid ${activeGateway===gw.id?"var(--color-red)":"rgba(255,255,255,0.2)"}`, background:activeGateway===gw.id?"var(--color-red)":"transparent" }}>
                {activeGateway===gw.id && <i className="fa-solid fa-check text-white text-[8px]" />}
              </div>
            </button>

            {activeGateway===gw.id && gw.fields.length > 0 && (
              <div className="p-4 space-y-3 rounded-b-sm" style={{ background:"rgba(0,0,0,0.3)", border:"1px solid rgba(255,255,255,0.06)", borderTop:"none" }}>
                <div className="grid sm:grid-cols-2 gap-3">
                  {gw.fields.map(f => (
                    <div key={f.key} className={(f as any).span2?"sm:col-span-2":""}>
                      <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color:"rgba(255,255,255,0.4)", fontFamily:"var(--font-heading)" }}>{f.label}</label>
                      <div className="flex gap-2">
                        {f.key==="cashInstructions" ? (
                          <textarea value={fields[f.key]||""} onChange={e=>upField(f.key,e.target.value)} rows={3}
                            placeholder={f.ph} className="w-full px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-sm text-white placeholder-white/25 outline-none focus:border-[#EF0107] resize-none" />
                        ) : (
                          <input type={(f as any).secret&&!showSecrets[f.key]?"password":"text"}
                            value={fields[f.key]||""} onChange={e=>upField(f.key,e.target.value)}
                            placeholder={`${mode==="test"?"[TEST] ":""}${f.ph}`} className={`${inp} flex-1`} />
                        )}
                        {(f as any).secret && (
                          <button onClick={()=>setShowSecrets(p=>({...p,[f.key]:!p[f.key]}))}
                            className="px-2 rounded border border-white/10 text-white/40 hover:text-white transition-colors">
                            {showSecrets[f.key]?<EyeOff size={13}/>:<Eye size={13}/>}
                          </button>
                        )}
                      </div>
                      {(f as any).hint && (
                        <p className="text-[10px] mt-1 leading-relaxed" style={{ color:"rgba(255,255,255,0.3)" }}>
                          <i className="fa-solid fa-circle-info mr-1" />{(f as any).hint}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
                {gw.id==="paystack" && (
                  <div className="flex items-center gap-3 pt-2" style={{ borderTop:"1px solid rgba(255,255,255,0.06)" }}>
                    <button type="button" onClick={()=>setPassCharges(v=>!v)}
                      className="relative w-10 h-5 rounded-full transition-colors flex-shrink-0"
                      style={{ background:passCharges?"#10B981":"rgba(255,255,255,0.1)" }}>
                      <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all" style={{ left:passCharges?"calc(100% - 18px)":"2px" }}/>
                    </button>
                    <span className="text-sm" style={{ color:"rgba(255,255,255,0.6)" }}>Pass Paystack charges to customer</span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="p-4 rounded-sm" style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)" }}>
        <p className="text-xs font-bold mb-1" style={{ color:"rgba(255,255,255,0.4)", fontFamily:"var(--font-heading)" }}>
          <i className="fa-solid fa-circle-info mr-1.5" style={{ color:"var(--color-gold)" }}/>Persistence Note
        </p>
        <p className="text-xs" style={{ color:"rgba(255,255,255,0.35)", lineHeight:1.7 }}>
          Settings are saved through <code className="px-1 rounded" style={{ background:"rgba(255,255,255,0.08)" }}>POST /api/settings</code> and persisted in the configured database. The live GBP→GHS rate is available from <code className="px-1 rounded" style={{ background:"rgba(255,255,255,0.08)" }}>GET /api/exchange-rate</code> — update it daily via a cron job or scheduled revalidation.
        </p>
      </div>
    </div>
  );
}
