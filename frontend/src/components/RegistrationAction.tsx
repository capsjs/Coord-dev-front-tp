import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import { getMyRegistrations } from "../api/registrations";
import { useAuth } from "../auth/useAuth";
import type { Event } from "../types/event";
import { getRegistrationStatus } from "./registrationStatus";

interface RegistrationActionProps {
  event: Event;
}

// Bloc « Inscription » de la fiche : affiche le bouton adapté à la situation
export function RegistrationAction({ event }: RegistrationActionProps) {
  const { user } = useAuth();
  const location = useLocation();

  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isParticipant = user?.role === "participant";

  // Seul un participant a besoin de savoir s'il est déjà inscrit
  useEffect(() => {
    if (!isParticipant) return;

    async function loadRegistrations() {
      try {
        setLoading(true);
        setError(null);
        const myEvents = await getMyRegistrations();
        setIsRegistered(myEvents.some((myEvent) => myEvent.id === event.id));
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Impossible de vérifier votre inscription.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadRegistrations();
  }, [isParticipant, event.id]);

  if (loading) {
    return <p>Vérification de votre inscription...</p>;
  }

  if (error) {
    return (
      <p className="error" role="alert">
        {error}
      </p>
    );
  }

  const status = getRegistrationStatus(user, event, isRegistered);

  switch (status) {
    case "past":
      return <p>Cet événement est terminé.</p>;

    case "visitor":
      // On mémorise la fiche pour y revenir après la connexion
      return (
        <Link to="/login" state={{ from: location.pathname }} className="button">
          S'inscrire
        </Link>
      );

    case "registered":
      return (
        <div className="event-registration">
          <p>Vous êtes inscrit à cet événement.</p>
          <button type="button" className="button-secondary">
            Se désinscrire
          </button>
        </div>
      );

    case "not-registered":
      return <button type="button">S'inscrire</button>;

    case "not-allowed":
      return null;
  }
}
