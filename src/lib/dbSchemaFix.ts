import { query } from "@/lib/db";

export async function columnExists(table: string, column: string): Promise<boolean> {
  const rows = await query<{ cnt: number }>(
    `SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  return Number(rows[0]?.cnt ?? 0) > 0;
}

export async function tableExists(table: string): Promise<boolean> {
  const rows = await query<{ cnt: number }>(
    `SELECT COUNT(*) AS cnt FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [table]
  );
  return Number(rows[0]?.cnt ?? 0) > 0;
}

async function addColumnIfMissing(
  table: string,
  column: string,
  definition: string,
  indexSql?: string
): Promise<void> {
  if (!(await tableExists(table))) return;
  if (await columnExists(table, column)) return;
  await query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  if (indexSql) {
    try {
      await query(indexSql);
    } catch {
      /* index may already exist */
    }
  }
}

/** Ensures auth_sessions exists and has member_id (fixes login INSERT errors on older DBs). */
export async function ensureAuthSessionSchema(): Promise<void> {
  await query(`
    CREATE TABLE IF NOT EXISTS auth_sessions (
      id          BIGINT AUTO_INCREMENT PRIMARY KEY,
      token_hash  VARCHAR(64)  NOT NULL UNIQUE,
      member_id   BIGINT       DEFAULT NULL,
      user_json   LONGTEXT     NOT NULL,
      expires_at  DATETIME     NOT NULL,
      created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_token     (token_hash),
      INDEX idx_member_id (member_id),
      INDEX idx_expires   (expires_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await addColumnIfMissing(
    "auth_sessions",
    "member_id",
    "BIGINT DEFAULT NULL AFTER token_hash",
    "ALTER TABLE auth_sessions ADD INDEX idx_member_id (member_id)"
  );
}

/** Ensures two_factor_codes has member_id (legacy tables used user_id or lacked the column). */
export async function ensureTwoFactorSchema(): Promise<void> {
  await query(`
    CREATE TABLE IF NOT EXISTS two_factor_codes (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      member_id   BIGINT       NOT NULL,
      code        VARCHAR(10)  NOT NULL,
      purpose     VARCHAR(40)  NOT NULL DEFAULT 'login',
      expires_at  DATETIME     NOT NULL,
      used        TINYINT(1)   NOT NULL DEFAULT 0,
      created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_member (member_id),
      INDEX idx_expires (expires_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  if (!(await tableExists("two_factor_codes"))) return;

  if (!(await columnExists("two_factor_codes", "member_id"))) {
    if (await columnExists("two_factor_codes", "user_id")) {
      await query(
        `ALTER TABLE two_factor_codes CHANGE COLUMN user_id member_id BIGINT NOT NULL`
      );
    } else {
      await addColumnIfMissing(
        "two_factor_codes",
        "member_id",
        "BIGINT NOT NULL DEFAULT 0 AFTER id",
        "ALTER TABLE two_factor_codes ADD INDEX idx_member (member_id)"
      );
    }
  }
}

/** Run all auth-related schema fixes (safe to call on every login). */
export async function ensureCoreAuthSchema(): Promise<void> {
  await ensureAuthSessionSchema();
  await ensureTwoFactorSchema();
  await ensureSessionMetadataColumns();
}

/** Adds device/IP columns to auth_sessions and admin_sessions. */
export async function ensureSessionMetadataColumns(): Promise<void> {
  for (const table of ["auth_sessions", "admin_sessions"] as const) {
    await addColumnIfMissing(table, "ip_address", "VARCHAR(45) DEFAULT NULL");
    await addColumnIfMissing(table, "user_agent", "VARCHAR(300) DEFAULT NULL");
    await addColumnIfMissing(table, "device_label", "VARCHAR(120) DEFAULT NULL");
    await addColumnIfMissing(
      table,
      "last_seen_at",
      "DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP"
    );
  }
}

export async function touchSessionLastSeen(
  table: "auth_sessions" | "admin_sessions",
  tokenHash: string
): Promise<void> {
  if (!(await tableExists(table))) return;
  if (!(await columnExists(table, "last_seen_at"))) return;
  try {
    await query(`UPDATE ${table} SET last_seen_at = NOW() WHERE token_hash = ?`, [tokenHash]);
  } catch {
    /* ignore */
  }
}
