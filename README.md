Branche créée à partir de Jira

# Coord Events : gestionnaire d'événements

Gestionnaire d'événements : API back-end (`backend/`) et interface web (`frontend/`), avec trois rôles :

| Rôle          | Description                                                  |
| ------------- | ------------------------------------------------------------ |
| `admin`       | Gère les comptes (liste, changement de rôle, suppression)    |
| `organizer`   | Crée et gère des événements *(à venir)*                       |
| `participant` | S'inscrit aux événements *(à venir)*                          |

**Stack back** : Node.js 22 · Express 5 · MySQL 8.4 · JWT · Docker Compose

**Stack front** : React 19 · TypeScript · Vite · React Router

> État actuel : **comptes et connexion** uniquement. Les événements arrivent ensuite.

## Démarrage rapide

```bash
make up
```

La commande lance MySQL et l'API, puis attend que l'API réponde. Sans `make`, utilisez `docker compose up -d --build`.

### Commandes `make`

Tapez `make` seul pour afficher la liste.

| Commande       | Effet                                                          |
| -------------- | -------------------------------------------------------------- |
| `make up`      | Démarre MySQL + l'API et attend qu'elle soit prête             |
| `make down`    | Arrête les conteneurs (les données sont conservées)            |
| `make build`   | Reconstruit et relance l'API après une modification du code    |
| `make restart` | Redémarre l'API sans reconstruire                              |
| `make rebuild` | Reconstruit tout sans cache                                    |
| `make logs`    | Suit les logs de l'API (`make logs-db` pour MySQL)             |
| `make ps`      | État des conteneurs                                            |
| `make health`  | Vérifie que l'API répond                                       |
| `make docs`    | Ouvre le Swagger dans le navigateur                            |
| `make test`    | Lance les tests d'intégration (l'API doit tourner)             |
| `make lint`    | Vérifie le code du back (ESLint) et le contrat d'API (Spectral) |
| `make db`      | Ouvre la console MySQL                                         |
| `make shell`   | Ouvre un shell dans le conteneur de l'API                      |
| `make reset`   | **Vide la base** et redémarre (comptes de démo recréés)        |
| `make install` | Installe les dépendances npm du back en local                  |
| `make hooks`   | Active le hook pre-commit (compose + lint vérifiés à chaque commit) |

