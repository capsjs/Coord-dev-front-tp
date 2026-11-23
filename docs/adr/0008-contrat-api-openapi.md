# ADR-0008 : Contrat d'API OpenAPI comme source de vérité

- **Statut** : Accepté
- **Date** : 2026-11-20
- **Tickets** : SCRUM-65 (contrat du MVP), SCRUM-68 (Spectral, oasdiff), SCRUM-75 (conformité à l'exécution)

## Contexte

Le front et le back sont développés en parallèle par des personnes différentes. Sans référence commune, chacun peut avoir une idée différente d'une route (nom d'un champ, format d'une date, code d'erreur), et l'écart n'apparaît qu'à l'intégration. Au début, la documentation Swagger était écrite en JavaScript dans `openapi.js`, à côté du code, sans rien qui garantisse qu'elle corresponde au comportement réel de l'API.

## Décision

Nous adoptons une démarche **contract-first** : **`backend/openapi.yaml`** (OpenAPI 3.0) est la source de vérité de l'API. Pour toute évolution, on modifie d'abord le contrat, il est validé par le front et le back, puis on code.

- **Documentation** : Swagger UI (`/api/docs`) sert directement ce fichier.
- **Conformité vérifiée à l'exécution** par `express-openapi-validator` :
  - les **requêtes** non conformes sont refusées en 400, sans conversion implicite de type ;
  - les **réponses** non conformes deviennent des erreurs 500 quand `VALIDATE_RESPONSES=true`, ce qui est le cas par défaut en développement, en Docker et en CI ;
  - l'authentification et les rôles restent gérés par nos middlewares (`validateSecurity: false`).
- **Vérifications en CI** (workflow *CI Contrat d'API*) :
  - **Spectral** applique les règles OpenAPI recommandées et celles de l'équipe : champs en camelCase, 401 documenté sur les routes protégées ;
  - **oasdiff** bloque les changements cassants par rapport à la branche cible.
- **Versioning SemVer** de `info.version`. Avant toute suppression, un champ ou une route est marqué `deprecated` au moins un sprint à l'avance. Une rupture volontaire passe par le label `rupture-de-contrat`.

## Conséquences

- **Positives** : le front peut coder à partir du contrat avant que la route existe. Tout écart entre le code et le contrat fait échouer les tests. Les ruptures involontaires sont bloquées en PR. La documentation est toujours à jour.
- **Négatives** :
  - Chaque évolution touche deux endroits, le contrat et le code, et demande une validation croisée front et back.
  - La validation des réponses consomme du temps à chaque requête : **elle doit être désactivée en production** (`VALIDATE_RESPONSES=false`).
  - Les messages d'erreur du validateur sont techniques : ils sont reformulés en français dans `errors.js`, ce qui ajoute du code à maintenir.
  - Le front ne génère pas encore ses types à partir du contrat (voir [ADR-0006](0006-stack-front-react-typescript-vite.md)).
