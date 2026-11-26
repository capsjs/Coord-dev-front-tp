// Étapes Gherkin du niveau API : chaque phrase des fichiers .feature est reliée ici à des appels HTTP.
// Les acteurs sont désignés par leur rôle : « organisateur », « autre organisateur », « participant »,
// « administrateur », « visiteur » (non connecté).
import { expect } from '@playwright/test';
import jwt from 'jsonwebtoken';

import { Given, When, Then } from '../fixtures.js';
import { ADMIN, JWT_SECRET, PASSWORD, api, eventBody, inDays, uniqueEmail, withDb } from './helpers.js';

const ACTEUR = '(organisateur|autre organisateur|participant|administrateur|visiteur)';
const ROLES = { organisateur: 'organizer', 'autre organisateur': 'organizer', participant: 'participant' };

function acteur(ctx, nom) {
  if (nom === 'visiteur') return { token: null };
  const a = ctx.acteurs[nom];
  if (!a) throw new Error(`Acteur « ${nom} » absent du scénario : ajoutez « Soit un ${nom} connecté ».`);
  return a;
}

async function register(request, role) {
  const email = uniqueEmail();
  const res = await api(request, 'POST', '/api/auth/register', {
    body: { name: 'Utilisateur BDD', email, password: PASSWORD, role },
  });
  expect(res.status, JSON.stringify(res.body)).toBe(201);
  return { ...res.body, email, password: PASSWORD };
}

async function insertPastEvent(organizerId) {
  return withDb(async (db) => {
    const [r] = await db.query(
      "INSERT INTO events (title, description, date, location, organizer_id) VALUES ('Événement passé', '', ?, 'Lyon', ?)",
      [new Date(Date.now() - 24 * 60 * 60 * 1000), organizerId],
    );
    return { id: r.insertId };
  });
}

async function createEvent(request, ctx, nom, body) {
  const res = await api(request, 'POST', '/api/events', { token: acteur(ctx, nom).token, body });
  expect(res.status, JSON.stringify(res.body)).toBe(201);
  ctx.event = res.body;
  ctx.events.push(res.body);
  return res.body;
}

const defaultEvent = (days = 30) => ({ title: 'Meetup BDD', description: 'Scénario Gherkin', date: inDays(days), location: 'Lyon' });

// ─────────────────────────────────────────────── Contexte (Soit)

Given(new RegExp(`^un ${ACTEUR} connecté$`), async ({ request, ctx }, nom) => {
  if (nom === 'administrateur') {
    const res = await api(request, 'POST', '/api/auth/login', { body: ADMIN });
    expect(res.status).toBe(200);
    ctx.acteurs[nom] = { ...res.body, ...ADMIN };
  } else {
    ctx.acteurs[nom] = await register(request, ROLES[nom]);
  }
});

Given('un compte participant existant', async ({ request, ctx }) => {
  ctx.acteurs.participant = await register(request, 'participant');
});

Given("un événement à venir créé par l'organisateur", async ({ request, ctx }) => {
  await createEvent(request, ctx, 'organisateur', defaultEvent());
});

Given(/^deux événements à venir créés par l'organisateur, dans (\d+) et (\d+) jours$/, async ({ request, ctx }, a, b) => {
  await createEvent(request, ctx, 'organisateur', defaultEvent(Number(a)));
  await createEvent(request, ctx, 'organisateur', defaultEvent(Number(b)));
});

Given("un événement déjà passé créé par l'organisateur", async ({ ctx }) => {
  ctx.event = await insertPastEvent(acteur(ctx, 'organisateur').user.id);
  ctx.events.push(ctx.event);
});

Given("le participant est inscrit à l'événement", async ({ request, ctx }) => {
  const res = await api(request, 'POST', `/api/events/${ctx.event.id}/registrations`, { token: acteur(ctx, 'participant').token });
  expect(res.status, JSON.stringify(res.body)).toBe(201);
});

// ─────────────────────────────────────────────── Actions (Quand)

When('un visiteur crée un compte avec un nouvel email', async ({ request, ctx }) => {
  const email = uniqueEmail();
  ctx.response = await api(request, 'POST', '/api/auth/register', { body: { name: 'Nouveau', email, password: PASSWORD } });
  if (ctx.response.status === 201) ctx.acteurs.participant = { ...ctx.response.body, email, password: PASSWORD };
});

