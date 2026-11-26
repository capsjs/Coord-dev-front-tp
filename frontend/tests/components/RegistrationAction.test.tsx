import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";

import { RegistrationAction } from "../../src/components/RegistrationAction";
import { ApiError } from "../../src/api/client";
import {
  getMyRegistrations,
  registerToEvent,
  unregisterFromEvent,
} from "../../src/api/registrations";
import { useAuth } from "../../src/auth/useAuth";

import type { Event } from "../../src/types/event";
import type { User } from "../../src/types/user";

// Simulation des appels API
vi.mock("../../src/api/registrations", () => ({
  getMyRegistrations: vi.fn(),
  registerToEvent: vi.fn(),
  unregisterFromEvent: vi.fn(),
}));

// Simulation du système d'authentification
vi.mock("../../src/auth/useAuth", () => ({
  useAuth: vi.fn(),
}));

const mockedGetMyRegistrations = vi.mocked(getMyRegistrations);
const mockedRegisterToEvent = vi.mocked(registerToEvent);
const mockedUnregisterFromEvent = vi.mocked(unregisterFromEvent);
const mockedUseAuth = vi.mocked(useAuth);

const ONE_DAY = 24 * 60 * 60 * 1000;

const mockEvent: Event = {
  id: 1,
  title: "Conférence React",
  description: "Découverte de React",
  date: new Date(Date.now() + 7 * ONE_DAY).toISOString(),
  location: "Montpellier",
  price: 15,
  currency: "EUR",
  capacity: null,
  remainingSeats: null,
  organizerId: 2,
  organizer: { id: 2, name: "Jean Dupont" },
};

const participant: User = {
  id: 3,
  name: "Paula Participante",
  email: "paula@example.com",
  role: "participant",
  createdAt: "2026-11-01T10:00:00.000Z",
  updatedAt: "2026-11-01T10:00:00.000Z",
};

function mockUser(user: User | null) {
  mockedUseAuth.mockReturnValue({
    user,
    loading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  });
}

function renderAction(event: Event = mockEvent) {
  return render(
    <MemoryRouter initialEntries={["/events/1"]}>
      <RegistrationAction event={event} />
    </MemoryRouter>,
  );
}

