"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { Card, CardHeader, CardTitle, CardContent, Button, FormGroup, Input, Switch } from "@/components/ui";
import toast from "react-hot-toast";

export default function ContactSettingsPage() {
  const { settings, updateSettings } = useApp();
  const s = settings as any;
  const [saving, setSaving] = useState(false);

  const [email,         setEmail]         = useState(s.contactEmail || "");
  const [phone,         setPhone]         = useState(s.contactPhone || "");
  const [whatsapp,      setWhatsapp]      = useState(s.contactWhatsApp || "");
  const [address,       setAddress]       = useState(s.contactAddress || "");
  const [officeHours,   setOfficeHours]   = useState(s.contactOfficeHours || "Mon–Fri, 9AM–5PM GMT");
  const [mapEmbed,      setMapEmbed]      = useState(s.contactMapEmbed || "");
  const [pageTitle,     setPageTitle]     = useState(s.contactPageTitle || "GET IN TOUCH");
  const [pageSubtitle,  setPageSubtitle]  = useState(s.contactPageSubtitle || "We'd love to hear from you");
  const [enableMap,     setEnableMap]     = useState(s.contactEnableMap !== false);
  const [enablePhone,   setEnablePhone]   = useState(s.contactEnablePhone !== false);
  const [enableWA,      setEnableWA]      = useState(s.contactEnableWhatsApp !== false);

  const handleSave = () => {
    setSaving(true);
    updateSettings({
      contactEmail: email, contactPhone: phone, contactWhatsApp: whatsapp,
      contactAddress: address, contactOfficeHours: officeHours,
      contactMapEmbed: mapEmbed, contactPageTitle: pageTitle,
      contactPageSubtitle: pageSubtitle,
      contactEnableMap: enableMap, contactEnablePhone: enablePhone,
      contactEnableWhatsApp: enableWA,
    } as any);
    setTimeout(() => { setSaving(false); toast.success("Contact page settings saved!"); }, 300);
  };

  const sec = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" };

  return (
    <div className="space-y-6 max-w-3xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white" style={{ fontFamily: "var(--font-display)" }}>CONTACT PAGE SETTINGS</h1>
          <p className="text-xs mt-0.5 text-white/40">All changes persist to the database and reflect on the frontend immediately</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <><i className="fa-solid fa-spinner fa-spin mr-1.5" />Saving…</> : <><i className="fa-solid fa-save mr-1.5" />Save Settings</>}
        </Button>
      </motion.div>

      {/* Page Header */}
      <Card>
        <CardHeader><CardTitle><i className="fa-solid fa-heading mr-2" style={{ color: "var(--color-red)" }} />Page Header</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <FormGroup label="Page Title">
            <Input value={pageTitle} onChange={e => setPageTitle(e.target.value)} placeholder="GET IN TOUCH" />
          </FormGroup>
          <FormGroup label="Page Subtitle">
            <Input value={pageSubtitle} onChange={e => setPageSubtitle(e.target.value)} placeholder="We'd love to hear from you" />
          </FormGroup>
        </CardContent>
      </Card>

      {/* Contact Details */}
      <Card>
        <CardHeader><CardTitle><i className="fa-solid fa-address-book mr-2" style={{ color: "var(--color-red)" }} />Contact Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <FormGroup label="Email Address">
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="info@arsenalghana.com" />
          </FormGroup>
          <div className="grid grid-cols-2 gap-3">
            <FormGroup label="Phone Number">
              <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+233 20 000 0000" />
            </FormGroup>
            <FormGroup label="WhatsApp Number">
              <Input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="+233 20 000 0000" />
            </FormGroup>
          </div>
          <FormGroup label="Office Address">
            <textarea value={address} onChange={e => setAddress(e.target.value)} rows={2} placeholder="123 Example Street, Accra, Ghana"
              className="w-full px-3 py-2 text-sm rounded-sm text-white placeholder-white/30 outline-none resize-none"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
          </FormGroup>
          <FormGroup label="Office Hours">
            <Input value={officeHours} onChange={e => setOfficeHours(e.target.value)} placeholder="Mon–Fri, 9AM–5PM GMT" />
          </FormGroup>
        </CardContent>
      </Card>

      {/* Feature Toggles */}
      <Card>
        <CardHeader><CardTitle><i className="fa-solid fa-toggle-on mr-2" style={{ color: "var(--color-red)" }} />Contact Features</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: "Show Phone Number", sub: "Display phone on the contact page", val: enablePhone, set: setEnablePhone },
            { label: "Show WhatsApp Button", sub: "Direct WhatsApp message link", val: enableWA, set: setEnableWA },
            { label: "Show Google Map", sub: "Embed a map showing your location", val: enableMap, set: setEnableMap },
          ].map(row => (
            <div key={row.label} className="flex items-center justify-between p-3 rounded-sm" style={sec}>
              <div><p className="text-sm font-medium text-white">{row.label}</p><p className="text-xs text-white/40">{row.sub}</p></div>
              <Switch checked={row.val} onChange={() => row.set((p: boolean) => !p)} />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Map Embed */}
      {enableMap && (
        <Card>
          <CardHeader><CardTitle><i className="fa-solid fa-map-location-dot mr-2" style={{ color: "var(--color-red)" }} />Google Maps Embed</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <FormGroup label="Google Maps Embed URL">
              <Input value={mapEmbed} onChange={e => setMapEmbed(e.target.value)}
                placeholder="https://maps.google.com/maps?q=…&output=embed" />
            </FormGroup>
            <p className="text-xs text-white/30">
              Get this from Google Maps: Search your location → Share → Embed a map → Copy the src URL from the iframe code.
            </p>
            {mapEmbed && (
              <div className="rounded-sm overflow-hidden h-40">
                <iframe src={mapEmbed} width="100%" height="160" style={{ border: 0 }} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Preview */}
      <Card>
        <CardHeader><CardTitle><i className="fa-solid fa-eye mr-2" style={{ color: "var(--color-red)" }} />Live Preview</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2.5">
            {email && (
              <div className="flex items-center gap-3 text-sm">
                <i className="fa-solid fa-envelope w-4" style={{ color: "var(--color-red)" }} />
                <span className="text-white/70">{email}</span>
              </div>
            )}
            {enablePhone && phone && (
              <div className="flex items-center gap-3 text-sm">
                <i className="fa-solid fa-phone w-4" style={{ color: "var(--color-red)" }} />
                <span className="text-white/70">{phone}</span>
              </div>
            )}
            {enableWA && whatsapp && (
              <div className="flex items-center gap-3 text-sm">
                <i className="fa-brands fa-whatsapp w-4" style={{ color: "#25D366" }} />
                <span className="text-white/70">{whatsapp}</span>
              </div>
            )}
            {address && (
              <div className="flex items-start gap-3 text-sm">
                <i className="fa-solid fa-location-dot w-4 mt-0.5" style={{ color: "var(--color-red)" }} />
                <span className="text-white/70">{address}</span>
              </div>
            )}
            {officeHours && (
              <div className="flex items-center gap-3 text-sm">
                <i className="fa-solid fa-clock w-4" style={{ color: "var(--color-gold)" }} />
                <span className="text-white/70">{officeHours}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
