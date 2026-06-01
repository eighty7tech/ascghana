"use client";
import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Card, CardContent, Button, Input, FormGroup, RichTextField } from "@/components/ui";
import toast from "react-hot-toast";

export default function AdminHistoryPage() {
  const { settings, updateSettings } = useApp();
  const [title, setTitle] = useState(settings.historyTitle||"OUR HISTORY");
  const [content, setContent] = useState(settings.historyContent||"");
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    updateSettings({ historyTitle:title, historyContent:content });
    setTimeout(() => { setSaving(false); toast.success("History page saved!"); }, 400);
  };

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white" style={{ fontFamily:"var(--font-display)" }}>HISTORY PAGE</h1>
          <p className="text-xs mt-0.5" style={{ color:"rgba(255,255,255,0.4)" }}>Edit the club history content shown at /history</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <><i className="fa-solid fa-spinner fa-spin" />Saving…</> : <><i className="fa-solid fa-floppy-disk" />Save Changes</>}
        </Button>
      </div>

      <Card>
        <CardContent className="space-y-4">
          <FormGroup label="Page Title" icon="fa-solid fa-heading">
            <Input value={title} onChange={e=>setTitle(e.target.value)} placeholder="OUR HISTORY" />
          </FormGroup>
          <FormGroup label="History Content" icon="fa-solid fa-align-left" hint="Use the toolbar for headings, lists, links, and formatting.">
            <RichTextField value={content} onChange={setContent} placeholder="Write your club history…" minHeight={320} />
          </FormGroup>
        </CardContent>
      </Card>
    </div>
  );
}
