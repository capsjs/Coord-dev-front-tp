# language: fr
Fonctionnalité: Front servi par Docker : accès direct et rafraîchissement des pages (SCRUM-93)
  En tant qu'utilisateur
  Je veux pouvoir rafraîchir une page ou ouvrir un lien partagé
  Afin de ne jamais tomber sur une erreur alors que la page existe

  # Non-régression SCRUM-93 : nginx doit renvoyer index.html pour les routes de React Router (frontend/nginx.conf).
  # La précondition ignore le scénario si le conteneur n'est pas démarré (make up).

  Contexte:
    Soit le front servi par Docker est démarré

  @SCRUM-93
  Scénario: Ouvrir directement l'adresse de la liste des événements
    Quand le visiteur ouvre directement l'adresse "/events" du front Docker
    Alors il arrive sur la liste des événements

  @SCRUM-93
  Scénario: Rafraîchir la page de la liste des événements
    Quand le visiteur ouvre le front Docker et clique sur « Événements » dans le menu
    Et il rafraîchit la page
    Alors il arrive sur la liste des événements
