import { getEventOr404 } from '../events.js';
import { assertCanManageEvent } from '../permissions.js';
import { requireId } from '../validation.js';

/**
 * À placer après requireAuth sur les routes /:id qui modifient un événement.
 * Charge l'événement (404 s'il n'existe pas), vérifie les droits (403 sinon) et le met dans req.event.
 */
export async function requireEventManager(req, _res, next) {
  req.event = await getEventOr404(requireId(req.params.id));
  assertCanManageEvent(req.user, req.event);
  next();
}
