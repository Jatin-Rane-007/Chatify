import { z } from 'zod';

/**
 * Wire-protocol contract for the realtime layer.
 * Event names are namespaced `<domain>:<action>` so clients can route cleanly.
 */

export const SOCKET_EVENTS = {
  // server -> client
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

  // client -> server
  C_JOIN_ROOM: 'room:join',
  C_LEAVE_ROOM: 'room:leave',
  C_SEND_MESSAGE: 'message:send',
  C_DELETE_MESSAGE: 'message:delete',
  C_MARK_READ: 'message:markRead',
  C_TYPING: 'typing:set',
  C_PRESENCE_QUERY: 'presence:query',
  C_CHAT_FOCUS: 'chat:focus',
  C_CHAT_BLUR: 'chat:blur',
} as const;

export const ChatFocusSchema = z.object({
  chatId: z.string().min(1).max(64),
});
export type ChatFocusPayload = z.infer<typeof ChatFocusSchema>;

export const RoomIdSchema = z.object({
  roomId: z.string().min(1).max(64),
});

export const SendMessageSchema = z.object({
  roomId: z.string().min(1).max(64),
  content: z.string().trim().min(1).max(4000),
  messageType: z.enum(['TEXT', 'IMAGE', 'EMOJI']).default('TEXT'),
  replyToId: z.string().min(1).max(64).optional().nullable(),
  clientMessageId: z.string().min(1).max(64).optional(),
});

export const DeleteMessageSchema = z.object({
  messageId: z.string().min(1).max(64),
});

export const MarkReadSchema = z.object({
  roomId: z.string().min(1).max(64),
});

export const TypingSchema = z.object({
  roomId: z.string().min(1).max(64),
  isTyping: z.boolean(),
});

export const PresenceQuerySchema = z.object({
  userIds: z.array(z.string().min(1).max(64)).min(1).max(100),
});

export type SendMessagePayload = z.infer<typeof SendMessageSchema>;
export type DeleteMessagePayload = z.infer<typeof DeleteMessageSchema>;
export type MarkReadPayload = z.infer<typeof MarkReadSchema>;
export type TypingPayload = z.infer<typeof TypingSchema>;
export type PresenceQueryPayload = z.infer<typeof PresenceQuerySchema>;
export type RoomIdPayload = z.infer<typeof RoomIdSchema>;

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

export type Ack<T> =
  | { ok: true; data: T }
  | { ok: false; error: AckError };

export const ackOk = <T>(data: T): Ack<T> => ({ ok: true, data });
export const ackErr = (code: AckErrorCode, message: string): Ack<never> => ({
  ok: false,
  error: { code, message },
});
