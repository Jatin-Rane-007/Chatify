import { io, Socket } from 'socket.io-client';
import { env } from '@/lib/env';
import {
  SOCKET_EVENTS,
  type Ack,
  type ChatMessage,
  type MessageDeletedUpdate,
  type MessageReadUpdate,
  type PresenceUpdate,
  type RequestNewUpdate,
  type RequestStatusUpdate,
  type RoomCreatedUpdate,
  type SendMessageInput,
  type TypingUpdate,
} from './events';

export type TokenGetter = () => string | null | undefined;

const ACK_TIMEOUT_MS = 10_000;

export interface ChatSocket {
  raw: Socket;
  connect: () => void;
  disconnect: () => void;
  joinRoom: (roomId: string) => Promise<Ack<{ roomId: string }>>;
  leaveRoom: (roomId: string) => Promise<Ack<{ roomId: string }>>;
  sendMessage: (input: SendMessageInput) => Promise<Ack<ChatMessage>>;
  deleteMessage: (messageId: string) => Promise<Ack<{ messageId: string }>>;
  markRead: (roomId: string) => Promise<Ack<MessageReadUpdate>>;
  setTyping: (roomId: string, isTyping: boolean) => Promise<Ack<{ ok: true }>>;
  presenceQuery: (userIds: string[]) => Promise<Ack<Record<string, boolean>>>;
  on: <E extends keyof ServerEventMap>(event: E, handler: ServerEventMap[E]) => () => void;
}

export interface ServerEventMap {
  [SOCKET_EVENTS.CONNECTED]: (p: { userId: string; socketId: string }) => void;
  [SOCKET_EVENTS.NEW_MESSAGE]: (m: ChatMessage) => void;
  [SOCKET_EVENTS.MESSAGE_DELETED]: (p: MessageDeletedUpdate) => void;
  [SOCKET_EVENTS.MESSAGE_READ]: (p: MessageReadUpdate) => void;
  [SOCKET_EVENTS.USER_TYPING]: (p: TypingUpdate) => void;
  [SOCKET_EVENTS.PRESENCE_UPDATE]: (p: PresenceUpdate) => void;
  [SOCKET_EVENTS.ROOM_JOINED]: (p: { roomId: string }) => void;
  [SOCKET_EVENTS.REQUEST_NEW]: (p: RequestNewUpdate) => void;
  [SOCKET_EVENTS.REQUEST_UPDATED]: (p: RequestStatusUpdate) => void;
  [SOCKET_EVENTS.ROOM_CREATED]: (p: RoomCreatedUpdate) => void;
}

function emitWithAck<T>(socket: Socket, event: string, payload: unknown): Promise<Ack<T>> {
  return new Promise((resolve) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      resolve({ ok: false, error: { code: 'INTERNAL', message: 'Timed out' } });
    }, ACK_TIMEOUT_MS);

    socket.emit(event, payload, (ack: Ack<T> | undefined) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(ack ?? { ok: false, error: { code: 'INTERNAL', message: 'No ack' } });
    });
  });
}

export function createChatSocket(getToken: TokenGetter): ChatSocket {
  const socket = io(env.API_URL, {
    autoConnect: false,
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10_000,
    auth: (cb) => cb({ token: getToken() ?? '' }),
  });

  socket.on('connect_error', (err) => {
    if (err.message?.includes('UNAUTHORIZED') && !getToken()) {
      socket.disconnect();
    }
  });

  return {
    raw: socket,
    connect: () => {
      if (!socket.connected && getToken()) socket.connect();
    },
    disconnect: () => socket.disconnect(),
    joinRoom: (roomId) => emitWithAck(socket, SOCKET_EVENTS.C_JOIN_ROOM, { roomId }),
    leaveRoom: (roomId) => emitWithAck(socket, SOCKET_EVENTS.C_LEAVE_ROOM, { roomId }),
    sendMessage: (input) => emitWithAck(socket, SOCKET_EVENTS.C_SEND_MESSAGE, input),
    deleteMessage: (messageId) =>
      emitWithAck(socket, SOCKET_EVENTS.C_DELETE_MESSAGE, { messageId }),
    markRead: (roomId) => emitWithAck(socket, SOCKET_EVENTS.C_MARK_READ, { roomId }),
    setTyping: (roomId, isTyping) =>
      emitWithAck(socket, SOCKET_EVENTS.C_TYPING, { roomId, isTyping }),
    presenceQuery: (userIds) =>
      emitWithAck(socket, SOCKET_EVENTS.C_PRESENCE_QUERY, { userIds }),
    on: (event, handler) => {
      socket.on(event as string, handler as (...args: unknown[]) => void);
      return () => socket.off(event as string, handler as (...args: unknown[]) => void);
    },
  };
}
