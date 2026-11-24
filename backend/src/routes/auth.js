import { Router } from 'express';
import { query } from '../db.js';
import { badRequest, unauthorized } from '../errors.js';
import { requireAuth, signToken } from '../middleware/auth.js';
import {
  assertNotLastAdmin,
  checkPassword,
  createUser,
  findUserByEmail,
  getUserOr404,
  hashPassword,
  toPublicUser,
  updateUser,
} from '../users.js';
import { oneOf, requireEmail, requireName, requirePassword } from '../validation.js';

const router = Router();

router.post('/register', async (req, res) => {
  const body = req.body ?? {};
  const user = await createUser({
    name: requireName(body.name),
    email: requireEmail(body.email),
    password: requirePassword(body.password),
    role: oneOf(body.role ?? 'participant', ['participant', 'organizer'], 'role'),
  });
  res.status(201).json({ token: signToken(user), user: toPublicUser(user) });
});

router.post('/login', async (req, res) => {
  const body = req.body ?? {};
  const email = requireEmail(body.email);
  const password = requirePassword(body.password, 'password', { min: 1 });

  const user = await findUserByEmail(email);
  if (!user || !(await checkPassword(password, user.password_hash))) {
    throw unauthorized('Email ou mot de passe incorrect');
  }
  res.json({ token: signToken(user), user: toPublicUser(user) });
});

router.get('/me', requireAuth, async (req, res) => {
  res.json(toPublicUser(await getUserOr404(req.user.id)));
});

router.patch('/me', requireAuth, async (req, res) => {
  const body = req.body ?? {};
  const changes = {};
  if (body.name !== undefined) changes.name = requireName(body.name);
  if (body.email !== undefined) changes.email = requireEmail(body.email);
  if (Object.keys(changes).length === 0) throw badRequest('Rien à modifier : fournissez « name » et/ou « email »');
  res.json(toPublicUser(await updateUser(req.user.id, changes)));
});

router.put('/me/password', requireAuth, async (req, res) => {
  const body = req.body ?? {};
  const currentPassword = requirePassword(body.currentPassword, 'currentPassword', { min: 1 });
  const newPassword = requirePassword(body.newPassword, 'newPassword');

  const user = await getUserOr404(req.user.id);
  if (!(await checkPassword(currentPassword, user.password_hash))) {
    // 400 et non 401 : l'utilisateur est connecté, sa session est valide (401 = problème de session).
    throw badRequest('Mot de passe actuel incorrect');
  }
  await query('UPDATE users SET password_hash = ? WHERE id = ?', [await hashPassword(newPassword), user.id]);
  res.status(204).end();
});

router.delete('/me', requireAuth, async (req, res) => {
  const password = requirePassword(req.body?.password, 'password', { min: 1 });
  const user = await getUserOr404(req.user.id);
  if (!(await checkPassword(password, user.password_hash))) {
    throw badRequest('Mot de passe incorrect');
  }
  await assertNotLastAdmin(user, 'supprimer ce compte');
  await query('DELETE FROM users WHERE id = ?', [user.id]);
  res.status(204).end();
});

export default router;
