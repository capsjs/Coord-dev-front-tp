import type { Event } from "../types/event";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export async function getEvents(): Promise<Event[]> {
  const response = await fetch(`${API_URL}/events`);

  if (!response.ok) {
    throw new Error("Impossible de récupérer les événements");
  }

  return response.json();
}

export async function getEventById(id: number): Promise<Event> {
  const response = await fetch(`${API_URL}/events/${id}`);

  if (!response.ok) {
    throw new Error("Impossible de récupérer cet événement");
  }

  return response.json();
}

export async function createEvent(
  event: Omit<Event, "id">
): Promise<Event> {
  const response = await fetch(`${API_URL}/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(event),
  });

  if (!response.ok) {
    throw new Error("Impossible de créer l'événement");
  }

  return response.json();
}

export async function updateEvent(
  id: number,
  event: Omit<Event, "id">
): Promise<Event> {
  const response = await fetch(`${API_URL}/events/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(event),
  });

  if (!response.ok) {
    throw new Error("Impossible de modifier l'événement");
  }

  return response.json();
}

export async function deleteEvent(id: number): Promise<void> {
  const response = await fetch(`${API_URL}/events/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Impossible de supprimer l'événement");
  }
}