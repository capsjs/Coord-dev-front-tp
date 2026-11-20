const env = process.env;

export const config = {
  port: Number(env.PORT ?? 3000),
  db: {
    host: env.DB_HOST ?? 'localhost',
    port: Number(env.DB_PORT ?? 3306),
    user: env.DB_USER ?? 'events',
    password: env.DB_PASSWORD ?? 'events',
    database: env.DB_NAME ?? 'events',
  },
  jwtSecret: env.JWT_SECRET ?? 'dev-secret-a-changer',
  jwtExpiresIn: env.JWT_EXPIRES_IN ?? '7d',
  corsOrigins: (env.CORS_ORIGIN ?? 'http://localhost:5173').split(',').map((o) => o.trim()),
  admin: {
    email: env.ADMIN_EMAIL ?? 'admin@events.local',
    password: env.ADMIN_PASSWORD ?? 'admin1234',
    name: env.ADMIN_NAME ?? 'Administrateur',
  },
  seedDemo: env.SEED_DEMO === 'true',
  // Vérifie aussi les réponses de l'API contre openapi.yaml (une réponse non conforme devient une erreur 500).
  // Activé par défaut hors production : en dev et en CI, tout écart au contrat fait échouer les tests.
  validateResponses: env.VALIDATE_RESPONSES ? env.VALIDATE_RESPONSES === 'true' : env.NODE_ENV !== 'production',
};

if (env.NODE_ENV === 'production' && config.jwtSecret === 'dev-secret-a-changer') {
  console.warn('[config] JWT_SECRET n\'est pas défini : utilisez un secret fort en production.');
}
