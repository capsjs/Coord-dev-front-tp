import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { query } from '../db.js';
import { forbidden, unauthorized } from '../errors.js';

export function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

async function loadUser(req) {
  const header = req.get('authorization') ?? '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return null;

  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret);
  } catch (err) {
    // Message distinct pour une session expirée : le front peut rediriger vers la connexion.
    if (err.name === 'TokenExpiredError') throw unauthorized('Session expirée : reconnectez-vous');
    throw unauthorized('Jeton invalide');
  }
  // On relit l'utilisateur en base : un rôle modifié ou un compte supprimé est pris en compte immédiatement.
  const [user] = await query('SELECT id, email, name, role FROM users WHERE id = ?', [payload.sub]);
  if (!user) throw unauthorized('Compte introuvable');
  return user;
}

export async function optionalAuth(req, _res, next) {
  req.user = await loadUser(req);
  next();
}

export async function requireAuth(req, _res, next) {
  req.user = await loadUser(req);
  if (!req.user) throw unauthorized();
  next();
}

export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user) throw unauthorized();
    if (!roles.includes(req.user.role)) throw forbidden();
    next();
  };
}
