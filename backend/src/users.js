import bcrypt from 'bcryptjs';
import { query } from './db.js';
import { badRequest, conflict, notFound } from './errors.js';

const SALT_ROUNDS = 10;

export const toPublicUser = (u) => ({
  id: u.id,
  email: u.email,
  name: u.name,
  role: u.role,
  createdAt: u.created_at,
  updatedAt: u.updated_at,
});

export const hashPassword = (password) => bcrypt.hash(password, SALT_ROUNDS);
export const checkPassword = (password, hash) => bcrypt.compare(password, hash);

export async function findUserById(id) {
  const [user] = await query('SELECT * FROM users WHERE id = ?', [id]);
  return user ?? null;
}

export async function findUserByEmail(email) {
  const [user] = await query('SELECT * FROM users WHERE email = ?', [email]);
  return user ?? null;
}

export async function getUserOr404(id) {
  const user = await findUserById(id);
  if (!user) throw notFound('Utilisateur introuvable');
  return user;
}

export async function createUser({ email, password, name, role }) {
  if (await findUserByEmail(email)) throw conflict('Un compte existe déjà avec cet email');
  const hash = await hashPassword(password);
  try {
    const result = await query(
      'INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)',
      [email, hash, name, role],
    );
    return findUserById(result.insertId);
  } catch (err) {
    // Deux inscriptions simultanées avec le même email : la contrainte UNIQUE tranche.
    if (err.code === 'ER_DUP_ENTRY') throw conflict('Un compte existe déjà avec cet email');
    throw err;
  }
}

export async function updateUser(id, { name, email }) {
  if (email) {
    const other = await findUserByEmail(email);
    if (other && other.id !== id) throw conflict('Un compte existe déjà avec cet email');
  }
  const fields = [];
  const params = [];
  if (name !== undefined) { fields.push('name = ?'); params.push(name); }
  if (email !== undefined) { fields.push('email = ?'); params.push(email); }
  if (fields.length > 0) {
    try {
      await query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, [...params, id]);
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') throw conflict('Un compte existe déjà avec cet email');
      throw err;
    }
  }
  return getUserOr404(id);
}

export async function countAdmins() {
  const [{ n }] = await query("SELECT COUNT(*) AS n FROM users WHERE role = 'admin'");
  return Number(n);
}

export async function assertNotLastAdmin(user, action) {
  if (user.role === 'admin' && (await countAdmins()) <= 1) {
    throw badRequest(`Impossible de ${action} : c'est le dernier administrateur`);
  }
}
