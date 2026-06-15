'use client';

/**
 * localStorage-backed auth store.
 *
 * localStorage is the single source of truth for the persisted session, so it is
 * an *external store*. Reading it on mount with `useEffect` + `setState` triggers
 * the `react-hooks/set-state-in-effect` cascading-render anti-pattern; instead the
 * store is consumed via `useSyncExternalStore`, which also gives us free cross-tab
 * sync and a correct SSR/hydration handoff through {@link getServerSnapshot}.
 */

export interface AuthUser {
  id: string;
  email: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  privacySetting: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  readonly user: AuthUser | null;
  readonly token: string | null;
  /** `false` until the client has read localStorage (i.e. during SSR / first paint). */
  readonly hydrated: boolean;
}

const USER_KEY = 'chatify_user';
const TOKEN_KEY = 'chatify_token';

/** Stable reference returned during SSR and hydration. */
const SERVER_STATE: AuthState = { user: null, token: null, hydrated: false };

function readFromStorage(): AuthState {
  try {
    const rawUser = localStorage.getItem(USER_KEY);
    const token = localStorage.getItem(TOKEN_KEY);
    if (rawUser && token) {
      return { user: JSON.parse(rawUser) as AuthUser, token, hydrated: true };
    }
  } catch {
    // Corrupt / unavailable storage — fall through to an empty (but hydrated) state.
  }
  return { user: null, token: null, hydrated: true };
}

let state: AuthState =
  typeof window === 'undefined' ? SERVER_STATE : readFromStorage();

const listeners = new Set<() => void>();

function emit(next: AuthState): void {
  state = next;
  listeners.forEach((listener) => listener());
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  const onStorage = (event: StorageEvent): void => {
    if (event.key === USER_KEY || event.key === TOKEN_KEY) {
      emit(readFromStorage());
    }
  };
  window.addEventListener('storage', onStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

export function getSnapshot(): AuthState {
  return state;
}

export function getServerSnapshot(): AuthState {
  return SERVER_STATE;
}

/** Persist a freshly authenticated session and notify subscribers. */
export function setSession(user: AuthUser, token: string): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.setItem(TOKEN_KEY, token);
  emit({ user, token, hydrated: true });
}

/** Update only the stored user (token unchanged), e.g. after a profile edit. */
export function setStoredUser(user: AuthUser): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  emit({ user, token: state.token, hydrated: true });
}

/** Clear the persisted session. */
export function clearSession(): void {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
  emit({ user: null, token: null, hydrated: true });
}
