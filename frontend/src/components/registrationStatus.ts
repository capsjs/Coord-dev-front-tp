import type { Event } from "../types/event";
import type { User } from "../types/user";

export type RegistrationStatus =
  | "past"
  | "visitor"
  | "not-allowed"
  | "registered"
  | "full"
  | "not-registered";

// Décide quoi afficher sur la fiche selon l'événement et la personne connectée
export function getRegistrationStatus(
  user: User | null,
  event: Event,
  isRegistered: boolean,
): RegistrationStatus {
  // Un événement passé est fermé pour tout le monde, visiteurs compris
  if (new Date(event.date) < new Date()) return "past";
  if (!user) return event.remainingSeats === 0 ? "full" : "visitor";
  // Le contrat réserve l'inscription au rôle participant (403 sinon)
  if (user.role !== "participant") return "not-allowed";
  if (isRegistered) return "registered";
  if (event.remainingSeats === 0) return "full";
  return "not-registered";
}
