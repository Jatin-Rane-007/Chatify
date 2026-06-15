import { apiClient, unwrap } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import type { ChatMessage } from '@/lib/socket/events';

export interface ChatPartner {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
}

export interface ChatRoomSummary {
  id: string;
  createdAt: string;
  partner: ChatPartner | null;
  lastMessage: ChatMessage | null;
  unreadCount: number;
}

export interface UserSearchResult {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  privacySetting?: 'EVERYONE' | 'VERIFIED' | 'FRIENDS_OF_FRIENDS' | 'NOBODY';
  relationship: {
    id: string;
    senderId: string;
    receiverId: string;
    status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'BLOCKED';
  } | null;
}

export interface ChatRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'BLOCKED';
  sender: ChatPartner;
  receiver: ChatPartner;
}

export interface ChatRequestBuckets {
  incoming: ChatRequest[];
  outgoing: ChatRequest[];
  blocked: ChatRequest[];
  declined: ChatRequest[];
}

export const chatService = {
  listRooms: async (): Promise<ChatRoomSummary[]> => {
    const { data } = await apiClient.get(endpoints.chats.rooms);
    return unwrap<ChatRoomSummary[]>(data);
  },

  getMessages: async (roomId: string): Promise<ChatMessage[]> => {
    const { data } = await apiClient.get(endpoints.chats.roomMessages(roomId));
    return unwrap<ChatMessage[]>(data);
  },

  sendMessage: async (
    roomId: string,
    body: { content: string; messageType?: 'TEXT' | 'IMAGE' | 'EMOJI'; replyToId?: string | null },
  ): Promise<ChatMessage> => {
    const { data } = await apiClient.post(endpoints.chats.roomMessages(roomId), body);
    return unwrap<ChatMessage>(data);
  },

  deleteMessage: async (messageId: string): Promise<void> => {
    await apiClient.delete(endpoints.chats.message(messageId));
  },

  markRead: async (roomId: string): Promise<void> => {
    await apiClient.post(endpoints.chats.roomRead(roomId));
  },

  searchUsers: async (q: string): Promise<UserSearchResult[]> => {
    const { data } = await apiClient.get(endpoints.users.search, { params: { q } });
    return unwrap<UserSearchResult[]>(data);
  },

  getRequests: async (): Promise<ChatRequestBuckets> => {
    const { data } = await apiClient.get(endpoints.chats.requests);
    return unwrap<ChatRequestBuckets>(data);
  },

  sendRequest: async (receiverId: string): Promise<{ status: string }> => {
    const { data } = await apiClient.post(endpoints.chats.requests, { receiverId });
    return unwrap<{ status: string }>(data);
  },

  startDirectChat: async (recipientUserId: string): Promise<{ chatRoomId: string; created: boolean }> => {
    const { data } = await apiClient.post(endpoints.chats.directRoom, { recipientUserId });
    return unwrap<{ chatRoomId: string; created: boolean }>(data);
  },

  respondRequest: async (
    requestId: string,
    status: 'ACCEPTED' | 'DECLINED' | 'BLOCKED',
  ): Promise<{ status: string; chatRoomId?: string }> => {
    const { data } = await apiClient.post(endpoints.chats.requestRespond(requestId), { status });
    return unwrap<{ status: string; chatRoomId?: string }>(data);
  },

  blockUser: async (userIdToBlock: string): Promise<void> => {
    await apiClient.post(endpoints.chats.blocked, { userIdToBlock });
  },

  unblockUser: async (userIdToUnblock: string): Promise<void> => {
    await apiClient.delete(endpoints.chats.blockedUser(userIdToUnblock));
  },
};
