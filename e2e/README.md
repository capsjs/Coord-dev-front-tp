# Coord Events : scénarios Gherkin

Les critères d'acceptation des user stories, écrits en **Gherkin** (en français) et exécutés avec **Playwright** via [`playwright-bdd`](https://github.com/vitalets/playwright-bdd) (SCRUM-74), à deux niveaux :

| Niveau | Dossier | Ce qui est vérifié |
| ------ | ------- | ------------------ |
| **API** | `features/api/` | les règles métier, en appelant l'API en HTTP (codes, messages, données) |
| **Interface** | `features/front/` | ce que voit et fait l'utilisateur dans Chromium : redirections, boutons affichés ou masqués, confirmations, messages |
| **Front servi par Docker** | `features/front/front-docker.feature` | l'image de production du front (nginx, port 8080) : accès direct à une adresse et rafraîchissement d'une page (SCRUM-93). Ignoré si le conteneur n'est pas démarré (`make up`) |
| **Parcours complets** | `features/front/parcours-complet.feature` | les étapes du MVP **enchaînées** dans l'interface, sans préparation par l'API : création des comptes, de l'événement, inscription, désinscription, suppression (SCRUM-24) |

## Lancer

L'API doit tourner (`make up` à la racine).

```bash
make bdd                 # les deux niveaux (installe Chromium et les dépendances si besoin)
make bdd-api             # niveau API seulement, sans navigateur
# ou, depuis e2e/ :
npm test                 # les deux niveaux
npx playwright test --project=front --headed   # voir le navigateur pendant les scénarios
```

Pour le niveau interface, Playwright **démarre lui-même le front** (serveur Vite sur le port 5173, déjà autorisé par le CORS de l'API) ou réutilise celui qui tourne (`npm run dev` dans `frontend/`).

En CI, le workflow **Scénarios Gherkin** les lance à chaque modification du back, du front ou des scénarios, et affiche un résumé par fonctionnalité sur la page du workflow. En cas d'échec, le rapport Playwright (avec captures d'écran) est publié en artefact (`scenarios-gherkin`).

## Écrire un scénario

1. Repérer le critère dans [`docs/exigences.json`](../docs/exigences.json) (ex. `F06.3` : « Je ne peux pas m'inscrire deux fois »).
2. L'écrire dans le fichier `.feature` concerné, **tagué avec l'exigence** : il apparaîtra dans la [matrice de traçabilité](../docs/matrice-tracabilite.md) (`cd backend && npm run matrix`). Un scénario du niveau interface compte comme un test front.

```gherkin
  @F06.3
  Scénario: Le participant ne peut pas s'inscrire deux fois au même événement
    Soit un événement à venir créé par l'organisateur
    Et le participant est inscrit à l'événement
    Quand le participant s'inscrit à l'événement
    Alors la réponse a le code 409
    Et le message d'erreur est "Vous êtes déjà inscrit à cet événement"
```

3. Réutiliser les phrases existantes ([`steps/api/steps.js`](steps/api/steps.js), [`steps/front/steps.js`](steps/front/steps.js)) ; une nouvelle phrase demande une nouvelle étape.

**Acteurs** : `organisateur`, `autre organisateur`, `participant`, `administrateur` (API) et `visiteur` (non connecté). Niveau API : « Soit un … connecté ». Niveau interface : « Soit un … existant », puis « Et le … est connecté dans le navigateur ». Chaque scénario crée ses propres comptes et événements (titres uniques) : ils sont indépendants et tournent en parallèle.

**Niveau interface** : les données de départ sont préparées par l'API ; les éléments sont repérés par ce que voit l'utilisateur (libellés, textes des boutons, titres), sans dépendre du code du front.

**Bug connu (`@fail`)** : un scénario qui prouve une anomalie non encore corrigée porte `@fail` et la clé du ticket (ex. `@fail @SCRUM-94`). Il s'exécute et **doit échouer** : la CI reste verte tant que le bug existe. Quand le correctif est mergé, le scénario passe et Playwright le signale en erreur (« expected to fail, but passed ») : retirer `@fail`, ajouter le tag de l'exigence (ex. `@F01.2`) et régénérer la matrice. Le tag du ticket n'entre pas dans la matrice (seuls les tags d'exigence `@F01.2` y figurent).

**Tableau d'événement** : champs `titre`, `description`, `date` (`dans 30 jours`, `hier`, ou une valeur brute), `lieu`, `prix`, `devise`.

## Structure

```
e2e/
├── playwright.config.js     # projets « api » et « front » ; démarrage du front pour « front »
├── features/
│   ├── api/*.feature        # un fichier par story (F01, F02…)
│   └── front/*.feature      # connexion, événements, inscriptions dans l'interface
├── steps/
│   ├── fixtures.js          # état partagé entre les étapes d'un scénario, client HTTP vers l'API
│   ├── api/                 # étapes du niveau API + outils (appels HTTP, base)
│   └── front/               # étapes du niveau interface
└── scripts/resume-ci.js     # résumé affiché sur la page du workflow
```
