import { apiFetch } from "./client";
import type { Event } from "../types/event";
import type { EventFormData } from "../types/eventFormData";

// Récupérer tous les événements
export async function getEvents(): Promise<Event[]> {
  return apiFetch<Event[]>("/events");
}

// Récupérer un événement
export async function getEventById(id: number): Promise<Event> {
  return apiFetch<Event>(`/events/${id}`);
}

// Créer un événement
export async function createEvent(event: EventFormData): Promise<Event> {
  return apiFetch<Event>("/events", {
    method: "POST",
    body: JSON.stringify(event),
  });
}

// Modifier un événement
export async function updateEvent(
  id: number,
  event: EventFormData,
): Promise<Event> {
  return apiFetch<Event>(`/events/${id}`, {
    method: "PUT",
    body: JSON.stringify(event),
  });
}

// Supprimer un événement
export async function deleteEvent(id: number): Promise<void> {
  return apiFetch<void>(`/events/${id}`, {
    method: "DELETE",
  });
}
