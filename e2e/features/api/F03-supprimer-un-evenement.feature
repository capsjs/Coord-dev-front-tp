# language: fr
Fonctionnalité: F03 – Supprimer un événement (SCRUM-17)
  En tant qu'organisateur
  Je veux supprimer un de mes événements
  Afin de retirer un événement annulé ou créé par erreur

  Contexte:
    Soit un organisateur connecté
    Et un événement à venir créé par l'organisateur

  @F03.2 @F08b.2
  Scénario: Un autre organisateur ne peut pas supprimer l'événement
    Soit un autre organisateur connecté
    Quand l'autre organisateur supprime l'événement
    Alors la réponse a le code 403
    Et l'événement apparaît dans la liste des événements

  @F03.3
  Scénario: L'événement supprimé disparaît de la liste et sa fiche est introuvable
    Quand l'organisateur supprime l'événement
    Alors la réponse a le code 204
    Et l'événement n'apparaît pas dans la liste des événements
    Et la fiche de l'événement est introuvable

  @F03.4
  Scénario: Les inscriptions liées à l'événement sont supprimées aussi
    Soit un participant connecté
    Et le participant est inscrit à l'événement
    Quand l'organisateur supprime l'événement
    Alors la réponse a le code 204
    Et l'événement ne figure plus dans les inscriptions du participant
