import { Link } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { usePageTitle } from '../hooks/usePageTitle'

export function HomePage() {
  usePageTitle('Accueil')
  const { user } = useAuth()

  return (
    <>
      <section className="hero">
        <h1>
          Coord<span>Events</span>
        </h1>
        <p>Le gestionnaire d'événements : organisez, consultez, inscrivez-vous.</p>
        <div className="hero-actions">
          <Link to="/events" className="button">Voir les événements</Link>
          {!user && <Link to="/register" className="button-secondary">Créer un compte</Link>}
        </div>
      </section>

      <section className="roles">
        <article className="role-card">
          <span className="badge badge-organizer">Organisateur</span>
          <p>Crée et gère ses événements.</p>
        </article>
        <article className="role-card">
          <span className="badge badge-participant">Participant</span>
          <p>Consulte les événements et s'y inscrit.</p>
        </article>
        <article className="role-card">
          <span className="badge badge-admin">Admin</span>
          <p>Gère les comptes de la plateforme.</p>
        </article>
      </section>
    </>
  )
}
