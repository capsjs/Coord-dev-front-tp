// Prérequis : l'API doit tourner (make up) avec SEED_DEMO=true.
import assert from 'node:assert/strict';

export const API = process.env.API_URL ?? 'http://localhost:3000';
export const ADMIN = { email: process.env.ADMIN_EMAIL ?? 'admin@events.local', password: process.env.ADMIN_PASSWORD ?? 'admin1234' };

export async function api(method, path, { body, token } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      ...(body !== undefined && { 'Content-Type': 'application/json' }),
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
}

export const unique = () => `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;

export async function register(role = 'participant') {
  const email = unique();
  const res = await api('POST', '/api/auth/register', {
    body: { name: 'Test User', email, password: 'motdepasse123', role },
  });
  assert.equal(res.status, 201, JSON.stringify(res.body));
  return { ...res.body, email, password: 'motdepasse123' };
}

// Accès direct à MySQL (port exposé par Docker Compose) pour préparer des cas impossibles via l'API,
// comme un événement déjà passé.
export async function withDb(fn) {
  const { default: mysql } = await import('mysql2/promise');
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST ?? '127.0.0.1',
    port: Number(process.env.DB_HOST_PORT ?? 3307),
    user: process.env.DB_USER ?? 'events',
    password: process.env.DB_PASSWORD ?? 'events',
    database: process.env.DB_NAME ?? 'events',
    timezone: 'Z',
  });
  try {
    return await fn(conn);
  } finally {
    await conn.end();
  }
}
