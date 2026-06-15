import type { Server } from 'socket.io';
import { prisma } from '../../database/prisma.js';
import { AppError } from '../../../shared/errors/AppError.js';
import { bind } from '../handlerKit.js';
import { SOCKET_EVENTS, TypingSchema } from '../events.js';
import { chatRoom, type AuthedSocket } from '../types.js';

export function registerTypingHandlers(io: Server, socket: AuthedSocket): void {
  bind(socket, SOCKET_EVENTS.C_TYPING, TypingSchema, async (s, { roomId, isTyping }) => {
    const userId = s.data.userId;
    const room = await prisma.chatRoom.findUnique({
      where: { id: roomId },
      select: { user1Id: true, user2Id: true },
    });
    if (!room) throw new AppError('Chat room not found', 404, 'NOT_FOUND');
    if (room.user1Id !== userId && room.user2Id !== userId) {
      throw new AppError('Access denied to this chat room', 403, 'FORBIDDEN');
    }

    // exclude the sender — typing indicators only go to the other side
    io.to(chatRoom(roomId)).except(s.id).emit(SOCKET_EVENTS.USER_TYPING, {
      roomId,
      userId,
      isTyping,
    });
    return { ok: true as const };
  });
}
