# ADR-0001 : Consigner les décisions d'architecture dans des ADR

- **Statut** : Accepté
- **Date** : 2026-11-23
- **Tickets** : SCRUM-81

## Contexte

Le projet est développé à plusieurs, en parallèle (back, front, CI), au fil de sprints courts. Les choix structurants (stack, base de données, authentification, contrat d'API…) ont été faits rapidement et n'étaient expliqués que dans le code, les messages de commit ou à l'oral. Un nouvel arrivant ne peut pas savoir pourquoi le projet est construit ainsi, ni ce qui a été écarté.

## Décision

Nous consignons chaque décision d'architecture majeure dans un ADR, un fichier Markdown court rangé dans `docs/adr/` et numéroté (`NNNN-titre.md`). Chaque ADR suit le même format : **contexte**, **décision**, **conséquences**, à partir du modèle [`0000-modele.md`](0000-modele.md).

Un ADR accepté n'est pas réécrit. Si la décision change, un nouvel ADR la remplace.

Les ADR 0002 à 0009 documentent a posteriori les décisions déjà prises au début du projet.

## Conséquences

- **Positives** : les raisons des choix restent dans le dépôt, versionnées et relues en PR avec le code. Elles sont faciles à retrouver pour l'équipe comme pour l'évaluation.
- **Négatives** : un peu de rédaction en plus à chaque décision importante. Un ADR oublié laisse la documentation incomplète, d'où l'intérêt de le demander en revue de PR quand un choix structurant est fait.
