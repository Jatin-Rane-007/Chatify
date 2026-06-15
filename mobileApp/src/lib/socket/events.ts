/**
 * Mirror of backend's `infrastructure/socket/events.ts`.
 * Kept in sync by hand — if you change one, change both (and webapp's copy).
 */

export const SOCKET_EVENTS = {
  CONNECTED: 'connected',
  ERROR: 'error',
  NEW_MESSAGE: 'message:new',
  MESSAGE_DELETED: 'message:deleted',
  MESSAGE_READ: 'message:read',
  USER_TYPING: 'typing:update',
  PRESENCE_UPDATE: 'presence:update',
  ROOM_JOINED: 'room:joined',
  REQUEST_NEW: 'request:new',
  REQUEST_UPDATED: 'request:updated',
  ROOM_CREATED: 'room:created',

  C_JOIN_ROOM: 'room:join',
  C_LEAVE_ROOM: 'room:leave',
  C_SEND_MESSAGE: 'message:send',
  C_DELETE_MESSAGE: 'message:delete',
  C_MARK_READ: 'message:markRead',
  C_TYPING: 'typing:set',
  C_PRESENCE_QUERY: 'presence:query',
} as const;

export interface RequestNewUpdate {
  fromUserId: string;
  toUserId: string;
}

export interface RequestStatusUpdate {
  requestId?: string;
  fromUserId?: string;
  toUserId?: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'BLOCKED' | 'UNBLOCKED';
  chatRoomId?: string;
}

export interface RoomCreatedUpdate {
  chatRoomId: string;
}

export type AckErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'BLOCKED'
  | 'BAD_REQUEST'
  | 'RATE_LIMITED'
  | 'INTERNAL';

export interface AckError {
  code: AckErrorCode;
  message: string;
}

export type Ack<T> = { ok: true; data: T } | { ok: false; error: AckError };

export interface ChatMessage {
  id: string;
  chatRoomId: string;
  senderId: string;
  content: string;
  messageType: 'TEXT' | 'IMAGE' | 'EMOJI';
  replyToId: string | null;
  createdAt: string;
  isRead: boolean;
  clientMessageId?: string | null;
}

export interface TypingUpdate {
  roomId: string;
  userId: string;
  isTyping: boolean;
}

export interface MessageReadUpdate {
  roomId: string;
  readerId: string;
  count: number;
  at: string;
}

export interface MessageDeletedUpdate {
  roomId: string;
  messageId: string;
}

export interface PresenceUpdate {
  userId: string;
  status: 'online' | 'offline';
  at: string;
}

export interface SendMessageInput {
  roomId: string;
  content: string;
  messageType?: 'TEXT' | 'IMAGE' | 'EMOJI';
  replyToId?: string | null;
  clientMessageId?: string;
}
