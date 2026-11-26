# Coord Events : scénarios Gherkin

Les critères d'acceptation des user stories, écrits en **Gherkin** (en français) et exécutés avec **Playwright** via [`playwright-bdd`](https://github.com/vitalets/playwright-bdd) (SCRUM-74).

- **Niveau API** (`features/api/`) : chaque étape appelle l'API en HTTP. En place.
- **Niveau front** (`features/front/`, navigateur) : à venir.

## Lancer

L'API doit tourner (`make up` à la racine).

```bash
make bdd                 # depuis la racine
# ou
cd e2e && npm ci && npm run test:api
```

Ils tournent aussi en CI, dans le job *Build et tests d'intégration* de **CI Back**. En cas d'échec, le rapport Playwright est publié en artefact (`scenarios-gherkin`).

## Écrire un scénario

1. Repérer le critère dans [`docs/exigences.json`](../docs/exigences.json) (ex. `F06.3` : « Je ne peux pas m'inscrire deux fois »).
2. L'écrire dans le fichier `.feature` de la story, **tagué avec l'exigence** : il apparaîtra dans la [matrice de traçabilité](../docs/matrice-tracabilite.md) (`cd backend && npm run matrix`).

```gherkin
  @F06.3
  Scénario: Le participant ne peut pas s'inscrire deux fois au même événement
    Soit un événement à venir créé par l'organisateur
    Et le participant est inscrit à l'événement
    Quand le participant s'inscrit à l'événement
    Alors la réponse a le code 409
    Et le message d'erreur est "Vous êtes déjà inscrit à cet événement"
```

3. Réutiliser les phrases existantes ([`steps/api/steps.js`](steps/api/steps.js)) ; une nouvelle phrase demande une nouvelle étape dans ce fichier.

**Acteurs** : `organisateur`, `autre organisateur`, `participant`, `administrateur` (connectés via « Soit un … connecté ») et `visiteur` (non connecté). Chaque scénario crée ses propres comptes et événements : ils sont indépendants et tournent en parallèle.

**Tableau d'événement** (`… crée un événement avec :` / `… modifie l'événement avec :`) : champs `titre`, `description`, `date` (`dans 30 jours`, `hier`, ou une valeur brute), `lieu`, `prix`, `devise`.

## Structure

```
e2e/
├── playwright.config.js     # projets Playwright (api ; front à venir)
├── features/api/*.feature   # un fichier par story (F01, F02…)
└── steps/
    ├── fixtures.js          # état partagé entre les étapes d'un scénario
    └── api/                 # étapes du niveau API + outils (appels HTTP, base)
```
