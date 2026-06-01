import { query } from "@/lib/db";

type StepResult = { step: string; ok: boolean; detail?: string };

async function tableExists(table: string): Promise<boolean> {
  const rows = await query<{ cnt: number }>(
    `SELECT COUNT(*) AS cnt FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [table]
  );
  const row = Array.isArray(rows) ? rows[0] : null;
  return Number((row as { cnt?: number })?.cnt ?? 0) > 0;
}

async function columnExists(table: string, column: string): Promise<boolean> {
  const rows = await query<{ cnt: number }>(
    `SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  const row = Array.isArray(rows) ? rows[0] : null;
  return Number((row as { cnt?: number })?.cnt ?? 0) > 0;
}

/** Idempotent upgrade to schema v1.9.0 */
export async function runUpgradeV190(): Promise<{ ok: boolean; results: StepResult[]; version: string }> {
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

  await run("auth_sessions.member_id column", async () => {
    const { ensureAuthSessionSchema, ensureTwoFactorSchema } = await import("@/lib/dbSchemaFix");
    await ensureAuthSessionSchema();
    await ensureTwoFactorSchema();
  });

  await run("membership_change_requests table", async () => {
    if (!(await tableExists("membership_change_requests"))) {
      await query(
        `CREATE TABLE membership_change_requests (
          id                VARCHAR(40)  PRIMARY KEY,
          member_id         BIGINT       NOT NULL,
          membership_number VARCHAR(30)  NOT NULL,
          member_name       VARCHAR(200) NOT NULL,
          email             VARCHAR(200) DEFAULT NULL,
          phone             VARCHAR(40)  DEFAULT NULL,
          branch            VARCHAR(80)  DEFAULT NULL,
          current_tier      VARCHAR(30)  NOT NULL,
          requested_tier    VARCHAR(30)  NOT NULL,
          request_type      ENUM('renew','upgrade','downgrade') NOT NULL DEFAULT 'renew',
          amount            DECIMAL(10,2) NOT NULL DEFAULT 0,
          season            VARCHAR(20)  DEFAULT NULL,
          status            ENUM('Pending','Approved','Declined') NOT NULL DEFAULT 'Pending',
          notes             TEXT,
          admin_notes       TEXT,
          member_details    JSON DEFAULT NULL,
          submitted_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
          processed_at      DATETIME     DEFAULT NULL,
          processed_by      VARCHAR(100) DEFAULT NULL,
          INDEX idx_member (member_id),
          INDEX idx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
        []
      );
    } else if (!(await columnExists("membership_change_requests", "member_details"))) {
      await query(
        `ALTER TABLE membership_change_requests ADD COLUMN member_details JSON DEFAULT NULL AFTER admin_notes`,
        []
      );
    }
  });

  await run("app_state membershipRequests seed", async () => {
    await query(
      `INSERT INTO app_state (\`key\`, \`value\`) VALUES ('membershipRequests', '[]')
       ON DUPLICATE KEY UPDATE \`key\` = \`key\``,
      []
    );
  });

  await run("system_upgrade_log", async () => {
    if (await tableExists("system_upgrade_log")) {
      await query(
        `INSERT INTO system_upgrade_log (version, description, applied_by) VALUES (?, ?, ?)`,
        [
          "1.9.0",
          "v1.9.0: auth hardening, membership DB sync, currency persistence, session refresh on approval",
          "admin-api",
        ]
      );
    }
  });

  await run("app_state db_version", async () => {
    await query(
      `INSERT INTO app_state (\`key\`, \`value\`) VALUES ('db_version', '"1.9.0"')
       ON DUPLICATE KEY UPDATE \`value\` = '"1.9.0"', updated_at = NOW()`,
      []
    );
  });

  const failed = results.filter(r => !r.ok);
  return { ok: failed.length === 0, results, version: "1.9.0" };
}

export { getDbVersion } from "./upgrade-v1.8.0";
