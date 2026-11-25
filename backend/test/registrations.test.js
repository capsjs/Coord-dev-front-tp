import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

import { ADMIN, api, register, withDb } from './helpers.js';

const inDays = (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

const createEvent = async (organizer, date = inDays(30)) => {
  const res = await api('POST', '/api/events', {
    token: organizer.token,
    body: { title: 'Atelier Docker', date, location: 'Lyon' },
  });
  assert.equal(res.status, 201, JSON.stringify(res.body));
  return res.body;
};

const createPastEvent = (organizer) =>
  withDb(async (db) => {
    const [r] = await db.query(
      "INSERT INTO events (title, description, date, location, organizer_id) VALUES ('Passé', '', ?, 'Lyon', ?)",
      [new Date(Date.now() - 60 * 60 * 1000), organizer.user.id],
    );
    return r.insertId;
  });

const countRegistrations = (column, id) =>
  withDb(async (db) => {
    const [[{ n }]] = await db.query(`SELECT COUNT(*) AS n FROM registrations WHERE ${column} = ?`, [id]);
    return Number(n);
  });

const registerTo = (eventId, token) => api('POST', `/api/events/${eventId}/registrations`, { token });

describe("Inscription à un événement (POST /api/events/:id/registrations)", () => {
  let organizer;
  let participant;
  before(async () => {
    organizer = await register('organizer');
    participant = await register('participant');
  });

  it("inscrit le participant connecté et renvoie l'inscription datée (201) [F06.2]", async () => {
    const event = await createEvent(organizer);
    const before = Date.now() - 1000;

    const res = await registerTo(event.id, participant.token);
    assert.equal(res.status, 201, JSON.stringify(res.body));
    assert.deepEqual(Object.keys(res.body).sort(), ['createdAt', 'eventId', 'userId']);
    assert.equal(res.body.eventId, event.id);
    assert.equal(res.body.userId, participant.user.id);
    assert.ok(Date.parse(res.body.createdAt) >= before, "la date d'inscription est celle de la requête");
    assert.equal(await countRegistrations('event_id', event.id), 1);
  });

  it('accepte plusieurs participants sur le même événement', async () => {
    const event = await createEvent(organizer);
    const other = await register('participant');
    assert.equal((await registerTo(event.id, participant.token)).status, 201);
    assert.equal((await registerTo(event.id, other.token)).status, 201);
    assert.equal(await countRegistrations('event_id', event.id), 2);
  });

  it('refuse une double inscription (409) [F06.3]', async () => {
    const event = await createEvent(organizer);
    assert.equal((await registerTo(event.id, participant.token)).status, 201);

    const res = await registerTo(event.id, participant.token);
    assert.equal(res.status, 409);
    assert.equal(res.body.error, 'Vous êtes déjà inscrit à cet événement');
    assert.equal(await countRegistrations('event_id', event.id), 1);
  });

  it('refuse une double inscription envoyée en même temps (409) [F06.3]', async () => {
    const event = await createEvent(organizer);
    const statuses = (await Promise.all([1, 2, 3].map(() => registerTo(event.id, participant.token))))
      .map((r) => r.status)
      .sort();
    assert.deepEqual(statuses, [201, 409, 409]);
    assert.equal(await countRegistrations('event_id', event.id), 1);
  });

  it('refuse un événement déjà passé (400) [F06.5]', async () => {
    const pastId = await createPastEvent(organizer);
    const res = await registerTo(pastId, participant.token);
    assert.equal(res.status, 400);
    assert.equal(res.body.error, 'Cet événement est déjà passé');
    assert.equal(await countRegistrations('event_id', pastId), 0);
  });

  it('exige un jeton valide (401) [F06.4] [F08b.1]', async () => {
    const event = await createEvent(organizer);
    assert.equal((await registerTo(event.id)).status, 401);
    assert.equal((await registerTo(event.id, 'faux.jeton.jwt')).status, 401);
    assert.equal(await countRegistrations('event_id', event.id), 0);
  });

  it("est réservée aux participants : refuse un organisateur et un admin (403) [F08b.4]", async () => {
    const event = await createEvent(organizer);
    const adminToken = (await api('POST', '/api/auth/login', { body: ADMIN })).body.token;
    for (const token of [organizer.token, adminToken]) {
      const res = await registerTo(event.id, token);
      assert.equal(res.status, 403);
      assert.equal(res.body.error, "Seuls les participants peuvent s'inscrire à un événement");
    }
    assert.equal(await countRegistrations('event_id', event.id), 0);
  });

  it("renvoie 404 si l'événement n'existe pas, avant de vérifier le rôle", async () => {
    for (const token of [participant.token, organizer.token]) {
      const res = await registerTo(999999999, token);
      assert.equal(res.status, 404);
      assert.equal(res.body.error, 'Événement introuvable');
    }
  });

  it('refuse un identifiant invalide (400)', async () => {
    assert.equal((await registerTo('abc', participant.token)).status, 400);
  });
});

describe('Suppression des inscriptions en cascade', () => {
  it("supprime les inscriptions quand l'événement est supprimé [F03.4]", async () => {
    const organizer = await register('organizer');
    const participant = await register('participant');
    const event = await createEvent(organizer);
    assert.equal((await registerTo(event.id, participant.token)).status, 201);

    assert.equal((await api('DELETE', `/api/events/${event.id}`, { token: organizer.token })).status, 204);
    assert.equal(await countRegistrations('event_id', event.id), 0);
  });

  it('supprime les inscriptions quand le compte du participant est supprimé', async () => {
    const organizer = await register('organizer');
    const participant = await register('participant');
    const event = await createEvent(organizer);
    assert.equal((await registerTo(event.id, participant.token)).status, 201);

    const res = await api('DELETE', '/api/auth/me', { token: participant.token, body: { password: participant.password } });
    assert.equal(res.status, 204);
    assert.equal(await countRegistrations('user_id', participant.user.id), 0);
  });
});
