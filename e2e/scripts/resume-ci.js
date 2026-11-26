// Résumé des scénarios Gherkin pour la page du workflow GitHub Actions (SCRUM-74).
// Lit reports/resultats.json (reporter JSON de Playwright) et écrit un tableau Markdown :
// total réussi / échoué, puis une ligne par fonctionnalité et par niveau (API ou interface). Usage : node scripts/resume-ci.js >> "$GITHUB_STEP_SUMMARY"
import { existsSync, readFileSync } from 'node:fs';

const path = new URL('../reports/resultats.json', import.meta.url);

if (!existsSync(path)) {
  console.log('## Scénarios Gherkin\n\n⚠️ Aucun résultat : les scénarios n\'ont pas pu être lancés (voir le journal de l\'étape).');
  process.exit(0);
}

const report = JSON.parse(readFileSync(path, 'utf8'));

/** Compte les scénarios d'une suite et de ses sous-suites (un plan de scénario compte chaque exemple). */
function count(suite, acc = { ok: 0, ko: 0, bugs: 0, ignores: 0 }) {
  for (const spec of suite.specs ?? []) {
    // Scénario ignoré (ex. front Docker non démarré) : ni réussi ni échoué.
    if (spec.tests?.every((t) => t.status === 'skipped')) {
      acc.ignores += 1;
      continue;
    }
    if (spec.ok) acc.ok += 1;
    else acc.ko += 1;
    // Scénario tagué @fail : bug connu, dont l'échec est attendu (voir e2e/README.md).
    if (spec.tests?.some((t) => t.expectedStatus === 'failed')) acc.bugs += 1;
  }
  for (const child of suite.suites ?? []) count(child, acc);
  return acc;
}

// Premier niveau : un fichier .feature ; son premier sous-niveau porte le titre de la fonctionnalité.
const niveau = (file) => (file.title.includes('/front/') ? 'Interface' : 'API');
const rows = report.suites
  .map((file) => ({ niveau: niveau(file), titre: file.suites?.[0]?.title ?? file.title, ...count(file) }))
  .sort((a, b) => a.niveau.localeCompare(b.niveau));
const total = rows.reduce(
  (t, r) => ({ ok: t.ok + r.ok, ko: t.ko + r.ko, bugs: t.bugs + r.bugs, ignores: t.ignores + r.ignores }),
  { ok: 0, ko: 0, bugs: 0, ignores: 0 },
);
const bugsConnus = total.bugs ? `, dont ${total.bugs} bug(s) connu(s) qui échoue(nt) comme attendu (\`@fail\`)` : '';
const duree = ((report.stats?.duration ?? 0) / 1000).toFixed(1);

const lines = [
  '## Scénarios Gherkin',
  '',
  total.ko === 0
    ? `✅ **${total.ok} scénarios réussis** sur ${total.ok}${bugsConnus} (${duree} s)`
    : `❌ **${total.ko} scénario(s) en échec** sur ${total.ok + total.ko} : voir l'artefact \`scenarios-gherkin\``,
  '',
  ...(total.ignores ? [`⚠️ **${total.ignores} scénario(s) ignoré(s)** : précondition non remplie (voir le journal).`, ''] : []),
  '| Niveau | Fonctionnalité | Réussis | Échoués | Ignorés |',
  '|---|---|---:|---:|---:|',
  ...rows.map((r) => `| ${r.niveau} | ${r.titre} | ${r.ok} | ${r.ko ? `❌ ${r.ko}` : 0} | ${r.ignores ? `⚠️ ${r.ignores}` : 0} |`),
];

console.log(lines.join('\n'));
