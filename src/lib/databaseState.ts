import { query, queryOne } from '@/lib/db';

type AppStateRow = {
  key: string;
  value: string;
};

let ensured = false;

async function ensureAppStateTable() {
  if (ensured) return;

  await query(`
    CREATE TABLE IF NOT EXISTS app_state (
      \`key\` VARCHAR(120) PRIMARY KEY,
      \`value\` LONGTEXT NOT NULL,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  ensured = true;
}

export async function getAllState() {
  await ensureAppStateTable();
  const rows = await query('SELECT `key`, `value` FROM app_state');
  const state: Record<string, unknown> = {};

  if (!Array.isArray(rows)) return state;

  for (const row of rows as AppStateRow[]) {
    try {
      state[row.key] = JSON.parse(row.value);
    } catch {
      state[row.key] = null;
    }
  }

  return state;
}

export async function getStateValue<T>(key: string, fallback: T): Promise<T> {
  await ensureAppStateTable();
  const row = await queryOne('SELECT `value` FROM app_state WHERE `key` = ?', [key]) as Pick<AppStateRow, 'value'> | null;

  if (!row) return fallback;

  try {
    return JSON.parse(row.value) as T;
  } catch {
    return fallback;
  }
}

export async function setStateValue(key: string, value: unknown) {
  await ensureAppStateTable();
  const json = JSON.stringify(value ?? null);

  await query(
    `INSERT INTO app_state (\`key\`, \`value\`)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE \`value\` = VALUES(\`value\`), updated_at = NOW()`,
    [key, json]
  );
}
