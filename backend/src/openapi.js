const error = (description, example) => ({
  description,
  content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { error: example } } },
});

const json = (schema) => ({ 'application/json': { schema } });
const ref = (name) => ({ $ref: `#/components/schemas/${name}` });
const auth = [{ bearerAuth: [] }];
const userId = { name: 'id', in: 'path', required: true, schema: { type: 'integer', minimum: 1 } };

const unauthorizedResp = error('Jeton absent, invalide ou expiré', 'Authentification requise');
const forbiddenResp = error('Rôle insuffisant', 'Accès refusé');
const notFoundResp = error('Utilisateur introuvable', 'Utilisateur introuvable');

export const openapiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Coord Events — API',
    version: '1.0.0',
    description:
      "API du gestionnaire d'événements : comptes et connexion.\n\n" +
      '**Rôles** : `admin`, `organizer` (créateur d\'événements), `participant`.\n\n' +
      '**Authentification** : appelez `POST /api/auth/login`, copiez le `token` de la réponse, ' +
      'puis cliquez sur **Authorize** et collez-le.',
  },
  servers: [{ url: '/', description: 'Serveur courant' }],
  tags: [
    { name: 'Santé' },
    { name: 'Auth', description: 'Inscription, connexion et gestion de son propre compte' },
    { name: 'Admin', description: 'Gestion des comptes (rôle admin requis)' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      Role: { type: 'string', enum: ['admin', 'organizer', 'participant'] },
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 2 },
          email: { type: 'string', format: 'email', example: 'orga@events.local' },
          name: { type: 'string', example: 'Olivia Orga' },
          role: ref('Role'),
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          token: { type: 'string', description: 'JWT à envoyer dans `Authorization: Bearer <token>`' },
          user: ref('User'),
        },
      },
      RegisterInput: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string', minLength: 2, maxLength: 100, example: 'Jeanne Dupont' },
          email: { type: 'string', format: 'email', example: 'jeanne@example.com' },
          password: { type: 'string', format: 'password', minLength: 8, maxLength: 128, example: 'motdepasse123' },
          role: {
            type: 'string',
            enum: ['participant', 'organizer'],
            default: 'participant',
            description: 'Le rôle admin ne peut pas être choisi à l\'inscription.',
          },
        },
      },
      LoginInput: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'admin@events.local' },
          password: { type: 'string', format: 'password', example: 'admin1234' },
        },
      },
      UpdateMeInput: {
        type: 'object',
        minProperties: 1,
        properties: {
          name: { type: 'string', minLength: 2, maxLength: 100 },
          email: { type: 'string', format: 'email' },
        },
      },
      ChangePasswordInput: {
        type: 'object',
        required: ['currentPassword', 'newPassword'],
        properties: {
          currentPassword: { type: 'string', format: 'password' },
          newPassword: { type: 'string', format: 'password', minLength: 8, maxLength: 128 },
        },
      },
      PasswordInput: {
        type: 'object',
        required: ['password'],
        properties: { password: { type: 'string', format: 'password' } },
      },
      RoleInput: {
        type: 'object',
        required: ['role'],
        properties: { role: ref('Role') },
      },
      Error: {
        type: 'object',
        properties: { error: { type: 'string' } },
      },
    },
  },
  paths: {
    '/api/health': {
      get: {
        tags: ['Santé'],
        summary: "État de l'API",
        responses: { 200: { description: 'OK', content: json({ type: 'object', properties: { status: { type: 'string', example: 'ok' } } }) } },
      },
    },
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Créer un compte',
        requestBody: { required: true, content: json(ref('RegisterInput')) },
        responses: {
          201: { description: 'Compte créé, utilisateur connecté', content: json(ref('AuthResponse')) },
          400: error('Données invalides', 'Adresse email invalide'),
          409: error('Email déjà utilisé', 'Un compte existe déjà avec cet email'),
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Se connecter',
        requestBody: { required: true, content: json(ref('LoginInput')) },
        responses: {
          200: { description: 'Connexion réussie', content: json(ref('AuthResponse')) },
          400: error('Données invalides', 'Le champ « password » est requis'),
          401: error('Identifiants incorrects', 'Email ou mot de passe incorrect'),
        },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Voir son profil',
        security: auth,
        responses: { 200: { description: 'Profil', content: json(ref('User')) }, 401: unauthorizedResp },
      },
      patch: {
        tags: ['Auth'],
        summary: 'Modifier son nom et/ou son email',
        security: auth,
        requestBody: { required: true, content: json(ref('UpdateMeInput')) },
        responses: {
          200: { description: 'Profil mis à jour', content: json(ref('User')) },
          400: error('Données invalides', 'Rien à modifier : fournissez « name » et/ou « email »'),
          401: unauthorizedResp,
          409: error('Email déjà utilisé', 'Un compte existe déjà avec cet email'),
        },
      },
      delete: {
        tags: ['Auth'],
        summary: 'Supprimer son compte',
        description: 'Le mot de passe est redemandé. Le dernier administrateur ne peut pas supprimer son compte.',
        security: auth,
        requestBody: { required: true, content: json(ref('PasswordInput')) },
        responses: {
          204: { description: 'Compte supprimé' },
          400: error('Dernier administrateur', "Impossible de supprimer ce compte : c'est le dernier administrateur"),
          401: error('Mot de passe incorrect ou jeton invalide', 'Mot de passe incorrect'),
        },
      },
    },
    '/api/auth/me/password': {
      put: {
        tags: ['Auth'],
        summary: 'Changer son mot de passe',
        security: auth,
        requestBody: { required: true, content: json(ref('ChangePasswordInput')) },
        responses: {
          204: { description: 'Mot de passe modifié' },
          400: error('Nouveau mot de passe invalide', 'Le champ « newPassword » doit contenir au moins 8 caractères'),
          401: error('Mot de passe actuel incorrect ou jeton invalide', 'Mot de passe actuel incorrect'),
        },
      },
    },
    '/api/admin/users': {
      get: {
        tags: ['Admin'],
        summary: 'Lister les comptes',
        security: auth,
        parameters: [{ name: 'role', in: 'query', required: false, schema: ref('Role') }],
        responses: {
          200: { description: 'Liste des comptes', content: json({ type: 'array', items: ref('User') }) },
          400: error('Rôle de filtre invalide', 'Le champ « role » doit valoir : admin, organizer, participant'),
          401: unauthorizedResp,
          403: forbiddenResp,
        },
      },
    },
    '/api/admin/users/{id}': {
      parameters: [userId],
      get: {
        tags: ['Admin'],
        summary: 'Voir un compte',
        security: auth,
        responses: { 200: { description: 'Compte', content: json(ref('User')) }, 401: unauthorizedResp, 403: forbiddenResp, 404: notFoundResp },
      },
      patch: {
        tags: ['Admin'],
        summary: "Changer le rôle d'un compte",
        description: "Un admin ne peut pas changer son propre rôle, ni retirer le rôle du dernier admin.",
        security: auth,
        requestBody: { required: true, content: json(ref('RoleInput')) },
        responses: {
          200: { description: 'Compte mis à jour', content: json(ref('User')) },
          400: error('Opération refusée', 'Vous ne pouvez pas modifier votre propre rôle'),
          401: unauthorizedResp,
          403: forbiddenResp,
          404: notFoundResp,
        },
      },
      delete: {
        tags: ['Admin'],
        summary: 'Supprimer un compte',
        security: auth,
        responses: {
          204: { description: 'Compte supprimé' },
          400: error('Opération refusée', 'Utilisez DELETE /api/auth/me pour supprimer votre propre compte'),
          401: unauthorizedResp,
          403: forbiddenResp,
          404: notFoundResp,
        },
      },
    },
  },
};
