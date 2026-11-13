import { createContext } from 'react'
import type { LoginData, RegisterData } from '../api/auth'
import type { User } from '../types/user'

export interface AuthContextValue {
  user: User | null
  // true tant qu'on vérifie le token enregistré au démarrage
  loading: boolean
  login: (data: LoginData) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
