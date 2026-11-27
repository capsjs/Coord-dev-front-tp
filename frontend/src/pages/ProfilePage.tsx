import { useAuth } from '../auth/useAuth'
import { RoleBadge } from '../components/RoleBadge'
import { usePageTitle } from '../hooks/usePageTitle'

export function ProfilePage() {
  usePageTitle('Mon profil')
  const { user } = useAuth()
  // ProtectedRoute garantit qu'un utilisateur est connecté ici
  if (!user) return null

  return (
    <section className="card">
      <h1>Mon profil</h1>
      <dl className="details">
        <dt>Nom</dt>
        <dd>{user.name}</dd>
        <dt>Email</dt>
        <dd>{user.email}</dd>
        <dt>Rôle</dt>
        <dd><RoleBadge role={user.role} /></dd>
      </dl>
    </section>
  )
}
