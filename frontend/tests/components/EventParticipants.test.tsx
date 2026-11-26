import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";

import { EventParticipants } from "../../src/components/EventParticipants";
import { ApiError } from "../../src/api/client";
import { getEventRegistrations } from "../../src/api/registrations";
import type { EventRegistration } from "../../src/types/registration";

vi.mock("../../src/api/registrations", () => ({
  getEventRegistrations: vi.fn(),
}));

const mockedGetEventRegistrations = vi.mocked(getEventRegistrations);

function registration(
  id: number,
  name: string,
  email: string,
): EventRegistration {
  return {
    eventId: 1,
    userId: id,
    createdAt: "2026-11-25T10:00:00.000Z",
    user: { id, name, email },
  };
}

describe("EventParticipants", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetEventRegistrations.mockResolvedValue([]);
  });

  it("affiche un indicateur de chargement", () => {
    mockedGetEventRegistrations.mockReturnValue(new Promise(() => {}));

    render(<EventParticipants eventId={1} />);

    expect(
      screen.getByText("Chargement des participants..."),
    ).toBeInTheDocument();
  });

  it("[F09.1] affiche le nom et l'e-mail de chaque inscrit et le nombre total", async () => {
    mockedGetEventRegistrations.mockResolvedValue([
      registration(3, "Paula Participante", "paula@example.com"),
      registration(4, "Marc Martin", "marc@example.com"),
    ]);

    render(<EventParticipants eventId={1} />);

    expect(await screen.findByText("2 inscrits")).toBeInTheDocument();
    expect(mockedGetEventRegistrations).toHaveBeenCalledWith(1);

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(
      within(items[0]).getByText("Paula Participante"),
    ).toBeInTheDocument();
    expect(
      within(items[0]).getByRole("link", { name: "paula@example.com" }),
    ).toHaveAttribute("href", "mailto:paula@example.com");
    expect(within(items[1]).getByText("Marc Martin")).toBeInTheDocument();
    expect(within(items[1]).getByText("marc@example.com")).toBeInTheDocument();
  });

  it("[F09.1] accorde le total au singulier pour un seul inscrit", async () => {
    mockedGetEventRegistrations.mockResolvedValue([
      registration(3, "Paula Participante", "paula@example.com"),
    ]);

    render(<EventParticipants eventId={1} />);

    expect(await screen.findByText("1 inscrit")).toBeInTheDocument();
  });

  it("[F09.3] indique que personne n'est inscrit", async () => {
    render(<EventParticipants eventId={1} />);

    expect(
      await screen.findByText("Aucun participant inscrit pour le moment."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("[F09.2] affiche le message de l'API en cas de refus (403)", async () => {
    mockedGetEventRegistrations.mockRejectedValue(
      new ApiError(
        403,
        "Seul l'organisateur de l'événement peut voir la liste des participants",
      ),
    );

    render(<EventParticipants eventId={1} />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Seul l'organisateur de l'événement peut voir la liste des participants",
    );
  });
});
