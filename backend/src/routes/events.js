import { Router } from 'express';
import { createEvent, deleteEvent, getEventOr404, listUpcomingEvents, toPublicEvent, updateEvent } from '../events.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { requireEventManager } from '../middleware/eventAccess.js';
import { assertCanRegister } from '../permissions.js';
import { createRegistration, deleteRegistration, toPublicRegistration } from '../registrations.js';
import { parseEventInput, requireId } from '../validation.js';

const router = Router();

// F04 — Liste publique des événements à venir, triés par date croissante.
router.get('/', async (_req, res) => {
  const events = await listUpcomingEvents();
  res.json(events.map(toPublicEvent));
});

// F05 — Fiche publique d'un événement (y compris passé).
router.get('/:id', async (req, res) => {
  res.json(toPublicEvent(await getEventOr404(requireId(req.params.id))));
});

// F01 — Créer un événement : l'utilisateur connecté en devient l'organisateur.
router.post('/', requireAuth, requireRole('organizer', 'admin'), async (req, res) => {
  const event = await createEvent(parseEventInput(req.body), req.user.id);
  res.status(201).json(toPublicEvent(event));
});

// F02 — Modifier un événement : mêmes règles de validation qu'à la création.
// Réservé à l'organisateur de l'événement ou à un admin (requireEventManager : 404 puis 403).
router.put('/:id', requireAuth, requireEventManager, async (req, res) => {
  const event = await updateEvent(req.event.id, parseEventInput(req.body));
  res.json(toPublicEvent(event));
});

// F03 — Supprimer un événement. Réservé à l'organisateur de l'événement ou à un admin.
router.delete('/:id', requireAuth, requireEventManager, async (req, res) => {
  await deleteEvent(req.event.id);
  res.status(204).end();
});

router.post('/:id/registrations', requireAuth, async (req, res) => {
  const event = await getEventOr404(requireId(req.params.id));
  assertCanRegister(req.user, event);
  const registration = await createRegistration(event.id, req.user.id);
  res.status(201).json(toPublicRegistration(registration));
});

router.delete('/:id/registrations/me', requireAuth, async (req, res) => {
  const event = await getEventOr404(requireId(req.params.id));
  await deleteRegistration(event.id, req.user.id);
  res.status(204).end();
});

export default router;
