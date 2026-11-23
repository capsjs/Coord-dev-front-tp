// Prérequis : l'API doit tourner (make up) avec SEED_DEMO=true.
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

import jwt from 'jsonwebtoken';

import { API, ADMIN, api, unique, register, withDb } from './helpers.js';

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-a-changer';

describe('Inscription', () => {
  it('crée un participant par défaut et renvoie un jeton [F08a.1] [F08a.4]', async () => {
    const email = unique();
    const res = await api('POST', '/api/auth/register', { body: { name: 'Alice', email, password: 'motdepasse123' } });
    assert.equal(res.status, 201);
    assert.ok(res.body.token);
    assert.equal(res.body.user.role, 'participant');
    assert.equal(res.body.user.email, email);
    assert.equal(res.body.user.password_hash, undefined, 'le hash ne doit jamais sortir');
  });

  it('stocke le mot de passe haché (bcrypt), jamais en clair [F08a.3]', async () => {
    const { user, password } = await register();
    const [row] = await withDb(async (db) => (await db.query('SELECT password_hash FROM users WHERE id = ?', [user.id]))[0]);
    assert.notEqual(row.password_hash, password);
    assert.ok(!row.password_hash.includes(password), 'le mot de passe ne doit pas apparaître dans le hash');
    assert.match(row.password_hash, /^\$2[aby]\$\d{2}\$/, 'format bcrypt attendu');
  });

  it('accepte le rôle organizer', async () => {
    const { user } = await register('organizer');
    assert.equal(user.role, 'organizer');
  });

  it("refuse de s'inscrire en admin", async () => {
    const res = await api('POST', '/api/auth/register', {
      body: { name: 'Pirate', email: unique(), password: 'motdepasse123', role: 'admin' },
    });
    assert.equal(res.status, 400);
  });

  it('refuse un email déjà utilisé, sans tenir compte de la casse [F08a.2]', async () => {
    const { email } = await register();
    const res = await api('POST', '/api/auth/register', {
      body: { name: 'Doublon', email: email.toUpperCase(), password: 'motdepasse123' },
    });
    assert.equal(res.status, 409);
  });

  it('valide les champs [F08a.1]', async () => {
    const cases = [
      { name: 'A', email: unique(), password: 'motdepasse123' },
      { name: 'Alice', email: 'pas-un-email', password: 'motdepasse123' },
      { name: 'Alice', email: unique(), password: 'court' },
      {},
    ];
    for (const body of cases) {
      const res = await api('POST', '/api/auth/register', { body });
      assert.equal(res.status, 400, `attendu 400 pour ${JSON.stringify(body)}`);
      assert.ok(res.body.error);
    }
  });
});

describe('Connexion', () => {
  it("connecte l'admin créé au démarrage [F08a.4]", async () => {
    const res = await api('POST', '/api/auth/login', { body: ADMIN });
    assert.equal(res.status, 200);
    assert.equal(res.body.user.role, 'admin');
  });

  it('refuse un mauvais mot de passe ou un email inconnu avec le même message [F08a.5]', async () => {
    const wrongPwd = await api('POST', '/api/auth/login', { body: { email: ADMIN.email, password: 'mauvais' } });
    const unknown = await api('POST', '/api/auth/login', { body: { email: unique(), password: 'mauvais' } });
    assert.equal(wrongPwd.status, 401);
    assert.equal(unknown.status, 401);
    assert.equal(wrongPwd.body.error, unknown.body.error);
  });

  it('distingue une session expirée (pour que le front redirige vers la connexion) [F08b.3]', async () => {
    const { user } = await register();
    const expired = jwt.sign({ sub: user.id, role: user.role, exp: Math.floor(Date.now() / 1000) - 60 }, JWT_SECRET);
    const res = await api('GET', '/api/auth/me', { token: expired });
    assert.equal(res.status, 401);
    assert.equal(res.body.error, 'Session expirée : reconnectez-vous');
  });

  it('refuse un jeton falsifié [F08b.4]', async () => {
    const { user } = await register();
    const forged = jwt.sign({ sub: user.id, role: 'admin' }, 'pas-le-bon-secret');
    const res = await api('GET', '/api/auth/me', { token: forged });
    assert.equal(res.status, 401);
    assert.equal(res.body.error, 'Jeton invalide');
  });

  it('exige un jeton valide sur /me [F08b.1]', async () => {
    assert.equal((await api('GET', '/api/auth/me')).status, 401);
    assert.equal((await api('GET', '/api/auth/me', { token: 'faux.jeton.jwt' })).status, 401);
  });
});

