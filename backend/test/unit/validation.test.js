// Tests unitaires de la validation métier. Le validateur OpenAPI refuse déjà la plupart des requêtes
// invalides avant d'arriver ici : ces fonctions sont le filet de sécurité, on les teste donc directement.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  oneOf,
  optionalCurrency,
  optionalPrice,
  optionalString,
  parseEventInput,
  requireEmail,
  requireFutureDate,
  requireId,
  requireName,
  requirePassword,
  requireString,
} from '../../src/validation.js';

/** Vérifie qu'une fonction lève une erreur 400 dont le message correspond au motif. */
const rejects400 = (fn, pattern) =>
  assert.throws(fn, (err) => {
    assert.equal(err.status, 400);
    if (pattern) assert.match(err.message, pattern);
    return true;
  });

const inMs = (ms) => new Date(Date.now() + ms).toISOString();

describe('requireString', () => {
  it('renvoie la valeur sans espaces autour', () => {
    assert.equal(requireString('  bonjour  ', 'titre'), 'bonjour');
  });

  it('refuse une valeur absente ou qui n’est pas une chaîne', () => {
    rejects400(() => requireString(undefined, 'titre'), /« titre » est requis/);
    rejects400(() => requireString(42, 'titre'), /est requis/);
  });

  it('applique les longueurs minimale et maximale (après trim)', () => {
    rejects400(() => requireString('   ab  ', 'titre', { min: 3 }), /au moins 3/);
    rejects400(() => requireString('abcdef', 'titre', { max: 5 }), /dépasser 5/);
    assert.equal(requireString('abc', 'titre', { min: 3, max: 3 }), 'abc');
  });
});

describe('requireEmail', () => {
  it('met en minuscules et retire les espaces', () => {
    assert.equal(requireEmail('  Jeanne@Example.COM '), 'jeanne@example.com');
  });

  it('refuse un email mal formé', () => {
    for (const email of ['jeanne', 'jeanne@', '@example.com', 'jeanne@example', 'jean ne@example.com']) {
      rejects400(() => requireEmail(email), /email invalide/);
    }
  });
});

describe('requirePassword', () => {
  it('conserve les espaces (pas de trim)', () => {
    assert.equal(requirePassword('  motdepasse  '), '  motdepasse  ');
  });

  it('refuse un mot de passe absent, trop court ou trop long', () => {
    rejects400(() => requirePassword(undefined), /« password » est requis/);
    rejects400(() => requirePassword(''), /est requis/);
    rejects400(() => requirePassword('court'), /au moins 8/);
    rejects400(() => requirePassword('x'.repeat(129)), /dépasser 128/);
  });

  it('accepte un minimum personnalisé et un autre nom de champ', () => {
    assert.equal(requirePassword('a', 'currentPassword', { min: 1 }), 'a');
    rejects400(() => requirePassword(undefined, 'newPassword'), /« newPassword »/);
  });
});

describe('requireName', () => {
  it('exige entre 2 et 100 caractères', () => {
    assert.equal(requireName(' Al '), 'Al');
    rejects400(() => requireName('A'), /au moins 2/);
    rejects400(() => requireName('x'.repeat(101)), /dépasser 100/);
  });
});

describe('requireId', () => {
  it('convertit un identifiant entier positif', () => {
    assert.equal(requireId('42'), 42);
    assert.equal(requireId(7), 7);
  });

  it('refuse zéro, un négatif, un décimal ou du texte', () => {
    for (const value of ['0', '-1', '1.5', 'abc', '', undefined]) {
      rejects400(() => requireId(value, 'id'), /Identifiant « id » invalide/);
    }
  });
});

describe('oneOf', () => {
  it('accepte une valeur autorisée', () => {
    assert.equal(oneOf('organizer', ['participant', 'organizer'], 'role'), 'organizer');
  });

  it('refuse une autre valeur en listant les valeurs possibles', () => {
    rejects400(() => oneOf('admin', ['participant', 'organizer'], 'role'), /doit valoir : participant, organizer/);
  });
});

