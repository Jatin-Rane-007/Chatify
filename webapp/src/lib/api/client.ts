'use client';

import { env } from '@/lib/env';
import { tokenService } from '@/lib/auth/tokenService';

/**
 * Global typed HTTP client for the Chatify backend.
 *
 * One place to change base URL, auth injection, headers, and error handling for
 * every request the web app makes. Mirrors the mobile `apiClient` surface
 * (`{ success, data }` envelope + `unwrap<T>()`) but on native `fetch` — no extra
 * dependency, and Next.js fetch semantics stay available.
 *
 * Usage:
 *   const res = await api.get<ChatRoom[]>('/api/v1/chats/rooms');
 *   if (res.success) setRooms(res.data);
 */

/** Backend response envelope. */
export interface ApiResponse<T> {
  readonly success: boolean;
  readonly data: T;
  readonly message?: string;
}

export type QueryValue = string | number | boolean | null | undefined;

export interface RequestOptions {
  /** Query string params; `null`/`undefined` values are skipped. */
  readonly query?: Record<string, QueryValue>;
  /** Attach the bearer token (default `true`). */
  readonly auth?: boolean;
  /** Extra headers, merged over the defaults. */
  readonly headers?: Record<string, string>;
  /** Abort signal for cancellation (e.g. debounced lookups). */
  readonly signal?: AbortSignal;
}

/** Thrown on network failure, a non-JSON error body, or an unauthorized (401) response. */
export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const base = `${env.API_URL}${path}`;
  if (!query) return base;
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== null && value !== undefined) search.append(key, String(value));
  }
  const qs = search.toString();
  return qs ? `${base}?${qs}` : base;
}

function isApiResponse(body: unknown): body is ApiResponse<unknown> {
  return (
    typeof body === 'object' &&
    body !== null &&
    typeof (body as { success?: unknown }).success === 'boolean'
  );
}

async function request<T>(
  method: Method,
  path: string,
  payload?: unknown,
  options: RequestOptions = {},
): Promise<ApiResponse<T>> {
  const { query, auth = true, headers: extraHeaders, signal } = options;

  const headers: Record<string, string> = { ...extraHeaders };

  const isFormData = typeof FormData !== 'undefined' && payload instanceof FormData;
  if (payload !== undefined && !isFormData && headers['Content-Type'] === undefined) {
    headers['Content-Type'] = 'application/json';
  }

  let tokenAttached = false;
  if (auth) {
    const token = tokenService.getAccessToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
      tokenAttached = true;
    }
  }

  let res: Response;
  try {
    res = await fetch(buildUrl(path, query), {
      method,
      headers,
      signal,
      body:
        payload === undefined ? undefined : isFormData ? payload : JSON.stringify(payload),
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    throw new ApiError('Network request failed', 0, err);
  }

  const text = await res.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  // A 401 only means "session expired" when we actually sent a token. An
  // unauthenticated request (e.g. login with `auth: false`) returning 401 is a
  // normal error — fall through so the caller sees the real message.
  if (res.status === 401 && tokenAttached) {
    tokenService.handleAuthFailure();
    throw new ApiError('Session expired. Please sign in again.', 401, body);
  }

  if (isApiResponse(body)) return body as ApiResponse<T>;

  if (!res.ok) {
    const message =
      (body as { message?: string } | null)?.message ?? res.statusText ?? 'Request failed';
    throw new ApiError(message, res.status, body);
  }

  // 2xx with a non-enveloped body — wrap it so callers get a uniform shape.
  return { success: true, data: body as T };
}

export const api = {
  get: <T>(path: string, options?: RequestOptions): Promise<ApiResponse<T>> =>
    request<T>('GET', path, undefined, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> =>
    request<T>('POST', path, body, options),
  put: <T>(path: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> =>
    request<T>('PUT', path, body, options),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> =>
    request<T>('PATCH', path, body, options),
  del: <T>(path: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> =>
    request<T>('DELETE', path, body, options),
};

/**
 * Unwraps the `{ success, data }` envelope to the payload, throwing on failure.
 * Use when a caller just wants the data and treats any error as exceptional.
 */
export function unwrap<T>(res: ApiResponse<T>): T {
  if (!res.success) throw new ApiError(res.message ?? 'Request failed', 0, res);
  return res.data;
}
