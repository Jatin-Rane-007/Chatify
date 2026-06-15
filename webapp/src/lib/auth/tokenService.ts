'use client';

import { getSnapshot, clearSession } from './authStore';

/**
 * Seam between the API client and the auth store.
 *
 * The API client (`lib/api/client.ts`) talks to *this* — never to the store
 * directly — so the transport layer stays store-agnostic and easy to retarget
 * (mirrors the mobile app's `tokenService`).
 */
export const tokenService = {
  /** Current bearer token, or `null` when signed out. */
  getAccessToken(): string | null {
    return getSnapshot().token;
  },

  /** Called by the client on a 401 — clears the persisted session. */
  handleAuthFailure(): void {
    clearSession();
  },
};
