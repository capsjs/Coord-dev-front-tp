# Definition of Done : Coord Events

> SCRUM-72 · commune à **toutes les stories** et à leurs sous-tâches Front et Back.
> Une story n'est « Terminée » dans Jira que si **toutes** les cases ci-dessous sont cochées.
> Détail de la stratégie de test : [plan de test](plan-de-test.md).

## Contrat d'API

- [ ] Si la story ajoute ou modifie une route, un champ ou une erreur : `backend/openapi.yaml` est mis à jour **avant** le code, et validé par le Front **et** le Back.
- [ ] `info.version` du contrat est incrémentée selon SemVer (patch / mineure / majeure).
- [ ] Aucun changement cassant, ou PR avec le label `rupture-de-contrat` acceptée par les deux parties.

## Code

- [ ] Le code est sur une branche dédiée, nommée avec la clé Jira (`SCRUM-xx-…`), et les commits citent la clé.
- [ ] Le lint passe (`make lint` pour le Back et le contrat, `npm run lint` pour le Front), sans désactiver de règle.
- [ ] Aucun secret, mot de passe ou jeton dans le code ou les commits.

## Tests

- [ ] Chaque critère d'acceptation de la story est vérifié :
  - côté **Back**, par au moins un test automatisé qui cite l'exigence dans son titre (`it('… [F01.3]')`) ;
  - côté **Front**, par un test automatisé ou, à défaut, par une vérification manuelle décrite dans la PR.
- [ ] Les cas d'erreur du contrat sont testés (400, 401, 403, 404, 409… selon la route).
- [ ] La matrice est à jour : `cd backend && npm run matrix`, exigences de la story passées à `"livre"` avec leur version.
- [ ] La couverture Back reste au-dessus des seuils (`make coverage`).
- [ ] Un bug corrigé est accompagné d'un test qui le reproduisait.

## Revue et intégration

- [ ] La PR décrit ce qui change, la story et les exigences concernées, et comment tester.
- [ ] La PR est relue et approuvée par **une autre personne que son auteur** ; une modification du contrat est relue par le Front **et** le Back.
- [ ] La **CI est verte** : CI Back, CI Front et CI Contrat d'API selon les fichiers modifiés. Jamais de merge avec une CI rouge.
- [ ] La branche est à jour avec `main` avant le merge, puis supprimée après.

## Fonctionnel

- [ ] La fonctionnalité a été essayée sur la pile complète (`make up`) : Front branché sur la vraie API.
- [ ] Les critères d'acceptation ont été vérifiés un par un, et le Product Owner les a acceptés (en démo ou sur la PR).
- [ ] Les messages d'erreur affichés à l'utilisateur sont compréhensibles (le Front affiche le message `error` de l'API).

## Documentation et suivi

- [ ] Le README est à jour si la story change une commande, une route ou une configuration.
- [ ] Le ticket Jira est à jour : PR liée, choix d'implémentation notables en commentaire, statut « Terminé » après le merge.
- [ ] Les points reportés sont notés dans le ticket concerné (ex. « suppression en cascade reportée sur SCRUM-51 »).