describe('Mon compte', () => {
  it('lit et modifie le profil', async () => {
    const { token } = await register();
    const me = await api('GET', '/api/auth/me', { token });
    assert.equal(me.status, 200);

    const newEmail = unique();
    const upd = await api('PATCH', '/api/auth/me', { token, body: { name: 'Nouveau Nom', email: newEmail } });
    assert.equal(upd.status, 200);
    assert.equal(upd.body.name, 'Nouveau Nom');
    assert.equal(upd.body.email, newEmail);

    assert.equal((await api('PATCH', '/api/auth/me', { token, body: {} })).status, 400);
    assert.equal((await api('PATCH', '/api/auth/me', { token, body: { email: ADMIN.email } })).status, 409);
  });

  it('change le mot de passe', async () => {
    const { token, email, password } = await register();
    const bad = await api('PUT', '/api/auth/me/password', { token, body: { currentPassword: 'faux', newPassword: 'nouveaumdp123' } });
    assert.equal(bad.status, 401);

    const ok = await api('PUT', '/api/auth/me/password', { token, body: { currentPassword: password, newPassword: 'nouveaumdp123' } });
    assert.equal(ok.status, 204);
    assert.equal((await api('POST', '/api/auth/login', { body: { email, password } })).status, 401);
    assert.equal((await api('POST', '/api/auth/login', { body: { email, password: 'nouveaumdp123' } })).status, 200);
  });

  it('supprime son compte (mot de passe exigé) et invalide le jeton', async () => {
    const { token, password } = await register();
    assert.equal((await api('DELETE', '/api/auth/me', { token, body: { password: 'faux' } })).status, 401);
    assert.equal((await api('DELETE', '/api/auth/me', { token, body: { password } })).status, 204);
    assert.equal((await api('GET', '/api/auth/me', { token })).status, 401);
  });
});

describe('Administration des comptes', () => {
  let adminToken;
  before(async () => {
    adminToken = (await api('POST', '/api/auth/login', { body: ADMIN })).body.token;
  });

  it('est interdite aux non-admins [F08b.4]', async () => {
    const { token } = await register('organizer');
    assert.equal((await api('GET', '/api/admin/users', { token })).status, 403);
    assert.equal((await api('GET', '/api/admin/users')).status, 401);
  });

  it('liste et filtre les comptes par rôle', async () => {
    const all = await api('GET', '/api/admin/users', { token: adminToken });
    assert.equal(all.status, 200);
    assert.ok(all.body.length >= 3);
    const orgas = await api('GET', '/api/admin/users?role=organizer', { token: adminToken });
    assert.ok(orgas.body.every((u) => u.role === 'organizer'));
    assert.equal((await api('GET', '/api/admin/users?role=roi', { token: adminToken })).status, 400);
  });

  it("change le rôle d'un compte, pris en compte immédiatement", async () => {
    const { token, user } = await register();
    const res = await api('PATCH', `/api/admin/users/${user.id}`, { token: adminToken, body: { role: 'organizer' } });
    assert.equal(res.status, 200);
    assert.equal(res.body.role, 'organizer');
    assert.equal((await api('GET', '/api/auth/me', { token })).body.role, 'organizer');
  });

  it("protège l'admin contre lui-même", async () => {
    const me = (await api('GET', '/api/auth/me', { token: adminToken })).body;
    assert.equal((await api('PATCH', `/api/admin/users/${me.id}`, { token: adminToken, body: { role: 'participant' } })).status, 400);
    assert.equal((await api('DELETE', `/api/admin/users/${me.id}`, { token: adminToken })).status, 400);
  });

  it("supprime un autre admin tant qu'il en reste au moins un", async () => {
    // Admin temporaire créé pour le test : l'admin de départ n'est jamais modifié.
    const { user } = await register();
    const promoted = await api('PATCH', `/api/admin/users/${user.id}`, { token: adminToken, body: { role: 'admin' } });
    assert.equal(promoted.body.role, 'admin');
    assert.equal((await api('DELETE', `/api/admin/users/${user.id}`, { token: adminToken })).status, 204);
  });

  it('supprime un compte', async () => {
    const { user } = await register();
    assert.equal((await api('DELETE', `/api/admin/users/${user.id}`, { token: adminToken })).status, 204);
    assert.equal((await api('GET', `/api/admin/users/${user.id}`, { token: adminToken })).status, 404);
  });
});

describe('Divers', () => {
  it('sert la doc Swagger', async () => {
    const spec = await api('GET', '/api/docs.json');
    assert.equal(spec.status, 200);
    assert.equal(spec.body.openapi, '3.0.3');
    const ui = await fetch(`${API}/api/docs/`);
    assert.equal(ui.status, 200);
  });

  it('renvoie du JSON pour une route inconnue et un JSON invalide [CT.3]', async () => {
    assert.equal((await api('GET', '/api/nexiste-pas')).status, 404);
    const res = await fetch(`${API}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{oups' });
    assert.equal(res.status, 400);
  });
});
