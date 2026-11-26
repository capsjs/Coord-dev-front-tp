# language: fr
Fonctionnalité: F08 – Connexion et session dans l'interface (SCRUM-14, SCRUM-20)

  @F08a.4
  Scénario: Avec des identifiants valides, l'utilisateur est connecté et arrive sur la liste
    Soit un participant existant
    Quand le participant se connecte avec le formulaire
    Alors il arrive sur la liste des événements
    Et il est connecté

  @F08a.5
  Scénario: Avec un mauvais mot de passe, un message générique s'affiche
    Soit un participant existant
    Quand le participant se connecte avec le formulaire et un mauvais mot de passe
    Alors le message « Email ou mot de passe incorrect » est affiché
    Et il arrive sur la page de connexion

  @F08a.6
  Scénario: L'utilisateur peut se déconnecter
    Soit un participant existant
    Et le participant est connecté dans le navigateur
    Quand le participant ouvre la liste des événements
    Et le participant se déconnecte
    Alors il n'est plus connecté

  @F08b.1
  Scénario: Une page réservée redirige un visiteur vers la connexion
    Quand le visiteur ouvre sa page de profil
    Alors il arrive sur la page de connexion

  @F08b.3
  Scénario: Quand la session a expiré, l'utilisateur doit se reconnecter
    Soit un participant existant
    Et le participant a une session expirée dans le navigateur
    Quand le participant ouvre sa page de profil
    Alors il arrive sur la page de connexion
