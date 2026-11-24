const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

const TOKEN_KEY = "coord_events_token";

export const SESSION_EXPIRED_EVENT = "coord-events:session-expired";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function saveToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);

  if (options.body) {
    headers.set("Content-Type", "application/json");
  }

  const token = getToken();

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new ApiError(
      0,
      "Impossible de joindre le serveur. L'API est-elle lancée ?",
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    // Une requête authentifiée reçoit 401 :
    // le token utilisé n'est plus valide.
    if (response.status === 401 && token && getToken() === token) {
      clearToken();

      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }

    throw new ApiError(
      response.status,
      typeof data?.error === "string"
        ? data.error
        : `Erreur ${response.status}`,
    );
  }

  return data as T;
}
