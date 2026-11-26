# language: fr
Fonctionnalité: Parcours utilisateur complet (SCRUM-24)
  En tant qu'organisateur puis participant
  Je veux enchaîner toutes les étapes du MVP dans l'interface
  Afin de vérifier qu'elles fonctionnent ensemble, et pas seulement chacune séparément
  (aucune donnée n'est préparée par l'API : tout passe par les écrans)

  @parcours @F08a.1 @F08a.4 @F01.5 @F02.4 @F03.3 @F08a.6
  Scénario: Parcours de l'organisateur, de la création du compte à la suppression de l'événement
    Quand un visiteur crée un compte organisateur avec le formulaire
    Alors il arrive sur la liste des événements
    Et il est connecté
    Quand l'organisateur crée un événement avec le formulaire :
      | titre       | Atelier Gherkin             |
      | description | Écrire ses premiers scénarios |
      | date        | dans 20 jours               |
      | lieu        | Montpellier                 |
    Alors il arrive sur la liste des événements
    Et l'événement est affiché dans la liste
    Quand il clique sur « Modifier » de l'événement dans la liste et le renomme en "Atelier Gherkin avancé"
    Alors il arrive sur la liste des événements
    Et l'événement est affiché dans la liste
    Quand il supprime l'événement depuis la liste et confirme
    Alors l'événement n'est plus affiché dans la liste
    Quand l'organisateur se déconnecte
    Alors il n'est plus connecté

  @parcours @F08a.4 @F04.4 @F06.2 @F07.2 @F05.2
  Scénario: Parcours complet, un organisateur publie un événement et un participant s'y inscrit puis se désinscrit
    Quand un visiteur crée un compte organisateur avec le formulaire
    Et l'organisateur crée un événement avec le formulaire :
      | titre       | Conférence parcours        |
      | description | Retours d'expérience en équipe |
      | date        | dans 25 jours              |
      | lieu        | Lyon                       |
    Et l'organisateur se déconnecte
    Et un visiteur crée un compte participant avec le formulaire
    Et le participant ouvre la liste des événements
    Et il clique sur « Voir le détail » de l'événement
    Alors le bouton « S'inscrire » est affiché
    Quand il clique sur « S'inscrire »
    Alors le message « Inscription confirmée. » est affiché
    Quand le participant se déconnecte
    Et le participant se connecte avec le formulaire
    Et le participant ouvre la liste des événements
    Et il clique sur « Voir le détail » de l'événement
    Alors le message « Vous êtes inscrit à cet événement. » est affiché
    Quand il clique sur « Se désinscrire »
    Alors le message « Désinscription confirmée. » est affiché
    Et le bouton « S'inscrire » est affiché
