// Tests unitaires du gestionnaire d'erreurs : chaque type d'erreur doit produire le bon code HTTP
// et le format { error } du contrat. Aucune API n'est démarrée : on passe une fausse réponse.
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import { HttpError, badRequest, conflict, errorHandler, forbidden, notFound, unauthorized } from '../../src/errors.js';

/** Fausse réponse Express qui enregistre le code et le corps envoyés. */
function fakeRes() {
  return {
    statusCode: undefined,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

const req = { method: 'POST', originalUrl: '/api/events' };

function handle(err) {
  const res = fakeRes();
  errorHandler(err, req, res, () => {});
  return res;
}

describe('fabriques d’erreurs HTTP', () => {
  it('associent le bon code à chaque erreur', () => {
    assert.equal(badRequest('x').status, 400);
    assert.equal(unauthorized().status, 401);
    assert.equal(forbidden().status, 403);
    assert.equal(notFound().status, 404);
    assert.equal(conflict('x').status, 409);
  });

  it('ont un message par défaut pour 401, 403 et 404', () => {
    assert.equal(unauthorized().message, 'Authentification requise');
    assert.equal(forbidden().message, 'Accès refusé');
    assert.equal(notFound().message, 'Ressource introuvable');
  });
});

describe('errorHandler', () => {
  beforeEach((t) => {
    // Les erreurs 500 sont loguées : on coupe la sortie pour garder les tests lisibles.
    t.mock.method(console, 'error', () => {});
  });

  it('renvoie le code et le message d’une HttpError', () => {
    const res = handle(new HttpError(409, 'Déjà inscrit'));
    assert.equal(res.statusCode, 409);
    assert.deepEqual(res.body, { error: 'Déjà inscrit' });
  });

  it('renvoie 400 « JSON invalide » si le corps ne se parse pas', () => {
    const err = Object.assign(new SyntaxError('Unexpected token'), { type: 'entity.parse.failed' });
    const res = handle(err);
    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, { error: 'JSON invalide' });
  });

  it('traduit une requête non conforme au contrat (erreur de format) [CT.1] [CT.3]', () => {
    const err = {
      status: 400,
      message: 'request/body/date must match format "date-time"',
      errors: [{ path: '/body/date', message: 'must match format "date-time"', errorCode: 'format.openapi.validation' }],
    };
    const res = handle(err);
    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, { error: 'Champ « date » invalide : doit respecter le format date-time' });
  });

  it('traduit une requête non conforme au contrat (autre erreur, champ imbriqué)', () => {
    const err = {
      status: 400,
      message: 'bad request',
      errors: [{ path: '/body/organizer/name', message: 'must be string', errorCode: 'type.openapi.validation' }],
    };
    assert.deepEqual(handle(err).body, { error: 'Champ « organizer.name » invalide : must be string' });
  });

  it('garde le message global si l’erreur du contrat ne cible aucun champ', () => {
    const noPath = { status: 415, message: 'unsupported media type', errors: [{ message: 'unsupported media type' }] };
    assert.deepEqual(handle(noPath).body, { error: 'unsupported media type' });

    const empty = { status: 405, message: 'method not allowed', errors: [] };
    const res = handle(empty);
    assert.equal(res.statusCode, 405);
    assert.deepEqual(res.body, { error: 'method not allowed' });
  });

  it('renvoie 500 si une réponse de l’API ne respecte pas le contrat, et le logue [CT.2]', () => {
    const err = { status: 500, message: '.response should have required property', errors: [{ path: '/response/organizer' }] };
    const res = handle(err);
    assert.equal(res.statusCode, 500);
    assert.deepEqual(res.body, { error: "Réponse non conforme au contrat d'API" });
    assert.match(String(console.error.mock.calls[0].arguments[0]), /\[contrat\]/);
  });

  it('renvoie 500 générique pour une erreur inattendue, sans exposer le détail', () => {
    const res = handle(new Error('Connection lost: the server closed the connection'));
    assert.equal(res.statusCode, 500);
    assert.deepEqual(res.body, { error: 'Erreur interne du serveur' });
    assert.equal(console.error.mock.callCount(), 1);
  });
});
