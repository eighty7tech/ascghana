/**
 * Run schema upgrade to v1.9.0 (auth_sessions.member_id, membership_change_requests).
 * Usage: node scripts/upgrade-db.mjs
 */
import { config } from "dotenv";
import { createPool } from "mysql2/promise";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
config({ path: join(root, ".env.local") });
config({ path: join(root, ".env") });

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set in .env.local");
  process.exit(1);
}

const pool = createPool(url);

async function columnExists(table, column) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  return Number(rows[0]?.cnt ?? 0) > 0;
}

async function tableExists(table) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS cnt FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [table]
  );
  return Number(rows[0]?.cnt ?? 0) > 0;
}

async function run() {
  console.log("Upgrading database to v1.9.0…");

  if (!(await columnExists("auth_sessions", "member_id"))) {
    await pool.query(
      `ALTER TABLE auth_sessions ADD COLUMN member_id BIGINT DEFAULT NULL AFTER token_hash`
    );
    console.log("✓ Added auth_sessions.member_id");
    try {
      await pool.query(`ALTER TABLE auth_sessions ADD INDEX idx_member_id (member_id)`);
    } catch {
      /* ignore */
    }
  } else {
    console.log("✓ auth_sessions.member_id already exists");
  }

  if (!(await tableExists("membership_change_requests"))) {
    await pool.query(`
      CREATE TABLE membership_change_requests (
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("✓ Created membership_change_requests");
  } else {
    console.log("✓ membership_change_requests already exists");
  }

  await pool.query(
    `INSERT INTO app_state (\`key\`, \`value\`) VALUES ('membershipRequests', '[]')
     ON DUPLICATE KEY UPDATE \`key\` = \`key\``
  );
  await pool.query(
    `INSERT INTO app_state (\`key\`, \`value\`) VALUES ('db_version', '"1.9.0"')
     ON DUPLICATE KEY UPDATE \`value\` = '"1.9.0"', updated_at = NOW()`
  );
  console.log("✓ db_version set to 1.9.0");
  console.log("Done.");
  await pool.end();
}

run().catch(e => {
  console.error(e.message || e);
  process.exit(1);
});
