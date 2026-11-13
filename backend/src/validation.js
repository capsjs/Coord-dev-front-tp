import { badRequest } from './errors.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const ROLES = ['admin', 'organizer', 'participant'];
export const PASSWORD_MIN = 8;

export function requireString(value, field, { min = 1, max = 255 } = {}) {
  if (typeof value !== 'string') throw badRequest(`Le champ « ${field} » est requis`);
  const v = value.trim();
  if (v.length < min) throw badRequest(`Le champ « ${field} » doit contenir au moins ${min} caractère(s)`);
  if (v.length > max) throw badRequest(`Le champ « ${field} » ne doit pas dépasser ${max} caractères`);
  return v;
}

export function requireEmail(value) {
  const v = requireString(value, 'email').toLowerCase();
  if (!EMAIL_RE.test(v)) throw badRequest('Adresse email invalide');
  return v;
}

/** Les mots de passe ne sont pas « trim » : les espaces en bord font partie du mot de passe. */
export function requirePassword(value, field = 'password', { min = PASSWORD_MIN } = {}) {
  if (typeof value !== 'string' || value.length === 0) throw badRequest(`Le champ « ${field} » est requis`);
  if (value.length < min) throw badRequest(`Le champ « ${field} » doit contenir au moins ${min} caractères`);
  if (value.length > 128) throw badRequest(`Le champ « ${field} » ne doit pas dépasser 128 caractères`);
  return value;
}

export function requireName(value) {
  return requireString(value, 'name', { min: 2, max: 100 });
}

export function requireId(value, field = 'id') {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) throw badRequest(`Identifiant « ${field} » invalide`);
  return n;
}

export function oneOf(value, allowed, field) {
  if (!allowed.includes(value)) {
    throw badRequest(`Le champ « ${field} » doit valoir : ${allowed.join(', ')}`);
  }
  return value;
}
