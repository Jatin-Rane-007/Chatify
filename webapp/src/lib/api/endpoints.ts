/**
 * Central registry of every backend path the web app calls.
 *
 * One source of truth: change a route here and every call site updates. Call
 * sites must reference `endpoints.*` — never inline a path string. Dynamic
 * segments are functions so the `:id` interpolation stays in one place too.
 *
 * Mirrors the mobile app's intent (a single endpoints map) but typed and
 * grouped by domain. Paths are relative to `env.API_URL` (set by `lib/api/client`).
 */
export const endpoints = {
  auth: {
    login: '/api/v1/auth/login',
    signup: '/api/v1/auth/signup',
    profile: '/api/v1/auth/profile',
    checkUsername: '/api/v1/auth/profile/check-username',
    accountEmail: '/api/v1/auth/account/email',
    accountPassword: '/api/v1/auth/account/password',
    account: '/api/v1/auth/account',
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
    blocked: '/api/v1/chats/blocked',
  },
  media: {
    signature: '/api/v1/media/signature',
  },
  notifications: {
    devices: '/api/v1/notifications/devices',
    device: (endpoint: string) =>
      `/api/v1/notifications/devices/${encodeURIComponent(endpoint)}`,
  },
} as const;
