# language: fr
Fonctionnalité: F01 à F05 – Gérer et consulter les événements dans l'interface (SCRUM-15 à SCRUM-19)

  Contexte:
    Soit un organisateur existant

  @F01.1 @F01.5
  Scénario: L'organisateur crée un événement avec le formulaire et le retrouve dans la liste
    Soit l'organisateur est connecté dans le navigateur
    Quand l'organisateur crée un événement avec le formulaire :
      | titre       | Meetup JavaScript          |
      | description | Soirée de talks autour de React |
      | date        | dans 15 jours              |
      | lieu        | Lyon                       |
    Alors il arrive sur la liste des événements
    Et l'événement est affiché dans la liste

  @F02.1
  Scénario: Le formulaire de modification est pré-rempli
    Soit un événement à venir créé par l'organisateur
    Et l'organisateur est connecté dans le navigateur
    Quand l'organisateur ouvre le formulaire de modification de l'événement
    Alors le formulaire est pré-rempli avec les informations de l'événement

  @F02.3
  Scénario: L'organisateur de l'événement voit les actions Modifier et Supprimer
    Soit un événement à venir créé par l'organisateur
    Et l'organisateur est connecté dans le navigateur
    Quand l'organisateur ouvre la fiche de l'événement
    Alors les actions « Modifier » et « Supprimer » sont affichées

  @F02.3
  Scénario: Un autre organisateur ne voit pas les actions Modifier et Supprimer
    Soit un événement à venir créé par l'organisateur
    Et un autre organisateur existant
    Et l'autre organisateur est connecté dans le navigateur
    Quand l'autre organisateur ouvre la fiche de l'événement
    Alors les actions « Modifier » et « Supprimer » ne sont pas affichées

  @F03.1
  Scénario: Une confirmation est demandée avant la suppression ; si on refuse, rien n'est supprimé
    Soit un événement à venir créé par l'organisateur
    Et l'organisateur est connecté dans le navigateur
    Quand l'organisateur ouvre la fiche de l'événement
    Et il clique sur « Supprimer » et refuse la confirmation
    Alors une confirmation « Es-tu sûr de vouloir supprimer cet événement ? » a été demandée
    Et il arrive sur la fiche de l'événement

  @F03.1 @F03.3
  Scénario: Après confirmation, l'événement est supprimé et disparaît de la liste
    Soit un événement à venir créé par l'organisateur
    Et l'organisateur est connecté dans le navigateur
    Quand l'organisateur ouvre la fiche de l'événement
    Et il clique sur « Supprimer » et accepte la confirmation
    Alors il arrive sur la liste des événements
    Et l'événement n'est plus affiché dans la liste

  @F04.2 @F04.4
  Scénario: Un clic sur un événement de la liste ouvre sa fiche
    Soit un événement à venir créé par l'organisateur
    Quand le visiteur ouvre la liste des événements
    Et il clique sur « Voir le détail » de l'événement
    Alors il arrive sur la fiche de l'événement

  @F05.1
  Scénario: La fiche affiche le titre, le lieu et l'organisateur
    Soit un événement à venir créé par l'organisateur
    Quand le visiteur ouvre la fiche de l'événement
    Alors la fiche affiche le titre, le lieu et le nom de l'organisateur

  @F05.3
  Scénario: Un événement inexistant affiche un message « introuvable »
    Quand le visiteur ouvre la fiche d'un événement inexistant
    Alors le message « Événement introuvable » est affiché
