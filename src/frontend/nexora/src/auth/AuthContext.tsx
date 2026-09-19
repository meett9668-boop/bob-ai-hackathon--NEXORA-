import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { NexoraUser } from '../types/extended';

// ─── Demo credentials (clearly marked as demo only) ───────────────────────────
const DEMO_USERS: (NexoraUser & { password: string })[] = [
  {
    id: 'usr-admin-001',
    name: 'Aarav Mehta',
    email: 'admin@nexora.com',
    password: 'admin123',
    role: 'admin',
    avatar: 'AM',
  },
  {
    id: 'usr-user-001',
    name: 'Jordan Lee',
    email: 'user@nexora.com',
    password: 'user123',
    role: 'user',
    region: 'Houston North',
    avatar: 'JL',
  },
  {
    id: 'usr-user-002',
    name: 'Sam Rivera',
    email: 'user2@nexora.com',
    password: 'user123',
    role: 'user',
    region: 'Houston South',
    avatar: 'SR',
  },
];

const AUTH_KEY = 'nexora_auth';

// ─── Extend NexoraUser for Google login data ───────────────────────────────────
export interface NexoraUserExtended extends NexoraUser {
  photoUrl?: string;   // Google profile picture URL
  googleSub?: string;  // Google subject ID (stable unique Google user identifier)
  loginMethod?: 'demo' | 'google';
}

// ─── Context shape ─────────────────────────────────────────────────────────────
interface AuthContextValue {
  user: NexoraUserExtended | null;
  login: (email: string, password: string) => boolean;
  loginWithGoogle: (credential: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Decode Google JWT payload (without verifying — backend does that) ────────
function decodeGoogleJwt(token: string): Record<string, string> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    // base64url → base64 padding
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

// ─── Provider ──────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<NexoraUserExtended | null>(() => {
    try {
      const stored = localStorage.getItem(AUTH_KEY);
      return stored ? (JSON.parse(stored) as NexoraUserExtended) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_KEY);
    }
  }, [user]);

  function login(email: string, password: string): boolean {
    const found = DEMO_USERS.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password,
    );
    if (!found) return false;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _pw, ...safeUser } = found;
    setUser({ ...safeUser, loginMethod: 'demo' });
    return true;
  }

  const loginWithGoogle = useCallback(async (credential: string): Promise<{ success: boolean; error?: string }> => {
    const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

    // ── Option A: Backend verification (preferred) ──────────────────────────
    // If the backend is available, verify the token server-side.
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser({ ...data.user, loginMethod: 'google' });
          return { success: true };
        }
      }
      // Backend responded but returned an error
      const errData = await res.json().catch(() => ({}));
      return { success: false, error: errData.detail ?? 'Authentication failed' };
    } catch {
      // ── Option B: Backend unavailable — decode JWT locally (frontend-only demo mode) ──
      // NOTE: This is NOT secure verification. It is only used when the backend
      // is unavailable in the demo environment. In production, always use the backend.
      if (!GOOGLE_CLIENT_ID) {
        return { success: false, error: 'Google Client ID not configured. Set VITE_GOOGLE_CLIENT_ID in .env' };
      }
      const payload = decodeGoogleJwt(credential);
      if (!payload) {
        return { success: false, error: 'Invalid Google credential token' };
      }
      const googleUser: NexoraUserExtended = {
        id: `google-${payload.sub}`,
        googleSub: payload.sub,
        name: payload.name ?? payload.email?.split('@')[0] ?? 'User',
        email: payload.email ?? '',
        role: 'user', // Default role for new Google users — NOT inferred from Google
        avatar: payload.name ? payload.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : 'GU',
        photoUrl: payload.picture,
        loginMethod: 'google',
      };
      setUser(googleUser);
      return { success: true };
    }
  }, []);

  function logout() {
    setUser(null);
    // Revoke Google session if available (prevents auto-sign-in on next visit)
    try {
      window.google?.accounts?.id?.disableAutoSelect();
    } catch {
      // not available
    }
  }

  return <AuthContext.Provider value={{ user, login, loginWithGoogle, logout }}>{children}</AuthContext.Provider>;
}

// ─── Hook ──────────────────────────────────────────────────────────────────────
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
