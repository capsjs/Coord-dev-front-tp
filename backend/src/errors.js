export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const badRequest = (msg) => new HttpError(400, msg);
export const unauthorized = (msg = 'Authentification requise') => new HttpError(401, msg);
export const forbidden = (msg = 'Accès refusé') => new HttpError(403, msg);
export const notFound = (msg = 'Ressource introuvable') => new HttpError(404, msg);
export const conflict = (msg) => new HttpError(409, msg);

// Express 5 transmet automatiquement les erreurs des handlers async à ce middleware.
export function errorHandler(err, req, res, _next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON invalide' });
  }
  console.error(err);
  res.status(500).json({ error: 'Erreur interne du serveur' });
}
