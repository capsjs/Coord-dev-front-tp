# ADR-0004 : Authentification par JWT et mots de passe bcrypt

- **Statut** : Accepté
- **Date** : 2026-11-13
- **Tickets** : SCRUM-39 (session expirée)

## Contexte

Le front (React, servi sur un autre port ou domaine) et l'API sont deux applications séparées. Les utilisateurs doivent s'inscrire, se connecter et rester connectés, et chaque requête doit pouvoir être rattachée à un utilisateur et à son rôle.

## Décision

Nous utilisons des **jetons JWT** transmis dans l'en-tête `Authorization: Bearer <token>`.

- **À la connexion ou à l'inscription**, l'API renvoie `{ token, user }`.
  - Le jeton est signé en HS256 avec `JWT_SECRET`.
  - Il contient seulement `sub` (id de l'utilisateur) et `role`.
  - Il expire après **7 jours** (`JWT_EXPIRES_IN`).
- **À chaque requête protégée** (`middleware/auth.js`), l'API vérifie la signature et l'expiration, puis **relit l'utilisateur en base**. Un rôle modifié ou un compte supprimé prend donc effet immédiatement, sans attendre l'expiration du jeton.
- **Mots de passe hachés avec bcrypt** (`bcryptjs`, coût 10), jamais stockés ni renvoyés en clair.
- **Messages d'erreur** :
  - même message pour un email inconnu et pour un mauvais mot de passe, afin de ne pas révéler quels emails existent ;
  - message distinct pour une session expirée, pour que le front puisse renvoyer vers la connexion.
- **Pas de route de déconnexion** : le front supprime simplement le jeton, qu'il stocke dans le `localStorage`.

Options écartées :
- **Sessions côté serveur avec cookie** : il faudrait stocker un état sur le serveur, et les cookies entre deux origines différentes compliquent la configuration (CORS, CSRF) ;
- **Jetons de rafraîchissement** (*refresh tokens*), jugés trop complexes pour le MVP.

## Conséquences

- **Positives** : API sans état de session, simple à consommer pour le front et à tester (Swagger, curl). Les changements de rôle et les suppressions de compte sont pris en compte tout de suite.
- **Négatives** :
  - **Pas de révocation** : un jeton volé reste valide jusqu'à son expiration, et changer son mot de passe n'invalide pas les jetons déjà émis.
  - Le `localStorage` est lisible par du JavaScript : une faille XSS dans le front exposerait le jeton.
  - Une requête SQL supplémentaire à chaque appel authentifié, à cause de la relecture de l'utilisateur.
  - bcrypt est volontairement lent : le login est la route la plus coûteuse de l'API, ce qui freine aussi les attaques par force brute.
  - `JWT_SECRET` a une valeur par défaut de développement : **elle doit être remplacée hors développement**, sinon n'importe qui peut fabriquer un jeton admin.
