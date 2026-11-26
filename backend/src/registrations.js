import { query } from './db.js';
import { conflict, notFound } from './errors.js';

export const toPublicRegistration = (r) => ({
  eventId: r.event_id,
  userId: r.user_id,
  createdAt: r.created_at,
});

export const toPublicEventRegistration = (r) => ({
  ...toPublicRegistration(r),
  user: { id: r.user_id, name: r.user_name, email: r.user_email },
});

export async function listEventRegistrations(eventId) {
  return query(
    `SELECT r.*, u.name AS user_name, u.email AS user_email
     FROM registrations r
     JOIN users u ON u.id = r.user_id
     WHERE r.event_id = ?
     ORDER BY r.created_at ASC, r.user_id ASC`,
    [eventId],
  );
}

export async function createRegistration(eventId, userId) {
  try {
    await query('INSERT INTO registrations (event_id, user_id) VALUES (?, ?)', [eventId, userId]);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') throw conflict('Vous êtes déjà inscrit à cet événement');
    throw err;
  }
  const [registration] = await query(
    'SELECT * FROM registrations WHERE event_id = ? AND user_id = ?',
    [eventId, userId],
  );
  return registration;
}

export async function deleteRegistration(eventId, userId) {
  const result = await query('DELETE FROM registrations WHERE event_id = ? AND user_id = ?', [eventId, userId]);
  if (result.affectedRows === 0) throw notFound("Vous n'êtes pas inscrit à cet événement");
}
