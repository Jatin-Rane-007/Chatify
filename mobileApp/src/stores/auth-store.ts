import { useState, useEffect } from 'react';

import { tokenService } from '@/lib/auth/tokenService';
import { secureStorage } from '@/lib/storage/secureStorage';

const USER_KEY = 'chatify_user';
const TOKEN_KEY = 'chatify_token';

export type PrivacySetting = 'EVERYONE' | 'VERIFIED' | 'FRIENDS_OF_FRIENDS' | 'NOBODY';

export interface User {
  id: string;
  email: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  privacySetting: PrivacySetting | string;
  createdAt: string;
  updatedAt: string;
}

let cachedUser: User | null = null;
let cachedToken: string | null = null;
let isInitialized = false;
let isNewlyRegistered = false;
const listeners = new Set<() => void>();

export const AuthStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  notify() {
    listeners.forEach((l) => l());
  },

  async init() {
    if (isInitialized) return;
    try {
      const [u, t] = await Promise.all([
        secureStorage.get(USER_KEY),
        secureStorage.get(TOKEN_KEY),
      ]);
      cachedUser = u ? JSON.parse(u) : null;
      cachedToken = t;
    } catch (e) {
      console.warn('Failed to load auth store', e);
    } finally {
      isInitialized = true;
      this.notify();
    }
  },

  getUser() {
    return cachedUser;
  },

  getToken() {
    return cachedToken;
  },

  isLoaded() {
    return isInitialized;
  },

  isNewlyRegistered() {
    return isNewlyRegistered;
  },

  setNewlyRegistered(val: boolean) {
    isNewlyRegistered = val;
    this.notify();
  },

  async setAuth(user: User, token: string) {
    cachedUser = user;
    cachedToken = token;
    try {
      await Promise.all([
        secureStorage.set(USER_KEY, JSON.stringify(user)),
        secureStorage.set(TOKEN_KEY, token),
      ]);
    } catch (e) {
      console.error('Failed to save auth state', e);
    }
    this.notify();
  },

  async clearAuth() {
    cachedUser = null;
    cachedToken = null;
    isNewlyRegistered = false;
    try {
      await Promise.all([
        secureStorage.delete(USER_KEY),
        secureStorage.delete(TOKEN_KEY),
      ]);
    } catch (e) {
      console.error('Failed to clear auth state', e);
    }
    this.notify();
  },
};

// Bridge the singleton to the apiClient's token interceptor.
// Imported once at module load — kept module-scoped so the seam doesn't leak
// React or store internals into `lib/api/`.
tokenService.registerGetToken(() => cachedToken);
tokenService.registerOnAuthFailure(() => AuthStore.clearAuth());
// refreshAccessToken stays the default no-op until the backend ships
// POST /api/v1/auth/refresh. See lib/api/client.ts for the wiring point.

export function useAuthStore() {
  const [user, setUser] = useState<User | null>(AuthStore.getUser());
  const [token, setToken] = useState<string | null>(AuthStore.getToken());
  const [loading, setLoading] = useState<boolean>(!AuthStore.isLoaded());
  const [newlyRegistered, setNewlyRegisteredState] = useState<boolean>(AuthStore.isNewlyRegistered());

  useEffect(() => {
    const handleUpdate = () => {
      setUser(AuthStore.getUser());
      setToken(AuthStore.getToken());
      setLoading(!AuthStore.isLoaded());
      setNewlyRegisteredState(AuthStore.isNewlyRegistered());
    };

    const unsubscribe = AuthStore.subscribe(handleUpdate);

    if (!AuthStore.isLoaded()) {
      AuthStore.init().finally(() => {
        setLoading(false);
      });
    } else {
      setLoading(false);
    }

    return () => {
      unsubscribe();
    };
  }, []);

  return {
    user,
    token,
    loading,
    newlyRegistered,
    setAuth: (u: User, t: string) => AuthStore.setAuth(u, t),
    clearAuth: () => AuthStore.clearAuth(),
    setNewlyRegistered: (val: boolean) => AuthStore.setNewlyRegistered(val),
  };
}
