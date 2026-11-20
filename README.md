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
| `make lint`    | Vérifie le code du back avec ESLint                            |
| `make db`      | Ouvre la console MySQL                                         |
| `make shell`   | Ouvre un shell dans le conteneur de l'API                      |
| `make reset`   | **Vide la base** et redémarre (comptes de démo recréés)        |
| `make install` | Installe les dépendances npm du back en local                  |

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
│   ├── validation.js       # validation des entrées
│   ├── errors.js           # erreurs HTTP + middleware d'erreur
│   ├── openapi.js          # charge openapi.yaml pour Swagger
│   ├── middleware/auth.js  # JWT, requireAuth, requireRole
│   └── routes/
│       ├── auth.js         # /api/auth/*
│       └── admin.js        # /api/admin/*
├── test/auth.test.js
└── Dockerfile
frontend/                   # interface React (voir frontend/README.md)
docker-compose.yml
Makefile                    # raccourcis : make up, make test…
```
