// Tests unitaires : aucune API ni base de données nécessaire.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { assertCanManageEvent, assertCanRegister, canManageEvent } from '../../src/permissions.js';

const event = { id: 10, organizer_id: 1 };
const organizer = { id: 1, role: 'organizer' };
const otherOrganizer = { id: 2, role: 'organizer' };
const participant = { id: 3, role: 'participant' };
const admin = { id: 4, role: 'admin' };

describe('canManageEvent (F08)', () => {
  it("autorise l'organisateur de l'événement", () => {
    assert.equal(canManageEvent(organizer, event), true);
  });

  it("autorise un admin, même s'il n'est pas l'organisateur", () => {
    assert.equal(canManageEvent(admin, event), true);
  });

  it('refuse un autre organisateur [F08b.2]', () => {
    assert.equal(canManageEvent(otherOrganizer, event), false);
  });

  it('refuse un participant', () => {
    assert.equal(canManageEvent(participant, event), false);
  });

  it("garde l'organisateur propriétaire même si son rôle a changé", () => {
    // C'est l'id qui compte : un organisateur repassé participant peut encore gérer ses événements.
    assert.equal(canManageEvent({ id: 1, role: 'participant' }, event), true);
  });

  it('refuse sans utilisateur ou sans événement', () => {
    assert.equal(canManageEvent(null, event), false);
    assert.equal(canManageEvent(organizer, null), false);
  });
});

describe('assertCanManageEvent', () => {
  it('ne lève rien si autorisé', () => {
    assert.doesNotThrow(() => assertCanManageEvent(organizer, event));
  });

  it('lève une erreur 403 sinon [F08b.2]', () => {
    assert.throws(() => assertCanManageEvent(otherOrganizer, event), (err) => {
      assert.equal(err.status, 403);
      assert.match(err.message, /organisateur/);
      return true;
    });
  });
});

describe('assertCanRegister (F06)', () => {
  const now = new Date('2026-12-01T12:00:00.000Z');
  const upcoming = { date: new Date('2026-12-15T18:00:00.000Z') };
  const past = { date: new Date('2026-11-30T18:00:00.000Z') };
  const startingNow = { date: now };

  const expectError = (status, message) => (err) => {
    assert.equal(err.status, status);
    assert.equal(err.message, message);
    return true;
  };

  it('autorise un participant pour un événement à venir', () => {
    assert.doesNotThrow(() => assertCanRegister(participant, upcoming, now));
  });

  it('refuse un organisateur ou un admin (403)', () => {
    for (const user of [organizer, admin]) {
      assert.throws(
        () => assertCanRegister(user, upcoming, now),
        expectError(403, "Seuls les participants peuvent s'inscrire à un événement"),
      );
    }
  });

  it('refuse sans utilisateur (403)', () => {
    assert.throws(() => assertCanRegister(null, upcoming, now), expectError(403, "Seuls les participants peuvent s'inscrire à un événement"));
  });

  it('refuse un événement passé (400) [F06.5]', () => {
    assert.throws(() => assertCanRegister(participant, past, now), expectError(400, 'Cet événement est déjà passé'));
  });

  it("refuse un événement qui commence à l'instant (400) [F06.5]", () => {
    assert.throws(() => assertCanRegister(participant, startingNow, now), expectError(400, 'Cet événement est déjà passé'));
  });

  it("vérifie le rôle avant la date : un organisateur reçoit 403 même pour un événement passé", () => {
    assert.throws(() => assertCanRegister(organizer, past, now), expectError(403, "Seuls les participants peuvent s'inscrire à un événement"));
  });

  it("utilise l'heure courante par défaut", () => {
    assert.doesNotThrow(() => assertCanRegister(participant, { date: new Date(Date.now() + 60_000) }));
    assert.throws(() => assertCanRegister(participant, { date: new Date(Date.now() - 60_000) }), expectError(400, 'Cet événement est déjà passé'));
  });
});
