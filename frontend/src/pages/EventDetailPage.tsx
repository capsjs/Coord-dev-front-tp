import { useParams } from 'react-router'

// Contenu à l'incrément 4 (F05 : détail d'un événement)
export function EventDetailPage() {
  const { id } = useParams()

  return (
    <section>
      <h1>Événement n° {id}</h1>
      <p>Le détail de l'événement arrive bientôt.</p>
    </section>
  )
}
