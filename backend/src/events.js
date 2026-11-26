import { query, withTransaction } from './db.js';
import { badRequest, notFound } from './errors.js';

export const toPublicEvent = (e) => ({
  id: e.id,
  title: e.title,
  description: e.description,
  date: e.date,
  location: e.location,
  price: Number(e.price), // DECIMAL est renvoyé en chaîne par mysql2
  currency: e.currency,
  capacity: e.capacity,
  remainingSeats: e.capacity === null ? null : Math.max(0, e.capacity - Number(e.registration_count)),
  organizerId: e.organizer_id,
  organizer: { id: e.organizer_id, name: e.organizer_name },
  createdAt: e.created_at,
  updatedAt: e.updated_at,
});

// Chaque événement est renvoyé avec le nom de son organisateur.
const SELECT_EVENTS = `
  SELECT e.*, u.name AS organizer_name,
    (SELECT COUNT(*) FROM registrations rc WHERE rc.event_id = e.id) AS registration_count
  FROM events e
  JOIN users u ON u.id = e.organizer_id`;

export async function findEventById(id) {
  const [event] = await query(`${SELECT_EVENTS} WHERE e.id = ?`, [id]);
  return event ?? null;
}

/** Événements dont la date n'est pas encore passée, du plus proche au plus lointain. */
export async function listUpcomingEvents() {
  return query(`${SELECT_EVENTS} WHERE e.date > ? ORDER BY e.date ASC, e.id ASC`, [new Date()]);
}

export async function listEventsRegisteredBy(userId) {
  return query(
    `${SELECT_EVENTS} JOIN registrations r ON r.event_id = e.id WHERE r.user_id = ? ORDER BY e.date ASC, e.id ASC`,
    [userId],
  );
}

export async function getEventOr404(id) {
  const event = await findEventById(id);
  if (!event) throw notFound('Événement introuvable');
  return event;
}

export async function createEvent({ title, description, date, location, price, currency, capacity }, organizerId) {
  const result = await query(
    `INSERT INTO events (title, description, date, location, price, currency, capacity, organizer_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [title, description, date, location, price, currency, capacity, organizerId],
  );
  return getEventOr404(result.insertId);
}

export async function updateEvent(id, { title, description, date, location, price, currency, capacity }) {
  await withTransaction(async (conn) => {
    await conn.query('SELECT id FROM events WHERE id = ? FOR UPDATE', [id]);
    const [[{ n }]] = await conn.query('SELECT COUNT(*) AS n FROM registrations WHERE event_id = ?', [id]);
    if (capacity !== null && capacity < n) {
      throw badRequest(`La capacité ne peut pas être inférieure au nombre d'inscrits actuel (${n})`);
    }
    await conn.query(
      `UPDATE events SET title = ?, description = ?, date = ?, location = ?, price = ?, currency = ?, capacity = ?
       WHERE id = ?`,
      [title, description, date, location, price, currency, capacity, id],
    );
  });
  return getEventOr404(id);
}

/** Les inscriptions liées sont supprimées par la base (clé étrangère ON DELETE CASCADE). */
export async function deleteEvent(id) {
  await query('DELETE FROM events WHERE id = ?', [id]);
}
