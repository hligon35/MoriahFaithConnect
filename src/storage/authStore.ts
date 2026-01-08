import AsyncStorage from '@react-native-async-storage/async-storage';

export type AuthRole = 'admin' | 'member';

export type AuthUser = {
  email: string;
  role: AuthRole;
  password: string;
  createdAtIso: string;
};

export type AuthSession = {
  email: string;
  signedInAtIso: string;
};

const USERS_KEY = 'mfc.auth.users.v1';
const SESSION_KEY = 'mfc.auth.session.v1';

const seededUsers: AuthUser[] = [
  {
    email: 'admin@example.com',
    role: 'admin',
    password: 'Admin123!',
    createdAtIso: new Date().toISOString(),
  },
  {
    email: 'member@example.com',
    role: 'member',
    password: 'Member123!',
    createdAtIso: new Date().toISOString(),
  },
];

export function normalizeEmail(input: unknown) {
  if (typeof input !== 'string') return '';
  const raw = input.trim().toLowerCase();
  if (!raw) return raw;
  // Convenience: allow entering seeded identities without the domain.
  if (!raw.includes('@') && (raw === 'admin' || raw === 'member')) return `${raw}@example.com`;
  return raw;
}

function legacyUsernameToEmail(input: unknown) {
  if (typeof input !== 'string') return '';
  const raw = input.trim().toLowerCase();
  if (!raw) return '';
  if (raw.includes('@')) return raw;
  // Legacy behavior: usernames were treated as local-part.
  return `${raw}@example.com`;
}

function migrateUsers(rawUsers: any): { users: AuthUser[]; changed: boolean } {
  if (!Array.isArray(rawUsers)) return { users: [], changed: true };

  let changed = false;
  const users: AuthUser[] = [];

  for (const u of rawUsers) {
    const email =
      typeof u?.email === 'string' && u.email.trim()
        ? normalizeEmail(u.email)
        : legacyUsernameToEmail(u?.username);
    if (!email) {
      changed = true;
      continue;
    }

    const role: AuthRole = u?.role === 'admin' || u?.role === 'member' ? u.role : 'member';
    const password = typeof u?.password === 'string' ? u.password : '';
    const createdAtIso =
      typeof u?.createdAtIso === 'string' && u.createdAtIso ? u.createdAtIso : new Date().toISOString();

    users.push({ email, role, password, createdAtIso });

    if (!changed) {
      // If schema differs (username field, missing email, etc.) we'll rewrite.
      if (typeof u?.email !== 'string' || !u?.email?.trim?.()) changed = true;
    }
  }

  const byEmail = new Set(users.map((u) => normalizeEmail(u.email)));
  for (const seeded of seededUsers) {
    const key = normalizeEmail(seeded.email);
    if (!byEmail.has(key)) {
      users.push(seeded);
      byEmail.add(key);
      changed = true;
    }
  }

  return { users, changed };
}

export function isPasswordValid(pw: string) {
  // >= 8 chars, at least 1 uppercase, at least 1 special character
  return /^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$/.test(pw);
}

export function passwordStrengthScore(pw: string): 0 | 1 | 2 | 3 | 4 {
  const hasLower = /[a-z]/.test(pw);
  const hasUpper = /[A-Z]/.test(pw);
  const hasNumber = /[0-9]/.test(pw);
  const hasSpecial = /[^A-Za-z0-9]/.test(pw);

  let score = 0;
  if (pw.length >= 8) score += 1;
  if (hasLower && hasUpper) score += 1;
  if (hasNumber) score += 1;
  if (hasSpecial) score += 1;

  return Math.max(0, Math.min(4, score)) as 0 | 1 | 2 | 3 | 4;
}

export function passwordStrengthLabel(score: number) {
  if (score <= 1) return 'Weak';
  if (score === 2) return 'Fair';
  if (score === 3) return 'Good';
  return 'Strong';
}

async function readJson<T>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function writeJson<T>(key: string, value: T) {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function ensureAuthSeeded() {
  const existing = await readJson<any>(USERS_KEY);
  if (existing && Array.isArray(existing) && existing.length) {
    const migrated = migrateUsers(existing);
    if (migrated.changed) {
      await writeJson(USERS_KEY, migrated.users);
    }
    return;
  }
  await writeJson(USERS_KEY, seededUsers);
}

export async function loadUsers(): Promise<AuthUser[]> {
  await ensureAuthSeeded();
  const existing = (await readJson<any>(USERS_KEY)) ?? [];
  const migrated = migrateUsers(existing);
  if (migrated.changed) {
    await writeJson(USERS_KEY, migrated.users);
  }
  return migrated.users;
}

export async function saveUsers(users: AuthUser[]) {
  await writeJson(USERS_KEY, users);
}

export async function loadSession(): Promise<AuthSession | null> {
  const raw = await readJson<any>(SESSION_KEY);
  if (!raw) return null;
  // Backward compatibility: previously stored as { username, signedInAtIso }
  const email =
    typeof raw?.email === 'string' && raw.email.trim()
      ? normalizeEmail(raw.email)
      : typeof raw?.username === 'string' && raw.username.trim()
        ? legacyUsernameToEmail(raw.username)
        : '';
  const signedInAtIso = typeof raw?.signedInAtIso === 'string' ? raw.signedInAtIso : new Date().toISOString();
  if (!email) return null;
  return { email, signedInAtIso };
}

export async function saveSession(session: AuthSession | null) {
  if (!session) {
    await AsyncStorage.removeItem(SESSION_KEY);
    return;
  }
  await writeJson(SESSION_KEY, session);
}

export async function authenticateUser(input: { email: string; password: string }) {
  const users = await loadUsers();
  const key = normalizeEmail(input.email);
  const user = users.find((u) => normalizeEmail(u.email) === key);
  if (!user) return null;
  if (user.password !== input.password) return null;
  return { email: user.email, role: user.role } as const;
}

export async function registerUser(input: { email: string; password: string }) {
  const email = normalizeEmail(input.email);
  if (!email) throw new Error('Email is required.');
  if (!isPasswordValid(input.password)) {
    throw new Error('Password must be 8+ chars and include 1 capital and 1 special character.');
  }

  const users = await loadUsers();
  if (users.some((u) => normalizeEmail(u.email) === email)) {
    throw new Error('That email is already in use.');
  }

  const next: AuthUser = {
    email,
    role: 'member',
    password: input.password,
    createdAtIso: new Date().toISOString(),
  };

  await saveUsers([next, ...users]);
  return { email: next.email, role: next.role } as const;
}

export async function resetPassword(input: { email: string; newPassword: string }) {
  if (!isPasswordValid(input.newPassword)) {
    throw new Error('Password must be 8+ chars and include 1 capital and 1 special character.');
  }

  const users = await loadUsers();
  const key = normalizeEmail(input.email);
  const idx = users.findIndex((u) => normalizeEmail(u.email) === key);
  if (idx < 0) throw new Error('User not found.');

  const updated = users.slice();
  updated[idx] = { ...updated[idx], password: input.newPassword };
  await saveUsers(updated);
}
