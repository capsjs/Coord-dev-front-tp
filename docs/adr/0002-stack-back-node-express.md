# ADR-0002 : Back-end en Node.js 22 et Express 5

- **Statut** : Accepté
- **Date** : 2026-11-13

## Contexte

Il faut une API REST pour un gestionnaire d'événements : comptes, rôles, événements. L'équipe a choisi d'utiliser JavaScript côté back comme côté front (React), pour partager un seul langage. Le projet est de taille modeste et doit avancer vite.

## Décision

Nous écrivons l'API en **Node.js 22** avec **Express 5**, en JavaScript (modules ES), sans framework par-dessus.

- **Express 5** transmet automatiquement les erreurs des fonctions `async` au middleware d'erreur. Les routes lèvent une `HttpError` (`badRequest`, `forbidden`…) au lieu d'écrire des `try/catch` partout.
- **Organisation en couches simples** :
  - les routes (`src/routes/`) ;
  - les modules d'accès aux données (`users.js`, `events.js`) ;
  - le pool MySQL (`db.js`).
  La validation est dans `validation.js`, les règles d'accès dans `permissions.js`.
- **Toutes les erreurs** sont renvoyées au même format : `{ "error": "message" }`, en français et prêt à afficher par le front.
- **Toute la configuration** passe par des variables d'environnement (`config.js`), avec des valeurs par défaut pour le développement.

Options écartées :
- **NestJS**, jugé trop lourd pour la taille du projet ;
- **TypeScript côté back** : il ajoute une étape de build, et le contrat OpenAPI validé à l'exécution apporte déjà une garantie sur les entrées et sorties (voir [ADR-0008](0008-contrat-api-openapi.md)).

## Conséquences

- **Positives** : peu de dépendances et un code direct, facile à lire pour toute l'équipe. Même langage que le front. Démarrage instantané, sans compilation.
- **Négatives** :
  - Pas de typage statique côté back : les erreurs de type ne sont détectées que par les tests et le validateur OpenAPI.
  - Les conventions (structure des dossiers, gestion des erreurs) reposent sur la discipline de l'équipe, pas sur un framework.
  - Node.js exécute le JavaScript sur un seul cœur : les traitements coûteux en CPU, comme le hachage bcrypt du login, limitent le débit (voir [ADR-0004](0004-authentification-jwt.md)).
