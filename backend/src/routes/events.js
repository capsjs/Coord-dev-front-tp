import { Router } from 'express';
import { createEvent, getEventOr404, listUpcomingEvents, toPublicEvent } from '../events.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
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

export default router;
