import type { Server } from 'socket.io';
import { prisma } from '../../database/prisma.js';
import { AppError } from '../../../shared/errors/AppError.js';
import { bind } from '../handlerKit.js';
import { RoomIdSchema, SOCKET_EVENTS } from '../events.js';
import { chatRoom, type AuthedSocket } from '../types.js';

async function assertParticipant(roomId: string, userId: string): Promise<void> {
  const room = await prisma.chatRoom.findUnique({
    where: { id: roomId },
    select: { user1Id: true, user2Id: true },
  });
  if (!room) throw new AppError('Chat room not found', 404, 'NOT_FOUND');
  if (room.user1Id !== userId && room.user2Id !== userId) {
    throw new AppError('Access denied to this chat room', 403, 'FORBIDDEN');
  }
}

export function registerRoomHandlers(_io: Server, socket: AuthedSocket): void {
  bind(socket, SOCKET_EVENTS.C_JOIN_ROOM, RoomIdSchema, async (s, { roomId }) => {
    await assertParticipant(roomId, s.data.userId);
    await s.join(chatRoom(roomId));
    s.emit(SOCKET_EVENTS.ROOM_JOINED, { roomId });
    return { roomId };
  });

  bind(socket, SOCKET_EVENTS.C_LEAVE_ROOM, RoomIdSchema, async (s, { roomId }) => {
    await s.leave(chatRoom(roomId));
    return { roomId };
  });
}
