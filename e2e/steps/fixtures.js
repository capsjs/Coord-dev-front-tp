// État partagé entre les étapes d'un même scénario (remis à zéro à chaque scénario).
import { test as base, createBdd } from 'playwright-bdd';

export const test = base.extend({
  // Client HTTP vers l'API, quel que soit le projet (le projet « front » a le front comme baseURL).
  apiRequest: async ({ playwright }, use) => {
    const context = await playwright.request.newContext({ baseURL: process.env.API_URL ?? 'http://localhost:3000' });
    await use(context);
    await context.dispose();
  },
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
