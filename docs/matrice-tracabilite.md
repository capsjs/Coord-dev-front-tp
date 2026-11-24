# Matrice de traçabilité exigence → test → version

> Fichier généré par `cd backend && npm run matrix` à partir de [`exigences.json`](exigences.json)
> et des titres des tests (`[F01.3]`…). Ne pas modifier à la main : la CI vérifie qu'il est à jour.

Version courante du contrat d'API : **1.2.0** · 41 exigences · 34 tests reliés.

| Statut | Nombre |
|---|---|
| Testé (back) | 15 |
| Testé (back) · front à vérifier | 12 |
| Front, vérification manuelle | 4 |
| Sprint 3 | 10 |

La colonne **Version** indique la version de l'API (`openapi.yaml`) qui a livré l'exigence côté back.
Les critères d'interface (boutons, redirections, messages) ne sont pas encore couverts par des tests automatisés front.

## F08a : Créer un compte et se connecter (SCRUM-14)

| Exigence | Critère | Couche | Tests | Version | Statut |
|---|---|---|---|---|---|
| **F08a.1** | L'inscription demande un e-mail et un mot de passe (validés). | back+front | `auth.test.js` › Inscription › crée un participant par défaut et renvoie un jeton<br>`auth.test.js` › Inscription › valide les champs | 1.0.0 | Testé (back) · front à vérifier |
| **F08a.2** | Un e-mail déjà utilisé est refusé avec un message clair. | back | `auth.test.js` › Inscription › refuse un email déjà utilisé, sans tenir compte de la casse | 1.0.0 | Testé (back) |
| **F08a.3** | Le mot de passe est stocké haché, jamais en clair. | back | `auth.test.js` › Inscription › stocke le mot de passe haché (bcrypt), jamais en clair | 1.0.0 | Testé (back) |
| **F08a.4** | Avec des identifiants valides, l'utilisateur est connecté (puis redirigé vers la liste). | back+front | `auth.test.js` › Inscription › crée un participant par défaut et renvoie un jeton<br>`auth.test.js` › Connexion › connecte l'admin créé au démarrage | 1.0.0 | Testé (back) · front à vérifier |
| **F08a.5** | Avec des identifiants invalides, un message d'erreur générique est renvoyé. | back | `auth.test.js` › Connexion › refuse un mauvais mot de passe ou un email inconnu avec le même message | 1.0.0 | Testé (back) |
| **F08a.6** | L'utilisateur peut se déconnecter. | front | — | — | Front, vérification manuelle |

## F01 : Créer un événement (SCRUM-15)

| Exigence | Critère | Couche | Tests | Version | Statut |
|---|---|---|---|---|---|
| **F01.1** | Un événement contient titre, description, date et heure, lieu. | back+front | `contract.test.js` › Conformité des requêtes au contrat › refuse une date sans heure ou sans fuseau horaire (format date-time)<br>`events.test.js` › Création d'un événement (POST /api/events) › crée l'événement et en fait l'organisateur l'utilisateur connecté | 1.0.0 | Testé (back) · front à vérifier |
| **F01.2** | Titre, date et lieu sont obligatoires ; un message indique le champ manquant. | back+front | `events.test.js` › Création d'un événement (POST /api/events) › valide les champs (400) | 1.0.0 | Testé (back) · front à vérifier |
| **F01.3** | Une date passée est refusée. | back | `events.test.js` › Création d'un événement (POST /api/events) › valide les champs (400)<br>`unit/validation.test.js` › requireFutureDate › refuse une date passée ou égale à maintenant | 1.0.0 | Testé (back) |
| **F01.4** | L'événement créé est associé à l'organisateur connecté. | back | `events.test.js` › Création d'un événement (POST /api/events) › crée l'événement et en fait l'organisateur l'utilisateur connecté | 1.0.0 | Testé (back) |
| **F01.5** | Après création, une confirmation s'affiche et l'événement apparaît dans la liste. | back+front | `events.test.js` › Liste des événements à venir (GET /api/events) › est publique et renvoie les événements à venir triés par date croissante | 1.1.0 | Testé (back) · front à vérifier |

## F02 : Modifier un événement (SCRUM-16)

