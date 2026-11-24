import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";

import EventFormPage from "../../src/pages/EventFormPage";
import { createEvent, getEventById, updateEvent } from "../../src/api/events";
import type { Event } from "../../src/types/event";

vi.mock("../../src/api/events", () => ({
  createEvent: vi.fn(),
  getEventById: vi.fn(),
  updateEvent: vi.fn(),
}));

const mockedCreateEvent = vi.mocked(createEvent);
const mockedGetEventById = vi.mocked(getEventById);
const mockedUpdateEvent = vi.mocked(updateEvent);

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

// Permet de tester les routes de création et de modification
function renderPage(path = "/events/new") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/events/new" element={<EventFormPage />} />
        <Route path="/events/:id/edit" element={<EventFormPage />} />
        <Route path="/events" element={<p>Liste des événements</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

// Remplit le formulaire comme le ferait un utilisateur
function fillForm() {
  fireEvent.change(screen.getByLabelText("Titre"), {
    target: { value: "Conférence React" },
  });

  fireEvent.change(screen.getByLabelText("Description"), {
    target: { value: "Découverte de React" },
  });

  fireEvent.change(screen.getByLabelText("Date et heure"), {
    target: { value: "2026-12-15T18:00" },
  });

  fireEvent.change(screen.getByLabelText("Lieu"), {
    target: { value: "Montpellier" },
  });

  fireEvent.change(screen.getByLabelText("Prix"), {
    target: { value: "15" },
  });

  fireEvent.change(screen.getByLabelText("Devise"), {
    target: { value: "EUR" },
  });
}

describe("EventFormPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockedCreateEvent.mockResolvedValue(mockEvent);
    mockedUpdateEvent.mockResolvedValue(mockEvent);
    mockedGetEventById.mockResolvedValue(mockEvent);
  });

  it("[F01.1] affiche le formulaire de création", () => {
    renderPage();

    expect(
      screen.getByRole("heading", {
        name: "Créer un événement",
      }),
    ).toBeInTheDocument();

    expect(screen.getByLabelText("Titre")).toBeInTheDocument();
    expect(screen.getByLabelText("Date et heure")).toHaveAttribute(
      "type",
      "datetime-local",
    );

    expect(screen.getByLabelText("Prix")).toHaveValue(0);
  });

  it("[F01.1] crée un événement avec une date ISO 8601", async () => {
    renderPage();

    fillForm();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Créer l'événement",
      }),
    );

    await waitFor(() => {
      expect(mockedCreateEvent).toHaveBeenCalledOnce();
    });

    expect(mockedCreateEvent).toHaveBeenCalledWith({
      title: "Conférence React",
      description: "Découverte de React",
      date: new Date("2026-12-15T18:00").toISOString(),
      location: "Montpellier",
      price: 15,
      currency: "EUR",
    });

    // La navigation se fait après création réussie
    expect(await screen.findByText("Liste des événements")).toBeInTheDocument();
  });

  it("[F02.1] préremplit le formulaire en mode modification", async () => {
    renderPage("/events/1/edit");

    expect(
      screen.getByText("Chargement de l'événement..."),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByLabelText("Titre")).toHaveValue("Conférence React");
    });

    expect(mockedGetEventById).toHaveBeenCalledWith(1);

    expect(screen.getByLabelText("Lieu")).toHaveValue("Montpellier");

    expect(screen.getByLabelText("Prix")).toHaveValue(15);

    // Vérifie que l'heure affichée correspond
    // à l'heure locale de la date fournie par l'API
    const date = new Date(mockEvent.date);
    const expectedLocalDate = new Date(
      date.getTime() - date.getTimezoneOffset() * 60000,
    )
      .toISOString()
      .slice(0, 16);

    expect(screen.getByLabelText("Date et heure")).toHaveValue(
      expectedLocalDate,
    );
  });

  it("modifie un événement existant", async () => {
    renderPage("/events/1/edit");

    await screen.findByDisplayValue("Conférence React");

    fireEvent.change(screen.getByLabelText("Titre"), {
      target: { value: "Conférence React avancée" },
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Enregistrer les modifications",
      }),
    );

    await waitFor(() => {
      expect(mockedUpdateEvent).toHaveBeenCalledOnce();
    });

    expect(mockedUpdateEvent).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        title: "Conférence React avancée",
        date: mockEvent.date,
      }),
    );

    expect(await screen.findByText("Liste des événements")).toBeInTheDocument();
  });

  it("affiche le message d'erreur renvoyé par l'API", async () => {
    mockedCreateEvent.mockRejectedValue(
      new Error("La date de l'événement doit être future."),
    );

    renderPage();
    fillForm();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Créer l'événement",
      }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "La date de l'événement doit être future.",
    );

    // Pas de redirection en cas d'erreur
    expect(
      screen.getByRole("heading", {
        name: "Créer un événement",
      }),
    ).toBeInTheDocument();
  });

  it("affiche une erreur si le chargement échoue", async () => {
    mockedGetEventById.mockRejectedValue(new Error("Événement introuvable"));

    renderPage("/events/999/edit");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Impossible de récupérer cet événement.",
    );

    expect(mockedUpdateEvent).not.toHaveBeenCalled();
  });
});
