import { readFile } from 'node:fs/promises';
import mysql from 'mysql2/promise';
import { config } from './config.js';

// Toutes les dates sont stockées et lues en UTC.
const baseOptions = { ...config.db, timezone: 'Z', dateStrings: false };

export const pool = mysql.createPool({ ...baseOptions, connectionLimit: 10 });

export async function query(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

export async function waitForDb({ retries = 30, delayMs = 2000 } = {}) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await pool.query('SELECT 1');
      return;
    } catch (err) {
      console.log(`[db] MySQL indisponible (${err.code ?? err.message}), tentative ${attempt}/${retries}…`);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw new Error('Impossible de se connecter à MySQL');
}

export async function withTransaction(fn) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

const ADDED_COLUMNS = [
  { table: 'events', column: 'capacity', definition: 'INT UNSIGNED NULL DEFAULT NULL AFTER currency' },
];

export async function migrate() {
  const sql = await readFile(new URL('./schema.sql', import.meta.url), 'utf8');
  const conn = await mysql.createConnection({ ...baseOptions, multipleStatements: true });
  try {
    await conn.query(sql);
    for (const { table, column, definition } of ADDED_COLUMNS) {
      const [[{ n }]] = await conn.query(
        'SELECT COUNT(*) AS n FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
        [table, column],
      );
      if (n === 0) await conn.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    }
  } finally {
    await conn.end();
  }
}
