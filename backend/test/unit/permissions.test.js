// Tests unitaires : aucune API ni base de données nécessaire.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { assertCanManageEvent, canManageEvent } from '../../src/permissions.js';

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
