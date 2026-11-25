# Coord Events : front-end

Interface web du gestionnaire d'événements Coord Events, branchée sur l'API du dossier `backend/`.

**Stack** : React 19 · TypeScript (strict) · Vite · React Router

> État actuel : **comptes et session, événements** (liste, fiche, création, modification, suppression) **et inscriptions** (S'inscrire / Se désinscrire sur la fiche), branchés sur l'API.

## Démarrage rapide

L'API doit tourner (depuis la racine du dépôt : `make up`).

```bash
cd frontend
cp .env.example .env    # URL de l'API
npm install
npm run dev             # http://localhost:5173
```

| Variable       | Défaut                      | Rôle                 |
| -------------- | --------------------------- | -------------------- |
| `VITE_API_URL` | `http://localhost:3000/api` | Adresse de l'API     |

Le back autorise déjà `http://localhost:5173` (variable `CORS_ORIGIN`). Si vous changez le port du front, mettez-la à jour.

### Scripts

| Commande          | Effet                                      |
| ----------------- | ------------------------------------------ |
| `npm run dev`     | Serveur de développement (rechargement auto) |
| `npm run build`   | Vérifie les types puis construit dans `dist/` |
| `npm run lint`    | Analyse du code (oxlint)                   |
| `npm run preview` | Sert le build de production en local       |

### Comptes de démo

Créés par le back au premier démarrage (voir le README racine).

| Rôle        | Email                      | Mot de passe |
| ----------- | -------------------------- | ------------ |
| organizer   | `orga@events.local`        | `orga1234`   |
| participant | `participant@events.local` | `part1234`   |

## Pages

| Route         | Accès     | Description                                |
| ------------- | --------- | ------------------------------------------ |
| `/`           | public    | Accueil, présentation des rôles            |
| `/register`   | public    | Créer un compte (participant ou organisateur) |
| `/login`      | public    | Se connecter                               |
| `/events`     | public    | Liste des événements à venir               |
| `/events/:id` | public    | Détail d'un événement, bouton S'inscrire / Se désinscrire |
| `/profile`    | connecté  | Mon profil                                 |
| `*`           | public    | Page introuvable                           |

## Authentification

1. `POST /auth/login` ou `/auth/register` renvoie `{ token, user }`.
2. Le token JWT est enregistré dans le `localStorage` (clé `coord_events_token`).
3. `apiFetch` l'ajoute à chaque requête : `Authorization: Bearer <token>`.
4. Au chargement de l'app, `AuthProvider` appelle `GET /auth/me` pour retrouver l'utilisateur. Si le token est invalide ou expiré, il est supprimé.
5. `ProtectedRoute` renvoie vers `/login` si personne n'est connecté, puis ramène à la page demandée après la connexion.

Les erreurs de l'API (`{ "error": "message" }`) deviennent des `ApiError` et leur message est affiché tel quel dans les formulaires.

## Structure

```
frontend/src/
├── main.tsx                 # point d'entrée : BrowserRouter + AuthProvider
├── App.tsx                  # déclaration des routes
├── index.css                # styles globaux (couleurs, une par rôle)
├── api/
│   ├── client.ts            # apiFetch : URL, JSON, token, erreurs
│   └── auth.ts              # register, login, me
├── auth/
│   ├── authContext.ts       # contexte React de l'auth
│   ├── AuthProvider.tsx     # état de la session (user, login, logout…)
│   ├── useAuth.ts           # hook d'accès au contexte
│   └── ProtectedRoute.tsx   # garde des pages réservées
├── components/
│   ├── Layout.tsx           # en-tête + contenu de la page
│   └── RoleBadge.tsx        # badge coloré du rôle
├── pages/                   # une page par route
└── types/user.ts            # User, Role, AuthResponse (calqués sur le back)
```
