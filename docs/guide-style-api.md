# Guide de style de l'API : Coord Events

> SCRUM-66 · règles pour écrire une route dans [`backend/openapi.yaml`](../backend/openapi.yaml).
> Les règles marquées 🤖 sont vérifiées automatiquement par Spectral (`make lint` et CI).

## 1. Routes

| Règle | ✅ Oui | ❌ Non |
| ----- | ------ | ------ |
| 🤖 Toutes les routes commencent par `/api/` | `/api/events` | `/events` |
| 🤖 Segments en minuscules, mots séparés par des tirets (*kebab-case*) | `/api/event-categories` | `/api/eventCategories`, `/api/Event_Categories` |
| 🤖 Pas de `/` final | `/api/events` | `/api/events/` |
| Ressources au **pluriel**, désignées par un **nom** | `/api/events`, `/api/admin/users` | `/api/event`, `/api/getEvents` |
| Un élément : la collection suivie de son identifiant entier `{id}` | `/api/events/{id}` | `/api/events/get/{id}` |
| Sous-ressource : sous son parent | `/api/events/{id}/registrations` | `/api/registrations?eventId=…` |
| L'utilisateur connecté s'écrit **`me`** | `/api/auth/me`, `/api/events/{id}/registrations/me` | `/api/users/{monId}` |
| L'action est portée par la **méthode HTTP**, pas par l'URL | `DELETE /api/events/{id}` | `POST /api/events/{id}/delete` |

**Exception assumée** : `POST /api/auth/register` et `POST /api/auth/login` sont des verbes, car ce sont des actions (créer une session) plutôt que des ressources. Toute nouvelle exception doit être justifiée dans la PR.

## 2. Méthodes et codes de succès

| Méthode | Usage | Succès | Corps de la réponse |
| ------- | ----- | ------ | ------------------- |
| `GET` | Lire une ressource ou une liste | `200` | la ressource ou un tableau |
| `POST` | Créer | `201` | la ressource créée, complète |
| `PUT` | **Remplacer** tous les champs modifiables (un champ optionnel absent reprend sa valeur par défaut) | `200` | la ressource modifiée, complète |
| `PATCH` | Modifier **une partie** des champs (au moins un requis) | `200` | la ressource modifiée, complète |
| `DELETE` | Supprimer | `204` | aucun |

Une action sans ressource à renvoyer répond aussi `204` (ex. `PUT /api/auth/me/password`).

## 3. Champs JSON

| Règle | Exemple |
| ----- | ------- |
| 🤖 Noms en **camelCase**, en anglais | `organizerId`, `createdAt` (jamais `organizer_id`) |
| Identifiants : entiers, champ `id` ; une référence à une autre ressource se termine par `Id` | `"id": 12`, `"organizerId": 2` |
| Ressource liée affichable : objet imbriqué minimal en plus de l'identifiant | `"organizer": { "id": 2, "name": "Olivia Orga" }` |
| Dates : chaînes **ISO 8601 en UTC**, avec l'heure et le fuseau ; à la seconde près en base | `"2026-12-15T18:00:00.000Z"` (pas `"2026-12-15"`, ni `"2026-12-15T18:00"`) |
| Dates techniques : `createdAt` et `updatedAt` sur chaque ressource persistée | |
| Montants : nombre (`price`) + code devise **ISO 4217** à 3 lettres majuscules (`currency`) | `"price": 10, "currency": "EUR"` |
| Champs optionnels : une valeur par défaut documentée dans le contrat (`default`) plutôt que `null` | `"description": ""`, `"price": 0` |
| Pas de conversion implicite : un nombre est envoyé comme nombre | `"price": 10` (pas `"10"`) |
| Ne jamais renvoyer de donnée sensible | jamais `password` ni `passwordHash` |

## 4. Codes d'erreur

| Code | Quand | Exemple de message |
| ---- | ----- | ------------------ |
| `400` | Requête invalide : corps, paramètre, format ou règle métier non respectés. **Toute erreur de validation est un 400** (nous n'utilisons pas `422`) | `Champ « date » invalide : doit respecter le format date-time` |
| `401` | Jeton absent, invalide ou expiré ; identifiants incorrects. 🤖 Toute route protégée (`security`) documente ce code | `Authentification requise` · `Session expirée : reconnectez-vous` |
| `403` | Connecté, mais pas le droit (rôle insuffisant, pas propriétaire) | `Seul l'organisateur de l'événement peut le modifier ou le supprimer` |
| `404` | Ressource ou route inexistante | `Événement introuvable` · `Route inconnue` |
| `409` | Conflit avec l'état actuel (doublon) | `Un compte existe déjà avec cet email` |
| `500` | Erreur inattendue du serveur, ou réponse non conforme au contrat (en dev et CI) | `Erreur interne du serveur` |

**Ordre des vérifications** sur une route protégée qui cible une ressource : `400` (requête invalide) → `401` (pas connecté) → `404` (ressource inexistante) → `403` (pas le droit).

## 5. Format commun des erreurs

Toutes les erreurs, quel que soit le code, ont le même corps :

```json
{ "error": "Message lisible, en français, affichable tel quel à l'utilisateur" }
```

- Schéma `Error` et réponses réutilisables (`BadRequest`, `Unauthorized`, `Forbidden`, `NotFound`…) dans `components` du contrat : une nouvelle route les référence au lieu de les redéfinir.
- Le message **désigne le champ en cause** quand il y en a un (`Champ « price » invalide : …`).
- Un message n'expose **jamais** de détail interne (requête SQL, pile d'appels, nom de fichier) : les erreurs inattendues renvoient `Erreur interne du serveur` et le détail part dans les logs.
- Côté front : afficher `body.error` plutôt qu'un message générique.

## 6. Pagination

*Pas encore implémentée : `GET /api/events` renvoie toute la liste. Cette convention s'appliquera à toute liste paginée.*

| Élément | Règle |
| ------- | ----- |
| Paramètres | `page` (entier ≥ 1, défaut `1`) et `limit` (entier de 1 à `100`, défaut `20`), en *query string* |
| Corps de la réponse | **reste un tableau** d'éléments : la pagination n'est pas un changement cassant |
| Total | en-tête **`X-Total-Count`** : nombre total d'éléments, toutes pages confondues |
| CORS | ajouter `X-Total-Count` à `Access-Control-Expose-Headers`, sinon le navigateur le masque au front |
| Hors limites | `page` au-delà de la dernière page : `200` avec un tableau vide · `limit` > 100 ou ≤ 0 : `400` |
| Tri | ordre stable et documenté pour chaque liste (ex. date croissante puis `id`) |

Exemple :

```http
GET /api/events?page=2&limit=20

HTTP/1.1 200 OK
X-Total-Count: 57

[ { "id": 21, "title": "…" }, … ]
```

Les filtres (F11) suivront la même logique : paramètres de *query string* en camelCase, nommés comme le champ filtré (ex. `?location=Lyon`).
