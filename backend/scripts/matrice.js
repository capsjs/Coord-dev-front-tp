/**
 * Matrice de traçabilité exigence → story Jira → test → PR → version (SCRUM-75).
 * npm run matrix       : génère docs/matrice-tracabilite.md
 * npm run matrix:check : vérifie les références, les tests backend et la matrice.
 * Sources : docs/exigences.json, backend/test et frontend/tests.
 * Convention : it('[F03.1] description du scénario', ...).
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

const backendDir = fileURLToPath(new URL("..", import.meta.url));
const rootDir = join(backendDir, "..");
const exigencesPath = join(rootDir, "docs/exigences.json");
const matricePath = join(rootDir, "docs/matrice-tracabilite.md");

const { stories, exigences } = JSON.parse(readFileSync(exigencesPath, "utf8"));
const apiVersion = parse(readFileSync(join(backendDir, "openapi.yaml"), "utf8"))
  .info.version;

function testFiles(dir, suffixes) {
  if (!existsSync(dir)) return [];

  return readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => {
      const path = join(dir, entry.name);

      if (entry.isDirectory()) return testFiles(path, suffixes);

      return suffixes.some((suffix) => entry.name.endsWith(suffix))
        ? [path]
        : [];
    })
    .sort();
}

function allTestFiles() {
  return [
    ...testFiles(join(backendDir, "test"), [".test.js"]).map((path) => ({
      path,
      layer: "back",
    })),

    ...testFiles(join(rootDir, "frontend/tests"), [
      ".test.ts",
      ".test.tsx",
    ]).map((path) => ({ path, layer: "front" })),
  ];
}

// Analyse les titres littéraux.
// Les titres générés dynamiquement ne sont pas reconnus.
const CALL_RE = /\b(describe|it|test)\s*\(\s*(['"`])((?:\\.|(?!\2)[\s\S])*)\2/g;
const TAG_RE = /\[([A-Za-z]+\d*[a-z]?\.\d+)\]/g;

function taggedTests() {
  const tests = [];

  for (const { path, layer } of allTestFiles()) {
    const file = relative(rootDir, path).replaceAll("\\", "/");
    const source = readFileSync(path, "utf8");
    let suite = "";

    for (const [, kind, , raw] of source.matchAll(CALL_RE)) {
      const title = raw.replace(/\\(.)/g, "$1");

      if (kind === "describe") {
        suite = title;
        continue;
      }

      const tags = [...title.matchAll(TAG_RE)].map((match) => match[1]);

      if (tags.length === 0) continue;

      tests.push({
        file,
        layer,
        suite,
        title: title.replace(TAG_RE, "").trim(),
        tags: [...new Set(tags)],
      });
    }
  }

  return tests;
}

// Scénarios Gherkin (SCRUM-74) : e2e/features/**/*.feature, tags « @F01.3 » au-dessus d'un scénario.
// Niveau « interface » (e2e/features/front) : compte comme un test front pour le statut.
// Niveau « API » (e2e/features/api) : listé dans la matrice, sans changer le statut.
const SCENARIO_RE = /^\s*(Scénario|Plan du scénario|Scenario|Scenario Outline)\s*:\s*(.+)$/i;
const FEATURE_RE = /^\s*(Fonctionnalité|Feature)\s*:\s*(.+)$/i;
const GHERKIN_TAG_RE = /@([A-Za-z]+\d*[a-z]?\.\d+)\b/g;

