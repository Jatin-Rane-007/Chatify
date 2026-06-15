import type { Server } from 'socket.io';
import { prisma } from '../../database/prisma.js';
import { AppError } from '../../../shared/errors/AppError.js';
import { bind } from '../handlerKit.js';
import {
  DeleteMessageSchema,
  MarkReadSchema,
  SendMessageSchema,
  SOCKET_EVENTS,
} from '../events.js';
import { chatRoom, userRoom, type AuthedSocket } from '../types.js';

async function loadRoomFor(roomId: string, userId: string) {
  const room = await prisma.chatRoom.findUnique({
    where: { id: roomId },
    select: { id: true, user1Id: true, user2Id: true },
  });
  if (!room) throw new AppError('Chat room not found', 404, 'NOT_FOUND');
  if (room.user1Id !== userId && room.user2Id !== userId) {
    throw new AppError('Access denied to this chat room', 403, 'FORBIDDEN');
  }
  return room;
}

async function assertNotBlocked(a: string, b: string): Promise<void> {
  const blocked = await prisma.chatRequest.findFirst({
    where: {
      status: 'BLOCKED',
      OR: [
        { senderId: a, receiverId: b },
        { senderId: b, receiverId: a },
      ],
    },
    select: { id: true },
  });
  if (blocked) throw new AppError('Communication is blocked', 403, 'BLOCKED');
}

export function registerMessageHandlers(io: Server, socket: AuthedSocket): void {
  bind(socket, SOCKET_EVENTS.C_SEND_MESSAGE, SendMessageSchema, async (s, payload) => {
    const senderId = s.data.userId;
    const room = await loadRoomFor(payload.roomId, senderId);
    const otherId = room.user1Id === senderId ? room.user2Id : room.user1Id;
    await assertNotBlocked(senderId, otherId);

    const message = await prisma.message.create({
      data: {
        chatRoomId: room.id,
        senderId,
        content: payload.content,
        messageType: payload.messageType,
        replyToId: payload.replyToId ?? null,
        isRead: false,
      },
    });

    const envelope = { ...message, clientMessageId: payload.clientMessageId ?? null };

    // Deliver to anyone watching the room, plus the partner's personal room
    // so unread badges update even when the chat isn't open.
    io.to(chatRoom(room.id)).emit(SOCKET_EVENTS.NEW_MESSAGE, envelope);
    io.to(userRoom(otherId)).emit(SOCKET_EVENTS.NEW_MESSAGE, envelope);

    return envelope;
  });

  bind(socket, SOCKET_EVENTS.C_DELETE_MESSAGE, DeleteMessageSchema, async (s, { messageId }) => {
    const userId = s.data.userId;
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      select: { id: true, senderId: true, chatRoomId: true },
    });
    if (!message) throw new AppError('Message not found', 404, 'NOT_FOUND');
    if (message.senderId !== userId) {
      throw new AppError('You can only delete your own messages', 403, 'FORBIDDEN');
    }

    await prisma.message.delete({ where: { id: messageId } });

    io.to(chatRoom(message.chatRoomId)).emit(SOCKET_EVENTS.MESSAGE_DELETED, {
      messageId,
      roomId: message.chatRoomId,
    });
    return { messageId };
  });

  bind(socket, SOCKET_EVENTS.C_MARK_READ, MarkReadSchema, async (s, { roomId }) => {
    const userId = s.data.userId;
    const room = await loadRoomFor(roomId, userId);
    const otherId = room.user1Id === userId ? room.user2Id : room.user1Id;

    const result = await prisma.message.updateMany({
      where: { chatRoomId: roomId, senderId: { not: userId }, isRead: false },
      data: { isRead: true },
    });

    const payload = { roomId, readerId: userId, count: result.count, at: new Date().toISOString() };
    io.to(chatRoom(roomId)).emit(SOCKET_EVENTS.MESSAGE_READ, payload);
    io.to(userRoom(otherId)).emit(SOCKET_EVENTS.MESSAGE_READ, payload);
    return payload;
  });
}
