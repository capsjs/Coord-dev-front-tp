import { useEffect, useState } from "react";
import { getEventRegistrations } from "../api/registrations";
import type { EventRegistration } from "../types/registration";

interface EventParticipantsProps {
  eventId: number;
}

function formatParticipantCount(count: number): string {
  return `${count} inscrit${count > 1 ? "s" : ""}`;
}

export function EventParticipants({ eventId }: EventParticipantsProps) {
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRegistrations() {
      try {
        setLoading(true);
        setError(null);
        setRegistrations(await getEventRegistrations(eventId));
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Impossible de récupérer la liste des participants.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadRegistrations();
  }, [eventId]);

  return (
    <section
      className="event-participants"
      aria-labelledby="participants-title"
    >
      <h2 id="participants-title">Participants</h2>

      {loading ? (
        <p>Chargement des participants...</p>
      ) : error ? (
        <p className="error" role="alert">
          {error}
        </p>
      ) : registrations.length === 0 ? (
        <p>Aucun participant inscrit pour le moment.</p>
      ) : (
        <>
          <p className="event-participants-count">
            {formatParticipantCount(registrations.length)}
          </p>
          <ul className="event-participants-list">
            {registrations.map(({ user }) => (
              <li key={user.id}>
                <span>{user.name}</span>
                <a href={`mailto:${user.email}`}>{user.email}</a>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
