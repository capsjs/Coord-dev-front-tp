// Génère la documentation Swagger statique de l'API à partir de openapi.yaml (SCRUM-67).
//   npm run docs:build   → backend/docs-site/ (index.html + openapi.yaml + fichiers Swagger UI)
// Publiée sur GitHub Pages par le workflow .github/workflows/docs-api.yml à chaque merge sur main.
// La page est autonome : la spec est intégrée au HTML, aucun appel réseau ni CDN externe.
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getAbsoluteFSPath } from 'swagger-ui-dist';
import { parse } from 'yaml';

const backendDir = fileURLToPath(new URL('..', import.meta.url));
const outDir = join(backendDir, 'docs-site');
const specPath = join(backendDir, 'openapi.yaml');
const swaggerDir = getAbsoluteFSPath();

const specYaml = readFileSync(specPath, 'utf8');
const spec = parse(specYaml);

// Version publiée : consultation seulement (il n'y a pas d'API en ligne à appeler).
// Pour essayer les routes, lancer l'API en local et ouvrir http://localhost:3000/api/docs.
spec.servers = [{ url: 'http://localhost:3000', description: 'API locale (make up)' }];

const commit = (process.env.GITHUB_SHA ?? '').slice(0, 7);
const generatedAt = new Date().toISOString().slice(0, 16).replace('T', ' ');
const repoUrl = 'https://github.com/capsjs/Coord-dev-front-tp';

const escapeHtml = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
// JSON intégré dans une balise <script> : on neutralise « < » pour qu'aucune chaîne ne puisse fermer la balise.
const specJson = JSON.stringify(spec).replace(/</g, '\\u003c');

const html = `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(spec.info.title)} · v${escapeHtml(spec.info.version)}</title>
  <link rel="icon" type="image/png" href="favicon-32x32.png">
  <link rel="stylesheet" href="swagger-ui.css">
  <style>
    body { margin: 0; background: #fff; }
    .bandeau { font: 14px/1.5 system-ui, sans-serif; padding: 12px 20px; background: #f4f6f8; border-bottom: 1px solid #dde3e8; color: #333; }
    .bandeau a { color: #1b6ac9; }
  </style>
</head>
<body>
  <div class="bandeau">
    <strong>Documentation de l'API, version ${escapeHtml(spec.info.version)}</strong>
    · générée depuis <a href="${repoUrl}/blob/main/backend/openapi.yaml"><code>openapi.yaml</code></a>
    le ${generatedAt} UTC${commit ? ` (commit <a href="${repoUrl}/commit/${process.env.GITHUB_SHA}"><code>${commit}</code></a>)` : ''}
    · <a href="openapi.yaml" download>télécharger le contrat</a>
    · <a href="${repoUrl}/blob/main/docs/guide-style-api.md">guide de style</a>
    <br>Consultation seulement : pour essayer les routes, lancez l'API (<code>make up</code>) et ouvrez <code>http://localhost:3000/api/docs</code>.
  </div>
  <div id="swagger-ui"></div>
  <script id="spec" type="application/json">${specJson}</script>
  <script src="swagger-ui-bundle.js"></script>
  <script>
    window.ui = SwaggerUIBundle({
      spec: JSON.parse(document.getElementById('spec').textContent),
      dom_id: '#swagger-ui',
      deepLinking: true,
      supportedSubmitMethods: [],
      defaultModelsExpandDepth: 0,
    });
  </script>
</body>
</html>
`;

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
for (const file of ['swagger-ui.css', 'swagger-ui-bundle.js', 'favicon-16x16.png', 'favicon-32x32.png']) {
  copyFileSync(join(swaggerDir, file), join(outDir, file));
}
writeFileSync(join(outDir, 'openapi.yaml'), specYaml);
writeFileSync(join(outDir, 'index.html'), html);
// GitHub Pages : servir les fichiers tels quels (pas de traitement Jekyll).
writeFileSync(join(outDir, '.nojekyll'), '');

console.log(`Documentation générée : backend/docs-site/index.html (API v${spec.info.version})`);
