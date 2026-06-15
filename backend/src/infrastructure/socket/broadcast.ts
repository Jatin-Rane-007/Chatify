import { getSocketIO } from './socket.js';
import { SOCKET_EVENTS } from './events.js';
import { chatRoom, userRoom } from './types.js';

import { logger } from '../../shared/logger.js';

/**
 * Helpers used by non-socket code paths (e.g. REST controllers) to fan out
 * realtime events without needing to know about socket.io internals.
 * All emits swallow errors so they can never break the originating request.
 */

function safeEmit(fn: () => void, ctx: string): void {
  try {
    fn();
  } catch (err) {
    logger.error({ err, ctx }, 'broadcast failed');
  }
}

export function broadcastNewMessage(roomId: string, partnerUserIds: string[], message: unknown): void {
  safeEmit(() => {
    const io = getSocketIO();
    io.to(chatRoom(roomId)).emit(SOCKET_EVENTS.NEW_MESSAGE, message);
    for (const uid of partnerUserIds) {
      io.to(userRoom(uid)).emit(SOCKET_EVENTS.NEW_MESSAGE, message);
    }
  }, 'broadcastNewMessage');
}

export function broadcastMessageDeleted(roomId: string, messageId: string): void {
  safeEmit(() => {
    getSocketIO().to(chatRoom(roomId)).emit(SOCKET_EVENTS.MESSAGE_DELETED, { roomId, messageId });
  }, 'broadcastMessageDeleted');
}

export function broadcastRequestNew(targetUserId: string, request: unknown): void {
  safeEmit(() => {
    getSocketIO().to(userRoom(targetUserId)).emit(SOCKET_EVENTS.REQUEST_NEW, request);
  }, 'broadcastRequestNew');
}

export function broadcastRequestUpdated(targetUserIds: string[], request: unknown): void {
  safeEmit(() => {
    const io = getSocketIO();
    for (const uid of targetUserIds) {
      io.to(userRoom(uid)).emit(SOCKET_EVENTS.REQUEST_UPDATED, request);
    }
  }, 'broadcastRequestUpdated');
}

export function broadcastRoomCreated(targetUserIds: string[], room: unknown): void {
  safeEmit(() => {
    const io = getSocketIO();
    for (const uid of targetUserIds) {
      io.to(userRoom(uid)).emit(SOCKET_EVENTS.ROOM_CREATED, room);
    }
  }, 'broadcastRoomCreated');
}

export function broadcastMessageRead(roomId: string, readerId: string, count: number, partnerUserIds: string[]): void {
  safeEmit(() => {
    const io = getSocketIO();
    const payload = { roomId, readerId, count, at: new Date().toISOString() };
    io.to(chatRoom(roomId)).emit(SOCKET_EVENTS.MESSAGE_READ, payload);
    for (const uid of partnerUserIds) {
      io.to(userRoom(uid)).emit(SOCKET_EVENTS.MESSAGE_READ, payload);
    }
  }, 'broadcastMessageRead');
}