| Exigence | Critère | Couche | Tests | Version | Statut |
|---|---|---|---|---|---|
| **F02.1** | Le formulaire de modification est pré-rempli avec les informations actuelles. | back+front | `events.test.js` › Détail d'un événement (GET /api/events/:id) › est public et renvoie toutes les informations, organisateur compris | 1.1.0 | Testé (back) · front à vérifier |
| **F02.2** | Les mêmes règles de validation qu'à la création s'appliquent. | back | `events.test.js` › Modification d'un événement (PUT /api/events/:id) › applique les mêmes règles de validation qu'à la création (400) | 1.1.0 | Testé (back) |
| **F02.3** | Seul l'organisateur de l'événement (ou un admin) peut enregistrer une modification. | back+front | `events.test.js` › Modification d'un événement (PUT /api/events/:id) › refuse un autre organisateur ou un participant (403), sans rien modifier | 1.1.0 | Testé (back) · front à vérifier |
| **F02.4** | Les modifications sont visibles immédiatement dans la liste et sur la fiche. | back | `events.test.js` › Modification d'un événement (PUT /api/events/:id) › permet à l'organisateur de modifier tous les champs | 1.1.0 | Testé (back) |

## F03 : Supprimer un événement (SCRUM-17)

| Exigence | Critère | Couche | Tests | Version | Statut |
|---|---|---|---|---|---|
| **F03.1** | Une confirmation est demandée avant la suppression. | front | — | — | Front, vérification manuelle |
| **F03.2** | Seul l'organisateur de l'événement (ou un admin) peut le supprimer. | back | `events.test.js` › Suppression d'un événement (DELETE /api/events/:id) › refuse un autre organisateur (403) et conserve l'événement | 1.1.0 | Testé (back) |
| **F03.3** | L'événement supprimé n'apparaît plus dans la liste ; sa fiche renvoie « introuvable ». | back | `events.test.js` › Suppression d'un événement (DELETE /api/events/:id) › permet à l'organisateur de supprimer son événement | 1.1.0 | Testé (back) |
| **F03.4** | Les inscriptions liées à l'événement sont supprimées aussi. | back | — | — | Sprint 3 |

## F04 : Consulter la liste des événements (SCRUM-18)

| Exigence | Critère | Couche | Tests | Version | Statut |
|---|---|---|---|---|---|
| **F04.1** | La liste affiche les événements à venir, triés par date croissante. | back | `events.test.js` › Liste des événements à venir (GET /api/events) › est publique et renvoie les événements à venir triés par date croissante<br>`events.test.js` › Liste des événements à venir (GET /api/events) › n'inclut pas les événements passés | 1.1.0 | Testé (back) |
| **F04.2** | Chaque événement montre au minimum son titre, sa date et son lieu. | back+front | `events.test.js` › Liste des événements à venir (GET /api/events) › est publique et renvoie les événements à venir triés par date croissante | 1.1.0 | Testé (back) · front à vérifier |
| **F04.3** | Si aucun événement n'est prévu, un message l'indique. | front | — | — | Front, vérification manuelle |
| **F04.4** | Un clic sur un événement ouvre sa fiche détaillée. | front | — | — | Front, vérification manuelle |

## F05 : Consulter les détails d'un événement (SCRUM-19)

| Exigence | Critère | Couche | Tests | Version | Statut |
|---|---|---|---|---|---|
| **F05.1** | La fiche affiche titre, description, date et heure, lieu et organisateur. | back+front | `events.test.js` › Détail d'un événement (GET /api/events/:id) › est public et renvoie toutes les informations, organisateur compris | 1.1.0 | Testé (back) · front à vérifier |
| **F05.2** | Un utilisateur connecté voit « S'inscrire » ou « Se désinscrire » selon qu'il est inscrit. | back+front | — | — | Sprint 3 |
| **F05.3** | Un événement inexistant affiche une page « introuvable ». | back+front | `events.test.js` › Détail d'un événement (GET /api/events/:id) › renvoie 404 si l'événement n'existe pas | 1.1.0 | Testé (back) · front à vérifier |

## F08b : Protéger les accès selon le rôle (SCRUM-20)

