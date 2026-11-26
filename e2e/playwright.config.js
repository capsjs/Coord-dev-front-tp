// Scénarios Gherkin exécutés avec Playwright (SCRUM-74).
// Les fichiers .feature sont traduits en tests Playwright par playwright-bdd (commande « bddgen »).
// Projet « api » : appels HTTP à l'API, sans navigateur. Un projet « front » (navigateur) viendra ensuite.
import { defineConfig } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

const apiTestDir = defineBddConfig({
  outputDir: '.features-gen/api',
  features: 'features/api/**/*.feature',
  steps: ['steps/fixtures.js', 'steps/api/**/*.js'],
});

export default defineConfig({
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  // Chaque scénario crée ses propres comptes et événements : ils peuvent tourner en parallèle.
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  projects: [
    {
      name: 'api',
      testDir: apiTestDir,
      use: { baseURL: process.env.API_URL ?? 'http://localhost:3000' },
    },
  ],
});
