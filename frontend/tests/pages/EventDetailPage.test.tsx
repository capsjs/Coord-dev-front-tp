import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";

import { EventDetailPage } from "../../src/pages/EventDetailPage";
import { getEventById, deleteEvent } from "../../src/api/events";
import {
  getEventRegistrations,
  getMyRegistrations,
} from "../../src/api/registrations";
import { useAuth } from "../../src/auth/useAuth";
import type { Event } from "../../src/types/event";
import type { User } from "../../src/types/user";

// Simulation des appels API
vi.mock("../../src/api/events", () => ({
  getEventById: vi.fn(),
  deleteEvent: vi.fn(),
}));

vi.mock("../../src/api/registrations", () => ({
  getEventRegistrations: vi.fn(),
  getMyRegistrations: vi.fn(),
  registerToEvent: vi.fn(),
  unregisterFromEvent: vi.fn(),
}));

// Simulation du système d'authentification
vi.mock("../../src/auth/useAuth", () => ({
  useAuth: vi.fn(),
}));

const mockedGetEventById = vi.mocked(getEventById);
const mockedDeleteEvent = vi.mocked(deleteEvent);
const mockedUseAuth = vi.mocked(useAuth);
const mockedGetEventRegistrations = vi.mocked(getEventRegistrations);
const mockedGetMyRegistrations = vi.mocked(getMyRegistrations);

const mockEvent: Event = {
  id: 1,
  title: "Conférence React",
  description: "Découverte de React",
  date: "2026-12-15T17:00:00.000Z",
  location: "Montpellier",
  price: 15,
  currency: "EUR",
  organizerId: 2,
  organizer: {
    id: 2,
    name: "Jean Dupont",
  },
};

const organizer: User = {
  id: 2,
  name: "Jean Dupont",
  email: "jean@example.com",
  role: "organizer",
  createdAt: "2026-11-01T10:00:00.000Z",
  updatedAt: "2026-11-01T10:00:00.000Z",
};

// Simuler une session utilisateur
function mockUser(user: User | null) {
  mockedUseAuth.mockReturnValue({
    user,
    loading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  });
}

// Simuler l'organisateur propriétaire
function mockOrganizer() {
  mockUser(organizer);
}

