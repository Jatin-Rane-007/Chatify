/**
 * Central registry of every backend path the mobile app calls.
 *
 * One source of truth: change a route here and every call site updates. Call
 * sites (services and screens) must reference `endpoints.*` — never inline a
 * path string. Dynamic segments are functions so `:id` interpolation lives in
 * one place too.
 *
 * Kept in sync with `webapp/src/lib/api/endpoints.ts`. Paths are relative to
 * `env.API_URL` (the axios `baseURL` in `lib/api/client`).
 */
export const endpoints = {
  auth: {
    login: '/api/v1/auth/login',
    signup: '/api/v1/auth/signup',
    profile: '/api/v1/auth/profile',
  },
  users: {
    search: '/api/v1/users/search',
  },
  chats: {
    rooms: '/api/v1/chats/rooms',
    directRoom: '/api/v1/chats/rooms/direct',
    roomMessages: (roomId: string) => `/api/v1/chats/rooms/${roomId}/messages`,
    roomRead: (roomId: string) => `/api/v1/chats/rooms/${roomId}/read`,
    message: (messageId: string) => `/api/v1/chats/messages/${messageId}`,
    requests: '/api/v1/chats/requests',
    requestRespond: (requestId: string) => `/api/v1/chats/requests/${requestId}/respond`,
    blocked: '/api/v1/chats/blocked',
    blockedUser: (userId: string) => `/api/v1/chats/blocked/${encodeURIComponent(userId)}`,
  },
  notifications: {
    devices: '/api/v1/notifications/devices',
    device: (token: string) => `/api/v1/notifications/devices/${encodeURIComponent(token)}`,
  },
} as const;
