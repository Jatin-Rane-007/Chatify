'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSocket } from '@/context/SocketContext';
import { SOCKET_EVENTS, type ChatMessage } from '@/lib/socket/events';

interface UseChatRoomResult {
  messages: ChatMessage[];
  typingPeers: Set<string>;
  joined: boolean;
  error: string | null;
  sendMessage: (content: string, opts?: { replyToId?: string }) => Promise<ChatMessage | null>;
  deleteMessage: (messageId: string) => Promise<boolean>;
  markRead: () => Promise<void>;
  setTyping: (isTyping: boolean) => void;
  setInitialMessages: (msgs: ChatMessage[]) => void;
}

const TYPING_DEBOUNCE_MS = 1500;

/**
 * Subscribes to a chat room over the socket. Pass `roomId=null` to disable
 * (e.g. when the chat screen is closed). On mount the hook joins the room;
 * on unmount it leaves and clears handlers.
 */
export function useChatRoom(roomId: string | null): UseChatRoomResult {
  const { socket, status } = useSocket();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingPeers, setTypingPeers] = useState<Set<string>>(new Set());
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastTypingSentRef = useRef<{ value: boolean; at: number }>({ value: false, at: 0 });

  // (re)join when room or connection changes
  useEffect(() => {
    if (!socket || !roomId || status !== 'connected') {
      setJoined(false);
      return;
    }
    let cancelled = false;
    void socket.joinRoom(roomId).then((ack) => {
      if (cancelled) return;
      if (ack.ok) {
        setJoined(true);
        setError(null);
      } else {
        setJoined(false);
        setError(ack.error.message);
      }
    });

    // Tell the backend this chat is foregrounded so the notifications
    // dispatcher skips OS pushes to this user for this room.
    socket.raw.emit('chat:focus', { chatId: roomId });

    return () => {
      cancelled = true;
      void socket.leaveRoom(roomId);
      socket.raw.emit('chat:blur');
      setJoined(false);
    };
  }, [socket, roomId, status]);

  // wire incoming events
  useEffect(() => {
    if (!socket || !roomId) return;

    const offNew = socket.on(SOCKET_EVENTS.NEW_MESSAGE, (msg) => {
      if (msg.chatRoomId !== roomId) return;
      setMessages((prev) => {
        // de-dupe by id or clientMessageId
        if (prev.some((m) => m.id === msg.id)) return prev;
        if (msg.clientMessageId) {
          const idx = prev.findIndex((m) => m.clientMessageId === msg.clientMessageId);
          if (idx >= 0) {
            const next = prev.slice();
            next[idx] = msg;
            return next;
          }
        }
        return [...prev, msg];
      });
    });

    const offDel = socket.on(SOCKET_EVENTS.MESSAGE_DELETED, (p) => {
      if (p.roomId !== roomId) return;
      setMessages((prev) => prev.filter((m) => m.id !== p.messageId));
    });

    const offRead = socket.on(SOCKET_EVENTS.MESSAGE_READ, (p) => {
      if (p.roomId !== roomId) return;
      setMessages((prev) =>
        prev.map((m) => (m.senderId !== p.readerId && !m.isRead ? { ...m, isRead: true } : m)),
      );
    });

    const offTyping = socket.on(SOCKET_EVENTS.USER_TYPING, (p) => {
      if (p.roomId !== roomId) return;
      setTypingPeers((prev) => {
        const next = new Set(prev);
        if (p.isTyping) next.add(p.userId);
        else next.delete(p.userId);
        return next;
      });
    });

    return () => {
      offNew();
      offDel();
      offRead();
      offTyping();
    };
  }, [socket, roomId]);

  const sendMessage = useCallback(
    async (content: string, opts?: { replyToId?: string }) => {
      if (!socket || !roomId) return null;
      const trimmed = content.trim();
      if (!trimmed) return null;

      const clientMessageId = `c_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const optimistic: ChatMessage = {
        id: clientMessageId,
        chatRoomId: roomId,
        senderId: 'self',
        content: trimmed,
        messageType: 'TEXT',
        replyToId: opts?.replyToId ?? null,
        createdAt: new Date().toISOString(),
        isRead: false,
        clientMessageId,
      };
      setMessages((prev) => [...prev, optimistic]);

      const ack = await socket.sendMessage({
        roomId,
        content: trimmed,
        replyToId: opts?.replyToId ?? null,
        clientMessageId,
      });

      if (!ack.ok) {
        setError(ack.error.message);
        setMessages((prev) => prev.filter((m) => m.clientMessageId !== clientMessageId));
        return null;
      }
      // server broadcasts message:new which dedupes via clientMessageId
      return ack.data;
    },
    [socket, roomId],
  );

  const deleteMessage = useCallback(
    async (messageId: string) => {
      if (!socket) return false;
      const ack = await socket.deleteMessage(messageId);
      if (!ack.ok) setError(ack.error.message);
      return ack.ok;
    },
    [socket],
  );

  const markRead = useCallback(async () => {
    if (!socket || !roomId) return;
    await socket.markRead(roomId);
  }, [socket, roomId]);

  const setTyping = useCallback(
    (isTyping: boolean) => {
      if (!socket || !roomId) return;
      const now = Date.now();
      const last = lastTypingSentRef.current;
      // debounce: only resend `true` after the window, but always send `false`
      if (isTyping && last.value && now - last.at < TYPING_DEBOUNCE_MS) return;
      lastTypingSentRef.current = { value: isTyping, at: now };
      void socket.setTyping(roomId, isTyping);
    },
    [socket, roomId],
  );

  const setInitialMessages = useCallback((msgs: ChatMessage[]) => {
    setMessages(msgs);
  }, []);

  return {
    messages,
    typingPeers,
    joined,
    error,
    sendMessage,
    deleteMessage,
    markRead,
    setTyping,
    setInitialMessages,
  };
}
