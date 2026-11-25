import { describe, expect, it } from "vitest";

import { getRegistrationStatus } from "../../src/components/registrationStatus";

import type { Event } from "../../src/types/event";
import type { User } from "../../src/types/user";

const ONE_DAY = 24 * 60 * 60 * 1000;

// Dates calculées à partir d'aujourd'hui pour que les tests ne vieillissent pas
const futureEvent: Event = {
  id: 1,
  title: "Conférence React",
  description: "Découverte de React",
  date: new Date(Date.now() + 7 * ONE_DAY).toISOString(),
  location: "Montpellier",
  price: 15,
  currency: "EUR",
  organizerId: 2,
  organizer: { id: 2, name: "Jean Dupont" },
};

const pastEvent: Event = {
  ...futureEvent,
  date: new Date(Date.now() - 7 * ONE_DAY).toISOString(),
};

const participant: User = {
  id: 3,
  name: "Paula Participante",
  email: "paula@example.com",
  role: "participant",
  createdAt: "2026-11-01T10:00:00.000Z",
  updatedAt: "2026-11-01T10:00:00.000Z",
};

describe("getRegistrationStatus", () => {
  it("[F06.5] renvoie past pour un événement passé, même pour un visiteur", () => {
    expect(getRegistrationStatus(null, pastEvent, false)).toBe("past");
    expect(getRegistrationStatus(participant, pastEvent, true)).toBe("past");
  });

  it("[F06.4] renvoie visitor si personne n'est connecté", () => {
    expect(getRegistrationStatus(null, futureEvent, false)).toBe("visitor");
  });

  it("renvoie not-allowed pour un organisateur ou un admin", () => {
    const organizer: User = { ...participant, role: "organizer" };
    const admin: User = { ...participant, role: "admin" };

    expect(getRegistrationStatus(organizer, futureEvent, false)).toBe(
      "not-allowed",
    );
    expect(getRegistrationStatus(admin, futureEvent, false)).toBe(
      "not-allowed",
    );
  });

  it("[F07.1] renvoie registered pour un participant déjà inscrit", () => {
    expect(getRegistrationStatus(participant, futureEvent, true)).toBe(
      "registered",
    );
  });

  it("[F06.1] renvoie not-registered pour un participant pas encore inscrit", () => {
    expect(getRegistrationStatus(participant, futureEvent, false)).toBe(
      "not-registered",
    );
  });
});
