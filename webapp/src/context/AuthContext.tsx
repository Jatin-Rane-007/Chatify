'use client';

import React, { createContext, useContext, useState, useSyncExternalStore } from 'react';
import { api, unwrap } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import {
  subscribe,
  getSnapshot,
  getServerSnapshot,
  setSession,
  setStoredUser,
  clearSession,
  type AuthUser,
} from '@/lib/auth/authStore';

export type User = AuthUser;

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
  error: string | null;
  updateProfile: (data: Partial<User> & { name?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

export function AuthProvider({ children }: { readonly children: React.ReactNode }) {
  const { user, token, hydrated } = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const [busy, setBusy] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // `loading` covers both the initial localStorage hydration and in-flight requests.
  const loading = !hydrated || busy;

  const login = async (email: string, password: string) => {
    setError(null);
    setBusy(true);
    try {
      const res = await api.post<{ user: User; token: string }>(
        endpoints.auth.login,
        { email, password },
        { auth: false },
      );
      const { user: loggedInUser, token: authToken } = unwrap(res);
      setSession(loggedInUser, authToken);
    } catch (err: unknown) {
      setError(errorMessage(err, 'An unexpected error occurred during login'));
      throw err;
    } finally {
      setBusy(false);
    }
  };

  const signup = async (email: string, password: string) => {
    setError(null);
    setBusy(true);
    try {
      const res = await api.post<{ user: User; token: string }>(
        endpoints.auth.signup,
        { email, password },
        { auth: false },
      );
      const { user: registeredUser, token: authToken } = unwrap(res);
      setSession(registeredUser, authToken);
    } catch (err: unknown) {
      setError(errorMessage(err, 'An unexpected error occurred during signup'));
      throw err;
    } finally {
      setBusy(false);
    }
  };

  const logout = () => {
    clearSession();
    setError(null);
  };

  const updateProfile = async (data: Partial<User> & { name?: string }) => {
    setError(null);
    setBusy(true);
    try {
      const res = await api.put<{ user: User }>(endpoints.auth.profile, data);
      const { user: updatedUser } = unwrap(res);
      setStoredUser(updatedUser);
    } catch (err: unknown) {
      setError(errorMessage(err, 'An unexpected error occurred during profile update'));
      throw err;
    } finally {
      setBusy(false);
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    signup,
    logout,
    error,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
