import mysql from 'mysql2/promise';

let pool: mysql.Pool | null = null;

export function getPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  if (!pool) {
    pool = mysql.createPool(process.env.DATABASE_URL);
  }

  return pool;
}

// 1. Made generic using <T> and added type asserting to RowDataPacket
export async function query<T>(sql: string, values?: any[]): Promise<T[]> {
  const connection = await getPool().getConnection();
  try {
    const [results] = await connection.execute<mysql.RowDataPacket[]>(sql, values);
    return results as T[];
  } finally {
    connection.release();
  }
}

// 2. Made generic so it carries the type down to a single element or null
export async function queryOne<T>(sql: string, values?: any[]): Promise<T | null> {
  const results = await query<T>(sql, values);
  return Array.isArray(results) && results.length > 0 ? results[0] : null;
}

export async function transaction<T>(callback: (connection: mysql.PoolConnection) => Promise<T>): Promise<T> {
  const connection = await getPool().getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export default getPool;