"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useApp } from "@/context/AppContext";
import toast from "react-hot-toast";

const TARGET_SCHEMA_VERSION = "2.1.0";

function UpgradePanel({
  onBackupFirst,
  hasBackup,
  backupsCount,
  schemaVersion,
  onVersionChange,
}: {
  onBackupFirst: () => void;
  hasBackup: boolean;
  backupsCount: number;
  schemaVersion: string | null;
  onVersionChange: () => void;
}) {
  const sqlRef = useRef<HTMLInputElement>(null);
  const [sqlContent, setSqlContent] = useState("");
  const [sqlFileName, setSqlFileName] = useState("");
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [phase, setPhase] = useState<"idle"|"review"|"done">("idle");
  const [builtinUpgrading, setBuiltinUpgrading] = useState(false);

  const runBuiltinUpgrade = async () => {
    if (!hasBackup) {
      toast.error("Please create a backup first!");
      return;
    }
    setBuiltinUpgrading(true);
    try {
      const res = await fetch("/api/admin/system", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "upgrade", targetVersion: TARGET_SCHEMA_VERSION }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success(data.message || `Upgraded to v${TARGET_SCHEMA_VERSION}`);
        setPhase("done");
        onVersionChange();
      } else {
        const failed = (data.results as { step: string; ok: boolean; detail?: string }[] | undefined)?.filter((r) => !r.ok);
        toast.error(failed?.[0]?.detail || data.message || "Upgrade had errors");
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Upgrade failed");
    } finally {
      setBuiltinUpgrading(false);
    }
  };

  const readSql = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    if (!f.name.endsWith(".sql") && !f.name.endsWith(".json")) {
      toast.error("Only .sql or .json files"); return;
    }
    const r = new FileReader();
    r.onloadend = () => { setSqlContent(r.result as string); setSqlFileName(f.name); setPhase("review"); };
    r.readAsText(f);
  };

  const applyUpgrade = async () => {
    if (!hasBackup) { toast.error("Please create a backup first!"); return; }
    setApplying(true);
    try {
      const res = await fetch("/api/admin/system", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "migrate", sql: sqlContent }),
      });
      const data = await res.json();
      if (data.ok) {
        setApplying(false); setApplied(true); setPhase("done");
        toast.success(`Migration applied — ${data.results?.length || 0} statement(s) executed`);
      } else {
        setApplying(false);
        toast.error(data.error || "Migration failed");
      }
    } catch (e: unknown) {
      setApplying(false);
      toast.error(e instanceof Error ? e.message : "Could not reach database — check DATABASE_URL");
    }
  };

  return (
    <div id="upgrade" className="space-y-3">
      <input ref={sqlRef} type="file" accept=".sql,.json" className="hidden" onChange={readSql} />

      {phase==="idle" && (
        <div className="flex flex-wrap gap-2">
          {!hasBackup && (
            <button onClick={onBackupFirst} className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-sm"
              style={{ background:"rgba(198,168,75,0.15)", border:"1px solid rgba(198,168,75,0.3)", color:"var(--color-gold)", fontFamily:"var(--font-heading)" }}>
              <i className="fa-solid fa-database" />Create Backup First
            </button>
          )}
          {schemaVersion !== TARGET_SCHEMA_VERSION && (
            <button onClick={runBuiltinUpgrade} disabled={builtinUpgrading || !hasBackup}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-sm disabled:opacity-50"
              style={{ background:"rgba(34,197,94,0.15)", border:"1px solid rgba(34,197,94,0.35)", color:"#22C55E", fontFamily:"var(--font-heading)" }}>
              {builtinUpgrading
                ? <><i className="fa-solid fa-spinner fa-spin" />Upgrading...</>
                : <><i className="fa-solid fa-bolt" />Upgrade to v{TARGET_SCHEMA_VERSION}</>}
            </button>
          )}
          <button onClick={()=>sqlRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-sm"
            style={{ background:"rgba(59,130,246,0.15)", border:"1px solid rgba(59,130,246,0.3)", color:"#3B82F6", fontFamily:"var(--font-heading)" }}>
            <i className="fa-solid fa-upload" />Upload Schema File (.sql / .json)
          </button>
        </div>
      )}

      {phase==="review" && (
        <div className="space-y-3">
          <div className="p-4 rounded-sm" style={{ background:"rgba(59,130,246,0.08)", border:"1px solid rgba(59,130,246,0.2)" }}>
            <div className="flex items-center gap-2 mb-2">
              <i className="fa-solid fa-file-code" style={{ color:"#3B82F6" }} />
              <p className="text-sm font-bold text-white" style={{ fontFamily:"var(--font-heading)" }}>{sqlFileName}</p>
              <span className="text-[10px] px-2 py-0.5 rounded" style={{ background:"rgba(59,130,246,0.2)", color:"#3B82F6" }}>{Math.round(sqlContent.length/1024)} KB</span>
            </div>
            <pre className="text-[10px] max-h-32 overflow-y-auto p-2 rounded" style={{ background:"rgba(0,0,0,0.4)", color:"rgba(255,255,255,0.6)", fontFamily:"monospace" }}>
              {sqlContent.slice(0,800)}{sqlContent.length>800?"...":""}
            </pre>
          </div>
          <div className="flex gap-2">
            <button onClick={()=>setPhase("idle")} className="px-4 py-2 text-xs font-bold rounded-sm"
              style={{ border:"1px solid rgba(255,255,255,0.1)", color:"rgba(255,255,255,0.5)", fontFamily:"var(--font-heading)" }}>
              Cancel
            </button>
            {!hasBackup && (
              <p className="text-xs flex items-center gap-1" style={{ color:"#F59E0B" }}>
                <i className="fa-solid fa-triangle-exclamation" />Create a backup before applying
              </p>
            )}
            <button onClick={applyUpgrade} disabled={applying}
              className="btn-arsenal flex items-center gap-2 px-4 py-2 text-xs">
              {applying?<><i className="fa-solid fa-spinner fa-spin"/>Applying...</>:<><i className="fa-solid fa-play"/>Apply Upgrade</>}
            </button>
          </div>
        </div>
      )}

      {phase==="done" && (
        <div className="p-4 rounded-sm flex items-center gap-3" style={{ background:"rgba(34,197,94,0.08)", border:"1px solid rgba(34,197,94,0.2)" }}>
          <i className="fa-solid fa-circle-check text-2xl" style={{ color:"#22C55E" }} />
          <div>
            <p className="text-sm font-bold" style={{ color:"#22C55E", fontFamily:"var(--font-heading)" }}>Upgrade Applied</p>
            <p className="text-xs" style={{ color:"rgba(255,255,255,0.4)" }}>Schema updated from {sqlFileName}</p>
          </div>
          <button onClick={()=>{setPhase("idle");setSqlContent("");setSqlFileName("");setApplied(false);}} className="ml-auto text-xs px-3 py-1.5 rounded-sm"
            style={{ border:"1px solid rgba(255,255,255,0.1)", color:"rgba(255,255,255,0.5)", fontFamily:"var(--font-heading)" }}>
            Reset
          </button>
        </div>
      )}

      {/* ── SCHEMA UPGRADE / DATABASE UPDATE ──────────────────────────────── */}
      <div className="p-5 rounded-sm space-y-4" style={{ background:"#16213E", border:"1px solid rgba(59,130,246,0.25)" }}>
        <h2 className="text-sm font-black uppercase tracking-wider flex items-center gap-2"
          style={{ fontFamily:"var(--font-heading)", color:"#3B82F6" }}>
          <i className="fa-solid fa-database" />Database Upgrade / Schema Migration
        </h2>
        <p className="text-xs" style={{ color:"rgba(255,255,255,0.45)", fontFamily:"var(--font-body)", lineHeight:1.7 }}>
          Upload a <code className="px-1 rounded" style={{ background:"rgba(255,255,255,0.08)" }}>.sql</code> or <code className="px-1 rounded" style={{ background:"rgba(255,255,255,0.08)" }}>.json</code> file to upgrade the database schema or migrate data.
          SQL files run against your MySQL server; JSON files import as a data restore.
          <strong className="text-yellow-400"> Always create a backup first.</strong>
        </p>

        {/* Current schema version */}
        <div className="flex items-center gap-3 p-3 rounded-sm" style={{ background:"rgba(59,130,246,0.06)", border:"1px solid rgba(59,130,246,0.15)" }}>
          <i className="fa-solid fa-code-branch text-blue-400" />
          <div>
            <p className="text-xs font-bold text-white" style={{ fontFamily:"var(--font-heading)" }}>
              Schema: v{schemaVersion ?? "unknown"} · App: v{TARGET_SCHEMA_VERSION}
            </p>
            <p className="text-[10px]" style={{ color:"rgba(255,255,255,0.4)" }}>
              {schemaVersion === TARGET_SCHEMA_VERSION ? "Database is up to date" : `Upgrade available to v${TARGET_SCHEMA_VERSION}`}
            </p>
          </div>
          <a href="/database/schema.sql" download className="ml-auto text-xs font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-sm"
            style={{ background:"rgba(59,130,246,0.15)", color:"#3B82F6", border:"1px solid rgba(59,130,246,0.3)", fontFamily:"var(--font-heading)" }}>
            <i className="fa-solid fa-download text-[10px]" />Download Schema
          </a>
        </div>

        {/* Upload steps */}
        <div className="space-y-2">
          {[
            { step:"1", label:"Create a backup", desc:"Always backup before upgrading", icon:"fa-solid fa-database", done:backupsCount>0 },
            { step:"2", label:"Upload SQL or JSON file", desc:"Schema migration or data import", icon:"fa-solid fa-upload", done:false },
            { step:"3", label:"Review & Apply", desc:"Confirm before executing", icon:"fa-solid fa-play", done:false },
          ].map(s => (
            <div key={s.step} className="flex items-center gap-3 p-3 rounded-sm" style={{ background:"rgba(255,255,255,0.03)", border:`1px solid ${s.done?"rgba(34,197,94,0.2)":"rgba(255,255,255,0.06)"}` }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                style={{ background:s.done?"rgba(34,197,94,0.2)":"rgba(59,130,246,0.15)", color:s.done?"#22C55E":"#3B82F6" }}>
                {s.done?<i className="fa-solid fa-check text-[10px]"/>:s.step}
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-white" style={{ fontFamily:"var(--font-heading)" }}>{s.label}</p>
                <p className="text-[10px]" style={{ color:"rgba(255,255,255,0.35)" }}>{s.desc}</p>
              </div>
              <i className={`${s.icon} text-sm`} style={{ color:"rgba(255,255,255,0.2)" }} />
            </div>
          ))}
        </div>

        {/* Schema migration section above handles the upgrade flow */}
      </div>

    </div>
  );
}

export default function DatabasePage() {
  const {
    backups, createBackup, restoreBackup, deleteBackup,
    members, tickets, events, posts, products,
    setMembers, setTickets, setEvents, setPosts, setProducts,
    setDonations, setExco, resetSettings,
  } = useApp();

  const [schemaVersion, setSchemaVersion] = useState<string | null>(null);

  const loadSchemaVersion = useCallback(() => {
    fetch("/api/admin/system?action=version", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.schemaVersion) setSchemaVersion(data.schemaVersion);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadSchemaVersion();
  }, [loadSchemaVersion]);

  const [creating, setCreating]     = useState(false);
  const [restoreId, setRestoreId]   = useState<number|null>(null);
  const [label, setLabel]           = useState("");
  const [wipePhase, setWipePhase]   = useState<"idle"|"confirm"|"typing">("idle");
  const [wipeInput, setWipeInput]   = useState("");
  const [wiping, setWiping]         = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  // ── Create backup ──────────────────────────────────────────────────────────
  const handleCreate = async () => {
    setCreating(true);
    const lbl = label.trim() || `Manual Backup — ${new Date().toLocaleString()}`;
    try {
      const res = await fetch("/api/admin/system", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "backup", label: lbl }),
      });
      const data = await res.json();
      if (data.ok && data.backup) {
        // Save to AppContext as well for the local list
        createBackup(data.backup.label || lbl);
        toast.success("Backup created & saved to database!");
      } else {
        createBackup(lbl); // fallback local only
        toast.success("Backup created (local)");
      }
    } catch {
      createBackup(lbl);
      toast.success("Backup created!");
    }
    setLabel(""); setCreating(false);
  };

  // ── Restore backup ─────────────────────────────────────────────────────────
  const handleRestore = () => {
    if (!restoreId) return;
    restoreBackup(restoreId);
    setRestoreId(null);
    toast.success("Backup restored — all data updated");
  };

  // ── Download backup ────────────────────────────────────────────────────────
  const handleDownload = (backup: typeof backups[0]) => {
    const blob = new Blob([backup.data], { type:"application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `asc-ghana-backup-${backup.id}.json`;
    a.click();
    toast.success("Backup downloaded");
  };

  // ── Import backup ──────────────────────────────────────────────────────────
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        JSON.parse(reader.result as string); // validate JSON
        createBackup(`Imported: ${file.name}`);
        toast.success("File imported as backup — apply via Restore");
      } catch { toast.error("Invalid backup file — must be JSON"); }
    };
    reader.readAsText(file);
  };

  // ── WIPE ALL DATA ─────────────────────────────────────────────────────────
  const handleWipe = async () => {
    if (wipeInput !== "WIPE ALL DATA") {
      toast.error('Type exactly: WIPE ALL DATA');
      return;
    }
    setWiping(true);
    await new Promise(r => setTimeout(r,1000));

    // Create backup first before wiping
    createBackup(`Auto-backup before wipe — ${new Date().toLocaleString()}`);

    // Clear all data
    setMembers([]);
    setTickets([]);
    setEvents([]);
    setPosts([]);
    setProducts([]);
    setDonations([]);
    setExco([]);
    resetSettings();

    setWiping(false);
    setWipePhase("idle");
    setWipeInput("");
    toast.success("✅ All data wiped. A backup was created first.");
  };

  const dataStats = [
    { label:"Members",  value:members.length,  icon:"fa-solid fa-users",         color:"#EF0107" },
    { label:"Tickets",  value:tickets.length,  icon:"fa-solid fa-ticket",         color:"#F59E0B" },
    { label:"Events",   value:events.length,   icon:"fa-solid fa-calendar-days",  color:"#C6A84B" },
    { label:"Posts",    value:posts.length,    icon:"fa-solid fa-newspaper",      color:"#3B82F6" },
    { label:"Products", value:products.length, icon:"fa-solid fa-bag-shopping",   color:"#10B981" },
    { label:"Backups",  value:backups.length,  icon:"fa-solid fa-database",       color:"#8B5CF6" },
  ];

  return (
    <div className="max-w-4xl space-y-5">
      <div>
        <h1 className="text-2xl font-black text-white" style={{ fontFamily:"var(--font-display)" }}>DATABASE & BACKUP</h1>
        <p className="text-xs mt-0.5" style={{ color:"rgba(255,255,255,0.4)" }}>Backup, restore and manage all Arsenal Ghana website data</p>
      </div>

      {/* Data overview */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {dataStats.map(s => (
          <div key={s.label} className="p-3 rounded-sm text-center" style={{ background:"#16132A", border:"1px solid rgba(255,255,255,0.06)" }}>
            <i className={`${s.icon} text-xl mb-2 block`} style={{ color:s.color }} />
            <p className="text-xl font-black text-white" style={{ fontFamily:"var(--font-display)" }}>{s.value}</p>
            <p className="text-[10px] mt-0.5" style={{ color:"rgba(255,255,255,0.35)", fontFamily:"var(--font-body)" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Create Backup */}
      <div className="p-5 rounded-sm space-y-3" style={{ background:"#16213E", border:"1px solid rgba(255,255,255,0.06)" }}>
        <h2 className="text-sm font-black text-white uppercase tracking-wider" style={{ fontFamily:"var(--font-heading)" }}>
          <i className="fa-solid fa-plus mr-2" style={{ color:"var(--color-red)" }} />Create Backup
        </h2>
        <div className="flex gap-2">
          <input value={label} onChange={e=>setLabel(e.target.value)} placeholder="Backup label (optional)"
            className="input-arsenal flex-1 text-sm" />
          <button onClick={handleCreate} disabled={creating}
            className="btn-arsenal px-5 py-2 text-sm whitespace-nowrap flex items-center gap-2">
            {creating
              ? <><i className="fa-solid fa-spinner fa-spin" />Creating...</>
              : <><i className="fa-solid fa-database" />Create Backup</>}
          </button>
        </div>
        <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
        <button onClick={()=>importRef.current?.click()}
          className="flex items-center gap-2 text-xs px-3 py-2 transition-colors hover:bg-white/10"
          style={{ border:"1px solid rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.5)", fontFamily:"var(--font-heading)" }}>
          <i className="fa-solid fa-upload" />Import from JSON file
        </button>
      </div>

      {/* Restore confirmation modal */}
      {restoreId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background:"rgba(0,0,0,0.7)" }}>
          <div className="p-6 rounded-sm max-w-sm w-full" style={{ background:"#16213E", border:"1px solid rgba(239,1,7,0.3)" }}>
            <i className="fa-solid fa-rotate-left text-2xl mb-3 block" style={{ color:"var(--color-red)" }} />
            <h3 className="text-lg font-black text-white mb-2" style={{ fontFamily:"var(--font-display)" }}>Restore Backup?</h3>
            <p className="text-sm mb-5" style={{ color:"rgba(255,255,255,0.5)" }}>
              This will replace all current data with the selected backup. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={()=>setRestoreId(null)} className="flex-1 px-4 py-2 text-sm transition-colors hover:bg-white/5"
                style={{ border:"1px solid rgba(255,255,255,0.12)", color:"rgba(255,255,255,0.5)" }}>Cancel</button>
              <button onClick={handleRestore} className="flex-1 btn-arsenal py-2 text-sm">Restore Now</button>
            </div>
          </div>
        </div>
      )}

      {/* Backups list */}
      <div className="p-5 rounded-sm space-y-3" style={{ background:"#16213E", border:"1px solid rgba(255,255,255,0.06)" }}>
        <h2 className="text-sm font-black text-white uppercase tracking-wider" style={{ fontFamily:"var(--font-heading)" }}>
          <i className="fa-solid fa-clock-rotate-left mr-2" style={{ color:"var(--color-red)" }} />Saved Backups
          <span className="ml-2 text-xs font-normal" style={{ color:"rgba(255,255,255,0.3)" }}>({backups.length}/10)</span>
        </h2>
        {backups.length === 0 ? (
          <div className="py-8 text-center rounded-sm" style={{ border:"1px dashed rgba(255,255,255,0.08)" }}>
            <i className="fa-solid fa-database text-3xl mb-3 block" style={{ color:"rgba(255,255,255,0.1)" }} />
            <p className="text-sm" style={{ color:"rgba(255,255,255,0.3)" }}>No backups yet — create one above</p>
          </div>
        ) : (
          <div className="space-y-2">
            {backups.map(b => (
              <div key={b.id} className="flex items-center gap-3 p-3 rounded-sm"
                style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.05)" }}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate" style={{ fontFamily:"var(--font-body)" }}>{b.label}</p>
                  <p className="text-xs mt-0.5" style={{ color:"rgba(255,255,255,0.3)" }}>
                    {new Date(b.createdAt).toLocaleString()} · {b.size}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={()=>handleDownload(b)} title="Download"
                    className="p-2 transition-colors hover:text-white" style={{ color:"rgba(255,255,255,0.35)" }}>
                    <i className="fa-solid fa-download text-sm" />
                  </button>
                  <button onClick={()=>setRestoreId(b.id)} title="Restore"
                    className="p-2 transition-colors hover:text-green-400" style={{ color:"rgba(255,255,255,0.35)" }}>
                    <i className="fa-solid fa-rotate-left text-sm" />
                  </button>
                  <button onClick={()=>{ deleteBackup(b.id); toast.success("Backup deleted"); }} title="Delete"
                    className="p-2 transition-colors hover:text-red-400" style={{ color:"rgba(255,255,255,0.35)" }}>
                    <i className="fa-solid fa-trash text-sm" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── WIPE ALL DATA ──────────────────────────────────────────────────── */}
      <div className="p-5 rounded-sm" style={{ background:"rgba(231,76,60,0.06)", border:"1px solid rgba(231,76,60,0.25)" }}>
        <h2 className="text-sm font-black mb-1 uppercase tracking-wider flex items-center gap-2"
          style={{ fontFamily:"var(--font-heading)", color:"#E74C3C" }}>
          <i className="fa-solid fa-triangle-exclamation" />Danger Zone — Wipe All Data
        </h2>
        <p className="text-xs mb-4" style={{ color:"rgba(255,255,255,0.45)", fontFamily:"var(--font-body)" }}>
          Permanently deletes all members, tickets, events, posts, products, donations and resets settings.
          A backup is created automatically before wiping.
        </p>

        {wipePhase === "idle" && (
          <button onClick={()=>setWipePhase("confirm")}
            className="flex items-center gap-2 px-5 py-2.5 text-sm transition-all hover:opacity-90"
            style={{ background:"rgba(231,76,60,0.15)", border:"1px solid rgba(231,76,60,0.4)", color:"#E74C3C", fontFamily:"var(--font-heading)" }}>
            <i className="fa-solid fa-trash-can" />Wipe All Data
          </button>
        )}

        {wipePhase === "confirm" && (
          <div className="space-y-3">
            <div className="p-4 rounded-sm" style={{ background:"rgba(231,76,60,0.1)", border:"1px solid rgba(231,76,60,0.3)" }}>
              <p className="text-sm font-bold mb-2" style={{ color:"#E74C3C", fontFamily:"var(--font-heading)" }}>
                ⚠ Are you absolutely sure?
              </p>
              <p className="text-xs" style={{ color:"rgba(255,255,255,0.5)", fontFamily:"var(--font-body)" }}>
                This will delete <strong className="text-white">{members.length} members</strong>,{" "}
                <strong className="text-white">{tickets.length} tickets</strong>,{" "}
                <strong className="text-white">{events.length} events</strong> and all other data.
                This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={()=>setWipePhase("idle")}
                className="px-5 py-2 text-sm transition-colors hover:bg-white/5"
                style={{ border:"1px solid rgba(255,255,255,0.12)", color:"rgba(255,255,255,0.5)", fontFamily:"var(--font-heading)" }}>
                Cancel
              </button>
              <button onClick={()=>setWipePhase("typing")}
                className="px-5 py-2 text-sm flex items-center gap-2"
                style={{ background:"rgba(231,76,60,0.2)", border:"1px solid rgba(231,76,60,0.4)", color:"#E74C3C", fontFamily:"var(--font-heading)" }}>
                <i className="fa-solid fa-arrow-right" />Yes, proceed to confirmation
              </button>
            </div>
          </div>
        )}

        {wipePhase === "typing" && (
          <div className="space-y-3">
            <div className="p-4 rounded-sm" style={{ background:"rgba(231,76,60,0.08)", border:"1px solid rgba(231,76,60,0.25)" }}>
              <p className="text-xs font-bold mb-2" style={{ color:"#E74C3C", fontFamily:"var(--font-heading)" }}>
                Type exactly to confirm:
              </p>
              <p className="text-sm font-mono font-black text-white tracking-widest mb-3">WIPE ALL DATA</p>
              <input
                type="text"
                value={wipeInput}
                onChange={e => setWipeInput(e.target.value)}
                placeholder="Type: WIPE ALL DATA"
                className="input-arsenal font-mono tracking-wider"
                style={{ borderColor: wipeInput === "WIPE ALL DATA" ? "#2ECC71" : "rgba(231,76,60,0.4)" }}
                autoFocus
              />
              {wipeInput === "WIPE ALL DATA" && (
                <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color:"#2ECC71" }}>
                  <i className="fa-solid fa-circle-check" />Confirmation accepted
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={()=>{ setWipePhase("idle"); setWipeInput(""); }}
                className="px-5 py-2 text-sm transition-colors hover:bg-white/5"
                style={{ border:"1px solid rgba(255,255,255,0.12)", color:"rgba(255,255,255,0.5)", fontFamily:"var(--font-heading)" }}>
                Cancel
              </button>
              <button onClick={handleWipe} disabled={wipeInput !== "WIPE ALL DATA" || wiping}
                className="px-5 py-2 text-sm flex items-center gap-2 transition-all disabled:opacity-40"
                style={{ background: wipeInput === "WIPE ALL DATA" ? "rgba(231,76,60,0.3)" : "rgba(231,76,60,0.1)", border:"1px solid rgba(231,76,60,0.5)", color:"#E74C3C", fontFamily:"var(--font-heading)" }}>
                {wiping
                  ? <><i className="fa-solid fa-spinner fa-spin" />Wiping...</>
                  : <><i className="fa-solid fa-trash-can" />Confirm Wipe All Data</>
                }
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── SCHEMA UPGRADE / DATABASE UPDATE ──────────────────────────────── */}
      <div className="p-5 rounded-sm space-y-4" style={{ background:"#16213E", border:"1px solid rgba(59,130,246,0.25)" }}>
        <h2 className="text-sm font-black uppercase tracking-wider flex items-center gap-2"
          style={{ fontFamily:"var(--font-heading)", color:"#3B82F6" }}>
          <i className="fa-solid fa-database" />Database Upgrade / Schema Migration
        </h2>
        <p className="text-xs" style={{ color:"rgba(255,255,255,0.45)", fontFamily:"var(--font-body)", lineHeight:1.7 }}>
          Upload a <code className="px-1 rounded" style={{ background:"rgba(255,255,255,0.08)" }}>.sql</code> or <code className="px-1 rounded" style={{ background:"rgba(255,255,255,0.08)" }}>.json</code> file to upgrade the database schema or migrate data.
          SQL files run against your MySQL server; JSON files import as a data restore.
          <strong className="text-yellow-400"> Always create a backup first.</strong>
        </p>

        {/* Current schema version */}
        <div className="flex items-center gap-3 p-3 rounded-sm" style={{ background:"rgba(59,130,246,0.06)", border:"1px solid rgba(59,130,246,0.15)" }}>
          <i className="fa-solid fa-code-branch text-blue-400" />
          <div>
            <p className="text-xs font-bold text-white" style={{ fontFamily:"var(--font-heading)" }}>
              Schema: v{schemaVersion ?? "unknown"} · App: v{TARGET_SCHEMA_VERSION}
            </p>
            <p className="text-[10px]" style={{ color:"rgba(255,255,255,0.4)" }}>
              {schemaVersion === TARGET_SCHEMA_VERSION ? "Database is up to date" : `Upgrade available to v${TARGET_SCHEMA_VERSION}`}
            </p>
          </div>
          <a href="/database/schema.sql" download className="ml-auto text-xs font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-sm"
            style={{ background:"rgba(59,130,246,0.15)", color:"#3B82F6", border:"1px solid rgba(59,130,246,0.3)", fontFamily:"var(--font-heading)" }}>
            <i className="fa-solid fa-download text-[10px]" />Download Schema
          </a>
        </div>

        {/* Upload steps */}
        <div className="space-y-2">
          {[
            { step:"1", label:"Create a backup", desc:"Always backup before upgrading", icon:"fa-solid fa-database", done:backups.length>0 },
            { step:"2", label:"Upload SQL or JSON file", desc:"Schema migration or data import", icon:"fa-solid fa-upload", done:false },
            { step:"3", label:"Review & Apply", desc:"Confirm before executing", icon:"fa-solid fa-play", done:false },
          ].map(s => (
            <div key={s.step} className="flex items-center gap-3 p-3 rounded-sm" style={{ background:"rgba(255,255,255,0.03)", border:`1px solid ${s.done?"rgba(34,197,94,0.2)":"rgba(255,255,255,0.06)"}` }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                style={{ background:s.done?"rgba(34,197,94,0.2)":"rgba(59,130,246,0.15)", color:s.done?"#22C55E":"#3B82F6" }}>
                {s.done?<i className="fa-solid fa-check text-[10px]"/>:s.step}
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-white" style={{ fontFamily:"var(--font-heading)" }}>{s.label}</p>
                <p className="text-[10px]" style={{ color:"rgba(255,255,255,0.35)" }}>{s.desc}</p>
              </div>
              <i className={`${s.icon} text-sm`} style={{ color:"rgba(255,255,255,0.2)" }} />
            </div>
          ))}
        </div>

        <UpgradePanel
          onBackupFirst={handleCreate}
          hasBackup={backups.length > 0}
          backupsCount={backups.length}
          schemaVersion={schemaVersion}
          onVersionChange={loadSchemaVersion}
        />
      </div>

    </div>
  );
}
