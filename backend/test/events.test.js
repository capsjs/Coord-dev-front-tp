// Prérequis : l'API doit tourner (make up) avec SEED_DEMO=true.
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

import { ADMIN, api, register, withDb } from './helpers.js';

// Dates à la seconde près : l'API les stocke sans millisecondes.
const inDays = (days) => {
  const d = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  d.setUTCMilliseconds(0);
  return d.toISOString();
};

const without = (key) => {
  const event = validEvent();
  delete event[key];
  return event;
};

const validEvent = (overrides = {}) => ({
  title: 'Meetup JavaScript',
  description: 'Soirée de talks autour de React 19.',
  date: inDays(30),
  location: 'La Cordée, Lyon',
  price: 10,
  currency: 'EUR',
  ...overrides,
});

describe('Création d\'un événement (POST /api/events)', () => {
  let organizer;
  before(async () => {
    organizer = await register('organizer');
  });

  it("crée l'événement et en fait l'organisateur l'utilisateur connecté", async () => {
    const body = validEvent();
    const res = await api('POST', '/api/events', { token: organizer.token, body });
    assert.equal(res.status, 201, JSON.stringify(res.body));
    assert.ok(Number.isInteger(res.body.id));
    assert.equal(res.body.title, body.title);
    assert.equal(res.body.description, body.description);
    assert.equal(res.body.date, body.date);
    assert.equal(res.body.location, body.location);
    assert.equal(res.body.price, 10);
    assert.equal(res.body.currency, 'EUR');
    assert.equal(res.body.organizerId, organizer.user.id);
    assert.deepEqual(res.body.organizer, { id: organizer.user.id, name: organizer.user.name });
    assert.ok(res.body.createdAt);
    assert.ok(res.body.updatedAt);
  });

  it('applique les valeurs par défaut (description vide, gratuit, EUR)', async () => {
    const { title, date, location } = validEvent();
    const res = await api('POST', '/api/events', { token: organizer.token, body: { title, date, location } });
    assert.equal(res.status, 201, JSON.stringify(res.body));
    assert.equal(res.body.description, '');
    assert.equal(res.body.price, 0);
    assert.equal(res.body.currency, 'EUR');
  });

  it('autorise un admin', async () => {
    const admin = (await api('POST', '/api/auth/login', { body: ADMIN })).body;
    const res = await api('POST', '/api/events', { token: admin.token, body: validEvent() });
    assert.equal(res.status, 201, JSON.stringify(res.body));
    assert.equal(res.body.organizerId, admin.user.id);
  });

  it('exige un jeton (401) et le rôle organizer ou admin (403)', async () => {
    assert.equal((await api('POST', '/api/events', { body: validEvent() })).status, 401);
    const participant = await register('participant');
    const res = await api('POST', '/api/events', { token: participant.token, body: validEvent() });
    assert.equal(res.status, 403);
    assert.ok(res.body.error);
  });

  it('valide les champs (400)', async () => {
    const cases = [
      without('title'),
      without('date'),
      without('location'),
      validEvent({ title: 'ab' }),
      validEvent({ title: 'x'.repeat(151) }),
      validEvent({ date: 'pas-une-date' }),
      validEvent({ date: inDays(-1) }),
      validEvent({ location: 'a' }),
      validEvent({ price: -5 }),
      validEvent({ price: '10' }),
      validEvent({ currency: 'euro' }),
      validEvent({ description: 42 }),
    ];
    for (const body of cases) {
      const res = await api('POST', '/api/events', { token: organizer.token, body });
      assert.equal(res.status, 400, `attendu 400 pour ${JSON.stringify(body)}`);
      assert.ok(res.body.error);
    }
  });
});

describe('Liste des événements à venir (GET /api/events)', () => {
  let organizer;
  let pastId;
  before(async () => {
    organizer = await register('organizer');
    pastId = await withDb(async (db) => {
      const [r] = await db.query(
        "INSERT INTO events (title, description, date, location, organizer_id) VALUES ('Événement passé', '', ?, 'Lyon', ?)",
        [new Date(Date.now() - 24 * 60 * 60 * 1000), organizer.user.id],
      );
      return r.insertId;
    });
  });

  it('est publique et renvoie les événements à venir triés par date croissante', async () => {
    const later = await api('POST', '/api/events', { token: organizer.token, body: validEvent({ date: inDays(60) }) });
    const sooner = await api('POST', '/api/events', { token: organizer.token, body: validEvent({ date: inDays(2) }) });

    const res = await api('GET', '/api/events');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body));

    const ids = res.body.map((e) => e.id);
    assert.ok(ids.includes(later.body.id) && ids.includes(sooner.body.id));
    assert.ok(ids.indexOf(sooner.body.id) < ids.indexOf(later.body.id), 'le plus proche doit venir en premier');

    const dates = res.body.map((e) => Date.parse(e.date));
    assert.deepEqual(dates, [...dates].sort((a, b) => a - b));
    assert.ok(dates.every((d) => d > Date.now()), 'aucun événement passé');
  });

  it("n'inclut pas les événements passés", async () => {
    const res = await api('GET', '/api/events');
    assert.ok(!res.body.some((e) => e.id === pastId));
  });

  it("renvoie le nom de l'organisateur avec chaque événement", async () => {
    const res = await api('GET', '/api/events');
    assert.ok(res.body.length > 0);
    for (const e of res.body) {
      assert.equal(e.organizer.id, e.organizerId);
      assert.equal(typeof e.organizer.name, 'string');
    }
  });
});

describe("Détail d'un événement (GET /api/events/:id)", () => {
  let organizer;
  let created;
  before(async () => {
    organizer = await register('organizer');
    created = (await api('POST', '/api/events', { token: organizer.token, body: validEvent() })).body;
  });

  it("est public et renvoie toutes les informations, organisateur compris", async () => {
    const res = await api('GET', `/api/events/${created.id}`);
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, created);
    assert.deepEqual(res.body.organizer, { id: organizer.user.id, name: organizer.user.name });
  });

  it('renvoie aussi un événement passé', async () => {
    const pastId = await withDb(async (db) => {
      const [r] = await db.query(
        "INSERT INTO events (title, description, date, location, organizer_id) VALUES ('Passé', '', ?, 'Lyon', ?)",
        [new Date(Date.now() - 60 * 60 * 1000), organizer.user.id],
      );
      return r.insertId;
    });
    const res = await api('GET', `/api/events/${pastId}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.id, pastId);
  });

  it("renvoie 404 si l'événement n'existe pas", async () => {
    const res = await api('GET', '/api/events/999999999');
    assert.equal(res.status, 404);
    assert.equal(res.body.error, 'Événement introuvable');
  });
});
