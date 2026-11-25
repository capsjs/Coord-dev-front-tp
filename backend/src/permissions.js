import { badRequest, forbidden } from './errors.js';

/**
 * Règle F08 : seul l'organisateur d'un événement, ou un admin, peut le modifier ou le supprimer.
 * Fonction pure (ni base ni Express) : testée unitairement dans test/unit/permissions.test.js.
 * @param {{ id: number, role: string }} user  utilisateur connecté
 * @param {{ organizer_id: number }} event     événement tel que lu en base
 */
export function canManageEvent(user, event) {
  if (!user || !event) return false;
  return user.role === 'admin' || event.organizer_id === user.id;
}

export function assertCanManageEvent(user, event) {
  if (!canManageEvent(user, event)) {
    throw forbidden("Seul l'organisateur de l'événement peut le modifier ou le supprimer");
  }
}

export function assertCanRegister(user, event, now = new Date()) {
  if (user?.role !== 'participant') {
    throw forbidden("Seuls les participants peuvent s'inscrire à un événement");
  }
  if (event.date <= now) throw badRequest('Cet événement est déjà passé');
}