// Afficher le composant dans un routeur de test
function renderPage(path = "/events/1") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/events/:id" element={<EventDetailPage />} />
        <Route path="/events" element={<p>Liste des événements</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("EventDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Par défaut : visiteur non connecté
    mockUser(null);

    mockedGetEventById.mockResolvedValue(mockEvent);
    mockedDeleteEvent.mockResolvedValue(undefined);
    mockedGetEventRegistrations.mockResolvedValue([]);
    mockedGetMyRegistrations.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("affiche un indicateur de chargement", () => {
    mockedGetEventById.mockReturnValue(new Promise(() => {}));

    renderPage();

    expect(
      screen.getByText("Chargement de l'événement..."),
    ).toBeInTheDocument();
  });

  it("[F05.1] affiche les informations de l'événement", async () => {
    renderPage();

    expect(
      await screen.findByRole("heading", {
        name: "Conférence React",
      }),
    ).toBeInTheDocument();

    expect(screen.getByText("Découverte de React")).toBeInTheDocument();

    expect(screen.getByText("Montpellier")).toBeInTheDocument();

    expect(screen.getByText("Jean Dupont")).toBeInTheDocument();

    expect(screen.getByText("15,00 €")).toBeInTheDocument();

    expect(mockedGetEventById).toHaveBeenCalledWith(1);
  });

  it("[F05.3] affiche le message d'erreur 404 de l'API", async () => {
    mockedGetEventById.mockRejectedValue(new Error("Événement introuvable"));

    renderPage("/events/999");

    expect(
      await screen.findByText("Événement introuvable"),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("link", {
        name: "Retour aux événements",
      }),
    ).toHaveAttribute("href", "/events");
  });

  it("refuse un identifiant invalide", async () => {
    renderPage("/events/abc");

    expect(
      await screen.findByText("Identifiant invalide."),
    ).toBeInTheDocument();

    expect(mockedGetEventById).not.toHaveBeenCalled();
  });

  it("[F02.3] masque les actions Modifier et Supprimer pour un visiteur", async () => {
    renderPage();

    await screen.findByText("Conférence React");

    expect(
      screen.queryByRole("link", { name: "Modifier" }),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole("button", { name: "Supprimer" }),
    ).not.toBeInTheDocument();

    expect(mockedDeleteEvent).not.toHaveBeenCalled();
  });

  it("[F03.1] annule la suppression si l'utilisateur refuse", async () => {
    mockOrganizer();

    const confirmMock = vi.spyOn(window, "confirm").mockReturnValue(false);

    renderPage();

    await screen.findByText("Conférence React");

    fireEvent.click(
      screen.getByRole("button", {
        name: "Supprimer",
      }),
    );

    expect(confirmMock).toHaveBeenCalledOnce();
    expect(mockedDeleteEvent).not.toHaveBeenCalled();
  });

  it("supprime l'événement et redirige vers la liste", async () => {
    mockOrganizer();

    vi.spyOn(window, "confirm").mockReturnValue(true);

    renderPage();

    await screen.findByText("Conférence React");

    fireEvent.click(
      screen.getByRole("button", {
        name: "Supprimer",
      }),
    );

    await waitFor(() => {
      expect(mockedDeleteEvent).toHaveBeenCalledWith(1);
    });

    expect(await screen.findByText("Liste des événements")).toBeInTheDocument();
  });

  it("affiche une erreur si la suppression échoue", async () => {
    mockOrganizer();

    vi.spyOn(window, "confirm").mockReturnValue(true);

    mockedDeleteEvent.mockRejectedValue(new Error("Suppression non autorisée"));

    renderPage();

    await screen.findByText("Conférence React");

    fireEvent.click(
      screen.getByRole("button", {
        name: "Supprimer",
      }),
    );

    expect(
      await screen.findByText("Suppression non autorisée"),
    ).toBeInTheDocument();

    expect(mockedDeleteEvent).toHaveBeenCalledWith(1);

    expect(screen.queryByText("Liste des événements")).not.toBeInTheDocument();
  });

  it("[F02.3] masque les actions pour un participant connecté", async () => {
    mockUser({
      ...organizer,
      id: 3,
      role: "participant",
    });

    renderPage();

    await screen.findByRole("heading", {
      name: "Conférence React",
    });

    expect(
      screen.queryByRole("link", { name: "Modifier" }),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole("button", { name: "Supprimer" }),
    ).not.toBeInTheDocument();
  });

  it("[F02.3] [F08b.2] masque les actions pour un organisateur non propriétaire", async () => {
    mockUser({
      ...organizer,
      id: 99,
      role: "organizer",
    });

    renderPage();

    await screen.findByRole("heading", {
      name: "Conférence React",
    });

    expect(
      screen.queryByRole("link", { name: "Modifier" }),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole("button", { name: "Supprimer" }),
    ).not.toBeInTheDocument();
  });

  it("[F02.3] autorise les actions pour l'organisateur propriétaire", async () => {
    mockOrganizer();

    renderPage();

    await screen.findByRole("heading", {
      name: "Conférence React",
    });

    expect(screen.getByRole("link", { name: "Modifier" })).toHaveAttribute(
      "href",
      "/events/1/edit",
    );

    expect(
      screen.getByRole("button", { name: "Supprimer" }),
    ).toBeInTheDocument();
  });

  it("[F02.3] autorise les actions pour un administrateur", async () => {
    mockUser({
      ...organizer,
      id: 99,
      role: "admin",
    });

    renderPage();

    await screen.findByRole("heading", {
      name: "Conférence React",
    });

    expect(screen.getByRole("link", { name: "Modifier" })).toHaveAttribute(
      "href",
      "/events/1/edit",
    );

    expect(
      screen.getByRole("button", { name: "Supprimer" }),
    ).toBeInTheDocument();
  });

  it("[F09.2] affiche la liste des participants à l'organisateur propriétaire", async () => {
    mockOrganizer();

    renderPage();

    expect(
      await screen.findByRole("heading", { name: "Participants" }),
    ).toBeInTheDocument();
    expect(mockedGetEventRegistrations).toHaveBeenCalledWith(1);
  });

  it("[F09.2] affiche la liste des participants à un administrateur", async () => {
    mockUser({ ...organizer, id: 99, role: "admin" });

    renderPage();

    expect(
      await screen.findByRole("heading", { name: "Participants" }),
    ).toBeInTheDocument();
  });

  it("[F09.2] masque la liste des participants aux autres utilisateurs", async () => {
    const others: (User | null)[] = [
      null,
      { ...organizer, id: 3, role: "participant" },
      { ...organizer, id: 99, role: "organizer" },
    ];

    for (const user of others) {
      mockUser(user);
      const { unmount } = renderPage();

      await screen.findByRole("heading", { name: "Conférence React" });
      expect(
        screen.queryByRole("heading", { name: "Participants" }),
      ).not.toBeInTheDocument();

      unmount();
    }

    expect(mockedGetEventRegistrations).not.toHaveBeenCalled();
  });
});
