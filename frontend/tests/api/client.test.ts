import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError, apiFetch, saveToken } from "../../src/api/client";
import { SESSION_EXPIRED_EVENT, getToken } from "../../src/api/client";

describe("apiFetch", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("récupère les données lorsque l'API répond 200", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: 1, title: "Concert" }), {
        status: 200,
      }),
    );

    vi.stubGlobal("fetch", fetchMock);

    const result = await apiFetch("/events/1");

    expect(result).toEqual({
      id: 1,
      title: "Concert",
    });
  });

  it("ajoute le token JWT dans les headers", async () => {
    saveToken("test-token");

    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify([]), { status: 200 }));

    vi.stubGlobal("fetch", fetchMock);

    await apiFetch("/events");

    const options = fetchMock.mock.calls[0][1] as RequestInit;
    const headers = new Headers(options.headers);

    expect(headers.get("Authorization")).toBe("Bearer test-token");
  });

  it("remonte le message d'erreur 400 du backend", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: "La date doit être future.",
          }),
          { status: 400 },
        ),
      ),
    );

    await expect(apiFetch("/events")).rejects.toThrow(
      "La date doit être future.",
    );
  });

  it("conserve le statut HTTP dans ApiError", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: "Accès interdit" }), {
          status: 403,
        }),
      ),
    );

    await expect(apiFetch("/events")).rejects.toMatchObject({
      status: 403,
      message: "Accès interdit",
    } satisfies Partial<ApiError>);
  });

  it("gère une réponse 204 sans contenu", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 204 })),
    );

    await expect(apiFetch("/events/1")).resolves.toBeUndefined();
  });

  it("signale une API inaccessible", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Network error")),
    );

    await expect(apiFetch("/events")).rejects.toMatchObject({
      status: 0,
    });
  });

  it("supprime le token et signale une session expirée après un 401", async () => {
    saveToken("jwt-expire");

    const sessionExpiredHandler = vi.fn();

    window.addEventListener(SESSION_EXPIRED_EVENT, sessionExpiredHandler);

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: "Token expiré" }), {
          status: 401,
        }),
      ),
    );

    try {
      await expect(apiFetch("/auth/me")).rejects.toMatchObject({
        status: 401,
        message: "Token expiré",
      });

      expect(getToken()).toBeNull();
      expect(sessionExpiredHandler).toHaveBeenCalledOnce();
    } finally {
      window.removeEventListener(SESSION_EXPIRED_EVENT, sessionExpiredHandler);
    }
  });
});
