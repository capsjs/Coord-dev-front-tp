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

const CURRENCY_RE = /^[A-Z]{3}$/;

export function optionalString(value, field, { max = 255 } = {}) {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string') throw badRequest(`Le champ « ${field} » doit être une chaîne`);
  const v = value.trim();
  if (v.length > max) throw badRequest(`Le champ « ${field} » ne doit pas dépasser ${max} caractères`);
  return v;
}

export function requireFutureDate(value, field = 'date') {
  if (typeof value !== 'string' || value.trim() === '') throw badRequest(`Le champ « ${field} » est requis`);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw badRequest(`Le champ « ${field} » doit être une date ISO 8601 valide`);
  if (date.getTime() <= Date.now()) throw badRequest(`Le champ « ${field} » doit être dans le futur`);
  date.setUTCMilliseconds(0); // stocké en DATETIME (à la seconde) : on tronque plutôt que laisser MySQL arrondir
  return date;
}

export function optionalPrice(value, field = 'price') {
  if (value === undefined || value === null) return 0;
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw badRequest(`Le champ « ${field} » doit être un nombre positif ou nul`);
  }
  if (value > 99999999.99) throw badRequest(`Le champ « ${field} » est trop grand`);
  return Math.round(value * 100) / 100;
}

export function optionalCurrency(value, field = 'currency') {
  if (value === undefined || value === null) return 'EUR';
  if (typeof value !== 'string' || !CURRENCY_RE.test(value)) {
    throw badRequest(`Le champ « ${field} » doit être un code devise de 3 lettres majuscules (ex. EUR)`);
  }
  return value;
}

/** Valide le corps d'un EventInput (création et modification). */
export function parseEventInput(body = {}) {
  return {
    title: requireString(body.title, 'title', { min: 3, max: 150 }),
    description: optionalString(body.description, 'description', { max: 5000 }),
    date: requireFutureDate(body.date),
    location: requireString(body.location, 'location', { min: 2, max: 255 }),
    price: optionalPrice(body.price),
    currency: optionalCurrency(body.currency),
  };
}
