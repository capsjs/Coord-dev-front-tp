# language: fr
Fonctionnalité: Respect du contrat d'API (SCRUM-65, SCRUM-75)
  En tant que développeur front
  Je veux que l'API applique le contrat openapi.yaml
  Afin que toute requête mal formée soit refusée avec un message compréhensible

  Contexte:
    Soit un organisateur connecté

  @CT.1 @CT.3
  Plan du scénario: Une date sans heure ou sans fuseau horaire est refusée
    Quand l'organisateur crée un événement avec :
      | titre | Meetup  |
      | date  | <date>  |
      | lieu  | Lyon    |
    Alors la réponse a le code 400
    Et le message d'erreur mentionne "date-time"

    Exemples:
      | date             |
      | 2030-01-15       |
      | 2030-01-15T18:00 |
