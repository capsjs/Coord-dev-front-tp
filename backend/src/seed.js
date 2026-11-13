import { config } from './config.js';
import { query } from './db.js';
import { createUser, findUserByEmail } from './users.js';

async function ensureUser(data) {
  if (await findUserByEmail(data.email)) return;
  await createUser(data);
  console.log(`[seed] Compte ${data.role} créé : ${data.email}`);
}

export async function seedAdmin() {
  const [admin] = await query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
  if (!admin) await ensureUser({ ...config.admin, role: 'admin' });
}

export async function seedDemo() {
  await ensureUser({ email: 'orga@events.local', password: 'orga1234', name: 'Olivia Orga', role: 'organizer' });
  await ensureUser({ email: 'participant@events.local', password: 'part1234', name: 'Paul Participant', role: 'participant' });
}
