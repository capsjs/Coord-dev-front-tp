# ADR-0009 : Tests d'intégration sur la vraie stack et CI GitHub Actions

- **Statut** : Accepté
- **Date** : 2026-11-20
- **Tickets** : SCRUM-73 (couverture), SCRUM-76 (CI back), SCRUM-77 (CI front)

## Contexte

L'API repose surtout sur des requêtes SQL et des règles d'accès : la majorité des bugs possibles se situent entre le code et la base (contraintes, requêtes, formats de date). Plusieurs personnes fusionnent des PR sur `main` chaque jour : il faut détecter les régressions avant la fusion, pas après.

## Décision

**Tests du back**, avec le lanceur de tests intégré à Node (`node:test`), sans framework de test :
- **tests d'intégration** (`test/*.test.js`) : ils appellent la vraie API, démarrée avec Docker Compose, branchée sur une vraie base MySQL. **Aucune simulation (mock) de la base**. Ils couvrent l'authentification, les événements et la conformité au contrat ;
- **tests unitaires** (`test/unit/`) : réservés aux fonctions pures, à savoir les permissions, la validation et les erreurs. Ils sont rapides et ne demandent ni Docker ni base.

**Couverture** : mesurée avec c8 pendant que l'API tourne dans son conteneur (`make coverage`). Les seuils sont fixés dans `.c8rc.json` : **95 %** des lignes, instructions et fonctions, **85 %** des branches.

**CI GitHub Actions**, avec un workflow par partie, déclenché seulement si les fichiers concernés changent :

| Workflow | Vérifications |
| -------- | ------------- |
| *CI Back* | Validité du compose, ESLint, tests unitaires, puis build Docker, tests d'intégration et seuils de couverture (rapport publié en artefact) |
| *CI Front* | oxlint, build TypeScript et Vite, build de l'image Docker |
| *CI Contrat d'API* | Spectral et oasdiff (voir [ADR-0008](0008-contrat-api-openapi.md)) |

**Hook pre-commit** facultatif (`make hooks`) : il vérifie le compose, le lint et le contrat sur les fichiers du commit.

## Conséquences

- **Positives** : les tests reproduisent les conditions réelles et attrapent les erreurs SQL et de contrat. Le seuil de couverture empêche d'ajouter du code non testé. Chaque PR affiche son état.
- **Négatives** :
  - Les tests d'intégration demandent Docker et une API démarrée. Ils sont plus lents que des tests unitaires.
  - Ils créent des comptes jetables qui s'accumulent dans la base locale, jusqu'au prochain `make reset`.
  - **Le front n'a pas de tests automatisés** : sa CI vérifie le lint et le build, pas le comportement. Ce point est à traiter, par exemple avec Vitest et Testing Library.
  - La CI ne bloque la fusion que si `main` est protégée par des règles GitHub exigeant ces vérifications.
