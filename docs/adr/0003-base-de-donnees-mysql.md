# ADR-0003 : Base de données MySQL 8.4, SQL sans ORM

- **Statut** : Accepté
- **Date** : 2026-11-13
- **Tickets** : SCRUM-41 (table `events`)

## Contexte

Les données sont fortement relationnelles : des utilisateurs, des événements rattachés à un organisateur, et bientôt des inscriptions. Il faut des contraintes d'intégrité (email unique, clés étrangères). PostgreSQL a d'abord été envisagé, puis l'équipe a demandé MySQL.

## Décision

Nous utilisons **MySQL 8.4**, avec l'image Docker officielle, et le driver **`mysql2/promise`**, **sans ORM**.

- **Requêtes SQL écrites à la main** et toujours **paramétrées** (`?`), ce qui protège contre l'injection SQL.
- **Pool** de 10 connexions (`db.js`).
- **Intégrité garantie par la base elle-même** :
  - tables InnoDB en `utf8mb4` ;
  - `UNIQUE` sur l'email ;
  - `ENUM` pour le rôle ;
  - clés étrangères `ON DELETE CASCADE` (supprimer un compte supprime ses événements).
- **Schéma** dans `src/schema.sql`, appliqué au démarrage de l'API (`migrate()`) avec des `CREATE TABLE IF NOT EXISTS`. Cette opération peut être relancée sans risque.
- **Dates stockées et lues en UTC** (`timezone: 'Z'`) et exposées en ISO 8601. Le front se charge de l'affichage local.

Options écartées :
- **Un ORM** (Prisma, Sequelize), car il y a peu de tables et un SQL explicite reste lisible et maîtrisé ;
- **PostgreSQL**, à la demande de l'équipe.

## Conséquences

- **Positives** : aucune couche magique, chaque requête est visible dans le code. Les règles d'intégrité tiennent même si le code a un bug. Une base neuve est prête en un `docker compose up`.
- **Négatives** :
  - **Pas d'outil de migration** : `CREATE TABLE IF NOT EXISTS` crée les tables manquantes, mais ne modifie pas une table existante (ajout de colonne…). En développement, il faut faire `make reset`, ce qui vide la base. **Avant toute mise en production avec des données à conserver, il faudra introduire des migrations versionnées.**
  - Le passage des colonnes `snake_case` de la base au JSON `camelCase` de l'API se fait à la main, dans `toPublicUser` et ses équivalents.
  - Le SQL est propre à MySQL : changer de moteur demanderait de relire les requêtes.
