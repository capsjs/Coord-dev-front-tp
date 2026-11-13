import { Link } from 'react-router'

export function HomePage() {
  return (
    <section>
      <h1>EventFlow</h1>
      <p>Organisez vos événements et inscrivez-vous à ceux qui vous intéressent.</p>
      <Link to="/events">Voir les événements</Link>
    </section>
  )
}
