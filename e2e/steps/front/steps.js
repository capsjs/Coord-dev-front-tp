// Étapes Gherkin du niveau front : l'interface est pilotée dans le navigateur (Chromium).
// Les données de départ (comptes, événements, inscriptions) sont préparées par l'API, plus rapide et plus fiable ;
// le scénario lui-même se déroule dans l'interface, en repérant les éléments par ce que voit l'utilisateur.
import { expect } from '@playwright/test';
import jwt from 'jsonwebtoken';

import { Given, When, Then } from '../fixtures.js';
import { JWT_SECRET, PASSWORD, api, inDays, uniqueEmail } from '../api/helpers.js';

const ACTEUR = '(organisateur|autre organisateur|participant|visiteur)';
// Même liste sans capture, pour les étapes où l'acteur ne change rien à l'action (ouvrir une page…).
const QUI = '(?:organisateur|autre organisateur|participant|visiteur)';
const ROLES = { organisateur: 'organizer', 'autre organisateur': 'organizer', participant: 'participant' };
const TOKEN_KEY = 'coord_events_token'; // clé du jeton dans le localStorage du front

const suffix = () => Math.random().toString(36).slice(2, 7);

function acteur(ctx, nom) {
  const a = ctx.acteurs[nom];
  if (!a) throw new Error(`Acteur « ${nom} » absent du scénario : ajoutez « Soit un ${nom} existant ».`);
  return a;
}

/** Date au format du champ datetime-local (« 2026-12-30T18:00 »), dans N jours à 18 h. */
function localDateTime(days) {
  return `${inDays(days).slice(0, 10)}T18:00`;
}

async function setToken(page, token) {
  await page.goto('/');
  await page.evaluate(([key, value]) => localStorage.setItem(key, value), [TOKEN_KEY, token]);
}

// ─────────────────────────────────────────────── Contexte (Soit)

Given(new RegExp(`^un ${ACTEUR} existant$`), async ({ apiRequest, ctx }, nom) => {
  const email = uniqueEmail();
  const res = await api(apiRequest, 'POST', '/api/auth/register', {
    body: { name: `Utilisateur ${nom} ${suffix()}`, email, password: PASSWORD, role: ROLES[nom] },
  });
  expect(res.status, JSON.stringify(res.body)).toBe(201);
  ctx.acteurs[nom] = { ...res.body, email, password: PASSWORD };
});

Given("un événement à venir créé par l'organisateur", async ({ apiRequest, ctx }) => {
  const body = { title: `Meetup ${suffix()}`, description: 'Scénario front', date: inDays(30), location: 'Lyon' };
  const res = await api(apiRequest, 'POST', '/api/events', { token: acteur(ctx, 'organisateur').token, body });
  expect(res.status, JSON.stringify(res.body)).toBe(201);
  ctx.event = res.body;
});

Given("le participant est inscrit à l'événement", async ({ apiRequest, ctx }) => {
  const res = await api(apiRequest, 'POST', `/api/events/${ctx.event.id}/registrations`, { token: acteur(ctx, 'participant').token });
  expect(res.status, JSON.stringify(res.body)).toBe(201);
});

Given(new RegExp(`^(?:le |l')${ACTEUR} est connecté dans le navigateur$`), async ({ page, ctx }, nom) => {
  await setToken(page, acteur(ctx, nom).token);
});

Given('le participant a une session expirée dans le navigateur', async ({ page, ctx }) => {
  const { user } = acteur(ctx, 'participant');
  await setToken(page, jwt.sign({ sub: user.id, role: user.role, exp: Math.floor(Date.now() / 1000) - 60 }, JWT_SECRET));
});

// ─────────────────────────────────────────────── Actions (Quand)

When(new RegExp(`^(?:le |l')${ACTEUR} se connecte avec le formulaire( et un mauvais mot de passe)?$`), async ({ page, ctx }, nom, mauvais) => {
  const { email, password } = acteur(ctx, nom);
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Mot de passe').fill(mauvais ? 'mauvais-mot-de-passe' : password);
  await page.getByRole('button', { name: 'Se connecter' }).click();
  // Connexion réussie : on attend de quitter la page de connexion (la session est alors enregistrée).
  if (!mauvais) await expect(page).not.toHaveURL(/\/login$/);
});

