import { query } from "@/lib/db";

type StepResult = { step: string; ok: boolean; detail?: string };

async function tableExists(table: string): Promise<boolean> {
  const rows = await query<{ cnt: number }>(
    `SELECT COUNT(*) AS cnt FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [table]
  );
  return Number(rows[0]?.cnt ?? 0) > 0;
}

async function columnExists(table: string, column: string): Promise<boolean> {
  const rows = await query<{ cnt: number }>(
    `SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  return Number(rows[0]?.cnt ?? 0) > 0;
}

async function addCol(table: string, col: string, def: string) {
  if (!(await tableExists(table))) return;
  if (await columnExists(table, col)) return;
  await query(`ALTER TABLE ${table} ADD COLUMN ${col} ${def}`);
}

/** v2.0.0 — activity logs, session metadata, appearance defaults, remove legacy welcome banner */
export async function runUpgradeV200(): Promise<{ ok: boolean; results: StepResult[]; version: string }> {
  const results: StepResult[] = [];

  const run = async (step: string, fn: () => Promise<void>) => {
    try {
      await fn();
      results.push({ step, ok: true });
    } catch (e: unknown) {
      results.push({ step, ok: false, detail: e instanceof Error ? e.message : String(e) });
    }
  };

  await run("admin_activity_log table", async () => {
    if (!(await tableExists("admin_activity_log"))) {
      await query(`
        CREATE TABLE admin_activity_log (
          id          BIGINT AUTO_INCREMENT PRIMARY KEY,
          username    VARCHAR(100) NOT NULL,
          actor_name  VARCHAR(200) DEFAULT NULL,
          action      VARCHAR(100) NOT NULL,
          detail      TEXT,
          ip_address  VARCHAR(45)  DEFAULT NULL,
          user_agent  VARCHAR(300) DEFAULT NULL,
          created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_username (username),
          INDEX idx_action (action),
          INDEX idx_created (created_at DESC)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
    }
  });

  await run("session metadata columns", async () => {
    const { ensureSessionMetadataColumns } = await import("@/lib/dbSchemaFix");
    await ensureSessionMetadataColumns();
  });

  await run("appearance_settings seed", async () => {
    const defaults = {
      accentColor: "#E30613",
      goldColor: "#947A58",
      topBarBg: "#AF1311",
      navBg: "#E30613",
      lightNavBg: "#E30613",
      lightAccentColor: "#E30613",
      menuNavBg: "#E30613",
      menuNavText: "#FFFFFF",
      menuNavHoverBg: "rgba(255,255,255,0.12)",
      menuDropdownBg: "#FFFFFF",
      menuDropdownText: "#000000",
      menuDropdownHoverBg: "#F6F6F6",
      cardLightBg: "#FFFFFF",
      cardLightText: "#000000",
      cardLightBorder: "#E1E1E1",
      cardDarkBg: "#1C1829",
      cardDarkText: "#F8FAFC",
      cardDarkBorder: "rgba(255,255,255,0.08)",
      lightBgPrimary: "#F6F6F6",
      lightTextMuted: "#72767E",
      darkBgPrimary: "#0C0B12",
      darkBgCard: "#1C1829",
      darkTextPrimary: "#F8FAFC",
      darkTextMuted: "#8B93A3",
      darkNavBg: "#151925",
      darkAccentColor: "#E30613",
    };
    const existing = await query<{ value: string }>(
      `SELECT \`value\` FROM app_state WHERE \`key\` = 'settings' LIMIT 1`,
      []
    );
    let merged: Record<string, unknown> = {};
    if (existing[0]?.value) {
      try {
        merged = JSON.parse(existing[0].value);
      } catch {
        merged = {};
      }
    }
    for (const [k, v] of Object.entries(defaults)) {
      if (merged[k] === undefined) merged[k] = v;
    }
    await query(
      `INSERT INTO app_state (\`key\`, \`value\`) VALUES ('settings', ?)
       ON DUPLICATE KEY UPDATE \`value\` = VALUES(\`value\`), updated_at = NOW()`,
      [JSON.stringify(merged)]
    );
  });

  await run("admin_profiles seed", async () => {
    await query(
      `INSERT INTO app_state (\`key\`, \`value\`) VALUES ('adminProfiles', '{}')
       ON DUPLICATE KEY UPDATE \`key\` = \`key\``,
      []
    );
  });

  await run("remove welcome v1.0 announcement", async () => {
    if (await tableExists("announcements")) {
      await query(
        `DELETE FROM announcements WHERE title LIKE 'Welcome to Arsenal SC Ghana Portal%'`,
        []
      );
      await query(
        `UPDATE announcements SET is_active = 0 WHERE title LIKE '%Portal v1.0%'`,
        []
      );
    }
  });

  await run("system_upgrade_log", async () => {
    if (await tableExists("system_upgrade_log")) {
      await query(
        `INSERT INTO system_upgrade_log (version, description, applied_by) VALUES (?, ?, ?)`,
        [
          "2.0.0",
          "v2.0.0: activity logs, session devices, appearance/theme settings, admin profiles, grouped nav",
          "admin-api",
        ]
      );
    }
  });

  await run("app_state db_version", async () => {
    await query(
      `INSERT INTO app_state (\`key\`, \`value\`) VALUES ('db_version', '"2.0.0"')
       ON DUPLICATE KEY UPDATE \`value\` = '"2.0.0"', updated_at = NOW()`,
      []
    );
  });

  const failed = results.filter(r => !r.ok);
  return { ok: failed.length === 0, results, version: "2.0.0" };
}

export { getDbVersion } from "./upgrade-v1.9.0";
