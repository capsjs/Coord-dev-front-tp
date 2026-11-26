# language: fr
Fonctionnalité: F05 à F07 – S'inscrire et se désinscrire depuis la fiche (SCRUM-19, SCRUM-21, SCRUM-22)

  Contexte:
    Soit un organisateur existant
    Et un événement à venir créé par l'organisateur

  @F05.2 @F06.1 @F06.2
  Scénario: Un participant non inscrit s'inscrit depuis la fiche
    Soit un participant existant
    Et le participant est connecté dans le navigateur
    Quand le participant ouvre la fiche de l'événement
    Alors le bouton « S'inscrire » est affiché
    Quand il clique sur « S'inscrire »
    Alors le message « Inscription confirmée. » est affiché
    Et le bouton « Se désinscrire » est affiché

  @F05.2 @F07.1 @F07.2
  Scénario: Un participant inscrit se désinscrit depuis la fiche
    Soit un participant existant
    Et le participant est inscrit à l'événement
    Et le participant est connecté dans le navigateur
    Quand le participant ouvre la fiche de l'événement
    Alors le message « Vous êtes inscrit à cet événement. » est affiché
    Quand il clique sur « Se désinscrire »
    Alors le message « Désinscription confirmée. » est affiché
    Et le bouton « S'inscrire » est affiché

  @F06.4 @F08b.1
  Scénario: Un visiteur non connecté qui clique sur « S'inscrire » est redirigé vers la connexion
    Quand le visiteur ouvre la fiche de l'événement
    Et il clique sur « S'inscrire »
    Alors il arrive sur la page de connexion
