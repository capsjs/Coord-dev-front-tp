# ADR-0010 : Mesures de sécurité de l'API

- **Statut** : Proposé
- **Date** : 2026-11-25
- **Tickets** : SCRUM-85

## Contexte

L'API gère des mots de passe, des rôles et des données modifiables par leurs seuls propriétaires. Les choix de sécurité ont été faits au fil des tickets ; cet ADR les rassemble et liste les risques acceptés pour le MVP.

## Décision

| Thème | Mesure |
| ----- | ------ |
| **Mots de passe** | Hachés avec bcrypt (coût 10), jamais renvoyés ; redemandés pour changer de mot de passe ou supprimer son compte ([ADR-0004](0004-authentification-jwt.md)) |
| **Jetons** | JWT de 7 jours, utilisateur relu en base à chaque requête ([ADR-0004](0004-authentification-jwt.md)). 401 réservé aux problèmes de session ([guide de style](../guide-style-api.md)). Droits vérifiés uniquement côté back ([ADR-0005](0005-roles-et-autorisations.md)) |
| **CORS** | Liste blanche d'origines (`CORS_ORIGIN`), jamais `*` ; pas de cookie, donc pas de risque CSRF |
| **Entrées** | Requêtes validées par le contrat OpenAPI, règles métier dans `validation.js`, SQL toujours paramétré, corps limité à 100 Ko. Les erreurs inattendues n'exposent aucun détail interne |
| **Secrets** | Variables d'environnement uniquement (`.env` ignoré par Git) ; jamais dans le code, les commits ou un workflow (*GitHub Secrets*) |

Avant toute mise en ligne : changer `JWT_SECRET`, `ADMIN_PASSWORD` et les mots de passe MySQL, passer `SEED_DEMO` et `VALIDATE_RESPONSES` à `false`, restreindre `CORS_ORIGIN` et servir l'API en HTTPS.

Option écartée : jeton en cookie `HttpOnly` (protège du XSS mais impose la gestion CSRF entre deux origines, voir ADR-0004).

## Conséquences

- **Positives** : protections essentielles en place et vérifiées par les tests ; une seule page pour une revue ou le test d'intrusion (SCRUM-88).
- **Négatives (risques acceptés pour le MVP)** :
  - pas de limite de tentatives de connexion ni d'en-têtes de sécurité HTTP (Helmet) ;
  - jeton dans le `localStorage` (exposé en cas de XSS) et non révocable avant son expiration ;
  - l'inscription révèle si un email existe déjà (409).