| Exigence | Critère | Couche | Tests | Version | Statut |
|---|---|---|---|---|---|
| **F08b.1** | Une action réservée sans être connecté est refusée (401) et le front redirige vers la connexion. | back+front | `auth.test.js` › Connexion › exige un jeton valide sur /me<br>`events.test.js` › Création d'un événement (POST /api/events) › exige un jeton (401) et le rôle organizer ou admin (403)<br>`events.test.js` › Modification d'un événement (PUT /api/events/:id) › exige un jeton (401)<br>`events.test.js` › Suppression d'un événement (DELETE /api/events/:id) › exige un jeton (401) | 1.1.0 | Testé (back) · front à vérifier |
| **F08b.2** | Seul l'organisateur d'un événement peut le modifier ou le supprimer ; sinon 403. | back | `events.test.js` › Modification d'un événement (PUT /api/events/:id) › refuse un autre organisateur ou un participant (403), sans rien modifier<br>`events.test.js` › Suppression d'un événement (DELETE /api/events/:id) › refuse un autre organisateur (403) et conserve l'événement<br>`unit/permissions.test.js` › canManageEvent (F08) › refuse un autre organisateur<br>`unit/permissions.test.js` › assertCanManageEvent › lève une erreur 403 sinon | 1.1.0 | Testé (back) |
| **F08b.3** | Quand la session expire, l'utilisateur doit se reconnecter. | back+front | `auth.test.js` › Connexion › distingue une session expirée (pour que le front redirige vers la connexion) | 1.1.0 | Testé (back) · front à vérifier |
| **F08b.4** | Les routes de l'API sont protégées de la même façon que l'interface. | back | `auth.test.js` › Connexion › refuse un jeton falsifié<br>`auth.test.js` › Administration des comptes › est interdite aux non-admins<br>`events.test.js` › Création d'un événement (POST /api/events) › exige un jeton (401) et le rôle organizer ou admin (403) | 1.1.0 | Testé (back) |

## F06 : S'inscrire à un événement (SCRUM-21)

| Exigence | Critère | Couche | Tests | Version | Statut |
|---|---|---|---|---|---|
| **F06.1** | Le bouton « S'inscrire » est visible si je suis connecté et pas encore inscrit. | front | — | — | Sprint 3 |
| **F06.2** | Après inscription, une confirmation s'affiche et le bouton devient « Se désinscrire ». | back+front | — | — | Sprint 3 |
| **F06.3** | Je ne peux pas m'inscrire deux fois au même événement. | back | — | — | Sprint 3 |
| **F06.4** | Un visiteur non connecté qui clique sur « S'inscrire » est redirigé vers la connexion. | back+front | — | — | Sprint 3 |
| **F06.5** | On ne peut pas s'inscrire à un événement passé. | back | — | — | Sprint 3 |

## F07 : Se désinscrire d'un événement (SCRUM-22)

| Exigence | Critère | Couche | Tests | Version | Statut |
|---|---|---|---|---|---|
| **F07.1** | Le bouton « Se désinscrire » est visible sur la fiche si je suis inscrit. | front | — | — | Sprint 3 |
| **F07.2** | Après désinscription, une confirmation s'affiche et le bouton redevient « S'inscrire ». | back+front | — | — | Sprint 3 |
| **F07.3** | Ma place est libérée pour les autres participants. | back | — | — | Sprint 3 |

## CT : Respect du contrat d'API (SCRUM-65 / SCRUM-75)

| Exigence | Critère | Couche | Tests | Version | Statut |
|---|---|---|---|---|---|
| **CT.1** | Toute requête non conforme à openapi.yaml est refusée (400) avec un message clair. | back | `contract.test.js` › Conformité des requêtes au contrat › refuse une date sans heure ou sans fuseau horaire (format date-time)<br>`contract.test.js` › Conformité des requêtes au contrat › refuse un type incorrect sans conversion implicite<br>`contract.test.js` › Conformité des requêtes au contrat › refuse un identifiant de chemin non entier<br>`unit/errors.test.js` › errorHandler › traduit une requête non conforme au contrat (erreur de format) | 1.0.1 | Testé (back) |
| **CT.2** | Les réponses de l'API sont conformes à openapi.yaml (sinon 500 en dev et en CI). | back | `unit/errors.test.js` › errorHandler › renvoie 500 si une réponse de l’API ne respecte pas le contrat, et le logue | 1.0.1 | Testé (back) |
| **CT.3** | Toutes les erreurs ont le format { "error": "…" } du contrat. | back | `auth.test.js` › Divers › renvoie du JSON pour une route inconnue et un JSON invalide<br>`contract.test.js` › Conformité des requêtes au contrat › renvoie les erreurs au format { error } du contrat<br>`unit/errors.test.js` › errorHandler › traduit une requête non conforme au contrat (erreur de format) | 1.0.1 | Testé (back) |
