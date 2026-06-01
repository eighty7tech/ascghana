import { query } from "@/lib/db";

type StepResult = { step: string; ok: boolean; detail?: string };

async function columnExists(table: string, column: string): Promise<boolean> {
  const rows = await query<{ cnt: number }>(
    `SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  const row = Array.isArray(rows) ? rows[0] : null;
  return Number((row as { cnt?: number })?.cnt ?? 0) > 0;
}

async function tableExists(table: string): Promise<boolean> {
  const rows = await query<{ cnt: number }>(
    `SELECT COUNT(*) AS cnt FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [table]
  );
  const row = Array.isArray(rows) ? rows[0] : null;
  return Number((row as { cnt?: number })?.cnt ?? 0) > 0;
}

/** Idempotent upgrade to schema v1.7.0 — safe to run multiple times. */
export async function runUpgradeV170(): Promise<{ ok: boolean; results: StepResult[]; version: string }> {
  const results: StepResult[] = [];

  const run = async (step: string, fn: () => Promise<void>) => {
    try {
      await fn();
      results.push({ step, ok: true });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      results.push({ step, ok: false, detail: msg });
    }
  };

  await run("admin_settings icons", async () => {
    await query(
      `INSERT IGNORE INTO admin_settings (section, setting_key, setting_value) VALUES
       ('icons', 'size', '18'),
       ('icons', 'color', '"#EF0107"'),
       ('icons', 'style', '"solid"')`,
      []
    );
  });

  await run("button_styles.css_class", async () => {
    if (!(await columnExists("button_styles", "css_class"))) {
      await query(
        `ALTER TABLE button_styles ADD COLUMN css_class VARCHAR(60) DEFAULT NULL
         COMMENT 'Optional CSS class override e.g. btn-primary, btn-glow'`,
        []
      );
    }
  });

  await run("button_styles.is_active", async () => {
    if (!(await columnExists("button_styles", "is_active"))) {
      await query(
        `ALTER TABLE button_styles ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 0
         COMMENT '1 = global default button'`,
        []
      );
    }
  });

  await run("button_styles.section_tags", async () => {
    if (!(await columnExists("button_styles", "section_tags"))) {
      await query(
        `ALTER TABLE button_styles ADD COLUMN section_tags VARCHAR(300) DEFAULT NULL
         COMMENT 'Comma-separated section IDs this button is assigned to'`,
        []
      );
    }
  });

  await run("section_button_assignments table", async () => {
    if (!(await tableExists("section_button_assignments"))) {
      await query(
        `CREATE TABLE section_button_assignments (
          id INT AUTO_INCREMENT PRIMARY KEY,
          section_id VARCHAR(60) NOT NULL,
          button_id VARCHAR(40) NOT NULL,
          label VARCHAR(100) DEFAULT NULL,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY uq_section (section_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
        []
      );
    }
  });

  await run("icon_presets table", async () => {
    if (!(await tableExists("icon_presets"))) {
      await query(
        `CREATE TABLE icon_presets (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          fa_class VARCHAR(60) NOT NULL,
          color VARCHAR(30) NOT NULL DEFAULT '#EF0107',
          size SMALLINT NOT NULL DEFAULT 18,
          style VARCHAR(20) NOT NULL DEFAULT 'solid',
          is_global TINYINT(1) NOT NULL DEFAULT 0,
          sort_order INT NOT NULL DEFAULT 0,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_global (is_global)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
        []
      );
    }
  });

  await run("icon_presets seed", async () => {
    await query(
      `INSERT IGNORE INTO icon_presets (id, name, fa_class, color, size, style, is_global, sort_order) VALUES
       (1, 'Arsenal Red Solid', 'fa-solid fa-shield-halved', '#EF0107', 18, 'solid', 1, 1),
       (2, 'Club Gold Solid', 'fa-solid fa-trophy', '#C6A84B', 18, 'solid', 0, 2),
       (3, 'Navy Solid', 'fa-solid fa-futbol', '#023474', 18, 'solid', 0, 3),
       (4, 'Success Green Solid', 'fa-solid fa-circle-check', '#10B981', 18, 'solid', 0, 4),
       (5, 'Warning Amber Solid', 'fa-solid fa-bell', '#F59E0B', 18, 'solid', 0, 5)`,
      []
    );
  });

  await run("button_styles Arsenal presets", async () => {
    await query(
      `INSERT IGNORE INTO button_styles (id, name, styles_json) VALUES
       (1, 'Arsenal System Presets', JSON_OBJECT(
         'presets', JSON_ARRAY(
           JSON_OBJECT('css_class','btn-primary','label','Primary — Arsenal Red'),
           JSON_OBJECT('css_class','btn-glow','label','Glow — Glowing Red'),
           JSON_OBJECT('css_class','btn-secondary-a','label','Secondary — Red Outline'),
           JSON_OBJECT('css_class','btn-gold-full','label','Gold Premium'),
           JSON_OBJECT('css_class','btn-gold-outline-full','label','Gold Outline'),
           JSON_OBJECT('css_class','btn-hero-full','label','Hero — Large CTA'),
           JSON_OBJECT('css_class','btn-sm','label','Small'),
           JSON_OBJECT('css_class','btn-md','label','Medium'),
           JSON_OBJECT('css_class','btn-lg','label','Large')
         )
       ))`,
      []
    );
  });

  await run("system_upgrade_log", async () => {
    if (await tableExists("system_upgrade_log")) {
      await query(
        `INSERT INTO system_upgrade_log (version, description, applied_by) VALUES (?, ?, ?)`,
        [
          "1.7.0",
          "v1.7.0: section_button_assignments, icon_presets, button_styles columns, icon/button admin settings",
          "admin-api",
        ]
      );
    }
  });

  await run("app_state db_version", async () => {
    await query(
      `INSERT INTO app_state (\`key\`, \`value\`) VALUES ('db_version', '"1.7.0"')
       ON DUPLICATE KEY UPDATE \`value\` = '"1.7.0"', updated_at = NOW()`,
      []
    );
  });

  const failed = results.filter((r) => !r.ok);
  return { ok: failed.length === 0, results, version: "1.7.0" };
}

export async function getDbVersion(): Promise<string | null> {
  try {
    const rows = await query<{ value: string }>(
      `SELECT \`value\` FROM app_state WHERE \`key\` = 'db_version' LIMIT 1`,
      []
    );
    const row = Array.isArray(rows) ? rows[0] : null;
    if (!row?.value) return null;
    const raw = row.value;
    try {
      return JSON.parse(raw) as string;
    } catch {
      return raw.replace(/^"|"$/g, "");
    }
  } catch {
    return null;
  }
}