When("un visiteur crée un compte avec l'email du compte existant", async ({ request, ctx }) => {
  const { email } = acteur(ctx, 'participant');
  ctx.response = await api(request, 'POST', '/api/auth/register', { body: { name: 'Doublon', email, password: PASSWORD } });
});

When('un visiteur crée un compte sans mot de passe', async ({ request, ctx }) => {
  ctx.response = await api(request, 'POST', '/api/auth/register', { body: { name: 'Sans mot de passe', email: uniqueEmail() } });
});

When(/^le participant se connecte avec (son mot de passe|un mauvais mot de passe|un email inconnu)$/, async ({ request, ctx }, cas) => {
  const { email, password } = acteur(ctx, 'participant');
  const body = {
    'son mot de passe': { email, password },
    'un mauvais mot de passe': { email, password: 'mauvais-mot-de-passe' },
    'un email inconnu': { email: uniqueEmail(), password },
  }[cas];
  ctx.response = await api(request, 'POST', '/api/auth/login', { body });
});

When(/^le participant consulte son profil avec un jeton (expiré|falsifié)$/, async ({ request, ctx }, cas) => {
  const { user } = acteur(ctx, 'participant');
  const token = cas === 'expiré'
    ? jwt.sign({ sub: user.id, role: user.role, exp: Math.floor(Date.now() / 1000) - 60 }, JWT_SECRET)
    : jwt.sign({ sub: user.id, role: 'admin' }, 'pas-le-bon-secret');
  ctx.response = await api(request, 'GET', '/api/auth/me', { token });
});

When(new RegExp(`^(?:le |l')${ACTEUR} crée un événement avec :$`), async ({ request, ctx }, nom, table) => {
  ctx.response = await api(request, 'POST', '/api/events', { token: acteur(ctx, nom).token, body: eventBody(table.rowsHash()) });
  if (ctx.response.status === 201) {
    ctx.event = ctx.response.body;
    ctx.events.push(ctx.event);
  }
});

When(new RegExp(`^(?:le |l')${ACTEUR} modifie l'événement avec :$`), async ({ request, ctx }, nom, table) => {
  ctx.response = await api(request, 'PUT', `/api/events/${ctx.event.id}`, { token: acteur(ctx, nom).token, body: eventBody(table.rowsHash()) });
});

When(new RegExp(`^(?:le |l')${ACTEUR} supprime l'événement$`), async ({ request, ctx }, nom) => {
  ctx.response = await api(request, 'DELETE', `/api/events/${ctx.event.id}`, { token: acteur(ctx, nom).token });
});

When(new RegExp(`^(?:le |l')${ACTEUR} consulte la liste des événements$`), async ({ request, ctx }, nom) => {
  ctx.response = await api(request, 'GET', '/api/events', { token: acteur(ctx, nom).token });
});

When(new RegExp(`^(?:le |l')${ACTEUR} consulte la fiche de l'événement$`), async ({ request, ctx }, nom) => {
  ctx.response = await api(request, 'GET', `/api/events/${ctx.event.id}`, { token: acteur(ctx, nom).token });
});

When(new RegExp(`^(?:le |l')${ACTEUR} consulte la fiche d'un événement inexistant$`), async ({ request, ctx }, nom) => {
  ctx.response = await api(request, 'GET', '/api/events/999999999', { token: acteur(ctx, nom).token });
});

When(new RegExp(`^(?:le |l')${ACTEUR} s'inscrit à l'événement$`), async ({ request, ctx }, nom) => {
  ctx.response = await api(request, 'POST', `/api/events/${ctx.event.id}/registrations`, { token: acteur(ctx, nom).token });
});

When(new RegExp(`^(?:le |l')${ACTEUR} se désinscrit de l'événement$`), async ({ request, ctx }, nom) => {
  ctx.response = await api(request, 'DELETE', `/api/events/${ctx.event.id}/registrations/me`, { token: acteur(ctx, nom).token });
});

When(new RegExp(`^(?:le |l')${ACTEUR} consulte ses inscriptions$`), async ({ request, ctx }, nom) => {
  ctx.response = await api(request, 'GET', '/api/auth/me/registrations', { token: acteur(ctx, nom).token });
});

// ─────────────────────────────────────────────── Résultats (Alors)

Then(/^la réponse a le code (\d+)$/, async ({ ctx }, code) => {
  expect(ctx.response.status, JSON.stringify(ctx.response.body)).toBe(Number(code));
});

Then(/^le message d'erreur est "(.*)"$/, async ({ ctx }, message) => {
  expect(ctx.response.body).toEqual({ error: message });
});

