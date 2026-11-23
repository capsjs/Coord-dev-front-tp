
import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { createEvent, getEventById, updateEvent } from "../api/events";
import type { EventFormData } from "../types/eventFormData";


const initialFormData: EventFormData = {
  title: "",
  description: "",
  date: "",
  location: "",
  price: 0,
  currency: "EUR",
};

function EventFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState<EventFormData>(initialFormData);
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    const fetchEvent = async () => {
      try {
        const event = await getEventById(Number(id));

        setFormData({
          title: event.title,
          description: event.description,
          date: new Date(
            new Date(event.date).getTime() -
              new Date(event.date).getTimezoneOffset() * 60000
          ).toISOString().slice(0, 16),          
          location: event.location,
          price: event.price,
          currency: event.currency,
        });
      } catch {
        setError("Impossible de récupérer cet événement.");
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: name === "price" ? Number(value) : value,
    }));
  };

 const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  setError("");
  setSubmitting(true);

  try {
    const payload = {
      ...formData,
      date: new Date(formData.date).toISOString(),
    };

    if (isEditMode) {
      await updateEvent(Number(id), payload);
    } else {
      await createEvent(payload);
    }

    navigate("/events");
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "Une erreur est survenue lors de l'enregistrement."
    );
  } finally {
    setSubmitting(false);
  }
};

  if (loading) {
    return <p>Chargement de l'événement...</p>;
  }

  return (
    <div>
      <h1>{isEditMode ? "Modifier un événement" : "Créer un événement"}</h1>

      {error && <p role="alert">{error}</p>}

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="title">Titre</label>
          <input
            id="title"
            name="title"
            type="text"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
          />
        </div>

        <div>
         <label htmlFor="date">Date et heure</label>
          <input
            id="date"
            name="date"
            type="datetime-local"
            value={formData.date}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label htmlFor="location">Lieu</label>
          <input
            id="location"
            name="location"
            type="text"
            value={formData.location}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label htmlFor="price">Prix</label>
          <input
            id="price"
            name="price"
            type="number"
            min="0"
            step="0.01"
            value={formData.price}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label htmlFor="currency">Devise</label>
          <select
            id="currency"
            name="currency"
            value={formData.currency}
            onChange={(e) =>
              setFormData((previousData) => ({
                ...previousData,
                currency: e.target.value,
              }))
            }
            required
          >
            <option value="EUR">EUR (€)</option>
            <option value="USD">USD ($)</option>
            <option value="GBP">GBP (£)</option>
          </select>
        </div>

        <button type="submit" disabled={submitting}>
          {submitting
            ? "Enregistrement..."
            : isEditMode
              ? "Enregistrer les modifications"
              : "Créer l'événement"}
        </button>
      </form>

      <p>
        <Link to="/events">Retour à la liste des événements</Link>
      </p>
    </div>
  );
}

export default EventFormPage;
