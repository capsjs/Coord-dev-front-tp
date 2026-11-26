# Coord Events : gestionnaire d'événements

Gestionnaire d'événements : API back-end (`backend/`) et interface web (`frontend/`), avec trois rôles :

| Rôle          | Description                                                  |
| ------------- | ------------------------------------------------------------ |
| `admin`       | Gère les comptes (liste, changement de rôle, suppression) et peut gérer tous les événements |
| `organizer`   | Crée, modifie et supprime ses événements ; consulte la liste de leurs participants |
| `participant` | Consulte les événements ; s'y inscrit et s'en désinscrit      |

**Stack back** : Node.js 22 · Express 5 · MySQL 8.4 · JWT · OpenAPI 3 → [`backend/README.md`](backend/README.md)

**Stack front** : React 19 · TypeScript · Vite · React Router → [`frontend/README.md`](frontend/README.md)

> État actuel : **comptes, connexion, gestion des événements** (création, modification, suppression, liste, fiche) **et inscriptions** (s'inscrire et se désinscrire depuis la fiche d'un événement, liste des participants pour l'organisateur).

## Démarrage rapide

```bash
make up
```

La commande lance MySQL, l'API et le front, puis attend que l'API réponde. Sans `make`, utilisez `docker compose up -d --build`.

| Service          | URL                                |
| ---------------- | ---------------------------------- |
| Front (conteneur) | http://localhost:8080             |
| API              | http://localhost:3000/api          |
| Swagger (doc testable) | http://localhost:3000/api/docs |
| Doc publiée (consultation) | https://capsjs.github.io/Coord-dev-front-tp/ |
| MySQL (depuis l'hôte) | `localhost:3307` (user `events` / `events`) |

Pour développer le front avec rechargement automatique (http://localhost:5173) : voir [`frontend/README.md`](frontend/README.md). Pour l'API sans Docker : voir [`backend/README.md`](backend/README.md).

### Comptes de démo

Créés par l'API au premier démarrage :

| Rôle        | Email                      | Mot de passe |
| ----------- | -------------------------- | ------------ |
| admin       | `admin@events.local`       | `admin1234`  |
| organizer   | `orga@events.local`        | `orga1234`   |
| participant | `participant@events.local` | `part1234`   |

Les comptes de démo (organizer/participant) se désactivent avec `SEED_DEMO=false`.

### Configuration

Pour personnaliser (ports, secret JWT, identifiants admin…), copiez le fichier d'exemple puis éditez-le :

```bash
cp .env.example .env
```

Liste complète des variables et de leur rôle : [`backend/README.md`](backend/README.md#variables-denvironnement).

### Commandes `make`

Tapez `make` seul pour afficher la liste.

| Commande       | Effet                                                          |
| -------------- | -------------------------------------------------------------- |
| `make up`      | Démarre MySQL + l'API + le front et attend que l'API soit prête |
| `make down`    | Arrête les conteneurs (les données sont conservées)            |
| `make build`   | Reconstruit et relance l'API après une modification du code    |
| `make restart` | Redémarre l'API sans reconstruire                              |
| `make rebuild` | Reconstruit tout sans cache                                    |
| `make logs`    | Suit les logs de l'API (`make logs-db` pour MySQL)             |
| `make ps`      | État des conteneurs                                            |
| `make health`  | Vérifie que l'API répond                                       |
| `make docs`    | Ouvre le Swagger dans le navigateur                            |
| `make test`    | Lance les tests du back (l'API doit tourner)                   |
| `make coverage` | Tests + mesure de la couverture du back (rapport HTML dans `backend/coverage/report/`) |
| `make lint`    | Vérifie le code du back (ESLint) et le contrat d'API (Spectral) |
| `make db`      | Ouvre la console MySQL                                         |
| `make shell`   | Ouvre un shell dans le conteneur de l'API                      |
| `make reset`   | **Vide la base** et redémarre (comptes de démo recréés)        |
| `make install` | Installe les dépendances npm du back en local                  |
| `make hooks`   | Active le hook pre-commit (compose + lint vérifiés à chaque commit), une fois par clone |

## Intégration continue

Chaque PR déclenche les workflows concernés par les fichiers modifiés (dossier [`.github/workflows/`](.github/workflows/)) :

| Workflow | Déclenché par | Vérifie |
| -------- | ------------- | ------- |
| **CI Back** | `backend/`, `docker-compose.yml`, `Makefile`, exigences | compose valide, lint, tests unitaires, matrice de traçabilité, build Docker, tests d'intégration, couverture |
| **CI Front** | `frontend/`, `docker-compose.yml`, `Makefile` | lint, tests et couverture, build, image Docker |
| **CI Contrat d'API** | `backend/openapi.yaml` | Spectral, changements cassants (oasdiff) |
| **Documentation de l'API** | `backend/openapi.yaml` | génère la doc Swagger ; la publie sur GitHub Pages après merge sur `main` |

Le hook pre-commit (`make hooks`) fait une partie de ces vérifications avant même le commit.

## Documentation

| Document | Contenu |
| -------- | ------- |
| [`backend/README.md`](backend/README.md) | API : variables d'environnement, routes, contrat, tests, structure |
| [`frontend/README.md`](frontend/README.md) | Interface : pages, authentification, structure |
| [`docs/guide-style-api.md`](docs/guide-style-api.md) | Conventions de l'API : nommage, codes HTTP, erreurs, pagination |
| [`docs/adr/`](docs/adr/README.md) | Décisions d'architecture et leurs raisons |
| [`docs/plan-de-test.md`](docs/plan-de-test.md) | Stratégie de test : pyramide, outils, responsabilités |
| [`docs/definition-of-done.md`](docs/definition-of-done.md) | Ce qui doit être vrai pour qu'une story soit terminée |
| [`docs/matrice-tracabilite.md`](docs/matrice-tracabilite.md) | Quel test vérifie quel critère d'acceptation |

## Structure

```
backend/                    # API Express (voir backend/README.md)
frontend/                   # interface React (voir frontend/README.md)
docs/                       # ADR, guide de style de l'API, plan de test, Definition of Done, matrice de traçabilité
.github/workflows/          # CI Back, CI Front, CI Contrat d'API, publication de la doc
.githooks/                  # hook pre-commit de l'équipe (make hooks)
docker-compose.yml          # MySQL + API + front ; docker-compose.coverage.yml pour make coverage
Makefile                    # raccourcis : make up, make test…
```