Then(/^le message d'erreur mentionne "(.*)"$/, async ({ ctx }, texte) => {
  expect(Object.keys(ctx.response.body)).toEqual(['error']);
  expect(ctx.response.body.error).toContain(texte);
});

Then('un jeton de connexion est renvoyé', async ({ ctx }) => {
  expect(typeof ctx.response.body.token).toBe('string');
  expect(ctx.response.body.user.passwordHash).toBeUndefined();
});

Then('le mot de passe est stocké haché en base', async ({ ctx }) => {
  const { user, password } = acteur(ctx, 'participant');
  const [row] = await withDb(async (db) => (await db.query('SELECT password_hash FROM users WHERE id = ?', [user.id]))[0]);
  expect(row.password_hash).not.toContain(password);
  expect(row.password_hash).toMatch(/^\$2[aby]\$\d{2}\$/);
});

Then("l'événement appartient à l'organisateur", async ({ ctx }) => {
  const { user } = acteur(ctx, 'organisateur');
  expect(ctx.response.body.organizerId).toBe(user.id);
  expect(ctx.response.body.organizer).toEqual({ id: user.id, name: user.name });
});

Then(/^l'événement (apparaît|n'apparaît pas) dans la liste des événements$/, async ({ request, ctx }, cas) => {
  const res = await api(request, 'GET', '/api/events');
  const ids = res.body.map((e) => e.id);
  if (cas === 'apparaît') expect(ids).toContain(ctx.event.id);
  else expect(ids).not.toContain(ctx.event.id);
});

Then('la liste est triée par date croissante, sans événement passé', async ({ ctx }) => {
  const dates = ctx.response.body.map((e) => Date.parse(e.date));
  expect(dates).toEqual([...dates].sort((a, b) => a - b));
  expect(dates.every((d) => d > Date.now())).toBe(true);
  const ids = ctx.response.body.map((e) => e.id);
  const [soon, later] = ctx.events.filter((e) => e.date).sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
  expect(ids.indexOf(soon.id)).toBeLessThan(ids.indexOf(later.id));
});

Then("la liste ne contient pas l'événement passé", async ({ ctx }) => {
  expect(ctx.response.body.map((e) => e.id)).not.toContain(ctx.event.id);
});

Then('chaque événement de la liste a un titre, une date et un lieu', async ({ ctx }) => {
  expect(ctx.response.body.length).toBeGreaterThan(0);
  for (const e of ctx.response.body) {
    expect(e.title).toBeTruthy();
    expect(Number.isNaN(Date.parse(e.date))).toBe(false);
    expect(e.location).toBeTruthy();
  }
});

Then("la fiche affiche le titre, la description, la date, le lieu et le nom de l'organisateur", async ({ ctx }) => {
  const fiche = ctx.response.body;
  for (const field of ['title', 'description', 'date', 'location']) expect(fiche[field]).toEqual(ctx.event[field]);
  expect(fiche.organizer.name).toBe(acteur(ctx, 'organisateur').user.name);
});

Then(/^la fiche de l'événement affiche le titre "(.*)"$/, async ({ request, ctx }, titre) => {
  const res = await api(request, 'GET', `/api/events/${ctx.event.id}`);
  expect(res.body.title).toBe(titre);
});

Then(/^la liste des événements affiche le titre "(.*)"$/, async ({ request, ctx }, titre) => {
  const res = await api(request, 'GET', '/api/events');
  expect(res.body.find((e) => e.id === ctx.event.id)?.title).toBe(titre);
});

Then("l'événement n'est pas modifié", async ({ request, ctx }) => {
  const res = await api(request, 'GET', `/api/events/${ctx.event.id}`);
  expect(res.body.title).toBe(ctx.event.title);
});

Then("la fiche de l'événement est introuvable", async ({ request, ctx }) => {
  const res = await api(request, 'GET', `/api/events/${ctx.event.id}`);
  expect(res.status).toBe(404);
});

Then(/^l'événement (figure|ne figure plus) dans les inscriptions du participant$/, async ({ request, ctx }, cas) => {
  const res = await api(request, 'GET', '/api/auth/me/registrations', { token: acteur(ctx, 'participant').token });
  expect(res.status).toBe(200);
  const ids = res.body.map((e) => e.id);
  if (cas === 'figure') expect(ids).toContain(ctx.event.id);
  else expect(ids).not.toContain(ctx.event.id);
});
