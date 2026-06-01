/**
 * One-off: add missing member_id columns (auth_sessions, two_factor_codes).
 * Usage: node --env-file=.env.local scripts/fix-auth-schema.mjs
 */
import mysql from "mysql2/promise";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is required (use --env-file=.env.local)");
  process.exit(1);
}

async function columnExists(conn, table, column) {
  const [rows] = await conn.execute(
    `SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  return Number(rows[0]?.cnt ?? 0) > 0;
}

async function main() {
  const conn = await mysql.createConnection(url);
  console.log("Connected. Applying auth schema fixes…");

  await conn.execute(`
    CREATE TABLE IF NOT EXISTS auth_sessions (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      token_hash VARCHAR(64) NOT NULL UNIQUE,
      member_id BIGINT DEFAULT NULL,
      user_json LONGTEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_token (token_hash),
      INDEX idx_member_id (member_id),
      INDEX idx_expires (expires_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  if (!(await columnExists(conn, "auth_sessions", "member_id"))) {
    await conn.execute(
      `ALTER TABLE auth_sessions ADD COLUMN member_id BIGINT DEFAULT NULL AFTER token_hash`
    );
    console.log("✓ auth_sessions.member_id added");
  } else {
    console.log("• auth_sessions.member_id already exists");
  }

  await conn.execute(`
    CREATE TABLE IF NOT EXISTS two_factor_codes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      member_id BIGINT NOT NULL,
      code VARCHAR(10) NOT NULL,
      purpose VARCHAR(40) NOT NULL DEFAULT 'login',
      expires_at DATETIME NOT NULL,
      used TINYINT(1) NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_member (member_id),
      INDEX idx_expires (expires_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  if (!(await columnExists(conn, "two_factor_codes", "member_id"))) {
    if (await columnExists(conn, "two_factor_codes", "user_id")) {
      await conn.execute(
        `ALTER TABLE two_factor_codes CHANGE COLUMN user_id member_id BIGINT NOT NULL`
      );
    } else {
      await conn.execute(
        `ALTER TABLE two_factor_codes ADD COLUMN member_id BIGINT NOT NULL DEFAULT 0 AFTER id`
      );
    }
    console.log("✓ two_factor_codes.member_id added");
  } else {
    console.log("• two_factor_codes.member_id already exists");
  }

  await conn.end();
  console.log("Done.");
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
