import type { Server } from 'socket.io';
import { prisma } from '../../database/prisma.js';
import { bind } from '../handlerKit.js';
import { PresenceQuerySchema, SOCKET_EVENTS } from '../events.js';
import { userRoom, type AuthedSocket } from '../types.js';

/**
 * Presence is derived from socket.io rooms (each user auto-joins `user:<id>`),
 * which makes it correct under the Redis adapter without any extra store.
 */
async function isOnline(io: Server, userId: string): Promise<boolean> {
  const sockets = await io.in(userRoom(userId)).fetchSockets();
  return sockets.length > 0;
}

async function listChatPartners(userId: string): Promise<string[]> {
  const rooms = await prisma.chatRoom.findMany({
    where: { OR: [{ user1Id: userId }, { user2Id: userId }] },
    select: { user1Id: true, user2Id: true },
  });
  const partners = new Set<string>();
  for (const r of rooms) partners.add(r.user1Id === userId ? r.user2Id : r.user1Id);
  return [...partners];
}

export function registerPresenceHandlers(io: Server, socket: AuthedSocket): void {
  bind(socket, SOCKET_EVENTS.C_PRESENCE_QUERY, PresenceQuerySchema, async (_s, { userIds }) => {
    const entries = await Promise.all(
      userIds.map(async (id) => [id, await isOnline(io, id)] as const),
    );
    return Object.fromEntries(entries) as Record<string, boolean>;
  });
}

export async function broadcastPresence(
  io: Server,
  userId: string,
  status: 'online' | 'offline',
): Promise<void> {
  const partners = await listChatPartners(userId);
  if (partners.length === 0) return;
  const payload = { userId, status, at: new Date().toISOString() };
  for (const partnerId of partners) {
    io.to(userRoom(partnerId)).emit(SOCKET_EVENTS.PRESENCE_UPDATE, payload);
  }
}
