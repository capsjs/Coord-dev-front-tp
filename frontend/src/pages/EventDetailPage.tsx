import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { getEventById, deleteEvent } from '../api/events'
import type { Event } from '../types/event'

export function EventDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    async function loadEvent() {
      try {
        if (!id || !Number.isInteger(Number(id))) {
          throw new Error('Identifiant invalide.')
        }

        const data = await getEventById(Number(id))
        setEvent(data)
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Impossible de récupérer cet événement.'
        )
      } finally {
        setLoading(false)
      }
    }

    loadEvent()
  }, [id])

  async function handleDelete() {
    if (!event) return

    const confirmed = window.confirm(
      'Es-tu sûr de vouloir supprimer cet événement ?'
    )

    if (!confirmed) return

    try {
      setDeleting(true)
      await deleteEvent(event.id)
      navigate('/events')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Impossible de supprimer cet événement.'
      )
      setDeleting(false)
    }
  }

  function formatPrice(price: number, currency: string) {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency,
    }).format(price)
  }

  if (loading) {
    return <p>Chargement de l'événement...</p>
  }

  if (error || !event) {
    return (
      <section>
        <p className="error">
          {error || 'Événement introuvable.'}
        </p>
        <Link to="/events">Retour aux événements</Link>
      </section>
    )
  }

  return (
    <section className="event-detail">
      <Link to="/events">
        ← Retour aux événements
      </Link>

      <div className="event-detail-header">
        <h1>{event.title}</h1>

        <div className="event-detail-actions">
          <Link
            to={`/events/${event.id}/edit`}
            className="button-secondary"
          >
            Modifier
          </Link>

          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? 'Suppression...' : 'Supprimer'}
          </button>
        </div>
      </div>

      <div className="event-detail-content">
        <div>
          <h2>Description</h2>
          <p>{event.description}</p>
        </div>

        <div>
          <h2>Informations pratiques</h2>

          <p>
            <strong>Date :</strong>{' '}
            {new Date(event.date).toLocaleDateString('fr-FR')}
          </p>

          <p>
            <strong>Lieu :</strong> {event.location}
          </p>

          <p>
            <strong>Prix :</strong>{' '}
            {formatPrice(event.price, event.currency)}
          </p>
        </div>
      </div>
    </section>
  )
}