function gherkinScenarios() {
  const scenarios = [];
  for (const path of testFiles(join(rootDir, "e2e/features"), [".feature"])) {
    const file = relative(rootDir, path).replaceAll("\\", "/");
    let feature = "";
    let pending = [];
    for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
      const featureMatch = line.match(FEATURE_RE);
      if (featureMatch) {
        feature = featureMatch[2].trim();
        continue;
      }
      if (line.trim().startsWith("@")) {
        pending.push(...[...line.matchAll(GHERKIN_TAG_RE)].map((m) => m[1]));
        continue;
      }
      const scenarioMatch = line.match(SCENARIO_RE);
      if (scenarioMatch) {
        if (pending.length) {
          const niveau = file.includes("/features/front/") ? "front" : "api";
          scenarios.push({ file, layer: "gherkin", niveau, suite: feature, title: scenarioMatch[2].trim(), tags: [...new Set(pending)] });
        }
        pending = [];
      }
    }
  }
  return scenarios;
}

const STATUTS = {
  complet: "Testé (back + front)",
  back: "Testé (back)",
  backFrontManquant: "Testé (back) · front à compléter",
  front: "Testé (front)",
  frontBackManquant: "Testé (front) · back manquant",
  frontManquant: "Front non automatisé",
  sprint3: "Sprint 3",
  manquant: "Aucun test",
};

function statutDe(exigence, linked) {
  if (exigence.statut === "sprint3") return "sprint3";

  const hasBack = linked.some((test) => test.layer === "back");
  const hasFront = linked.some(
    (test) => test.layer === "front" || (test.layer === "gherkin" && test.niveau === "front"),
  );

  if (exigence.couche === "back") {
    return hasBack ? "back" : "manquant";
  }

  if (exigence.couche === "front") {
    return hasFront ? "front" : "frontManquant";
  }

  if (exigence.couche === "back+front") {
    if (hasBack && hasFront) return "complet";
    if (hasBack) return "backFrontManquant";
    if (hasFront) return "frontBackManquant";
  }

  return "manquant";
}

function escapeCell(value) {
  return String(value).replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}

function formatTest(test) {
  const layer =
    test.layer === "gherkin"
      ? `Gherkin (${test.niveau === "front" ? "interface" : "API"})`
      : { back: "Back", front: "Front" }[test.layer];

  const suite = test.suite ? `${escapeCell(test.suite)} › ` : "";

  return `**${layer}** : \`${escapeCell(test.file)}\` › ${suite}${escapeCell(test.title)}`;
}

function formatPrs(story) {
  if (!story.prs?.length) return "— (à renseigner)";
  const repo = "https://github.com/capsjs/Coord-dev-front-tp";
  return story.prs
    .map((pr) => `[#${pr}](${repo}/pull/${pr})`)
    .join(", ");
}

