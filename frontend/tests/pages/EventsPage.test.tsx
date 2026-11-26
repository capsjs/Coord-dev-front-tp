import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { EventsPage } from "../../src/pages/EventsPage";
import { getEvents, deleteEvent } from "../../src/api/events";
import { useAuth } from "../../src/auth/useAuth";
import type { Event } from "../../src/types/event";

vi.mock("../../src/api/events", () => ({
  getEvents: vi.fn(),
  deleteEvent: vi.fn(),
}));

vi.mock("../../src/auth/useAuth", () => ({
  useAuth: vi.fn(),
}));

const mockedGetEvents = vi.mocked(getEvents);
const mockedDeleteEvent = vi.mocked(deleteEvent);
const mockedUseAuth = vi.mocked(useAuth);

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

function renderPage() {
  return render(
    <MemoryRouter>
      <EventsPage />
    </MemoryRouter>,
  );
}

describe("EventsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Par défaut, le visiteur n'est pas connecté.
    mockedUseAuth.mockReturnValue({
      user: null,
      loading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    mockedGetEvents.mockResolvedValue([]);
  });

  it("affiche un chargement initial", () => {
    mockedGetEvents.mockReturnValue(new Promise(() => {}));

    renderPage();

    expect(
      screen.getByText("Chargement des événements..."),
    ).toBeInTheDocument();
  });

  it("[F04.3] affiche un message si aucun événement n'existe", async () => {
    renderPage();

    expect(
      await screen.findByText("Aucun événement pour le moment."),
    ).toBeInTheDocument();
  });

  it("[F04.2] affiche les informations des événements", async () => {
    mockedGetEvents.mockResolvedValue([mockEvent]);

    renderPage();

    expect(await screen.findByText("Conférence React")).toBeInTheDocument();

    expect(screen.getByText("Montpellier")).toBeInTheDocument();
    expect(screen.getByText("Jean Dupont")).toBeInTheDocument();
    expect(screen.getByText("15,00 €")).toBeInTheDocument();
  });

  it("affiche le message d'erreur renvoyé par l'API", async () => {
    mockedGetEvents.mockRejectedValue(
      new Error("Impossible de récupérer les événements"),
    );

    renderPage();

    expect(
      await screen.findByText("Impossible de récupérer les événements"),
    ).toBeInTheDocument();
  });

  it("masque la création pour un visiteur non connecté", async () => {
    renderPage();

    await screen.findByText("Aucun événement pour le moment.");

    expect(
      screen.queryByRole("link", { name: "Créer un événement" }),
    ).not.toBeInTheDocument();
  });

  it("permet à un organisateur de voir le bouton de création", async () => {
    mockedUseAuth.mockReturnValue({
      user: {
        id: 2,
        name: "Jean Dupont",
        email: "jean@example.com",
        role: "organizer",
        createdAt: "2026-11-01T10:00:00.000Z",
        updatedAt: "2026-11-01T10:00:00.000Z",
      },
      loading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    renderPage();

    expect(
      await screen.findByRole("link", { name: "Créer un événement" }),
    ).toHaveAttribute("href", "/events/new");
  });
});

describe("Suppression d'un événement", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockedUseAuth.mockReturnValue({
      user: {
        id: 2,
        name: "Jean Dupont",
        email: "jean@example.com",
        role: "organizer",
        createdAt: "2026-11-01T10:00:00.000Z",
        updatedAt: "2026-11-01T10:00:00.000Z",
      },
      loading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    mockedGetEvents.mockResolvedValue([mockEvent]);
  });

  it("[F03.1] supprime l'événement après confirmation", async () => {
    const confirmMock = vi.spyOn(window, "confirm").mockReturnValue(true);
    mockedDeleteEvent.mockResolvedValue(undefined);

    try {
      renderPage();

      await screen.findByText("Conférence React");

      fireEvent.click(screen.getByRole("button", { name: "Supprimer" }));

      await waitFor(() => {
        expect(mockedDeleteEvent).toHaveBeenCalledWith(1);
      });

      await waitFor(() => {
        expect(screen.queryByText("Conférence React")).not.toBeInTheDocument();
      });
    } finally {
      confirmMock.mockRestore();
    }
  });
});
