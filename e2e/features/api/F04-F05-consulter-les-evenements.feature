# language: fr
Fonctionnalité: F04 / F05 – Consulter les événements (SCRUM-18, SCRUM-19)
  En tant que participant
  Je veux voir la liste des événements à venir et la fiche de chacun
  Afin de repérer ceux qui m'intéressent et décider si je m'y inscris

  Contexte:
    Soit un organisateur connecté

  @F04.1
  Scénario: La liste affiche les événements à venir, triés par date croissante
    Soit deux événements à venir créés par l'organisateur, dans 60 et 2 jours
    Quand le visiteur consulte la liste des événements
    Alors la réponse a le code 200
    Et la liste est triée par date croissante, sans événement passé

  @F04.1
  Scénario: Un événement passé n'apparaît pas dans la liste
    Soit un événement déjà passé créé par l'organisateur
    Quand le visiteur consulte la liste des événements
    Alors la liste ne contient pas l'événement passé

  @F04.2
  Scénario: Chaque événement de la liste montre son titre, sa date et son lieu
    Soit un événement à venir créé par l'organisateur
    Quand le visiteur consulte la liste des événements
    Alors chaque événement de la liste a un titre, une date et un lieu

  @F05.1
  Scénario: La fiche affiche toutes les informations, organisateur compris
    Soit un événement à venir créé par l'organisateur
    Quand le visiteur consulte la fiche de l'événement
    Alors la réponse a le code 200
    Et la fiche affiche le titre, la description, la date, le lieu et le nom de l'organisateur

  @F05.2
  Scénario: Un participant connecté sait s'il est inscrit à l'événement
    Soit un événement à venir créé par l'organisateur
    Et un participant connecté
    Et le participant est inscrit à l'événement
    Quand le participant consulte ses inscriptions
    Alors la réponse a le code 200
    Et l'événement figure dans les inscriptions du participant

  @F05.3
  Scénario: Un événement inexistant est introuvable
    Quand le visiteur consulte la fiche d'un événement inexistant
    Alors la réponse a le code 404
    Et le message d'erreur est "Événement introuvable"