describe('optionalString', () => {
  it('renvoie une chaîne vide si la valeur est absente', () => {
    assert.equal(optionalString(undefined, 'description'), '');
    assert.equal(optionalString(null, 'description'), '');
  });

  it('retire les espaces et applique la longueur maximale', () => {
    assert.equal(optionalString('  texte  ', 'description'), 'texte');
    rejects400(() => optionalString('abcdef', 'description', { max: 5 }), /dépasser 5/);
  });

  it('refuse une valeur qui n’est pas une chaîne', () => {
    rejects400(() => optionalString(42, 'description'), /doit être une chaîne/);
  });
});

describe('requireFutureDate', () => {
  it('renvoie une date future tronquée à la seconde', () => {
    const date = requireFutureDate('2099-06-01T10:20:30.789Z');
    assert.ok(date instanceof Date);
    assert.equal(date.toISOString(), '2099-06-01T10:20:30.000Z');
  });

  it('refuse une date absente ou vide', () => {
    rejects400(() => requireFutureDate(undefined), /« date » est requis/);
    rejects400(() => requireFutureDate('   '), /est requis/);
    rejects400(() => requireFutureDate(20990601), /est requis/);
  });

  it('refuse une date illisible', () => {
    rejects400(() => requireFutureDate('pas-une-date'), /date ISO 8601 valide/);
  });

  it('refuse une date passée ou égale à maintenant', () => {
    rejects400(() => requireFutureDate(inMs(-60_000)), /dans le futur/);
    rejects400(() => requireFutureDate('2000-01-01T00:00:00.000Z'), /dans le futur/);
  });
});

describe('optionalPrice', () => {
  it('vaut 0 si absent', () => {
    assert.equal(optionalPrice(undefined), 0);
    assert.equal(optionalPrice(null), 0);
  });

  it('arrondit au centime', () => {
    assert.equal(optionalPrice(10), 10);
    assert.equal(optionalPrice(12.345), 12.35);
    assert.equal(optionalPrice(0), 0);
  });

  it('refuse un prix négatif, non numérique ou non fini', () => {
    for (const value of [-1, '10', NaN, Infinity]) {
      rejects400(() => optionalPrice(value), /nombre positif ou nul/);
    }
  });

  it('refuse un prix trop grand pour la base', () => {
    rejects400(() => optionalPrice(100_000_000), /trop grand/);
  });
});

describe('optionalCurrency', () => {
  it('vaut EUR si absente', () => {
    assert.equal(optionalCurrency(undefined), 'EUR');
    assert.equal(optionalCurrency(null), 'EUR');
  });

  it('accepte un code ISO de 3 lettres majuscules', () => {
    assert.equal(optionalCurrency('CHF'), 'CHF');
  });

  it('refuse tout autre format', () => {
    for (const value of ['eur', 'EURO', 'E1R', 42]) {
      rejects400(() => optionalCurrency(value), /3 lettres majuscules/);
    }
  });
});

describe('parseEventInput', () => {
  const date = '2099-06-01T18:00:00.000Z';

  it('valide et normalise un événement complet', () => {
    const input = { title: '  Meetup  ', description: ' Talks ', date, location: ' Lyon ', price: 9.999, currency: 'USD' };
    const event = parseEventInput(input);
    assert.deepEqual({ ...event, date: event.date.toISOString() }, {
      title: 'Meetup',
      description: 'Talks',
      date,
      location: 'Lyon',
      price: 10,
      currency: 'USD',
    });
  });

  it('applique les valeurs par défaut des champs optionnels', () => {
    const event = parseEventInput({ title: 'Meetup', date, location: 'Lyon' });
    assert.equal(event.description, '');
    assert.equal(event.price, 0);
    assert.equal(event.currency, 'EUR');
  });

  it('refuse un corps absent', () => {
    rejects400(() => parseEventInput(), /« title » est requis/);
  });
});