describe("RegistrationAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser(null);
    mockedGetMyRegistrations.mockResolvedValue([]);
  });

  it("[F06.4] envoie un visiteur vers la connexion", () => {
    renderAction();

    expect(screen.getByRole("link", { name: "S'inscrire" })).toHaveAttribute(
      "href",
      "/login",
    );
    expect(mockedGetMyRegistrations).not.toHaveBeenCalled();
  });

  it("[F06.1] propose de s'inscrire à un participant pas encore inscrit", async () => {
    mockUser(participant);

    renderAction();

    expect(
      await screen.findByRole("button", { name: "S'inscrire" }),
    ).toBeInTheDocument();
  });

  it("[F07.1] propose de se désinscrire à un participant déjà inscrit", async () => {
    mockUser(participant);
    mockedGetMyRegistrations.mockResolvedValue([mockEvent]);

    renderAction();

    expect(
      await screen.findByRole("button", { name: "Se désinscrire" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Vous êtes inscrit à cet événement."),
    ).toBeInTheDocument();
  });

  it("[F10.3] affiche Complet sans bouton à un participant non inscrit", async () => {
    mockUser(participant);

    renderAction({ ...mockEvent, capacity: 10, remainingSeats: 0 });

    expect(await screen.findByText("Complet")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "S'inscrire" }),
    ).not.toBeInTheDocument();
  });

  it("[F10.3] affiche Complet à un visiteur sur un événement complet", () => {
    renderAction({ ...mockEvent, capacity: 10, remainingSeats: 0 });

    expect(screen.getByText("Complet")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "S'inscrire" }),
    ).not.toBeInTheDocument();
  });

  it("laisse un inscrit se désinscrire d'un événement complet", async () => {
    mockUser(participant);
    const fullEvent = { ...mockEvent, capacity: 10, remainingSeats: 0 };
    mockedGetMyRegistrations.mockResolvedValue([fullEvent]);

    renderAction(fullEvent);

    expect(
      await screen.findByRole("button", { name: "Se désinscrire" }),
    ).toBeInTheDocument();
  });

  it("[F06.5] n'affiche aucun bouton pour un événement passé", () => {
    renderAction({
      ...mockEvent,
      date: new Date(Date.now() - 7 * ONE_DAY).toISOString(),
    });

    expect(screen.getByText("Cet événement est terminé.")).toBeInTheDocument();
    expect(screen.queryByText("S'inscrire")).not.toBeInTheDocument();
  });

  it("n'affiche rien pour un organisateur", () => {
    mockUser({ ...participant, role: "organizer" });

    renderAction();

    expect(screen.queryByText("S'inscrire")).not.toBeInTheDocument();
    expect(mockedGetMyRegistrations).not.toHaveBeenCalled();
  });

  it("affiche l'erreur si les inscriptions ne peuvent pas être chargées", async () => {
    mockUser(participant);
    mockedGetMyRegistrations.mockRejectedValue(
      new Error("Session expirée : reconnectez-vous"),
    );

    renderAction();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Session expirée : reconnectez-vous",
    );
  });

  describe("clic sur S'inscrire", () => {
    beforeEach(() => {
      mockUser(participant);
    });

    it("[F06.2] inscrit le participant, confirme et change le bouton", async () => {
      mockedRegisterToEvent.mockResolvedValue({
        eventId: 1,
        userId: 3,
        createdAt: new Date().toISOString(),
      });

      renderAction();
      await userEvent.click(
        await screen.findByRole("button", { name: "S'inscrire" }),
      );

      expect(mockedRegisterToEvent).toHaveBeenCalledWith(1);
      expect(await screen.findByRole("status")).toHaveTextContent(
        "Inscription confirmée.",
      );
      expect(
        screen.getByRole("button", { name: "Se désinscrire" }),
      ).toBeInTheDocument();
    });

    it("[F06.3] gère la double inscription (409) en affichant Se désinscrire", async () => {
      mockedRegisterToEvent.mockRejectedValue(
        new ApiError(409, "Vous êtes déjà inscrit à cet événement"),
      );
      mockedGetMyRegistrations
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([mockEvent]);

      renderAction();
      await userEvent.click(
        await screen.findByRole("button", { name: "S'inscrire" }),
      );

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Vous êtes déjà inscrit à cet événement",
      );
      expect(
        await screen.findByRole("button", { name: "Se désinscrire" }),
      ).toBeInTheDocument();
    });

    it("[F10.3] signale un événement devenu complet et demande à rafraîchir la fiche", async () => {
      mockedRegisterToEvent.mockRejectedValue(
        new ApiError(409, "Cet événement est complet"),
      );
      const onRegistrationChange = vi.fn();

      render(
        <MemoryRouter initialEntries={["/events/1"]}>
          <RegistrationAction
            event={{ ...mockEvent, capacity: 10, remainingSeats: 1 }}
            onRegistrationChange={onRegistrationChange}
          />
        </MemoryRouter>,
      );
      await userEvent.click(
        await screen.findByRole("button", { name: "S'inscrire" }),
      );

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Cet événement est complet",
      );
      expect(onRegistrationChange).toHaveBeenCalledOnce();
      expect(
        screen.getByRole("button", { name: "S'inscrire" }),
      ).toBeInTheDocument();
    });

    it("[F10.2] demande à rafraîchir la fiche après une inscription", async () => {
      mockedRegisterToEvent.mockResolvedValue({
        eventId: 1,
        userId: 3,
        createdAt: "2026-11-25T10:00:00.000Z",
      });
      const onRegistrationChange = vi.fn();

      render(
        <MemoryRouter initialEntries={["/events/1"]}>
          <RegistrationAction
            event={mockEvent}
            onRegistrationChange={onRegistrationChange}
          />
        </MemoryRouter>,
      );
      await userEvent.click(
        await screen.findByRole("button", { name: "S'inscrire" }),
      );

      expect(await screen.findByRole("status")).toHaveTextContent(
        "Inscription confirmée.",
      );
      expect(onRegistrationChange).toHaveBeenCalledOnce();
    });

    it("[F06.5] affiche le message de l'API si l'événement est passé (400)", async () => {
      mockedRegisterToEvent.mockRejectedValue(
        new ApiError(400, "Cet événement est déjà passé"),
      );

      renderAction();
      await userEvent.click(
        await screen.findByRole("button", { name: "S'inscrire" }),
      );

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Cet événement est déjà passé",
      );
      expect(
        screen.getByRole("button", { name: "S'inscrire" }),
      ).toBeEnabled();
    });

    it("[F06.3] désactive le bouton pendant l'envoi", async () => {
      // Promesse jamais résolue : la requête reste « en cours »
      mockedRegisterToEvent.mockReturnValue(new Promise(() => {}));

      renderAction();
      await userEvent.click(
        await screen.findByRole("button", { name: "S'inscrire" }),
      );

      expect(
        screen.getByRole("button", { name: "Inscription..." }),
      ).toBeDisabled();
      expect(mockedRegisterToEvent).toHaveBeenCalledTimes(1);
    });
  });

  describe("clic sur Se désinscrire", () => {
    beforeEach(() => {
      mockUser(participant);
      // Le participant est déjà inscrit à l'événement affiché
      mockedGetMyRegistrations.mockResolvedValue([mockEvent]);
    });

    it("[F07.2] désinscrit le participant, confirme et remet S'inscrire", async () => {
      mockedUnregisterFromEvent.mockResolvedValue(undefined);

      renderAction();
      await userEvent.click(
        await screen.findByRole("button", { name: "Se désinscrire" }),
      );

      expect(mockedUnregisterFromEvent).toHaveBeenCalledWith(1);
      expect(await screen.findByRole("status")).toHaveTextContent(
        "Désinscription confirmée.",
      );
      expect(
        screen.getByRole("button", { name: "S'inscrire" }),
      ).toBeInTheDocument();
    });

    it("[F07.2] remet S'inscrire si l'utilisateur n'était plus inscrit (404)", async () => {
      mockedUnregisterFromEvent.mockRejectedValue(
        new ApiError(404, "Vous n'êtes pas inscrit à cet événement"),
      );

      renderAction();
      await userEvent.click(
        await screen.findByRole("button", { name: "Se désinscrire" }),
      );

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Vous n'êtes pas inscrit à cet événement",
      );
      expect(
        screen.getByRole("button", { name: "S'inscrire" }),
      ).toBeInTheDocument();
    });

    it("garde le bouton Se désinscrire si une autre erreur survient", async () => {
      mockedUnregisterFromEvent.mockRejectedValue(
        new ApiError(500, "Erreur interne du serveur"),
      );

      renderAction();
      await userEvent.click(
        await screen.findByRole("button", { name: "Se désinscrire" }),
      );

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Erreur interne du serveur",
      );
      expect(
        screen.getByRole("button", { name: "Se désinscrire" }),
      ).toBeEnabled();
    });

    it("désactive le bouton pendant l'envoi", async () => {
      mockedUnregisterFromEvent.mockReturnValue(new Promise(() => {}));

      renderAction();
      await userEvent.click(
        await screen.findByRole("button", { name: "Se désinscrire" }),
      );

      expect(
        screen.getByRole("button", { name: "Désinscription..." }),
      ).toBeDisabled();
      expect(mockedUnregisterFromEvent).toHaveBeenCalledTimes(1);
    });
  });
});