function build() {
  const tests = [...taggedTests(), ...gherkinScenarios()];
  const known = new Set(exigences.map((e) => e.id));
  const errors = [];

  // Les PR sont associées aux stories Jira dans exigences.json.
  // Une PR liée à une story ne prouve pas à elle seule la couverture de chaque critère.
  for (const story of stories) {
    if (!Array.isArray(story.prs) ||
        story.prs.some((pr) => !Number.isInteger(pr) || pr <= 0) ||
        new Set(story.prs).size !== story.prs.length) {
      errors.push(`La story ${story.id} doit avoir un tableau « prs » de numéros de PR positifs et uniques.`);
    }
  }

  // Vérification des identifiants d'exigences.
  for (const test of tests) {
    for (const tag of test.tags) {
      if (!known.has(tag)) {
        errors.push(
          `Le test « ${test.title} » (${test.file}) cite l'exigence inconnue [${tag}].`,
        );
      }
    }
  }

  // Association des exigences et des tests.
  const rows = exigences.map((e) => {
    const linked = tests.filter((test) => test.tags.includes(e.id));
    const statut = statutDe(e, linked);

    // Une exigence backend livrée doit avoir un test backend.
    if (
      e.statut !== "sprint3" &&
      ["back", "back+front"].includes(e.couche) &&
      !linked.some((test) => test.layer === "back")
    ) {
      errors.push(
        `L'exigence ${e.id} est livrée côté back mais aucun test backend ne la cite.`,
      );
    }

    return { ...e, linked, statut };
  });

  const count = (statut) => rows.filter((r) => r.statut === statut).length;

  const backCount = tests.filter((t) => t.layer === "back").length;
  const frontCount = tests.filter((t) => t.layer === "front").length;
  const gherkinCount = tests.filter((t) => t.layer === "gherkin").length;

  const lines = [
    "# Matrice de traçabilité exigence → story Jira → test → PR → version",
    "",
    "> Fichier généré automatiquement par `cd backend && npm run matrix`.",
    "> Sources : [`exigences.json`](exigences.json) (stories et PR), tests backend et frontend, scénarios Gherkin (`e2e/features`).",
    "> Ne pas modifier à la main : la CI vérifie qu’il est à jour.",
    "",
    `Version courante du contrat d'API : **${apiVersion}**`,
    "",
    `**${rows.length} exigences** · **${tests.length} tests reliés** (${backCount} back, ${frontCount} front, ${gherkinCount} scénarios Gherkin)`,
    "",
    "## Synthèse de couverture",
    "",
    "| Statut | Nombre |",
    "|---|---:|",

    ...Object.keys(STATUTS)
      .filter((statut) => count(statut) > 0)
      .map((statut) => `| ${STATUTS[statut]} | ${count(statut)} |`),

    "",
    "La colonne **Version** désigne la version du contrat API ayant livré l’exigence côté backend.",
    "Un critère `back+front` nécessite au moins un test lié dans chaque couche.",
    "Les critères du Sprint 3 sont conservés comme non livrés.",
    "La colonne **PR** liste les Pull Requests vérifiées associées à la story Jira ; cela ne signifie pas que chaque PR implémente individuellement chaque critère.",
    "La valeur « à renseigner » signifie qu'aucune PR n'est encore documentée pour cette story.",
    "",
  ];

  // Génération des tableaux par user story.
  for (const story of stories) {
    const storyRows = rows.filter((r) => r.id.startsWith(`${story.id}.`));

    if (!storyRows.length) continue;

    lines.push(`## ${story.id} : ${story.titre} (${story.jira})`, "");

    lines.push(
      "| Exigence | Critère | Story Jira | Couche | Tests | Commit / PR | Version | Statut |",
      "|---|---|---|---|---|---|---|---|",
    );

    for (const r of storyRows) {
      const cell = r.linked.length
        ? r.linked.map(formatTest).join("<br>")
        : "—";

      lines.push(
        `| **${r.id}** | ${escapeCell(r.critere)} | ${escapeCell(story.jira)} | ${r.couche} | ${cell} | ${formatPrs(story)} | ${r.version ?? "—"} | ${STATUTS[r.statut]} |`,
      );
    }

    lines.push("");
  }

  return {
    markdown: lines.join("\n"),
    errors,
  };
}

// Génération ou vérification pour la CI.
const { markdown, errors } = build();

if (process.argv.includes("--check")) {
  let current = null;

  try {
    current = readFileSync(matricePath, "utf8");
  } catch {
    errors.push("docs/matrice-tracabilite.md est absent.");
  }

  if (current !== null && current !== markdown) {
    errors.push(
      "docs/matrice-tracabilite.md n’est pas à jour : lancez « cd backend && npm run matrix » et commitez le résultat.",
    );
  }

  if (errors.length) {
    console.error(errors.map((error) => `✗ ${error}`).join("\n"));
    process.exit(1);
  }

  console.log(
    "✓ Matrice de traçabilité à jour ; toutes les exigences backend livrées ont un test lié.",
  );
} else {
  writeFileSync(matricePath, markdown);

  console.log(`Matrice générée : ${relative(process.cwd(), matricePath)}`);

  if (errors.length) {
    console.error(errors.map((error) => `✗ ${error}`).join("\n"));
    process.exit(1);
  }

  console.log(
    `✓ ${exigences.length} exigences analysées, tests backend et frontend pris en charge.`,
  );
}
