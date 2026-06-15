import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
  isAxiosError,
} from 'axios';

import { env } from '@/lib/env';
import { tokenService } from '@/lib/auth/tokenService';

type RetriableRequest = InternalAxiosRequestConfig & { _retry?: boolean };

export const apiClient: AxiosInstance = axios.create({
  baseURL: env.API_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = tokenService.getAccessToken();
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

let refreshInFlight: Promise<string | null> | null = null;

async function refreshOnce(): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = tokenService.refreshAccessToken().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableRequest | undefined;
    const status = error.response?.status;

    // Only treat a 401 as session-expiry when the request actually carried a
    // token. A login/signup 401 (no auth header) is just bad credentials — let
    // it reject with the backend's real message instead of forcing a logout.
    const hadAuth = !!original?.headers?.get?.('Authorization');

    if (status !== 401 || !original || original._retry || !hadAuth) {
      return Promise.reject(error);
    }

    original._retry = true;

    // TODO(backend-refresh): When the backend ships POST /api/v1/auth/refresh
    // with an httpOnly refresh cookie, wire `tokenService.registerRefresh` to
    // call it and return the new access token. Until then, `refreshOnce()`
    // returns null and we fall through to logout.
    const newToken = await refreshOnce().catch(() => null);

    if (!newToken) {
      await tokenService.handleAuthFailure();
      return Promise.reject(error);
    }

    original.headers.set('Authorization', `Bearer ${newToken}`);
    return apiClient.request(original);
  },
);

/**
 * Unwraps the backend `{ success, data }` envelope. Use in service layers so
 * callers get the payload directly. Falls back to the raw body for endpoints
 * that don't wrap (e.g., responses with only `{ success, message }`).
 */
export function unwrap<T>(body: unknown): T {
  if (body && typeof body === 'object' && 'data' in (body as Record<string, unknown>)) {
    return (body as { data: T }).data;
  }
  return body as T;
}

/**
 * Best-effort human-readable message from a failed request. Prefers the
 * backend's `{ message }` envelope, then the Error message, then a fallback.
 */
export function apiErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
  if (isAxiosError(err)) {
    const data = err.response?.data as { message?: string } | undefined;
    if (data?.message) return data.message;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}