// Parcours complet (SCRUM-24) : le compte est créé avec le formulaire d'inscription, sans passer par l'API.
When(/^un visiteur crée un compte (participant|organisateur) avec le formulaire$/, async ({ page, ctx }, role) => {
  const compte = { name: `${role} ${suffix()}`, email: uniqueEmail(), password: PASSWORD };
  await page.goto('/register');
  await page.getByLabel('Nom').fill(compte.name);
  await page.getByLabel('Email').fill(compte.email);
  await page.getByLabel(/Mot de passe/).fill(compte.password);
  await page.getByLabel(role === 'organisateur' ? 'Organisateur' : 'Participant').check();
  await page.getByRole('button', { name: 'Créer mon compte' }).click();
  // Le front redirige vers la liste une fois le compte créé et la session enregistrée : on l'attend.
  await expect(page).toHaveURL(/\/events$/);
  ctx.acteurs[role] = compte;
});

When(/^il clique sur « Modifier » de l'événement dans la liste et le renomme en "(.*)"$/, async ({ page, ctx }, titre) => {
  await page.locator('article.event-card', { hasText: ctx.event.title }).getByRole('link', { name: 'Modifier' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Modifier un événement' })).toBeVisible();
  ctx.event.title = `${titre} ${suffix()}`;
  await page.getByLabel('Titre').fill(ctx.event.title);
  await page.getByRole('button', { name: 'Enregistrer les modifications' }).click();
  await expect(page).toHaveURL(/\/events$/);
});

When(/^il supprime l'événement depuis la liste et confirme$/, async ({ page, ctx }) => {
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('article.event-card', { hasText: ctx.event.title }).getByRole('button', { name: 'Supprimer' }).click();
});

When(new RegExp(`^(?:le |l')${QUI} se déconnecte$`), async ({ page }) => {
  await page.getByRole('button', { name: 'Déconnexion' }).click();
});

When(new RegExp(`^(?:le |l')${QUI} ouvre la liste des événements$`), async ({ page }) => {
  await page.goto('/events');
});

When(new RegExp(`^(?:le |l')${QUI} ouvre la fiche de l'événement$`), async ({ page, ctx }) => {
  await page.goto(`/events/${ctx.event.id}`);
});

When(new RegExp(`^(?:le |l')${QUI} ouvre la fiche d'un événement inexistant$`), async ({ page }) => {
  await page.goto('/events/999999999');
});

When(new RegExp(`^(?:le |l')${QUI} ouvre sa page de profil$`), async ({ page }) => {
  await page.goto('/profile');
});

When(new RegExp(`^(?:le |l')${QUI} ouvre le formulaire de modification de l'événement$`), async ({ page, ctx }) => {
  await page.goto(`/events/${ctx.event.id}/edit`);
});

When(/^il clique sur « Voir le détail » de l'événement$/, async ({ page, ctx }) => {
  await page.locator('article.event-card', { hasText: ctx.event.title }).getByRole('button', { name: 'Voir le détail' }).click();
});

When(new RegExp(`^(?:le |l')${ACTEUR} crée un événement avec le formulaire :$`), async ({ page, ctx }, _nom, table) => {
  const rows = table.rowsHash();
  const days = Number(rows.date.match(/^dans (\d+) jours?$/)[1]);
  ctx.event = { title: `${rows.titre} ${suffix()}` };
  await page.goto('/events/new');
  await page.getByLabel('Titre').fill(ctx.event.title);
  if (rows.description) await page.getByLabel('Description').fill(rows.description);
  await page.getByLabel('Date et heure').fill(localDateTime(days));
  await page.getByLabel('Lieu').fill(rows.lieu);
  await page.getByRole('button', { name: "Créer l'événement" }).click();
  // Le front revient sur la liste une fois l'événement enregistré : on attend la fin de la création.
  await expect(page).toHaveURL(/\/events$/);
});

