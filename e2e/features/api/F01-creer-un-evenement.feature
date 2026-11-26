# language: fr
Fonctionnalité: F01 – Créer un événement (SCRUM-15)
  En tant qu'organisateur connecté
  Je veux créer un événement
  Afin de le proposer aux participants

  Contexte:
    Soit un organisateur connecté

  @F01.1 @F01.4
  Scénario: L'organisateur crée un événement qui lui est associé
    Quand l'organisateur crée un événement avec :
      | titre       | Meetup JavaScript                  |
      | description | Soirée de talks autour de React 19 |
      | date        | dans 30 jours                      |
      | lieu        | Lyon                               |
    Alors la réponse a le code 201
    Et l'événement appartient à l'organisateur

  @F01.2
  Plan du scénario: Le titre, la date et le lieu sont obligatoires
    Quand l'organisateur crée un événement avec :
      | <présent 1> | <valeur 1> |
      | <présent 2> | <valeur 2> |
    Alors la réponse a le code 400
    Et le message d'erreur mentionne "<champ manquant>"

    Exemples:
      | présent 1 | valeur 1      | présent 2 | valeur 2      | champ manquant |
      | date      | dans 30 jours | lieu      | Lyon          | title          |
      | titre     | Meetup        | lieu      | Lyon          | date           |
      | titre     | Meetup        | date      | dans 30 jours | location       |

  @F01.3
  Scénario: Une date passée est refusée
    Quand l'organisateur crée un événement avec :
      | titre | Meetup |
      | date  | hier   |
      | lieu  | Lyon   |
    Alors la réponse a le code 400
    Et le message d'erreur mentionne "doit être dans le futur"

  @F01.5
  Scénario: L'événement créé apparaît dans la liste
    Quand l'organisateur crée un événement avec :
      | titre | Meetup        |
      | date  | dans 10 jours |
      | lieu  | Lyon          |
    Alors la réponse a le code 201
    Et l'événement apparaît dans la liste des événements
