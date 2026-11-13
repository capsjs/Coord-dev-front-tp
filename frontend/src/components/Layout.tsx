import { Link, NavLink, Outlet } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { RoleBadge } from './RoleBadge'

export function Layout() {
  const { user, logout } = useAuth()

  return (
    <>
      <header className="header">
        <Link to="/" className="logo">
          Coord<span>Events</span>
        </Link>
        <nav className="nav">
          <NavLink to="/events">Événements</NavLink>
          {user ? (
            <>
              <NavLink to="/profile" className="nav-user">
                {user.name} <RoleBadge role={user.role} />
              </NavLink>
              <button type="button" className="button-secondary" onClick={logout}>
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login">Connexion</NavLink>
              <Link to="/register" className="button">Inscription</Link>
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
