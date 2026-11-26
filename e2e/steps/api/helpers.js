// Outils communs aux étapes du niveau API.
import mysql from 'mysql2/promise';

export const ADMIN = {
  email: process.env.ADMIN_EMAIL ?? 'admin@events.local',
  password: process.env.ADMIN_PASSWORD ?? 'admin1234',
};
export const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-a-changer';
export const PASSWORD = 'motdepasse123';

/** Appel HTTP à l'API ; renvoie { status, body } (body = null pour une réponse vide, ex. 204). */
export async function api(request, method, path, { token, body } = {}) {
  const response = await request.fetch(path, {
    method,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    ...(body !== undefined && { data: body }),
  });
  const text = await response.text();
  return { status: response.status(), body: text ? JSON.parse(text) : null };
}

export const uniqueEmail = () => `bdd-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;

/** Date ISO à la seconde près (l'API ne garde pas les millisecondes). */
export function inDays(days) {
  const d = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  d.setUTCMilliseconds(0);
  return d.toISOString();
}

/** « dans 30 jours », « hier », ou une valeur brute (ex. « 2030-01-15 », pour tester un format invalide). */
export function parseDate(text) {
  const inN = text.match(/^dans (\d+) jours?$/);
  if (inN) return inDays(Number(inN[1]));
  if (text === 'hier') return inDays(-1);
  return text;
}

const FIELDS = { titre: 'title', description: 'description', date: 'date', lieu: 'location', prix: 'price', devise: 'currency' };

/** Transforme un tableau Gherkin « champ | valeur » en corps de requête EventInput. */
export function eventBody(rows) {
  const body = {};
  for (const [champ, valeur] of Object.entries(rows)) {
    const field = FIELDS[champ];
    if (!field) throw new Error(`Champ inconnu dans le tableau : « ${champ} »`);
    if (field === 'date') body.date = parseDate(valeur);
    else if (field === 'price') body.price = Number(valeur);
    else body[field] = valeur;
  }
  return body;
}

/** Accès direct à MySQL (port exposé par Docker Compose) pour les cas impossibles via l'API. */
export async function withDb(fn) {
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
