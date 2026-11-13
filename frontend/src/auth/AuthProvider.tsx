import { useEffect, useState, type ReactNode } from 'react'
import { getMeRequest, loginRequest, registerRequest, type LoginData, type RegisterData } from '../api/auth'
import { clearToken, getToken, saveToken } from '../api/client'
import type { AuthResponse, User } from '../types/user'
import { AuthContext } from './authContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(getToken() !== null)

  // Au chargement de l'app : si un token est enregistré, on récupère l'utilisateur
  useEffect(() => {
    if (!getToken()) return
    getMeRequest()
      .then(setUser)
      .catch(() => clearToken()) // token expiré ou invalide
      .finally(() => setLoading(false))
  }, [])

  function startSession({ token, user }: AuthResponse) {
    saveToken(token)
    setUser(user)
  }

  async function login(data: LoginData) {
    startSession(await loginRequest(data))
  }

  async function register(data: RegisterData) {
    startSession(await registerRequest(data))
  }

  function logout() {
    clearToken()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
