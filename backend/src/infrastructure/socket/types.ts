import type { Socket } from 'socket.io';

export interface SocketAuthData {
  userId: string;
  email: string;
}

export type AuthedSocket = Socket & { data: SocketAuthData };

export const userRoom = (userId: string): string => `user:${userId}`;
export const chatRoom = (roomId: string): string => `chat:${roomId}`;
