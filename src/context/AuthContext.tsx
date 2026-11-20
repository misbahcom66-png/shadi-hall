import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { apiRequest, ensureCsrfToken } from '../lib/api.ts';
import { useToast } from './ToastContext.tsx';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: 'user' | 'admin';
  totp_enabled: boolean;
}

interface LoginResponse {
  user?: AuthUser;
  requires2FA?: boolean;
  preAuthToken?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string, adminOnly?: boolean) => Promise<LoginResponse>;
  verify2FA: (preAuthToken: string, code: string) => Promise<AuthUser>;
  register: (payload: { name: string; email: string; phone: string; password: string }) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const inactivityTimerRef = useRef<number | null>(null);

  const refreshUser = useCallback(async () => {
    try {
      await ensureCsrfToken();
      const data = await apiRequest<{ user: AuthUser }>('/api/auth/me');
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  const logout = useCallback(async () => {
    try {
      await apiRequest('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network failure during logout cleanup
    } finally {
      setUser(null);
    }
  }, []);

  // Client-side inactivity auto-logout synced with backend policy (15m admin, 30m customer)
  useEffect(() => {
    if (!user) {
      if (inactivityTimerRef.current) window.clearTimeout(inactivityTimerRef.current);
      return;
    }

    const timeoutMs = user.role === 'admin' ? 15 * 60 * 1000 : 30 * 60 * 1000;

    const resetTimer = () => {
      if (inactivityTimerRef.current) window.clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = window.setTimeout(() => {
        void logout().then(() => {
          showToast('You were signed out due to inactivity.', 'info');
        });
      }, timeoutMs);
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach((ev) => window.addEventListener(ev, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      if (inactivityTimerRef.current) window.clearTimeout(inactivityTimerRef.current);
      events.forEach((ev) => window.removeEventListener(ev, resetTimer));
    };
  }, [user, logout, showToast]);

  const login = useCallback(async (email: string, password: string, adminOnly = false) => {
    const data = await apiRequest<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, adminOnly }),
    });
    if (data.user) {
      setUser(data.user);
    }
    return data;
  }, []);

  const verify2FA = useCallback(async (preAuthToken: string, code: string) => {
    const data = await apiRequest<{ user: AuthUser }>('/api/auth/verify-2fa', {
      method: 'POST',
      body: JSON.stringify({ preAuthToken, code }),
    });
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(
    async (payload: { name: string; email: string; phone: string; password: string }) => {
      const data = await apiRequest<{ user: AuthUser }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setUser(data.user);
      return data.user;
    },
    []
  );

  return (
    <AuthContext.Provider value={{ user, loading, login, verify2FA, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
