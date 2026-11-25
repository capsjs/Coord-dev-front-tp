import { apiFetch } from "./client";
import type { Event } from "../types/event";
import type { Registration } from "../types/registration";

// S'inscrire à un événement (l'API identifie l'utilisateur grâce au token)
export async function registerToEvent(eventId: number): Promise<Registration> {
  return apiFetch<Registration>(`/events/${eventId}/registrations`, {
    method: "POST",
  });
}

// Se désinscrire d'un événement
export async function unregisterFromEvent(eventId: number): Promise<void> {
  return apiFetch<void>(`/events/${eventId}/registrations/me`, {
    method: "DELETE",
  });
}

// Lister les événements auxquels je suis inscrit
export async function getMyRegistrations(): Promise<Event[]> {
  return apiFetch<Event[]>("/auth/me/registrations");
}
