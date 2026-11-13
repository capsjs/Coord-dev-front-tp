import type { AuthResponse, Role, User } from '../types/user'
import { apiFetch } from './client'

export interface RegisterData {
  name: string
  email: string
  password: string
  role: Exclude<Role, 'admin'>
}

export interface LoginData {
  email: string
  password: string
}

export function registerRequest(data: RegisterData): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function loginRequest(data: LoginData): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function getMeRequest(): Promise<User> {
  return apiFetch<User>('/auth/me')
}
