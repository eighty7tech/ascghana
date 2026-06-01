import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getDbVersion, runUpgradeV170 } from "@/lib/migrations/upgrade-v1.7.0";
import { runUpgradeV180 } from "@/lib/migrations/upgrade-v1.8.0";
import { runUpgradeV190 } from "@/lib/migrations/upgrade-v1.9.0";
import { runUpgradeV200 } from "@/lib/migrations/upgrade-v2.0.0";
import { runUpgradeV210 } from "@/lib/migrations/upgrade-v2.1.0";
import { getAdminSession } from "@/lib/sessionAuth";

const APP_VERSION = "2.1.0";

async function requireAdmin() {
  const admin = await getAdminSession();
  if (!admin) return null;
  return admin;
}

// GET /api/admin/system?action=status|version
export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 401 });
  }

  const action = req.nextUrl.searchParams.get("action");

  if (action === "status") {
    try {
      const rows = await query<{ version: string }>("SELECT version() as version", []);
      const tables = await query<{ Tables_in_db: string }>("SHOW TABLES", []);
      const schemaVersion = await getDbVersion();
      return NextResponse.json({
        ok: true,
        dbVersion: (rows as { version?: string }[])[0]?.version,
        schemaVersion,
        appVersion: APP_VERSION,
        tables: Array.isArray(tables) ? tables.length : 0,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return NextResponse.json({ ok: false, error: msg }, { status: 500 });
    }
  }

  if (action === "version") {
    try {
      const schemaVersion = await getDbVersion();
      return NextResponse.json({ ok: true, schemaVersion, appVersion: APP_VERSION });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return NextResponse.json({ ok: false, error: msg }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(()=>({}));
    const { action } = body as { action: string; sql?:string; label?:string; targetVersion?: string };

    if (action === "backup") {
      const rows = await query<{key:string; value:string; updated_at:string}>(
        "SELECT `key`, `value`, updated_at FROM app_state ORDER BY `key`",[]
      );
      const members = await query<any>("SELECT * FROM members ORDER BY id",[]);
      const events  = await query<any>("SELECT * FROM events ORDER BY id",[]);
      const backup  = {
        version: APP_VERSION,
        created_at: new Date().toISOString(),
        label: body.label || `Backup ${new Date().toISOString().slice(0,19).replace("T"," ")}`,
        app_state: rows,
        members: members.length,
        events: events.length,
        data: { app_state: rows },
      };
      return NextResponse.json({ ok:true, backup });
    }

    if (action === "upgrade") {
      const targetVersion = (body as { targetVersion?: string }).targetVersion || "2.1.0";
      const result =
        targetVersion === "1.7.0" ? await runUpgradeV170()
        : targetVersion === "1.8.0" ? await runUpgradeV180()
        : targetVersion === "1.9.0" ? await runUpgradeV190()
        : targetVersion === "2.0.0" ? await runUpgradeV200()
        : await runUpgradeV210();
      const schemaVersion = await getDbVersion();
      return NextResponse.json({
        ok: result.ok,
        results: result.results,
        schemaVersion,
        appVersion: APP_VERSION,
        message: result.ok
          ? `Database upgraded to v${result.version}`
          : "Upgrade completed with errors — review step results",
      });
    }

    if (action === "migrate") {
      const { sql } = body as { sql: string };
      if (!sql?.trim()) return NextResponse.json({ error: "No SQL provided" }, { status: 400 });

      const blocked = /\b(DROP\s+DATABASE|DROP\s+TABLE|TRUNCATE|DELETE\s+FROM|GRANT|REVOKE)\b/i;
      if (blocked.test(sql)) {
        return NextResponse.json({ error: "Destructive SQL is not allowed" }, { status: 400 });
      }

      const statements = sql
        .replace(/DELIMITER\s+\S+/gi, "")
        .split(/;\s*\n/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !s.startsWith("--"));

      const results: string[] = [];
      for (const stmt of statements) {
        if (/^(USE|SET\s+NAMES|SET\s+FOREIGN_KEY)/i.test(stmt)) continue;
        try {
          await query(stmt, []);
          results.push(`OK: ${stmt.slice(0, 80)}…`);
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e);
          results.push(`ERR: ${msg}`);
        }
      }
      const schemaVersion = await getDbVersion();
      return NextResponse.json({ ok: true, results, schemaVersion });
    }

    if (action === "restore") {
      const { data } = body as { data: any };
      if (!data?.app_state) return NextResponse.json({ error:"Invalid backup data" },{ status:400 });
      let restored = 0;
      for (const row of data.app_state) {
        await query(
          "INSERT INTO app_state (`key`,`value`) VALUES (?,?) ON DUPLICATE KEY UPDATE `value`=VALUES(`value`)",
          [row.key, row.value]
        );
        restored++;
      }
      return NextResponse.json({ ok:true, restored });
    }

    return NextResponse.json({ error:"Unknown action" },{ status:400 });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error:e.message },{ status:500 });
  }
}
