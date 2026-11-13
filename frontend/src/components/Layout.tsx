import { Link, NavLink, Outlet } from 'react-router'
import { useAuth } from '../auth/useAuth'

const ROLE_LABELS = {
  admin: 'Admin',
  organizer: 'Organisateur',
  participant: 'Participant',
}

export function Layout() {
  const { user, logout } = useAuth()

  return (
    <>
      <header className="header">
        <Link to="/" className="logo">EventFlow</Link>
        <nav className="nav">
          <NavLink to="/events">Événements</NavLink>
          {user ? (
            <>
              <NavLink to="/profile">
                {user.name} ({ROLE_LABELS[user.role]})
              </NavLink>
              <button type="button" onClick={logout}>Déconnexion</button>
            </>
          ) : (
            <>
              <NavLink to="/login">Connexion</NavLink>
              <NavLink to="/register">Inscription</NavLink>
            </>
          )}
        </nav>
      </header>
      <main className="main">
        <Outlet />
      </main>
    </>
  )
}
