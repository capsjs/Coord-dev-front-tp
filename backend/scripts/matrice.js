// Matrice de traçabilité exigence → test → version (SCRUM-75).
//   npm run matrix        génère docs/matrice-tracabilite.md
//   npm run matrix:check  échoue si une exigence back livrée n'a aucun test, si un test cite
//                         une exigence inconnue, ou si la matrice versionnée n'est pas à jour.
// Les exigences sont dans docs/exigences.json ; un test les cite dans son titre : it('… [F01.3]').
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const backendDir = fileURLToPath(new URL('..', import.meta.url));
const rootDir = join(backendDir, '..');
const exigencesPath = join(rootDir, 'docs/exigences.json');
const matricePath = join(rootDir, 'docs/matrice-tracabilite.md');

const { stories, exigences } = JSON.parse(readFileSync(exigencesPath, 'utf8'));
const apiVersion = parse(readFileSync(join(backendDir, 'openapi.yaml'), 'utf8')).info.version;

/** Fichiers *.test.js sous backend/test, triés pour un résultat stable. */
function testFiles(dir) {
  return readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) return testFiles(path);
      return entry.name.endsWith('.test.js') ? [path] : [];
    })
    .sort();
}

// describe('…') / it('…') avec un titre entre '…', "…" ou `…` (guillemets échappés acceptés).
const CALL_RE = /\b(describe|it)\(\s*(['"`])((?:\\.|(?!\2).)*)\2/g;
const TAG_RE = /\[([A-Za-z]+\d*[a-z]?\.\d+)\]/g;

/** Liste des tests qui citent au moins une exigence : { file, suite, title, tags }. */
function taggedTests() {
  const tests = [];
  for (const path of testFiles(join(backendDir, 'test'))) {
    const file = relative(rootDir, path);
    let suite = '';
    for (const [, kind, , raw] of readFileSync(path, 'utf8').matchAll(CALL_RE)) {
      const text = raw.replace(/\\(.)/g, '$1');
      if (kind === 'describe') {
        suite = text;
        continue;
      }
      const tags = [...text.matchAll(TAG_RE)].map((m) => m[1]);
      if (tags.length) tests.push({ file, suite, title: text.replace(TAG_RE, '').trim(), tags });
    }
  }
  return tests;
}

const STATUTS = {
  teste: 'Testé (back)',
  testeFront: 'Testé (back) · front à vérifier',
  front: 'Front, vérification manuelle',
  sprint3: 'Sprint 3',
  manquant: 'Aucun test',
};

function statutDe(exigence, tests) {
  if (exigence.statut === 'sprint3') return 'sprint3';
  if (exigence.couche === 'front') return 'front';
  if (tests.length === 0) return 'manquant';
  return exigence.couche === 'back+front' ? 'testeFront' : 'teste';
}

const escapeCell = (s) => s.replace(/\|/g, '\\|');

function build() {
  const tests = taggedTests();
  const known = new Set(exigences.map((e) => e.id));
  const errors = [];

  for (const t of tests) {
    for (const tag of t.tags) {
      if (!known.has(tag)) errors.push(`Le test « ${t.title} » (${t.file}) cite l'exigence inconnue [${tag}].`);
    }
  }

  const rows = exigences.map((e) => {
    const linked = tests.filter((t) => t.tags.includes(e.id));
    const statut = statutDe(e, linked);
    if (statut === 'manquant') errors.push(`L'exigence ${e.id} est livrée côté back mais aucun test ne la cite.`);
    return { ...e, linked, statut };
  });

  const count = (s) => rows.filter((r) => r.statut === s).length;
  const lines = [
    '# Matrice de traçabilité exigence → test → version',
    '',
    '> Fichier généré par `cd backend && npm run matrix` à partir de [`exigences.json`](exigences.json)',
    '> et des titres des tests (`[F01.3]`…). Ne pas modifier à la main : la CI vérifie qu\'il est à jour.',
    '',
    `Version courante du contrat d'API : **${apiVersion}** · ${rows.length} exigences · ${tests.length} tests reliés.`,
    '',
    '| Statut | Nombre |',
    '|---|---|',
    ...Object.keys(STATUTS).filter((s) => count(s) > 0).map((s) => `| ${STATUTS[s]} | ${count(s)} |`),
    '',
    'La colonne **Version** indique la version de l\'API (`openapi.yaml`) qui a livré l\'exigence côté back.',
    'Les critères d\'interface (boutons, redirections, messages) ne sont pas encore couverts par des tests automatisés front.',
    '',
  ];

  for (const story of stories) {
    const storyRows = rows.filter((r) => r.id.startsWith(`${story.id}.`));
    if (!storyRows.length) continue;
    lines.push(`## ${story.id} : ${story.titre} (${story.jira})`, '');
    lines.push('| Exigence | Critère | Couche | Tests | Version | Statut |', '|---|---|---|---|---|---|');
    for (const r of storyRows) {
      const testsCell = r.linked.length
        ? r.linked.map((t) => `\`${t.file.replace('backend/test/', '')}\` › ${escapeCell(t.suite)} › ${escapeCell(t.title)}`).join('<br>')
        : '—';
      lines.push(`| **${r.id}** | ${escapeCell(r.critere)} | ${r.couche} | ${testsCell} | ${r.version ?? '—'} | ${STATUTS[r.statut]} |`);
    }
    lines.push('');
  }

  return { markdown: lines.join('\n'), errors };
}

const { markdown, errors } = build();

if (process.argv.includes('--check')) {
  let current = '';
  try {
    current = readFileSync(matricePath, 'utf8');
  } catch {
    errors.push('docs/matrice-tracabilite.md est absent.');
  }
  if (current && current !== markdown) {
    errors.push('docs/matrice-tracabilite.md n\'est pas à jour : lancez « cd backend && npm run matrix » et commitez le résultat.');
  }
  if (errors.length) {
    console.error(errors.map((e) => `✗ ${e}`).join('\n'));
    process.exit(1);
  }
  console.log('✓ Matrice de traçabilité à jour et complète.');
} else {
  writeFileSync(matricePath, markdown);
  console.log(`Matrice générée : ${relative(process.cwd(), matricePath)}`);
  if (errors.length) {
    console.error(errors.map((e) => `✗ ${e}`).join('\n'));
    process.exit(1);
  }
}
