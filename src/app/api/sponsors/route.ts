import { type NextRequest, NextResponse } from "next/server";
import { getStateValue, setStateValue } from "@/lib/databaseState";
import { query } from "@/lib/db";

async function ensureTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS sponsors (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      logo_url VARCHAR(500),
      website VARCHAR(500),
      tier ENUM('title','gold','silver','bronze','partner') NOT NULL DEFAULT 'partner',
      description TEXT,
      active TINYINT(1) NOT NULL DEFAULT 1,
      featured TINYINT(1) NOT NULL DEFAULT 0,
      sort_order INT NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

export async function GET() {
  try {
    const settings = await getStateValue<any>("settings", {});
    const sponsors = settings.sponsors || [];
    return NextResponse.json({ sponsors });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const settings = await getStateValue<any>("settings", {});
    const sponsors = settings.sponsors || [];
    const newSponsor = { ...body, id: Date.now() };
    await setStateValue("settings", { ...settings, sponsors: [...sponsors, newSponsor] });
    return NextResponse.json({ success: true, sponsor: newSponsor });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 503 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, ...updates } = await req.json();
    const settings = await getStateValue<any>("settings", {});
    const sponsors = (settings.sponsors || []).map((s: any) => s.id === id ? { ...s, ...updates } : s);
    await setStateValue("settings", { ...settings, sponsors });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 503 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    const settings = await getStateValue<any>("settings", {});
    const sponsors = (settings.sponsors || []).filter((s: any) => s.id !== id);
    await setStateValue("settings", { ...settings, sponsors });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 503 });
  }
}
