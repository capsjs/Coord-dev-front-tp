# Décisions d'architecture (ADR)

Un **ADR** (*Architecture Decision Record*) consigne une décision d'architecture importante : le contexte qui l'a motivée, ce qui a été décidé, et ce que ça implique. Le but est que n'importe quel membre de l'équipe, ou un nouvel arrivant, comprenne **pourquoi** le projet est construit ainsi.

## Liste des décisions

| N° | Décision | Statut | Date |
| -- | -------- | ------ | ---- |
| [0001](0001-consigner-les-decisions-dans-des-adr.md) | Consigner les décisions d'architecture dans des ADR | Accepté | 2026-11-23 |
| [0002](0002-stack-back-node-express.md) | Back-end en Node.js 22 et Express 5 | Accepté | 2026-11-13 |
| [0003](0003-base-de-donnees-mysql.md) | Base de données MySQL 8.4, SQL sans ORM | Accepté | 2026-11-13 |
| [0004](0004-authentification-jwt.md) | Authentification par JWT et mots de passe bcrypt | Accepté | 2026-11-13 |
| [0005](0005-roles-et-autorisations.md) | Trois rôles fixes, contrôlés côté back | Accepté | 2026-11-13 |
| [0006](0006-stack-front-react-typescript-vite.md) | Front-end en React, TypeScript et Vite | Accepté | 2026-11-13 |
| [0007](0007-conteneurisation-docker-compose.md) | Conteneurisation avec Docker Compose | Accepté | 2026-11-13 |
| [0008](0008-contrat-api-openapi.md) | Contrat d'API OpenAPI comme source de vérité | Accepté | 2026-11-20 |
| [0009](0009-strategie-de-tests-et-ci.md) | Tests d'intégration sur la vraie stack et CI GitHub Actions | Accepté | 2026-11-20 |

## Écrire un nouvel ADR

1. Copier [`0000-modele.md`](0000-modele.md) en `NNNN-titre-court.md`, avec le numéro suivant.
2. Remplir les trois parties : **contexte**, **décision**, **conséquences**. Rester court : une page maximum.
3. L'ajouter au tableau ci-dessus et le faire relire dans la PR, comme du code.

**On ne réécrit pas un ADR accepté.** Si une décision change, on écrit un nouvel ADR qui la remplace, et on passe l'ancien au statut *Remplacé par ADR-NNNN*. L'historique des choix reste ainsi lisible.

**Statuts possibles** : *Proposé* (en discussion), *Accepté*, *Déprécié* (n'est plus appliqué), *Remplacé par ADR-NNNN*.
