// État partagé entre les étapes d'un même scénario (remis à zéro à chaque scénario).
import { test as base, createBdd } from 'playwright-bdd';

export const test = base.extend({
  // eslint-disable-next-line no-empty-pattern
  ctx: async ({}, use) => {
    await use({
      acteurs: {}, // « organisateur », « participant »… → { token, user, email, password }
      event: null, // dernier événement créé ou ciblé
      events: [], // événements créés dans le scénario
      response: null, // dernière réponse : { status, body }
    });
  },
});

export const { Given, When, Then } = createBdd(test);
