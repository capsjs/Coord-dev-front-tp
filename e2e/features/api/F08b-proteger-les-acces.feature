# language: fr
Fonctionnalité: F08 – Protéger les accès selon le rôle (SCRUM-20)
  En tant qu'utilisateur connecté
  Je veux que les actions sensibles soient réservées aux personnes autorisées
  Afin que personne ne puisse modifier ou supprimer les événements des autres

  @F08b.1
  Scénario: Une action réservée sans être connecté est refusée
    Quand le visiteur crée un événement avec :
      | titre | Meetup        |
      | date  | dans 30 jours |
      | lieu  | Lyon          |
    Alors la réponse a le code 401
    Et le message d'erreur est "Authentification requise"

  @F08b.3
  Scénario: Une session expirée oblige à se reconnecter
    Soit un compte participant existant
    Quand le participant consulte son profil avec un jeton expiré
    Alors la réponse a le code 401
    Et le message d'erreur est "Session expirée : reconnectez-vous"

  @F08b.4
  Scénario: Un jeton falsifié est refusé
    Soit un compte participant existant
    Quand le participant consulte son profil avec un jeton falsifié
    Alors la réponse a le code 401
    Et le message d'erreur est "Jeton invalide"

  @F08b.4
  Scénario: Un participant ne peut pas créer d'événement
    Soit un participant connecté
    Quand le participant crée un événement avec :
      | titre | Meetup        |
      | date  | dans 30 jours |
      | lieu  | Lyon          |
    Alors la réponse a le code 403

  @F08b.2
  Scénario: Un administrateur peut modifier l'événement d'un autre
    Soit un organisateur connecté
    Et un événement à venir créé par l'organisateur
    Et un administrateur connecté
    Quand l'administrateur modifie l'événement avec :
      | titre | Corrigé par l'admin |
      | date  | dans 30 jours       |
      | lieu  | Lyon                |
    Alors la réponse a le code 200
    Et la fiche de l'événement affiche le titre "Corrigé par l'admin"
