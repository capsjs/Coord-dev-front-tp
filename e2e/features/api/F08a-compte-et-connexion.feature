# language: fr
Fonctionnalité: F08 – Créer un compte et se connecter (SCRUM-14)
  En tant que visiteur
  Je veux créer un compte et me connecter
  Afin d'accéder aux fonctionnalités de Coord Events

  @F08a.1 @F08a.4
  Scénario: Un visiteur crée un compte et il est connecté
    Quand un visiteur crée un compte avec un nouvel email
    Alors la réponse a le code 201
    Et un jeton de connexion est renvoyé

  @F08a.1
  Scénario: L'inscription exige un mot de passe
    Quand un visiteur crée un compte sans mot de passe
    Alors la réponse a le code 400
    Et le message d'erreur mentionne "password"

  @F08a.2
  Scénario: Un email déjà utilisé est refusé avec un message clair
    Soit un compte participant existant
    Quand un visiteur crée un compte avec l'email du compte existant
    Alors la réponse a le code 409
    Et le message d'erreur est "Un compte existe déjà avec cet email"

  @F08a.3
  Scénario: Le mot de passe est stocké haché, jamais en clair
    Quand un visiteur crée un compte avec un nouvel email
    Alors le mot de passe est stocké haché en base

  @F08a.4
  Scénario: Avec des identifiants valides, l'utilisateur est connecté
    Soit un compte participant existant
    Quand le participant se connecte avec son mot de passe
    Alors la réponse a le code 200
    Et un jeton de connexion est renvoyé

  @F08a.5
  Plan du scénario: Avec des identifiants invalides, le message reste générique
    Soit un compte participant existant
    Quand le participant se connecte avec <cas>
    Alors la réponse a le code 401
    Et le message d'erreur est "Email ou mot de passe incorrect"

    Exemples:
      | cas                     |
      | un mauvais mot de passe |
      | un email inconnu        |
