// Scénarios Gherkin exécutés avec Playwright (SCRUM-74).
// Les fichiers .feature sont traduits en tests Playwright par playwright-bdd (commande « bddgen »).
// - Projet « api »   : appels HTTP à l'API, sans navigateur.
// - Projet « front » : l'interface dans Chromium ; le front est démarré par Playwright (serveur Vite).
import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

const API_URL = process.env.API_URL ?? 'http://localhost:3000';
const FRONT_URL = process.env.FRONT_URL ?? 'http://localhost:5173';

const apiTestDir = defineBddConfig({
  outputDir: '.features-gen/api',
  features: 'features/api/**/*.feature',
  steps: ['steps/fixtures.js', 'steps/api/**/*.js'],
});

const frontTestDir = defineBddConfig({
  outputDir: '.features-gen/front',
  features: 'features/front/**/*.feature',
  steps: ['steps/fixtures.js', 'steps/front/**/*.js'],
});

const onlyApi = process.argv.includes('--project=api');

export default defineConfig({
  // En CI : rapport HTML (publié en cas d'échec) + résultats JSON (résumé affiché sur la page du workflow).
  reporter: process.env.CI
    ? [['list'], ['html', { open: 'never' }], ['json', { outputFile: 'reports/resultats.json' }]]
    : 'list',
  // Chaque scénario crée ses propres comptes et événements : ils peuvent tourner en parallèle.
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  projects: [
    {
      name: 'api',
      testDir: apiTestDir,
      use: { baseURL: API_URL },
    },
    {
      name: 'front',
      testDir: frontTestDir,
      use: { ...devices['Desktop Chrome'], baseURL: FRONT_URL, locale: 'fr-FR', timezoneId: 'Europe/Paris' },
    },
  ],
  // Le front (serveur de développement Vite) est démarré pour le projet « front » ; réutilisé s'il tourne déjà.
  webServer: onlyApi
    ? undefined
    : {
        command: 'npm run dev -- --port 5173 --strictPort',
        cwd: '../frontend',
        url: FRONT_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        env: { VITE_API_URL: `${API_URL}/api` },
      },
});
