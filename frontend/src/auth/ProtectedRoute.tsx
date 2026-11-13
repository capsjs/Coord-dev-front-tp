import { Navigate, Outlet, useLocation } from 'react-router'
import type { Role } from '../types/user'
import { useAuth } from './useAuth'

interface ProtectedRouteProps {
  // Si fourni, seuls ces rôles peuvent accéder aux pages enfants
  roles?: Role[]
}

export function ProtectedRoute({ roles }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <p>Chargement…</p>

  if (!user) {
    // On mémorise la page demandée pour y revenir après la connexion
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (roles && !roles.includes(user.role)) {
    return <p className="error">Vous n'avez pas accès à cette page.</p>
  }

  return <Outlet />
}
