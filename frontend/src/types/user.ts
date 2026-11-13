// Calqué sur toPublicUser() du back (backend/src/users.js)
export type Role = 'admin' | 'organizer' | 'participant'

export interface User {
  id: number
  name: string
  email: string
  role: Role
  createdAt: string
  updatedAt: string
}

// Réponse de POST /auth/login et POST /auth/register
export interface AuthResponse {
  token: string
  user: User
}