When(/^il clique sur « Supprimer » et (refuse|accepte) la confirmation$/, async ({ page, ctx }, choix) => {
  page.once('dialog', async (dialog) => {
    ctx.dialog = dialog.message();
    if (choix === 'accepte') await dialog.accept();
    else await dialog.dismiss();
  });
  await page.getByRole('button', { name: 'Supprimer' }).click();
});

When(/^il clique sur « (S'inscrire|Se désinscrire) »$/, async ({ page }, libelle) => {
  await page.getByRole('button', { name: libelle }).or(page.getByRole('link', { name: libelle })).click();
});

// ─────────────────────────────────────────────── Résultats (Alors)

Then('il arrive sur la liste des événements', async ({ page }) => {
  await expect(page).toHaveURL(/\/events$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Événements' })).toBeVisible();
});

Then('il arrive sur la page de connexion', async ({ page }) => {
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Connexion' })).toBeVisible();
});

Then(/^il arrive sur la fiche de l'événement$/, async ({ page, ctx }) => {
  await expect(page).toHaveURL(new RegExp(`/events/${ctx.event.id}$`));
  await expect(page.getByRole('heading', { level: 1, name: ctx.event.title })).toBeVisible();
});

Then('il est connecté', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'Déconnexion' })).toBeVisible();
});

Then("il n'est plus connecté", async ({ page }) => {
  await expect(page.getByRole('link', { name: 'Connexion' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Déconnexion' })).toHaveCount(0);
});

Then(/^l'événement (est|n'est plus) affiché dans la liste$/, async ({ page, ctx }, cas) => {
  const titre = page.getByRole('heading', { level: 2, name: ctx.event.title });
  if (cas === 'est') await expect(titre).toBeVisible();
  else await expect(titre).toHaveCount(0);
});

Then("la fiche affiche le titre, le lieu et le nom de l'organisateur", async ({ page, ctx }) => {
  await expect(page.getByRole('heading', { level: 1, name: ctx.event.title })).toBeVisible();
  await expect(page.getByText(`Lieu : ${ctx.event.location}`)).toBeVisible();
  await expect(page.getByText(`Organisateur : ${ctx.event.organizer.name}`)).toBeVisible();
});

Then("le formulaire est pré-rempli avec les informations de l'événement", async ({ page, ctx }) => {
  await expect(page.getByRole('heading', { level: 1, name: 'Modifier un événement' })).toBeVisible();
  await expect(page.getByLabel('Titre')).toHaveValue(ctx.event.title);
  await expect(page.getByLabel('Lieu')).toHaveValue(ctx.event.location);
  await expect(page.getByLabel('Description')).toHaveValue(ctx.event.description);
});

Then(/^les actions « Modifier » et « Supprimer » (sont|ne sont pas) affichées$/, async ({ page, ctx }, cas) => {
  await expect(page.getByRole('heading', { level: 1, name: ctx.event.title })).toBeVisible();
  const modifier = page.getByRole('link', { name: 'Modifier' });
  const supprimer = page.getByRole('button', { name: 'Supprimer' });
  if (cas === 'sont') {
    await expect(modifier).toBeVisible();
    await expect(supprimer).toBeVisible();
  } else {
    await expect(modifier).toHaveCount(0);
    await expect(supprimer).toHaveCount(0);
  }
});

Then(/^une confirmation « (.*) » a été demandée$/, async ({ ctx }, message) => {
  expect(ctx.dialog).toBe(message);
});

Then(/^le message « (.*) » est affiché$/, async ({ page }, message) => {
  await expect(page.getByText(message, { exact: true })).toBeVisible();
});

Then(/^le bouton « (S'inscrire|Se désinscrire) » est affiché$/, async ({ page }, libelle) => {
  await expect(page.getByRole('button', { name: libelle }).or(page.getByRole('link', { name: libelle }))).toBeVisible();
});
