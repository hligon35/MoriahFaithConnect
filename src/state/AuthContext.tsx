import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import {
  authenticateUser,
  ensureAuthSeeded,
  loadUsers,
  loadSession,
  saveSession,
  type AuthRole,
} from '../storage/authStore';

type AuthUserInfo = {
  email: string;
  role: AuthRole;
};

type AuthContextValue = {
  hydrated: boolean;
  signedIn: boolean;
  user: AuthUserInfo | null;
  signInWithPassword: (input: { email: string; password: string }) => Promise<AuthUserInfo>;
  signInWithBiometric: () => Promise<AuthUserInfo>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [user, setUser] = useState<AuthUserInfo | null>(null);

  const signedIn = !!user;

  useEffect(() => {
    (async () => {
      try {
        await ensureAuthSeeded();
        const session = await loadSession();
        if (session?.email) {
          const users = await loadUsers();
          const normalized = session.email.trim().toLowerCase();
          const found = users.find((u) => u.email.trim().toLowerCase() === normalized);
          setUser(found ? { email: found.email, role: found.role } : null);
        }
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  const signInWithPassword = async (input: { email: string; password: string }) => {
    const authed = await authenticateUser(input);
    if (!authed) throw new Error('Invalid email or password.');
    const next: AuthUserInfo = { email: authed.email, role: authed.role };
    setUser(next);
    await saveSession({ email: authed.email, signedInAtIso: new Date().toISOString() });
    return next;
  };

  const signInWithBiometric = async () => {
    const session = await loadSession();
    if (!session?.email) throw new Error('No saved sign-in found.');
    const users = await loadUsers();
    const normalized = session.email.trim().toLowerCase();
    const found = users.find((u) => u.email.trim().toLowerCase() === normalized);
    if (!found) throw new Error('Saved user no longer exists.');
    const next: AuthUserInfo = { email: found.email, role: found.role };
    setUser(next);
    return next;
  };

  const signOut = async () => {
    setUser(null);
    await saveSession(null);
  };

  const value = useMemo<AuthContextValue>(
    () => ({ hydrated, signedIn, user, signInWithPassword, signInWithBiometric, signOut }),
    [hydrated, signedIn, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
