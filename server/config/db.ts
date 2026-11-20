import mysql from 'mysql2/promise';
import { env } from './env.ts';

let pool: mysql.Pool | null = null;
let mysqlActive = false;

export async function initDatabase(): Promise<void> {
  if (!env.db.host) {
    console.log('[DB] DB_HOST not configured — running with transactional local store (.data/db.json).');
    mysqlActive = false;
    return;
  }

  try {
    pool = mysql.createPool({
      host: env.db.host,
      port: env.db.port,
      user: env.db.user,
      password: env.db.password,
      database: env.db.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      charset: 'utf8mb4',
      timezone: 'Z',
    });

    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    mysqlActive = true;
    console.log(`[DB] Connected to MySQL (${env.db.host}:${env.db.port}/${env.db.database})`);
  } catch (err) {
    console.warn('[DB] MySQL connection failed, falling back to local transactional store:', (err as Error).message);
    mysqlActive = false;
    pool = null;
  }
}

export function isMysqlActive(): boolean {
  return mysqlActive && pool !== null;
}

export function getPool(): mysql.Pool {
  if (!pool) {
    throw new Error('MySQL pool is not initialized');
  }
  return pool;
}
