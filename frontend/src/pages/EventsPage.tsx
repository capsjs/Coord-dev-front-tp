import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { getEvents, deleteEvent } from "../api/events";
import type { Event } from "../types/event";
import { useAuth } from "../auth/useAuth";

export function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const { user } = useAuth();

  const navigate = useNavigate();

  useEffect(() => {
    async function loadEvents() {
      try {
        setLoading(true);
        setError(null);

        const data = await getEvents();
        setEvents(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Une erreur est survenue.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadEvents();
  }, []);

  async function handleDelete(id: number) {
    const confirmed = window.confirm(
      "Es-tu sûr de vouloir supprimer cet événement ?",
    );

    if (!confirmed) return;

    try {
      setDeletingId(id);
      setError(null);

      await deleteEvent(id);

      setEvents((currentEvents) =>
        currentEvents.filter((event) => event.id !== id),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de supprimer cet événement.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  // Formater le prix selon la devise
  function formatPrice(price: number, currency: string) {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency,
    }).format(price);
  }

  if (loading) {
    return <p>Chargement des événements...</p>;
  }

  return (
    <section>
      <div className="events-header">
        <div>
          <h1>Événements</h1>
        </div>

        {user && ["organizer", "admin"].includes(user.role) && (
          <Link to="/events/new" className="button">
            Créer un événement
          </Link>
        )}
      </div>

      {error && <p className="error">{error}</p>}

      {events.length === 0 ? (
        <p>Aucun événement pour le moment.</p>
      ) : (
        <div className="events-list">
          {events.map((event) => (
            <article className="event-card" key={event.id}>
              <div className="event-card-content">
                <h2>{event.title}</h2>

                <p>{event.description}</p>

                <p>
                  <strong>Date :</strong>{" "}
                  {new Date(event.date).toLocaleString("fr-FR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                </p>

                <p>
                  <strong>Lieu :</strong> {event.location}
                </p>

                <p>
                  <strong>Organisateur :</strong> {event.organizer.name}
                </p>

                <p>
                  <strong>Prix :</strong>{" "}
                  {formatPrice(event.price, event.currency)}
                </p>
              </div>

              <div className="event-card-actions">
                <button
                  type="button"
                  onClick={() => navigate(`/events/${event.id}`)}
                >
                  Voir le détail
                </button>

                <Link
                  to={`/events/${event.id}/edit`}
                  className="button-secondary"
                >
                  Modifier
                </Link>

                <button
                  type="button"
                  className="button-secondary"
                  disabled={deletingId === event.id}
                  onClick={() => handleDelete(event.id)}
                >
                  {deletingId === event.id ? "Suppression..." : "Supprimer"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
