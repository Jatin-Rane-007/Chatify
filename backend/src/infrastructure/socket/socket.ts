import type { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { env } from '../../config/env.js';
import { logger } from '../../shared/logger.js';
import { registerSocketAuth } from './auth.js';
import { attachAdapter } from './adapter.js';
import { SOCKET_EVENTS } from './events.js';
import { userRoom, type AuthedSocket } from './types.js';
import { registerRoomHandlers } from './handlers/room.handlers.js';
import { registerMessageHandlers } from './handlers/message.handlers.js';
import { registerTypingHandlers } from './handlers/typing.handlers.js';
import {
  broadcastPresence,
  registerPresenceHandlers,
} from './handlers/presence.handlers.js';
import { setActiveChat } from './presence.js';
import { SOCKET_EVENTS as EVT } from './events.js';

let io: Server | null = null;

function parseOrigins(): string[] | '*' {
  if (env.NODE_ENV !== 'production') return '*';
  return env.CORS_ORIGIN.split(',').map((s) => s.trim()).filter(Boolean);
}

export function initSocketServer(server: HttpServer): Server {
  io = new Server(server, {
    cors: {
      origin: parseOrigins(),
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingInterval: 25_000,
    pingTimeout: 20_000,
    maxHttpBufferSize: 1e6, // 1 MB
    transports: ['websocket', 'polling'],
  });

  attachAdapter(io);
  registerSocketAuth(io);

  io.on('connection', (raw) => {
    const socket = raw as AuthedSocket;
    const { userId } = socket.data;
    logger.info({ sid: socket.id, userId }, 'socket connected');

    void socket.join(userRoom(userId));
    socket.emit(SOCKET_EVENTS.CONNECTED, { userId, socketId: socket.id });

    registerRoomHandlers(io!, socket);
    registerMessageHandlers(io!, socket);
    registerTypingHandlers(io!, socket);
    registerPresenceHandlers(io!, socket);

    // Active-chat presence (notifications dispatcher reads this to skip pushes
    // for users already in the chat). Lightweight — no rate limit needed.
    socket.on(EVT.C_CHAT_FOCUS, (payload: { chatId?: string } | undefined) => {
      const chatId = payload?.chatId;
      if (typeof chatId === 'string' && chatId.length > 0 && chatId.length <= 64) {
        setActiveChat(userId, chatId);
      }
    });
    socket.on(EVT.C_CHAT_BLUR, () => setActiveChat(userId, null));

    // Announce online if this is the user's first socket
    void (async () => {
      const sockets = await io!.in(userRoom(userId)).fetchSockets();
      if (sockets.length === 1) await broadcastPresence(io!, userId, 'online');
    })();

    socket.on('disconnect', (reason) => {
      logger.info({ sid: socket.id, userId, reason }, 'socket disconnected');
      setActiveChat(userId, null);
      // Defer to next tick so the disconnecting socket has left its rooms.
      setImmediate(async () => {
        try {
          const remaining = await io!.in(userRoom(userId)).fetchSockets();
          if (remaining.length === 0) await broadcastPresence(io!, userId, 'offline');
        } catch (err) {
          logger.error({ err }, 'presence offline broadcast failed');
        }
      });
    });
  });

  return io;
}

export function getSocketIO(): Server {
  if (!io) throw new Error('Socket.io server has not been initialized');
  return io;
}
