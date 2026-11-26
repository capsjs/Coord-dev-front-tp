import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

import { api, register, withDb } from './helpers.js';

const inDays = (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

const eventBody = (overrides = {}) => ({
  title: 'Atelier capacité',
  date: inDays(30),
  location: 'Lyon',
  ...overrides,
});

const countRegistrations = (eventId) =>
  withDb(async (db) => {
    const [[{ n }]] = await db.query('SELECT COUNT(*) AS n FROM registrations WHERE event_id = ?', [eventId]);
    return Number(n);
  });

describe("Capacité d'un événement (F10)", () => {
  let organizer;
  const participants = [];

  const createEvent = async (overrides) => {
    const res = await api('POST', '/api/events', { token: organizer.token, body: eventBody(overrides) });
    assert.equal(res.status, 201, JSON.stringify(res.body));
    return res.body;
  };
  const updateEvent = (id, overrides) => api('PUT', `/api/events/${id}`, { token: organizer.token, body: eventBody(overrides) });
  const getEvent = async (id) => (await api('GET', `/api/events/${id}`)).body;
  const registerTo = (eventId, participant) => api('POST', `/api/events/${eventId}/registrations`, { token: participant.token });
  const unregisterFrom = (eventId, participant) => api('DELETE', `/api/events/${eventId}/registrations/me`, { token: participant.token });

  before(async () => {
    organizer = await register('organizer');
    for (let i = 0; i < 5; i++) participants.push(await register('participant'));
  });

  it("n'impose aucune limite si la capacité n'est pas saisie [F10.1]", async () => {
    const event = await createEvent();
    assert.equal(event.capacity, null);
    assert.equal(event.remainingSeats, null);
  });

  it('enregistre la capacité saisie à la création [F10.1] [F10.2]', async () => {
    const event = await createEvent({ capacity: 3 });
    assert.equal(event.capacity, 3);
    assert.equal(event.remainingSeats, 3);
  });

  it('modifie la capacité, ou la retire si elle est absente ou null [F10.1]', async () => {
    const event = await createEvent({ capacity: 3 });

    let res = await updateEvent(event.id, { capacity: 10 });
    assert.equal(res.status, 200, JSON.stringify(res.body));
    assert.equal(res.body.capacity, 10);
    assert.equal(res.body.remainingSeats, 10);

    res = await updateEvent(event.id, { capacity: null });
    assert.equal(res.status, 200);
    assert.equal(res.body.capacity, null);
    assert.equal(res.body.remainingSeats, null);

    await updateEvent(event.id, { capacity: 4 });
    res = await updateEvent(event.id);
    assert.equal(res.body.capacity, null);
  });

  it('refuse une capacité invalide (400)', async () => {
    for (const capacity of [0, -1, 2.5, '10', 100001]) {
      const res = await api('POST', '/api/events', { token: organizer.token, body: eventBody({ capacity }) });
      assert.equal(res.status, 400, `capacity=${JSON.stringify(capacity)}`);
      assert.match(res.body.error, /capacity/);
    }
  });

  it('met à jour les places restantes sur la fiche et la liste [F10.2]', async () => {
    const event = await createEvent({ capacity: 3 });
    assert.equal((await registerTo(event.id, participants[0])).status, 201);

    assert.equal((await getEvent(event.id)).remainingSeats, 2);
    const listed = (await api('GET', '/api/events')).body.find((e) => e.id === event.id);
    assert.equal(listed.remainingSeats, 2);

    assert.equal((await unregisterFrom(event.id, participants[0])).status, 204);
    assert.equal((await getEvent(event.id)).remainingSeats, 3);
  });

  it("refuse l'inscription quand l'événement est complet (409) [F10.3]", async () => {
    const event = await createEvent({ capacity: 1 });
    assert.equal((await registerTo(event.id, participants[0])).status, 201);
    assert.equal((await getEvent(event.id)).remainingSeats, 0);

    const res = await registerTo(event.id, participants[1]);
    assert.equal(res.status, 409);
    assert.equal(res.body.error, 'Cet événement est complet');
    assert.equal(await countRegistrations(event.id), 1);
  });

  it("répond « déjà inscrit » à un inscrit qui retente, même si l'événement est complet", async () => {
    const event = await createEvent({ capacity: 1 });
    assert.equal((await registerTo(event.id, participants[0])).status, 201);

    const res = await registerTo(event.id, participants[0]);
    assert.equal(res.status, 409);
    assert.equal(res.body.error, 'Vous êtes déjà inscrit à cet événement');
  });

  it('libère une place à la désinscription [F10.3]', async () => {
    const event = await createEvent({ capacity: 1 });
    assert.equal((await registerTo(event.id, participants[0])).status, 201);
    assert.equal((await unregisterFrom(event.id, participants[0])).status, 204);

    assert.equal((await registerTo(event.id, participants[1])).status, 201);
  });

  it("n'accepte pas plus d'inscrits que de places quand les demandes arrivent en même temps [F10.3]", async () => {
    const event = await createEvent({ capacity: 2 });

    const statuses = (await Promise.all(participants.map((p) => registerTo(event.id, p))))
      .map((r) => r.status)
      .sort();
    assert.deepEqual(statuses, [201, 201, 409, 409, 409]);
    assert.equal(await countRegistrations(event.id), 2);
    assert.equal((await getEvent(event.id)).remainingSeats, 0);
  });

  it("refuse une capacité inférieure au nombre d'inscrits (400) [F10.4]", async () => {
    const event = await createEvent({ capacity: 3 });
    for (const p of participants.slice(0, 2)) assert.equal((await registerTo(event.id, p)).status, 201);

    const res = await updateEvent(event.id, { capacity: 1, title: 'Titre modifié' });
    assert.equal(res.status, 400);
    assert.equal(res.body.error, "La capacité ne peut pas être inférieure au nombre d'inscrits actuel (2)");
    const unchanged = await getEvent(event.id);
    assert.equal(unchanged.capacity, 3);
    assert.equal(unchanged.title, 'Atelier capacité');
  });

  it("accepte une capacité égale au nombre d'inscrits : l'événement devient complet [F10.4]", async () => {
    const event = await createEvent({ capacity: 3 });
    for (const p of participants.slice(0, 2)) assert.equal((await registerTo(event.id, p)).status, 201);

    const res = await updateEvent(event.id, { capacity: 2 });
    assert.equal(res.status, 200);
    assert.equal(res.body.remainingSeats, 0);
    assert.equal((await registerTo(event.id, participants[2])).status, 409);
  });
});
