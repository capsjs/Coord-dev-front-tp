# ADR-0007 : Conteneurisation avec Docker Compose

- **Statut** : Accepté
- **Date** : 2026-11-13
- **Tickets** : SCRUM-76 (validation du compose en CI)

## Contexte

Chaque membre de l'équipe doit pouvoir lancer le projet complet (base, API, front) sur sa machine, sans installer ni configurer MySQL. Les mêmes conditions doivent servir en CI.

## Décision

Nous décrivons l'environnement complet dans **`docker-compose.yml`**, avec trois services :

| Service    | Image                                   | Port hôte |
| ---------- | --------------------------------------- | --------- |
| `db`       | `mysql:8.4`, données dans le volume `db-data` | 3307 |
| `backend`  | construite depuis `backend/Dockerfile` (`node:22-alpine`, dépendances de production, utilisateur non root) | 3000 |
| `frontend` | construite depuis `frontend/Dockerfile` (build Node, puis nginx) | 8080 |

- **Ordre de démarrage** : l'API attend que MySQL soit vraiment prêt, grâce au `healthcheck` du service `db`, puis réessaie de se connecter (`waitForDb`) par sécurité.
- **Configuration** par variables d'environnement, avec des **valeurs par défaut de développement**. Le fichier `.env` est facultatif : `.env.example` en donne la liste.
- **Raccourcis `make`** (`make up`, `make test`, `make reset`…) au-dessus de `docker compose`.
- **Surcharge `docker-compose.coverage.yml`** pour mesurer la couverture de l'API pendant les tests.

## Conséquences

- **Positives** : un seul prérequis (Docker) et une seule commande pour tout lancer. Environnement identique pour toute l'équipe et en CI. Remise à zéro facile avec `make reset`.
- **Négatives** :
  - Les valeurs par défaut (mots de passe MySQL, comptes de démo, `JWT_SECRET`) sont publiques dans le dépôt : **elles doivent être surchargées par un `.env` hors développement**.
  - Ce compose est pensé pour le développement : il n'y a ni HTTPS, ni reverse proxy, ni sauvegarde de la base. Un déploiement en production demandera une configuration dédiée.
  - Après une modification du code de l'API, il faut reconstruire l'image (`make build`), car le code n'est pas monté dans le conteneur.
  - Le serveur de développement du front et les tests tournent sur la machine hôte : ils demandent Node.js installé en local.
