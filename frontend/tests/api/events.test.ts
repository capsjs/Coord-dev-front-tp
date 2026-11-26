import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
} from "../../src/api/events";

import { apiFetch, ApiError } from "../../src/api/client";

import type { Event } from "../../src/types/event";
import type { EventFormData } from "../../src/types/eventFormData";

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

const formData: EventFormData = {
  title: "Conférence React",
  description: "Découverte de React",
  date: "2026-12-15T17:00:00.000Z",
  location: "Montpellier",
  price: 15,
  currency: "EUR",
};

describe("API Events", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("récupère la liste des événements", async () => {
    mockedApiFetch.mockResolvedValue([mockEvent]);

    const result = await getEvents();

    expect(mockedApiFetch).toHaveBeenCalledWith("/events");
    expect(result).toEqual([mockEvent]);
  });

  it("récupère un événement par son identifiant", async () => {
    mockedApiFetch.mockResolvedValue(mockEvent);

    const result = await getEventById(1);

    expect(mockedApiFetch).toHaveBeenCalledWith("/events/1");
    expect(result).toEqual(mockEvent);
  });

  it("crée un événement avec POST et un corps JSON", async () => {
    mockedApiFetch.mockResolvedValue(mockEvent);

    const result = await createEvent(formData);

    expect(mockedApiFetch).toHaveBeenCalledWith("/events", {
      method: "POST",
      body: JSON.stringify(formData),
    });

    expect(result).toEqual(mockEvent);
  });

  it("modifie un événement avec PUT", async () => {
    const updatedData: EventFormData = {
      ...formData,
      title: "Conférence React avancée",
    };

    mockedApiFetch.mockResolvedValue({
      ...mockEvent,
      title: updatedData.title,
    });

    const result = await updateEvent(1, updatedData);

    expect(mockedApiFetch).toHaveBeenCalledWith("/events/1", {
      method: "PUT",
      body: JSON.stringify(updatedData),
    });

    expect(result.title).toBe("Conférence React avancée");
  });

  it("supprime un événement avec DELETE", async () => {
    mockedApiFetch.mockResolvedValue(undefined);

    const result = await deleteEvent(1);

    expect(mockedApiFetch).toHaveBeenCalledWith("/events/1", {
      method: "DELETE",
    });

    expect(result).toBeUndefined();
  });

  it("propage les erreurs HTTP du client API", async () => {
    mockedApiFetch.mockRejectedValue(
      new ApiError(403, "Suppression non autorisée"),
    );

    await expect(deleteEvent(1)).rejects.toMatchObject({
      status: 403,
      message: "Suppression non autorisée",
    });
  });
});
