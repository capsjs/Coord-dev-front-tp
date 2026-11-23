# ADR-0006 : Front-end en React, TypeScript et Vite

- **Statut** : Accepté
- **Date** : 2026-11-13
- **Tickets** : SCRUM-77 (CI front)

## Contexte

Il faut une interface web qui consomme l'API (voir [ADR-0002](0002-stack-back-node-express.md)) : inscription, connexion, événements, avec un affichage qui dépend du rôle. Le front et le back sont développés par des personnes différentes.

## Décision

Nous développons une **application monopage** (SPA) en **React 19** et **TypeScript** (mode strict), construite avec **Vite**, avec **React Router** pour la navigation.

- **Un seul point d'appel à l'API**, `apiFetch` (`src/api/client.ts`), basé sur `fetch` sans librairie HTTP. Il ajoute le jeton, gère le JSON et transforme `{ error }` en `ApiError`.
- **État de connexion** partagé par un contexte React (`AuthProvider`, `useAuth`), sans librairie d'état globale.
- **Pages réservées** protégées par `ProtectedRoute`.
- **Types** (`src/types/`) calqués sur le contrat d'API (voir [ADR-0008](0008-contrat-api-openapi.md)).
- **URL de l'API** configurable par `VITE_API_URL`. Lint avec oxlint.
- **En Docker** : construction en deux étapes. Node construit l'application, puis **nginx** sert les fichiers statiques (port 8080).

Options écartées :
- **Create React App**, abandonné et lent ;
- **Next.js**, dont le rendu serveur n'est pas utile ici ;
- **Redux**, trop lourd pour un état limité à la session ;
- **Axios**, puisque `fetch` suffit.

## Conséquences

- **Positives** : démarrage et rechargement très rapides en développement. Le typage détecte les écarts avec l'API à la compilation. Peu de dépendances.
- **Négatives** :
  - Les types du front sont recopiés à la main depuis le contrat, au lieu d'être générés : il faut les mettre à jour à chaque évolution de l'API.
  - `VITE_API_URL` est figé au moment du build : il faut une image Docker par environnement.
  - Le nginx de l'image utilise sa configuration par défaut, **sans redirection vers `index.html`**. Recharger une page profonde (ex. `/events/3`) dans la version Docker renvoie une 404. **À corriger par une configuration nginx avec `try_files`.**
