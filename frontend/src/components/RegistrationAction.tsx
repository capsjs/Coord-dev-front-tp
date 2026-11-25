import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import { ApiError } from "../api/client";
import {
  getMyRegistrations,
  registerToEvent,
  unregisterFromEvent,
} from "../api/registrations";
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
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

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

  async function handleRegister() {
    // Évite d'envoyer deux requêtes sur un double clic
    if (submitting) return;

    try {
      setSubmitting(true);
      setMessage(null);
      setActionError(null);

      await registerToEvent(event.id);
      setIsRegistered(true);
      setMessage("Inscription confirmée.");
    } catch (err) {
      // 409 : déjà inscrit (autre onglet par exemple), on aligne le bouton
      if (err instanceof ApiError && err.status === 409) {
        setIsRegistered(true);
      }
      setActionError(
        err instanceof Error ? err.message : "Impossible de vous inscrire.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUnregister() {
    if (submitting) return;

    try {
      setSubmitting(true);
      setMessage(null);
      setActionError(null);

      await unregisterFromEvent(event.id);
      setIsRegistered(false);
      setMessage("Désinscription confirmée.");
    } catch (err) {
      // 404 : déjà désinscrit (autre onglet par exemple), on aligne le bouton
      if (err instanceof ApiError && err.status === 404) {
        setIsRegistered(false);
      }
      setActionError(
        err instanceof Error ? err.message : "Impossible de vous désinscrire.",
      );
    } finally {
      setSubmitting(false);
    }
  }

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
          <button
            type="button"
            className="button-secondary"
            onClick={handleUnregister}
            disabled={submitting}
          >
            {submitting ? "Désinscription..." : "Se désinscrire"}
          </button>
          <ActionFeedback message={message} error={actionError} />
        </div>
      );

    case "not-registered":
      return (
        <div className="event-registration">
          <button type="button" onClick={handleRegister} disabled={submitting}>
            {submitting ? "Inscription..." : "S'inscrire"}
          </button>
          <ActionFeedback message={message} error={actionError} />
        </div>
      );

    case "not-allowed":
      return null;
  }
}

interface ActionFeedbackProps {
  message: string | null;
  error: string | null;
}

// Retour affiché sous le bouton après une action
function ActionFeedback({ message, error }: ActionFeedbackProps) {
  if (error) {
    return (
      <p className="error" role="alert">
        {error}
      </p>
    );
  }

  if (message) {
    return <p role="status">{message}</p>;
  }

  return null;
}
