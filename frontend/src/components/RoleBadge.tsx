import type { Role } from '../types/user'

// Libellés des rôles définis par le back (voir README : admin, organizer, participant)
const ROLE_LABELS: Record<Role, string> = {
  admin: 'Admin',
  organizer: 'Organisateur',
  participant: 'Participant',
}

export function RoleBadge({ role }: { role: Role }) {
  return <span className={`badge badge-${role}`}>{ROLE_LABELS[role]}</span>
}
