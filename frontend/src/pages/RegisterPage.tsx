import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import type { RegisterData } from '../api/auth'
import { ApiError } from '../api/client'
import { useAuth } from '../auth/useAuth'
import { usePageTitle } from '../hooks/usePageTitle'

// Mêmes règles que le back (backend/src/validation.js)
const PASSWORD_MIN = 8
const NAME_MIN = 2

export function RegisterPage() {
  usePageTitle('Créer un compte')
  const { register } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState<RegisterData>({
    name: '',
    email: '',
    password: '',
    role: 'participant',
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function updateField(field: keyof RegisterData, value: string) {
    setForm((previous) => ({ ...previous, [field]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await register(form)
      navigate('/events', { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Une erreur est survenue')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="card">
      <h1>Créer un compte</h1>
      <form onSubmit={handleSubmit} className="form">
        <label>
          Nom
          <input value={form.name} onChange={(e) => updateField('name', e.target.value)} required minLength={NAME_MIN} maxLength={100} autoComplete="name" />
        </label>
        <label>
          Email
          <input type="email" value={form.email} onChange={(e) => updateField('email', e.target.value)} required autoComplete="email" />
        </label>
        <label>
          Mot de passe ({PASSWORD_MIN} caractères minimum)
          <input type="password" value={form.password} onChange={(e) => updateField('password', e.target.value)} required minLength={PASSWORD_MIN} maxLength={128} autoComplete="new-password" />
        </label>
        <fieldset>
          <legend>Je suis</legend>
          <label className="inline">
            <input type="radio" name="role" checked={form.role === 'participant'} onChange={() => updateField('role', 'participant')} />
            Participant
          </label>
          <label className="inline">
            <input type="radio" name="role" checked={form.role === 'organizer'} onChange={() => updateField('role', 'organizer')} />
            Organisateur
          </label>
        </fieldset>
        {error && <p className="error" role="alert">{error}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? 'Création…' : 'Créer mon compte'}
        </button>
      </form>
      <p>
        Déjà un compte ? <Link to="/login">Se connecter</Link>
      </p>
    </section>
  )
}
