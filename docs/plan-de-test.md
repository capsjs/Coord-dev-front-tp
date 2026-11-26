# Plan de test : Coord Events

> SCRUM-72 · s'applique à toutes les stories du MVP (sprints 2 à 4).
> Complété par la [Definition of Done](definition-of-done.md) et la [matrice de traçabilité](matrice-tracabilite.md).

## 1. Objectifs

- Prouver que **chaque critère d'acceptation** des user stories est vérifié, et par quel test.
- Détecter une régression **avant le merge**, automatiquement, à chaque pull request.
- Garantir que le Front et le Back respectent le **même contrat d'API** (`backend/openapi.yaml`).

## 2. Périmètre

| Dans le périmètre | Hors périmètre (pour l'instant) |
| ----------------- | ------------------------------- |
| Comptes et connexion (F08a), protection des accès (F08b) | Fonctionnalités *should/could-have* F09 à F15 tant qu'elles ne sont pas planifiées |
| Événements : création, modification, suppression, liste, détail (F01 à F05) | Tests de charge : prévus dans SCRUM-86 (k6) |
| Inscriptions (F06, F07) : Sprint 3 | Tests de sécurité offensifs : prévus dans SCRUM-88 (test d'intrusion croisé) |
| Conformité de l'API au contrat (CT) | Compatibilité navigateurs, accessibilité avancée |

## 3. Pyramide de tests visée

```
                ▲  peu nombreux, lents, proches de l'utilisateur
         ┌─────────────┐
         │ Fonctionnels │  scénarios Gherkin (SCRUM-74) + parcours complet e2e (SCRUM-24)
       ┌─┴─────────────┴─┐
       │   Intégration    │  API réelle + MySQL réel · composants Front + API simulée
     ┌─┴─────────────────┴─┐
     │      Unitaires       │  règles métier pures (Back) · fonctions et hooks (Front)
     └─────────────────────┘
                ▼  nombreux, rapides, isolés
   + en transverse : conformité au contrat d'API (requêtes et réponses), sur tous les niveaux
```

| Niveau | Ce qu'on teste | Back : état actuel | Front : état actuel | Cible |
| ------ | -------------- | ------------------ | ------------------- | ----- |
| **Unitaire** | Fonctions pures sans base ni réseau : validation, droits, erreurs (Back) ; formatage, conversion de dates, hooks (Front) | ✅ 47 tests (`backend/test/unit/`) | ❌ aucun | La majorité des tests ; chaque règle métier a ses cas limites |
| **Intégration** | Back : l'API démarrée avec MySQL, appelée en HTTP. Front : une page ou un composant avec l'API simulée | ✅ 50 tests (`backend/test/*.test.js`) | ❌ aucun | Chaque route : cas nominal + chaque code d'erreur du contrat. Chaque page : chargement, erreur, vide, données |
| **Contrat** | Les requêtes et les réponses respectent `openapi.yaml` | ✅ validateur dans l'API (requêtes toujours, réponses en dev et CI), Spectral, oasdiff | — | Toute route du contrat couverte ; aucun écart toléré |
| **Fonctionnel / e2e** | Les critères d'acceptation écrits en Gherkin et exécutés : au niveau API, et dans le navigateur (Front + Back + base) | ✅ 36 scénarios Gherkin au niveau API (`e2e/features/api`) | ✅ 17 scénarios Gherkin dans l'interface (`e2e/features/front`, Chromium) | Parcours complet enchaîné de bout en bout (SCRUM-24) |

Les critères d'interface (boutons, redirections, messages) sont aujourd'hui **vérifiés à la main** lors de la revue de PR), en attendant les tests Front.

## 4. Outils

| Besoin | Outil | Où | Commande |
| ------ | ----- | -- | -------- |
| Tests unitaires et d'intégration Back | `node:test` (intégré à Node 22) | `backend/test/` | `make test` (API démarrée) · `cd backend && npm run test:unit` |
| Base de test | MySQL 8.4 réel via Docker Compose | `docker-compose.yml` | `make up` |
| Conformité au contrat (exécution) | `express-openapi-validator` | `backend/src/app.js` | actif à chaque requête |
| Lint du contrat | Spectral + règles de l'équipe | `backend/.spectral.yaml` | `make lint` |
| Changements cassants du contrat | oasdiff | CI *Contrat d'API* | automatique sur PR |
| Couverture Back | c8 (V8) | `backend/.c8rc.json` | `make coverage` |
| Traçabilité exigence → test | script maison | `docs/exigences.json` | `cd backend && npm run matrix` |
| Lint | ESLint (Back), oxlint (Front) | — | `make lint` · `cd frontend && npm run lint` |
| Tests Front *(à confirmer par l'équipe Front)* | Vitest + Testing Library + MSW (API simulée) | `frontend/` | à définir |
| Scénarios Gherkin | Playwright + `playwright-bdd`, Gherkin en français ; niveau API et interface (Chromium) | `e2e/` | `make bdd` (API démarrée) |

## 5. Environnements et données de test

- **Local** : `make up` démarre MySQL, l'API et le Front ; `make test` lance les tests contre cette pile.
- **CI** (GitHub Actions, à chaque PR) : même pile Docker Compose, base vierge à chaque exécution (`docker compose down -v` à la fin).
- **Données** :
  - comptes créés au démarrage par le seed : admin (`admin@events.local`) et comptes de démo ;
  - chaque test crée **ses propres données jetables** (comptes `test-…@example.com`, événements) : les tests sont indépendants et peuvent tourner dans n'importe quel ordre ;
  - cas impossibles à créer via l'API (ex. un événement déjà passé) : insertion directe en base avec `withDb()` (`backend/test/helpers.js`) ;
  - `make reset` vide la base locale.
- **Validation des réponses** : `VALIDATE_RESPONSES=true` en dev et en CI, désactivé en production.

## 6. Critères d'entrée et de sortie

**Une PR peut être relue quand** : la CI est verte et la description indique la story et les exigences concernées.

**Une PR peut être mergée quand** (bloquant en CI) :

| Vérification | Workflow | Seuil |
| ------------ | -------- | ----- |
| Lint Back + contrat valide | CI Back · CI Contrat | 0 erreur, 0 avertissement Spectral |
| Tests unitaires et d'intégration Back | CI Back | 100 % de réussite |
| Couverture Back | CI Back | ≥ 95 % des lignes, instructions et fonctions · ≥ 85 % des branches |
| Matrice de traçabilité | CI Back | complète (aucune exigence Back livrée sans test) et à jour |
| Contrat sans rupture | CI Contrat | aucun changement cassant, sauf label `rupture-de-contrat` validé |
| Lint et build Front | CI Front | 0 erreur |

**Un sprint est terminé côté tests quand** : toutes les exigences des stories du sprint sont « Testé » dans la matrice (ou vérifiées à la main), et aucune anomalie bloquante n'est ouverte.

## 7. Traçabilité

Chaque critère d'acceptation est une exigence de [`exigences.json`](exigences.json) (ex. `F01.3`). Un test qui la vérifie la cite dans son titre : `it('… [F01.3]')`. La [matrice](matrice-tracabilite.md) est régénérée par `npm run matrix` et contrôlée en CI. Quand une exigence du Sprint 3 est livrée, on passe son statut à `livre` avec la version de l'API.

## 8. Gestion des anomalies

1. Toute anomalie trouvée (en revue, en test manuel, en démo) devient un ticket Jira de type **Bug**, rattaché à la story concernée, avec : étapes pour reproduire, résultat attendu, résultat obtenu, gravité.
2. **Gravité** : *bloquante* (empêche un parcours du MVP), *majeure* (contournable), *mineure* (cosmétique). Les bloquantes sont traitées dans le sprint en cours (SCRUM-25).
3. **Correction = test de non-régression** : on écrit d'abord un test qui reproduit le bug (il échoue), puis on corrige (il passe). Le test cite l'exigence concernée.

## 9. Responsabilités

| Rôle | Responsabilités |
| ---- | --------------- |
| **Dev Back** | Tests unitaires et d'intégration de l'API ; conformité au contrat ; maintien de la couverture et des seuils ; identifiants d'exigences dans les tests et mise à jour de la matrice ; correction des anomalies Back |
| **Dev Front** | Tests de composants et de pages (avec API simulée) ; vérification manuelle des critères d'interface en attendant ; signalement des écarts au contrat ; correction des anomalies Front |
| **Dev Front + Back ensemble** | Évolution du contrat (validé par les deux avant de coder) ; scénarios fonctionnels et e2e (SCRUM-74, SCRUM-24) ; **revue croisée** : chaque PR est relue par une autre personne que son auteur |
| **Product Owner** | Rédige et maintient les critères d'acceptation (source des exigences) ; valide en démo que chaque story répond au besoin ; priorise les anomalies |
| **Scrum Master** | Fait respecter la Definition of Done ; vérifie en fin de sprint que la matrice et la CI sont au vert ; organise la rétrospective sur la qualité |

## 10. Planning

| Sprint | Tests prévus |
| ------ | ------------ |
| **Sprint 2** (événements) | ✅ Unitaires et intégration Back, contrat, couverture, matrice · Front : premiers tests de composants (liste, fiche, formulaire) |
| **Sprint 3** (inscriptions) | Tests Back des inscriptions (F06, F07, F03.4 : suppression en cascade) avec identifiants dans la matrice · tests Front des boutons S'inscrire / Se désinscrire · premiers scénarios Gherkin (SCRUM-74) |
| **Sprint 4** (finalisation) | Parcours complet e2e (SCRUM-24), tests finaux du MVP (SCRUM-26), test de charge (SCRUM-86), correction des anomalies (SCRUM-25) |

## 11. Risques et limites

| Risque | Conséquence | Mesure |
| ------ | ----------- | ------ |
| Aucun test Front automatisé | Une régression d'interface passe inaperçue | Vérification manuelle en revue ; tests Front au Sprint 2–3 |
| Pas encore de test de bout en bout | Front et Back peuvent être corrects séparément mais mal branchés | Validation des requêtes par le contrat ; e2e au Sprint 4 |
| Cas concurrents non testés (ex. deux inscriptions simultanées avec le même email) | Comportement non vérifié automatiquement | Contraintes d'unicité en base ; à couvrir si un bug apparaît |
| `main` non protégée tant que les réglages GitHub ne sont pas faits | Une PR rouge peut être mergée | Protection de branche (SCRUM-80) ; d'ici là, règle d'équipe : jamais de merge avec une CI rouge |