| Service          | URL                                |
| ---------------- | ---------------------------------- |
| API              | http://localhost:3000/api          |
| Swagger (doc)    | http://localhost:3000/api/docs     |
| Spec OpenAPI     | http://localhost:3000/api/docs.json |
| MySQL (depuis l'hôte) | `localhost:3307` (user `events` / `events`) |

Au premier démarrage, l'API crée les tables puis les comptes ci-dessous.

| Rôle        | Email                      | Mot de passe |
| ----------- | -------------------------- | ------------ |
| admin       | `admin@events.local`       | `admin1234`  |
| organizer   | `orga@events.local`        | `orga1234`   |
| participant | `participant@events.local` | `part1234`   |

Les comptes de démo (organizer/participant) se désactivent avec `SEED_DEMO=false`.

Pour personnaliser (ports, secret JWT, identifiants admin…), copiez le fichier d'exemple puis éditez-le :

```bash
cp .env.example .env
```

Pour repartir d'une base vide : `make reset`.

## Front-end

```bash
make up                 # l'API doit tourner
cd frontend
cp .env.example .env
npm install
npm run dev             # http://localhost:5173
```

Détails (pages, authentification, structure) : [`frontend/README.md`](frontend/README.md).

## Routes de l'API

Toutes les routes sont documentées et testables dans **Swagger** (`/api/docs`). Pour les routes protégées, appelez d'abord `POST /api/auth/login`, puis collez le `token` reçu via le bouton **Authorize**.

| Méthode  | Route                    | Accès     | Description                                   |
| -------- | ------------------------ | --------- | --------------------------------------------- |
| `GET`    | `/api/health`            | public    | État de l'API                                 |
| `POST`   | `/api/auth/register`     | public    | Créer un compte (`participant` ou `organizer`) |
| `POST`   | `/api/auth/login`        | public    | Se connecter, renvoie un JWT                  |
| `GET`    | `/api/auth/me`           | connecté  | Voir son profil                               |
| `PATCH`  | `/api/auth/me`           | connecté  | Modifier son nom / email                      |
| `PUT`    | `/api/auth/me/password`  | connecté  | Changer son mot de passe                      |
| `DELETE` | `/api/auth/me`           | connecté  | Supprimer son compte (mot de passe exigé)     |
| `GET`    | `/api/admin/users`       | admin     | Lister les comptes (`?role=` pour filtrer)    |
| `GET`    | `/api/admin/users/:id`   | admin     | Voir un compte                                |
| `PATCH`  | `/api/admin/users/:id`   | admin     | Changer le rôle d'un compte                   |
| `DELETE` | `/api/admin/users/:id`   | admin     | Supprimer un compte                           |

Authentification : en-tête `Authorization: Bearer <token>`. Les erreurs sont renvoyées au format `{ "error": "message" }`.

## Contrat d'API

[`backend/openapi.yaml`](backend/openapi.yaml) est la **source de vérité** : on modifie d'abord le contrat, on le fait valider par le Front et le Back, puis on code.

**Vérifications automatiques** (workflow *CI Contrat d'API*, à chaque PR qui touche le contrat) :

| Vérification | Outil | En local |
| ------------ | ----- | -------- |
| Contrat valide, règles OpenAPI recommandées et règles de l'équipe ([`backend/.spectral.yaml`](backend/.spectral.yaml) : champs en camelCase, 401 documenté sur les routes protégées) | Spectral | `make lint` |
| Aucun changement cassant par rapport à la branche cible | oasdiff | — |

**Conformité de l'API au contrat** (à l'exécution, via `express-openapi-validator`) :

- **Requêtes** : toute requête non conforme à `openapi.yaml` est refusée en `400` avec un message clair (ex. `Champ « date » invalide : doit respecter le format date-time`). Aucune conversion implicite : `"10"` n'est pas accepté pour un nombre.
- **Réponses** : avec `VALIDATE_RESPONSES=true` (par défaut en dev, dans Docker Compose et en CI), une réponse non conforme au contrat devient une erreur `500`, loguée avec le préfixe `[contrat]`. Les tests d'intégration échouent donc dès que le code s'écarte du contrat. À désactiver en production.
- Tests dédiés : [`backend/test/contract.test.js`](backend/test/contract.test.js).

**Changement cassant** : tout ce qui casse un client existant (supprimer ou renommer une route ou un champ de réponse, rendre obligatoire un champ de requête, restreindre un type…). Ajouter une route ou un champ optionnel n'est pas cassant.

### Versioning et dépréciation

- `info.version` suit [SemVer](https://semver.org/lang/fr/) : *patch* pour une correction de doc, *mineure* pour un ajout compatible, *majeure* pour un changement cassant.
- Avant de supprimer une route ou un champ, on le marque `deprecated: true` dans le contrat **au moins un sprint avant**, et on prévient le Front.
- Un changement cassant volontaire passe par une PR portant le label **`rupture-de-contrat`**, validée par le Front et le Back, avec la version majeure incrémentée. Le label fait passer oasdiff en simple avertissement.

## Développement sans Docker pour l'API

```bash
docker compose up -d db          # MySQL seul, exposé sur le port 3307
cd backend
npm install
DB_PORT=3307 SEED_DEMO=true npm run dev
```

## Tests

Tests d'intégration (`node:test`) à lancer contre l'API démarrée :

```bash
make up
make test
```

Chaque lancement crée des comptes de test jetables en base. `make reset` les efface.

## Structure

```
backend/
├── openapi.yaml            # contrat d'API du MVP (source de vérité)
├── src/
│   ├── index.js            # démarrage : attente MySQL, migration, seed, serveur
│   ├── app.js              # application Express (routes, Swagger, erreurs)
│   ├── config.js           # configuration via variables d'environnement
│   ├── db.js               # pool MySQL, transactions, migration
│   ├── schema.sql          # schéma de la base
│   ├── seed.js             # compte admin + comptes de démo
│   ├── users.js            # accès aux données utilisateurs
│   ├── events.js           # accès aux données événements
│   ├── validation.js       # validation des entrées
│   ├── errors.js           # erreurs HTTP + middleware d'erreur
│   ├── openapi.js          # charge openapi.yaml pour Swagger
│   ├── middleware/auth.js  # JWT, requireAuth, requireRole
│   └── routes/
│       ├── auth.js         # /api/auth/*
│       ├── admin.js        # /api/admin/*
│       └── events.js       # /api/events/*
├── test/                   # tests d'intégration (auth, événements) + helpers.js
└── Dockerfile
frontend/                   # interface React (voir frontend/README.md)
docker-compose.yml
Makefile                    # raccourcis : make up, make test…
```
