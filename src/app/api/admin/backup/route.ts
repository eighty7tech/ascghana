import { type NextRequest, NextResponse } from "next/server";
import { getStateValue, setStateValue } from "@/lib/databaseState";
import { query } from "@/lib/db";

async function ensure() {
  await query(`CREATE TABLE IF NOT EXISTS backup_registry (
    id INT AUTO_INCREMENT PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    size_bytes BIGINT DEFAULT NULL,
    type ENUM('full','settings','members','media') NOT NULL DEFAULT 'full',
    status ENUM('complete','failed','partial') NOT NULL DEFAULT 'complete',
    created_by VARCHAR(100) DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
}

const ALL_KEYS = ["settings","members","tickets","matchTickets","events","posts","donations","products","exco","suggestions","tiers","gallery","adminAccounts"];

export async function GET(req: NextRequest) {
  try {
    await ensure();
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action") || "list";
    const filename = searchParams.get("filename");

    if (action === "list") {
      const rows = await query("SELECT * FROM backup_registry ORDER BY created_at DESC LIMIT 50") as any[];
      return NextResponse.json({ backups: rows });
    }
    if (action === "download-settings") {
      const settings = await getStateValue<any>("settings", {});
      const json = JSON.stringify({ type:"settings", version:"1.0.0", exportedAt: new Date().toISOString(), settings }, null, 2);
      return new NextResponse(json, { headers: { "Content-Type":"application/json", "Content-Disposition":`attachment; filename="asc-settings-${Date.now()}.json"` } });
    }
    if (action === "download") {
      const data: Record<string,any> = {};
      for (const k of ALL_KEYS) { try { data[k] = await getStateValue<any>(k, null); } catch {} }
      const json = JSON.stringify({ type:"full", version:"1.0.0", exportedAt: new Date().toISOString(), data }, null, 2);
      return new NextResponse(json, { headers: { "Content-Type":"application/json", "Content-Disposition":`attachment; filename="${filename||"backup.json"}"` } });
    }
    return NextResponse.json({ error:"Unknown action" }, { status:400 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status:503 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensure();
    const { type = "full" } = await req.json();
    const data: Record<string,any> = {};
    let size = 0;
    for (const k of ALL_KEYS) { try { const v = await getStateValue<any>(k,null); data[k]=v; size+=JSON.stringify(v||{}).length; } catch {} }
    const filename = `asc-backup-${type}-${new Date().toISOString().replace(/[:.]/g,"-").slice(0,19)}.json`;
    await query("INSERT INTO backup_registry (filename,size_bytes,type) VALUES (?,?,?)",[filename,size,type]);
    return NextResponse.json({ success:true, filename, size });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Backup failed" }, { status:503 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { data } = await req.json();
    if (!data) return NextResponse.json({ error:"No data" }, { status:400 });
    let restored = 0;
    for (const [key,value] of Object.entries(data)) {
      if (value!=null) { try { await setStateValue(key,value); restored++; } catch {} }
    }
    return NextResponse.json({ success:true, restored });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Restore failed" }, { status:503 });
  }
}
