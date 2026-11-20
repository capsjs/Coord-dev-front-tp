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
  // Erreurs du validateur OpenAPI : requête non conforme au contrat (400, 404, 405, 415…).
  if (Array.isArray(err.errors) && err.status && err.status < 500) {
    return res.status(err.status).json({ error: contractErrorMessage(err) });
  }
  if (Array.isArray(err.errors) && err.status >= 500) {
    // Réponse non conforme au contrat : c'est un bug de l'API, à corriger côté back.
    console.error('[contrat] réponse non conforme à openapi.yaml :', req.method, req.originalUrl, err.errors);
    return res.status(500).json({ error: 'Réponse non conforme au contrat d\'API' });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON invalide' });
  }
  console.error(err);
  res.status(500).json({ error: 'Erreur interne du serveur' });
}

/** « request/body/date must match format "date-time" » → « Champ « date » invalide : doit respecter le format date-time ». */
function contractErrorMessage(err) {
  const [first] = err.errors;
  if (!first) return err.message;
  const field = (first.path ?? '').split('/').filter(Boolean).filter((p) => !['request', 'body', 'query', 'params'].includes(p)).join('.');
  const detail = first.errorCode?.startsWith('format')
    ? `doit respecter le format ${first.message.match(/"(.+)"/)?.[1] ?? ''}`.trim()
    : first.message;
  return field ? `Champ « ${field} » invalide : ${detail}` : detail;
}
