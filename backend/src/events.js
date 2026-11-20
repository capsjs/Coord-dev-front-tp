import { query } from './db.js';
import { notFound } from './errors.js';

export const toPublicEvent = (e) => ({
  id: e.id,
  title: e.title,
  description: e.description,
  date: e.date,
  location: e.location,
  price: Number(e.price), // DECIMAL est renvoyé en chaîne par mysql2
  currency: e.currency,
  organizerId: e.organizer_id,
  createdAt: e.created_at,
  updatedAt: e.updated_at,
});

export async function findEventById(id) {
  const [event] = await query('SELECT * FROM events WHERE id = ?', [id]);
  return event ?? null;
}

export async function getEventOr404(id) {
  const event = await findEventById(id);
  if (!event) throw notFound('Événement introuvable');
  return event;
}

export async function createEvent({ title, description, date, location, price, currency }, organizerId) {
  const result = await query(
    `INSERT INTO events (title, description, date, location, price, currency, organizer_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [title, description, date, location, price, currency, organizerId],
  );
  return getEventOr404(result.insertId);
}
