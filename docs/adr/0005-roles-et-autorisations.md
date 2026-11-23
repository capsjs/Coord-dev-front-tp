# ADR-0005 : Trois rôles fixes, contrôlés côté back

- **Statut** : Accepté
- **Date** : 2026-11-13
- **Tickets** : SCRUM-39, SCRUM-43, SCRUM-45

## Contexte

L'application distingue trois profils : l'**admin** gère les comptes, l'**organisateur** crée et gère ses événements, le **participant** consulte les événements et s'y inscrit. Il faut empêcher un utilisateur de s'attribuer des droits et garantir qu'un organisateur ne touche qu'à ses propres événements.

## Décision

Chaque utilisateur a **un seul rôle**, stocké en base dans une colonne `ENUM('admin', 'organizer', 'participant')`.

- **À l'inscription**, on peut choisir `participant` ou `organizer`, **jamais `admin`**. Le premier admin est créé au démarrage à partir de `ADMIN_EMAIL` et `ADMIN_PASSWORD`. Ensuite, seul un admin peut promouvoir un compte.
- **Contrôle par route**, avec des middlewares chaînés :
  - `requireAuth` exige d'être connecté (401) ;
  - `requireRole(...)` exige le bon rôle (403).
- **Contrôle par ressource** : la règle « organisateur de l'événement ou admin » est une fonction pure (`canManageEvent` dans `permissions.js`), testée unitairement. Le middleware `requireEventManager` l'applique : il renvoie 404 si l'événement n'existe pas, puis 403 si l'utilisateur n'a pas les droits.
- **Garde-fous** : un admin ne peut pas changer son propre rôle, et l'application refuse de supprimer ou de rétrograder le **dernier admin**.
- **Le back seul fait foi** : le front adapte l'affichage au rôle, mais ce n'est jamais une protection.

Option écartée : un système de permissions fines (table de permissions, rôles multiples), surdimensionné pour trois profils.

## Conséquences

- **Positives** : modèle simple, lisible dans chaque route. Les règles sensibles sont centralisées et testées. Impossible de s'auto-promouvoir admin, et impossible de perdre tous les admins.
- **Négatives** :
  - Un utilisateur n'a qu'un rôle : si un organisateur doit aussi pouvoir s'inscrire aux événements des autres, la règle devra être revue par un nouvel ADR.
  - Ajouter un rôle demande de modifier l'`ENUM` en base. Faute d'outil de migration, cela impose une réinitialisation de la base (voir [ADR-0003](0003-base-de-donnees-mysql.md)).
