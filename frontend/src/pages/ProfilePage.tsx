import { useAuth } from '../auth/useAuth'

export function ProfilePage() {
  const { user } = useAuth()
  // ProtectedRoute garantit qu'un utilisateur est connecté ici
  if (!user) return null

  return (
    <section className="card">
      <h1>Mon profil</h1>
      <dl>
        <dt>Nom</dt>
        <dd>{user.name}</dd>
        <dt>Email</dt>
        <dd>{user.email}</dd>
        <dt>Rôle</dt>
        <dd>{user.role}</dd>
      </dl>
    </section>
  )
}
