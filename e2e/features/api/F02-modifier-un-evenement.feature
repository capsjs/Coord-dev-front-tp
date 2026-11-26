# language: fr
Fonctionnalité: F02 – Modifier un événement (SCRUM-16)
  En tant qu'organisateur
  Je veux modifier un de mes événements
  Afin de corriger ou mettre à jour ses informations

  Contexte:
    Soit un organisateur connecté
    Et un événement à venir créé par l'organisateur

  @F02.1
  Scénario: La fiche fournit les informations actuelles pour pré-remplir le formulaire
    Quand l'organisateur consulte la fiche de l'événement
    Alors la réponse a le code 200
    Et la fiche affiche le titre, la description, la date, le lieu et le nom de l'organisateur

  @F02.2
  Scénario: Les règles de validation de la création s'appliquent aussi à la modification
    Quand l'organisateur modifie l'événement avec :
      | titre | Meetup |
      | date  | hier   |
      | lieu  | Lyon   |
    Alors la réponse a le code 400
    Et le message d'erreur mentionne "doit être dans le futur"

  @F02.3 @F08b.2
  Scénario: Un autre organisateur ne peut pas modifier l'événement
    Soit un autre organisateur connecté
    Quand l'autre organisateur modifie l'événement avec :
      | titre | Piratage      |
      | date  | dans 30 jours |
      | lieu  | Lyon          |
    Alors la réponse a le code 403
    Et le message d'erreur est "Seul l'organisateur de l'événement peut le modifier ou le supprimer"
    Et l'événement n'est pas modifié

  @F02.4
  Scénario: Les modifications sont visibles immédiatement dans la liste et sur la fiche
    Quand l'organisateur modifie l'événement avec :
      | titre | Meetup modifié |
      | date  | dans 20 jours  |
      | lieu  | Grenoble       |
    Alors la réponse a le code 200
    Et la fiche de l'événement affiche le titre "Meetup modifié"
    Et la liste des événements affiche le titre "Meetup modifié"
