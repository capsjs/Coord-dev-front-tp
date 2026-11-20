import { Router } from 'express';
import { createEvent, toPublicEvent } from '../events.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { parseEventInput } from '../validation.js';

const router = Router();

// F01 — Créer un événement : l'utilisateur connecté en devient l'organisateur.
router.post('/', requireAuth, requireRole('organizer', 'admin'), async (req, res) => {
  const event = await createEvent(parseEventInput(req.body), req.user.id);
  res.status(201).json(toPublicEvent(event));
});

export default router;
