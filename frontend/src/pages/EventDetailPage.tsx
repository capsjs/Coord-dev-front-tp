import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { getEventById, deleteEvent } from "../api/events";
import { useAuth } from "../auth/useAuth";
import { RegistrationAction } from "../components/RegistrationAction";
import type { Event } from "../types/event";

export function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function loadEvent() {
      try {
        setLoading(true);
        setError(null);

        if (!id || !Number.isInteger(Number(id))) {
          throw new Error("Identifiant invalide.");
        }

        const data = await getEventById(Number(id));
        setEvent(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Impossible de récupérer cet événement.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadEvent();
  }, [id]);

  // Vérification des permissions
  const canManage =
    event !== null &&
    (user?.role === "admin" ||
      (user?.role === "organizer" && Number(user.id) === event.organizerId));

  async function handleDelete() {
    // Protection supplémentaire côté composant
    if (!event || !canManage || deleting) return;

    const confirmed = window.confirm(
      "Es-tu sûr de vouloir supprimer cet événement ?",
    );

    if (!confirmed) return;

    try {
      setDeleting(true);
      setError(null);

      await deleteEvent(event.id);
      navigate("/events");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de supprimer cet événement.",
      );
    } finally {
      setDeleting(false);
    }
  }

  function formatPrice(price: number, currency: string) {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency,
    }).format(price);
  }

  if (loading) {
    return <p>Chargement de l'événement...</p>;
  }

  if (!event) {
    return (
      <section>
        <p className="error" role="alert">
          {error || "Événement introuvable."}
        </p>
        <Link to="/events">Retour aux événements</Link>
      </section>
    );
  }

  return (
    <section className="event-detail">
      <Link to="/events">← Retour aux événements</Link>

      <div className="event-detail-header">
        <h1>{event.title}</h1>

        {/* Actions réservées au propriétaire ou à l'admin */}
        {canManage && (
          <div className="event-detail-actions">
            <Link to={`/events/${event.id}/edit`} className="button-secondary">
              Modifier
            </Link>

            <button type="button" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Suppression..." : "Supprimer"}
            </button>
          </div>
        )}
      </div>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <div className="event-detail-content">
        <div>
          <h2>Description</h2>
          <p>{event.description}</p>
        </div>

        <div>
          <h2>Informations pratiques</h2>

          <p>
            <strong>Date et heure :</strong>{" "}
            {new Date(event.date).toLocaleString("fr-FR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>

          <p>
            <strong>Lieu :</strong> {event.location}
          </p>

          <p>
            <strong>Organisateur :</strong> {event.organizer.name}
          </p>

          <p>
            <strong>Prix :</strong> {formatPrice(event.price, event.currency)}
          </p>

          <RegistrationAction event={event} />
        </div>
      </div>
    </section>
  );
}
