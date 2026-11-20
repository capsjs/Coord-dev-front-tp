// Prérequis : l'API doit tourner (make up) avec SEED_DEMO=true.
// Conformité au contrat (openapi.yaml) : l'API refuse toute requête qui ne le respecte pas.
// Les réponses sont elles aussi vérifiées contre le contrat (VALIDATE_RESPONSES=true en dev et en CI) :
// une réponse non conforme renvoie 500 et fait échouer les autres tests.
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

import { api, register } from './helpers.js';

describe('Conformité des requêtes au contrat', () => {
  let organizer;
  before(async () => {
    organizer = await register('organizer');
  });

  const event = (overrides) => ({ title: 'Test contrat', location: 'Lyon', date: '2030-01-15T18:00:00.000Z', ...overrides });

  it('refuse une date sans heure ou sans fuseau horaire (format date-time)', async () => {
    for (const date of ['2030-01-15', '2030-01-15T18:00']) {
      const res = await api('POST', '/api/events', { token: organizer.token, body: event({ date }) });
      assert.equal(res.status, 400, `attendu 400 pour date=${date}`);
      assert.match(res.body.error, /date.*date-time/);
    }
  });

  it('accepte une date ISO 8601 complète', async () => {
    const res = await api('POST', '/api/events', { token: organizer.token, body: event() });
    assert.equal(res.status, 201, JSON.stringify(res.body));
  });

  it('refuse un type incorrect sans conversion implicite', async () => {
    const res = await api('POST', '/api/events', { token: organizer.token, body: event({ price: '10' }) });
    assert.equal(res.status, 400);
    assert.match(res.body.error, /price/);
  });

  it('refuse un identifiant de chemin non entier', async () => {
    const res = await api('GET', '/api/events/abc');
    assert.equal(res.status, 400);
    assert.match(res.body.error, /id/);
  });

  it('renvoie les erreurs au format { error } du contrat', async () => {
    const res = await api('POST', '/api/auth/register', { body: { name: 'A' } });
    assert.equal(res.status, 400);
    assert.deepEqual(Object.keys(res.body), ['error']);
    assert.equal(typeof res.body.error, 'string');
  });
});
