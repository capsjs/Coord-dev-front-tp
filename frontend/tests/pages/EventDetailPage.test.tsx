import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";

import { EventDetailPage } from "../../src/pages/EventDetailPage";
import { getEventById, deleteEvent } from "../../src/api/events";
import type { Event } from "../../src/types/event";

vi.mock("../../src/api/events", () => ({
  getEventById: vi.fn(),
  deleteEvent: vi.fn(),
}));

const mockedGetEventById = vi.mocked(getEventById);
const mockedDeleteEvent = vi.mocked(deleteEvent);

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
    mockedGetEventById.mockResolvedValue(mockEvent);
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

  it("affiche les informations de l'événement", async () => {
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

  it("affiche le message d'erreur 404 de l'API", async () => {
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

  it("annule la suppression si l'utilisateur refuse", async () => {
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
    vi.spyOn(window, "confirm").mockReturnValue(true);

    mockedDeleteEvent.mockResolvedValue(undefined);

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
});
