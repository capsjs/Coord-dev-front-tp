import { Link } from 'react-router'
import { usePageTitle } from '../hooks/usePageTitle'

export function NotFoundPage() {
  usePageTitle('Page introuvable')
  return (
    <section>
      <h1>Page introuvable</h1>
      <Link to="/">Retour à l'accueil</Link>
    </section>
  )
}
