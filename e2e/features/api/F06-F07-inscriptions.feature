# language: fr
Fonctionnalité: F06 / F07 – S'inscrire et se désinscrire (SCRUM-21, SCRUM-22)
  En tant que participant connecté
  Je veux m'inscrire à un événement, puis pouvoir me désinscrire
  Afin de réserver ma place, ou la libérer si je ne peux plus venir

  Contexte:
    Soit un organisateur connecté
    Et un participant connecté

  @F06.2
  Scénario: Le participant s'inscrit à un événement à venir
    Soit un événement à venir créé par l'organisateur
    Quand le participant s'inscrit à l'événement
    Alors la réponse a le code 201
    Et l'événement figure dans les inscriptions du participant

  @F06.3
  Scénario: Le participant ne peut pas s'inscrire deux fois au même événement
    Soit un événement à venir créé par l'organisateur
    Et le participant est inscrit à l'événement
    Quand le participant s'inscrit à l'événement
    Alors la réponse a le code 409
    Et le message d'erreur est "Vous êtes déjà inscrit à cet événement"

  @F06.4 @F08b.1
  Scénario: Un visiteur non connecté ne peut pas s'inscrire
    Soit un événement à venir créé par l'organisateur
    Quand le visiteur s'inscrit à l'événement
    Alors la réponse a le code 401

  @F06.5
  Scénario: On ne peut pas s'inscrire à un événement passé
    Soit un événement déjà passé créé par l'organisateur
    Quand le participant s'inscrit à l'événement
    Alors la réponse a le code 400
    Et le message d'erreur est "Cet événement est déjà passé"

  @F08b.4
  Scénario: Seuls les participants peuvent s'inscrire
    Soit un événement à venir créé par l'organisateur
    Quand l'organisateur s'inscrit à l'événement
    Alors la réponse a le code 403
    Et le message d'erreur est "Seuls les participants peuvent s'inscrire à un événement"

  @F07.2
  Scénario: Le participant se désinscrit d'un événement
    Soit un événement à venir créé par l'organisateur
    Et le participant est inscrit à l'événement
    Quand le participant se désinscrit de l'événement
    Alors la réponse a le code 204
    Et l'événement ne figure plus dans les inscriptions du participant

  @F07.3
  Scénario: Après désinscription, la place est libérée
    Soit un événement à venir créé par l'organisateur
    Et le participant est inscrit à l'événement
    Et le participant se désinscrit de l'événement
    Quand le participant s'inscrit à l'événement
    Alors la réponse a le code 201
