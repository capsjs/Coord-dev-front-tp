import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import * as OpenApiValidator from 'express-openapi-validator';
import { config } from './config.js';
import { errorHandler, notFound } from './errors.js';
import { openapiSpec } from './openapi.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import eventRoutes from './routes/events.js';

export function createApp() {
  const app = express();
  app.use(cors({ origin: config.corsOrigins }));
  app.use(express.json({ limit: '100kb' }));

  // Le contrat (openapi.yaml) est appliqué à chaque requête : corps, paramètres, formats (date-time…).
  // La doc Swagger n'est pas dans le contrat, elle est donc exclue.
  app.use(
    OpenApiValidator.middleware({
      apiSpec: openapiSpec,
      validateRequests: { coerceTypes: false },
      validateResponses: config.validateResponses,
      validateSecurity: false, // l'authentification et les rôles restent gérés par middleware/auth.js
      ignorePaths: /^\/api\/docs/,
      ignoreUndocumented: true, // une route absente du contrat tombe sur le 404 « Route inconnue »
    }),
  );

  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
  app.use('/api/auth', authRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/events', eventRoutes);

  app.get('/api/docs.json', (_req, res) => res.json(openapiSpec));
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec, {
    customSiteTitle: 'Coord Events — API',
    swaggerOptions: { persistAuthorization: true },
  }));
  app.get('/', (_req, res) => res.redirect('/api/docs'));

  app.use('/api', () => {
    throw notFound('Route inconnue');
  });
  app.use(errorHandler);
  return app;
}
