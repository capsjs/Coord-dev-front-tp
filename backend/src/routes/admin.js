import { Router } from 'express';
import { query } from '../db.js';
import { badRequest } from '../errors.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { assertNotLastAdmin, getUserOr404, toPublicUser } from '../users.js';
import { oneOf, requireId, ROLES } from '../validation.js';

const router = Router();
router.use(requireAuth, requireRole('admin'));

router.get('/users', async (req, res) => {
  const { role } = req.query;
  const rows = role
    ? await query('SELECT * FROM users WHERE role = ? ORDER BY created_at DESC, id DESC', [oneOf(role, ROLES, 'role')])
    : await query('SELECT * FROM users ORDER BY created_at DESC, id DESC');
  res.json(rows.map(toPublicUser));
});

router.get('/users/:id', async (req, res) => {
  res.json(toPublicUser(await getUserOr404(requireId(req.params.id))));
});

router.patch('/users/:id', async (req, res) => {
  const id = requireId(req.params.id);
  const role = oneOf(req.body?.role, ROLES, 'role');
  if (id === req.user.id) throw badRequest('Vous ne pouvez pas modifier votre propre rôle');

  const user = await getUserOr404(id);
  if (role !== 'admin') await assertNotLastAdmin(user, 'retirer le rôle admin');
  await query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
  res.json(toPublicUser(await getUserOr404(id)));
});

router.delete('/users/:id', async (req, res) => {
  const id = requireId(req.params.id);
  if (id === req.user.id) throw badRequest('Utilisez DELETE /api/auth/me pour supprimer votre propre compte');
  const user = await getUserOr404(id);
  await assertNotLastAdmin(user, 'supprimer ce compte');
  await query('DELETE FROM users WHERE id = ?', [id]);
  res.status(204).end();
});

export default router;
