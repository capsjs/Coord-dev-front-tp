# Coord Events : back-end

API REST du gestionnaire d'événements Coord Events : comptes, événements et inscriptions.

**Stack** : Node.js 22 · Express 5 · MySQL 8.4 (SQL sans ORM) · JWT + bcrypt · OpenAPI 3 · Docker Compose
Pourquoi ces choix : [décisions d'architecture](../docs/adr/README.md).

## Démarrage

Depuis la racine du dépôt, `make up` démarre MySQL, l'API et le front (voir le [README racine](../README.md)). L'API répond sur http://localhost:3000/api.

### Sans Docker pour l'API

Pratique pour le rechargement automatique (`node --watch`) :

```bash
docker compose up -d db          # MySQL seul, exposé sur le port 3307
cd backend
npm install
DB_PORT=3307 SEED_DEMO=true npm run dev
```

Au démarrage, l'API attend MySQL, crée les tables manquantes (`src/schema.sql`), puis crée le compte admin et, si `SEED_DEMO=true`, les comptes de démo.

### Scripts npm

| Commande | Effet |
| -------- | ----- |
| `npm start` | Lance l'API |
| `npm run dev` | Lance l'API avec rechargement automatique |
| `npm test` | Tous les tests (l'API doit tourner) ; `make test` depuis la racine |
| `npm run test:unit` | Tests unitaires seuls (sans API ni base) |
| `npm run lint` | ESLint |
| `npm run lint:api` | Spectral sur `openapi.yaml` |
| `npm run matrix` / `matrix:check` | Génère / vérifie la matrice de traçabilité |
| `npm run docs:build` | Génère la doc Swagger statique dans `docs-site/` |

## Variables d'environnement

Lues dans [`src/config.js`](src/config.js). Avec Docker Compose, elles se règlent dans le fichier `.env` à la racine (modèle : [`.env.example`](../.env.example)).

| Variable | Défaut | Rôle |
| -------- | ------ | ---- |
| `PORT` | `3000` | Port d'écoute de l'API (dans le conteneur) |
| `DB_HOST` / `DB_PORT` | `localhost` / `3306` | Adresse de MySQL (Compose : `db` / `3306`) |
| `DB_NAME` / `DB_USER` / `DB_PASSWORD` | `events` / `events` / `events` | Base et identifiants MySQL |
| `JWT_SECRET` | `dev-secret-a-changer` | Secret de signature des jetons. **À changer** hors développement (avertissement au démarrage en production) |
| `JWT_EXPIRES_IN` | `7d` | Durée de validité d'un jeton (format `jsonwebtoken` : `1h`, `7d`…) |
| `CORS_ORIGIN` | `http://localhost:5173` | Origines autorisées à appeler l'API, séparées par des virgules. Compose : `http://localhost:5173,http://localhost:8080` |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` | `admin@events.local` / `admin1234` / `Administrateur` | Compte admin créé au démarrage s'il n'existe aucun admin |
| `SEED_DEMO` | `false` (Compose : `true`) | Crée les comptes de démo organizer et participant |
| `VALIDATE_RESPONSES` | `true` hors production | Vérifie les réponses contre `openapi.yaml` (réponse non conforme → 500). **À désactiver en production** |
| `NODE_ENV` | — | `production` dans l'image Docker |

Ports exposés sur la machine (Compose uniquement) : `API_PORT` (`3000`) et `DB_HOST_PORT` (`3307`).

## Routes

Toutes les routes sont documentées dans **Swagger** : http://localhost:3000/api/docs (testable : appelez `POST /api/auth/login`, puis collez le `token` reçu via le bouton **Authorize**). Version publiée, en consultation seulement : **https://capsjs.github.io/Coord-dev-front-tp/**.

| Méthode  | Route                    | Accès     | Description                                   |
| -------- | ------------------------ | --------- | --------------------------------------------- |
| `GET`    | `/api/health`            | public    | État de l'API                                 |
| `POST`   | `/api/auth/register`     | public    | Créer un compte (`participant` ou `organizer`) |
| `POST`   | `/api/auth/login`        | public    | Se connecter, renvoie un JWT                  |
| `GET`    | `/api/auth/me`           | connecté  | Voir son profil                               |
| `PATCH`  | `/api/auth/me`           | connecté  | Modifier son nom / email                      |
| `PUT`    | `/api/auth/me/password`  | connecté  | Changer son mot de passe                      |
| `DELETE` | `/api/auth/me`           | connecté  | Supprimer son compte (mot de passe exigé)     |
| `GET`    | `/api/auth/me/registrations` | connecté | Événements auxquels je suis inscrit (passés compris), par date croissante |
| `GET`    | `/api/admin/users`       | admin     | Lister les comptes (`?role=` pour filtrer)    |
| `GET`    | `/api/admin/users/:id`   | admin     | Voir un compte                                |
| `PATCH`  | `/api/admin/users/:id`   | admin     | Changer le rôle d'un compte                   |
| `DELETE` | `/api/admin/users/:id`   | admin     | Supprimer un compte                           |
| `GET`    | `/api/events`            | public    | Événements à venir, du plus proche au plus lointain |
| `GET`    | `/api/events/:id`        | public    | Détail d'un événement (organisateur compris)  |
| `POST`   | `/api/events`            | organizer, admin | Créer un événement                     |
| `PUT`    | `/api/events/:id`        | organisateur de l'événement, admin | Modifier un événement |
| `DELETE` | `/api/events/:id`        | organisateur de l'événement, admin | Supprimer un événement (et ses inscriptions) |
| `GET`    | `/api/events/:id/registrations` | organisateur de l'événement, admin | Liste des inscrits (nom, e-mail), du plus ancien au plus récent |
| `POST`   | `/api/events/:id/registrations` | participant | S'inscrire à un événement à venir (pas de double inscription) |
| `DELETE` | `/api/events/:id/registrations/me` | connecté | Se désinscrire d'un événement (404 si pas inscrit) |

Authentification : en-tête `Authorization: Bearer <token>`. Erreurs : `{ "error": "message" }`. Conventions complètes : [guide de style de l'API](../docs/guide-style-api.md).

## Contrat d'API

[`openapi.yaml`](openapi.yaml) est la **source de vérité** : on modifie d'abord le contrat, on le fait valider par le Front et le Back, puis on code ([ADR-0008](../docs/adr/0008-contrat-api-openapi.md)).

**Vérifications automatiques** (workflow *CI Contrat d'API*, à chaque PR qui touche le contrat) :

| Vérification | Outil | En local |
| ------------ | ----- | -------- |
| Contrat valide, règles OpenAPI recommandées et règles de l'équipe ([`.spectral.yaml`](.spectral.yaml)) | Spectral | `make lint` |
| Aucun changement cassant par rapport à la branche cible | oasdiff | — |

**Conformité de l'API au contrat** (à l'exécution, via `express-openapi-validator`) :

- **Requêtes** : toute requête non conforme est refusée en `400` avec un message clair (ex. `Champ « date » invalide : doit respecter le format date-time`). Aucune conversion implicite : `"10"` n'est pas accepté pour un nombre.
- **Réponses** : avec `VALIDATE_RESPONSES=true`, une réponse non conforme devient une erreur `500`, loguée avec le préfixe `[contrat]` : les tests échouent dès que le code s'écarte du contrat.

**Documentation publiée** : à chaque merge sur `main` qui modifie le contrat, le workflow *Documentation de l'API* génère la page Swagger (`npm run docs:build`) et la publie sur [GitHub Pages](https://capsjs.github.io/Coord-dev-front-tp/).

### Versioning et dépréciation

- `info.version` suit [SemVer](https://semver.org/lang/fr/) : *patch* pour une correction de doc, *mineure* pour un ajout compatible, *majeure* pour un changement cassant.
- **Changement cassant** : tout ce qui casse un client existant (supprimer ou renommer une route ou un champ de réponse, rendre obligatoire un champ de requête, restreindre un type…). Ajouter une route ou un champ optionnel n'est pas cassant.
- Avant de supprimer une route ou un champ, on le marque `deprecated: true` **au moins un sprint avant**, et on prévient le Front.
- Un changement cassant volontaire passe par une PR portant le label **`rupture-de-contrat`**, validée par le Front et le Back, avec la version majeure incrémentée. Le label fait passer oasdiff en simple avertissement.

## Tests

Stratégie (pyramide, outils, données, seuils, responsabilités) : [plan de test](../docs/plan-de-test.md). Ce qui doit être vrai pour qu'une story soit terminée : [Definition of Done](../docs/definition-of-done.md).

| Type | Où | Commande |
| ---- | -- | -------- |
| Intégration (API réelle + MySQL) | `test/*.test.js` | `make up` puis `make test` (depuis la racine) |
| Unitaires (règles pures, sans API ni base) | `test/unit/` | `npm run test:unit` |
| Couverture | rapport `coverage/report/index.html` | `make coverage` (depuis la racine) |

- Chaque lancement crée des comptes et événements de test jetables ; `make reset` vide la base.
- **Couverture** : seuils minimaux dans [`.c8rc.json`](.c8rc.json) (95 % des lignes, instructions et fonctions ; 85 % des branches). En CI, le job échoue sous ces seuils, affiche un résumé et publie le rapport HTML en artefact (`couverture-back`).
- **Traçabilité** : chaque critère d'acceptation est une exigence de [`docs/exigences.json`](../docs/exigences.json) (ex. `F01.3`). Un test la cite dans son titre (`it('… [F01.3]')`), et `npm run matrix` génère la [matrice exigence → test → version](../docs/matrice-tracabilite.md). En CI, `npm run matrix:check` échoue si une exigence back livrée n'a aucun test, si un test cite une exigence inconnue ou si la matrice n'est pas à jour.

## Structure

```
backend/
├── openapi.yaml            # contrat d'API (source de vérité)
├── .spectral.yaml          # règles de lint du contrat
├── .c8rc.json              # configuration et seuils de couverture
├── eslint.config.js
├── Dockerfile
├── scripts/
│   ├── matrice.js          # génère / vérifie la matrice de traçabilité
│   └── build-docs.js       # génère la doc Swagger statique
├── src/
│   ├── index.js            # démarrage : attente MySQL, migration, seed, serveur
│   ├── app.js              # application Express (routes, validateur OpenAPI, Swagger, erreurs)
│   ├── config.js           # configuration via variables d'environnement
│   ├── db.js               # pool MySQL, migration
│   ├── schema.sql          # schéma de la base
│   ├── seed.js             # compte admin + comptes de démo
│   ├── users.js            # accès aux données utilisateurs
│   ├── events.js           # accès aux données événements
│   ├── registrations.js    # accès aux données inscriptions
│   ├── validation.js       # validation des entrées
│   ├── permissions.js      # règles d'accès : organisateur ou admin (F08), inscription (F06), participants (F09)
│   ├── errors.js           # erreurs HTTP + middleware d'erreur
│   ├── openapi.js          # charge openapi.yaml
│   ├── middleware/
│   │   ├── auth.js         # JWT, requireAuth, requireRole
│   │   └── eventAccess.js  # requireEventManager (404 / 403)
│   └── routes/
│       ├── auth.js         # /api/auth/*
│       ├── admin.js        # /api/admin/*
│       └── events.js       # /api/events/*
└── test/
    ├── helpers.js          # appels HTTP, comptes de test, accès direct à la base
    ├── *.test.js           # tests d'intégration (auth, événements, inscriptions, contrat)
    └── unit/               # tests unitaires (permissions, validation, erreurs)
```
