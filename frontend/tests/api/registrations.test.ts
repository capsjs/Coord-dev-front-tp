import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  registerToEvent,
  unregisterFromEvent,
  getMyRegistrations,
  getEventRegistrations,
} from "../../src/api/registrations";

import { apiFetch, ApiError } from "../../src/api/client";

import type { Event } from "../../src/types/event";
import type {
  EventRegistration,
  Registration,
} from "../../src/types/registration";

// Simulation du client HTTP centralisé
vi.mock("../../src/api/client", () => ({
  apiFetch: vi.fn(),
  ApiError: class ApiError extends Error {
    constructor(
      public status: number,
      message: string,
    ) {
      super(message);
    }
  },
}));

const mockedApiFetch = vi.mocked(apiFetch);

const mockRegistration: Registration = {
  eventId: 1,
  userId: 3,
  createdAt: "2026-11-25T10:00:00.000Z",
};

const mockEvent: Event = {
  id: 1,
  title: "Conférence React",
  description: "Découverte de React",
  date: "2026-12-15T17:00:00.000Z",
  location: "Montpellier",
  price: 15,
  currency: "EUR",
  capacity: null,
  remainingSeats: null,
  organizerId: 2,
  organizer: {
    id: 2,
    name: "Jean Dupont",
  },
};

describe("API Inscriptions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("inscrit l'utilisateur avec POST et sans corps [F06]", async () => {
    mockedApiFetch.mockResolvedValue(mockRegistration);

    const result = await registerToEvent(1);

    expect(mockedApiFetch).toHaveBeenCalledWith("/events/1/registrations", {
      method: "POST",
    });
    expect(result).toEqual(mockRegistration);
  });

  it("désinscrit l'utilisateur avec DELETE sur /registrations/me [F07]", async () => {
    mockedApiFetch.mockResolvedValue(undefined);

    const result = await unregisterFromEvent(1);

    expect(mockedApiFetch).toHaveBeenCalledWith("/events/1/registrations/me", {
      method: "DELETE",
    });
    expect(result).toBeUndefined();
  });

  it("récupère les événements auxquels l'utilisateur est inscrit", async () => {
    mockedApiFetch.mockResolvedValue([mockEvent]);

    const result = await getMyRegistrations();

    expect(mockedApiFetch).toHaveBeenCalledWith("/auth/me/registrations");
    expect(result).toEqual([mockEvent]);
  });

  it("récupère les inscrits d'un événement avec leur nom et leur e-mail [F09.1]", async () => {
    const eventRegistrations: EventRegistration[] = [
      {
        ...mockRegistration,
        user: { id: 3, name: "Paula Participante", email: "paula@example.com" },
      },
    ];
    mockedApiFetch.mockResolvedValue(eventRegistrations);

    const result = await getEventRegistrations(1);

    expect(mockedApiFetch).toHaveBeenCalledWith("/events/1/registrations");
    expect(result).toEqual(eventRegistrations);
  });

  it("propage l'erreur 403 si l'utilisateur n'est pas l'organisateur [F09.2]", async () => {
    mockedApiFetch.mockRejectedValue(
      new ApiError(
        403,
        "Seul l'organisateur de l'événement peut voir la liste des participants",
      ),
    );

    await expect(getEventRegistrations(1)).rejects.toMatchObject({
      status: 403,
    });
  });

  it("propage l'erreur 409 en cas de double inscription [F06]", async () => {
    mockedApiFetch.mockRejectedValue(
      new ApiError(409, "Vous êtes déjà inscrit à cet événement"),
    );

    await expect(registerToEvent(1)).rejects.toMatchObject({
      status: 409,
      message: "Vous êtes déjà inscrit à cet événement",
    });
  });

  it("propage l'erreur 404 si l'utilisateur n'était pas inscrit [F07]", async () => {
    mockedApiFetch.mockRejectedValue(
      new ApiError(404, "Vous n'êtes pas inscrit à cet événement"),
    );

    await expect(unregisterFromEvent(1)).rejects.toMatchObject({
      status: 404,
    });
  });
});
