import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { useSocket } from '@/context/SocketContext';
import { SOCKET_EVENTS } from '@/lib/socket/events';
import { useAuthStore } from '@/stores/auth-store';

import { chatService, type ChatRoomSummary } from '../services/chatService';

export const chatRoomsQueryKey = ['chats', 'rooms'] as const;

interface UseChatRoomsResult {
  rooms: ChatRoomSummary[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Fetches chat rooms via TanStack Query and keeps the cache live by reacting
 * to `message:new` / `message:read` socket events.
 */
export function useChatRooms(): UseChatRoomsResult {
  const { token, user } = useAuthStore();
  const { socket, status } = useSocket();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: chatRoomsQueryKey,
    queryFn: () => chatService.listRooms(),
    enabled: !!token,
  });

  useEffect(() => {
    if (!socket || status !== 'connected' || !user) return;

    const offNew = socket.on(SOCKET_EVENTS.NEW_MESSAGE, (msg) => {
      queryClient.setQueryData<ChatRoomSummary[]>(chatRoomsQueryKey, (prev) =>
        prev?.map((room) => {
          if (room.id !== msg.chatRoomId) return room;
          const isIncoming = msg.senderId !== user.id;
          return {
            ...room,
            lastMessage: msg,
            unreadCount: isIncoming ? room.unreadCount + 1 : room.unreadCount,
          };
        }) ?? prev,
      );
    });

    const offRead = socket.on(SOCKET_EVENTS.MESSAGE_READ, (p) => {
      if (p.readerId !== user.id) return;
      queryClient.setQueryData<ChatRoomSummary[]>(chatRoomsQueryKey, (prev) =>
        prev?.map((room) => (room.id === p.roomId ? { ...room, unreadCount: 0 } : room)) ?? prev,
      );
    });

    const offRoomCreated = socket.on(SOCKET_EVENTS.ROOM_CREATED, () => {
      void queryClient.invalidateQueries({ queryKey: chatRoomsQueryKey });
    });

    return () => {
      offNew();
      offRead();
      offRoomCreated();
    };
  }, [socket, status, user, queryClient]);

  return {
    rooms: query.data ?? [],
    loading: query.isPending,
    error: query.error instanceof Error ? query.error.message : null,
    refresh: async () => {
      await query.refetch();
    },
  };
}
