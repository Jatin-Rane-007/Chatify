import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import { env } from '../../../config/env.js';
import { logger } from '../../../shared/logger.js';

const expo = new Expo({ accessToken: env.EXPO_ACCESS_TOKEN });

export interface ExpoChatPushPayload {
  to: string;
  title: string;
  body: string;
  data: {
    type: 'chat_message';
    chatId: string;
    messageId: string;
    senderId: string;
  };
  badge?: number;
}

export async function sendExpoPush(
  messages: ExpoChatPushPayload[],
): Promise<ExpoPushTicket[]> {
  const valid = messages.filter((m) => Expo.isExpoPushToken(m.to));
  if (valid.length === 0) return [];

  const expoMessages: ExpoPushMessage[] = valid.map((m) => ({
    to: m.to,
    sound: 'default',
    title: m.title,
    body: m.body,
    data: m.data,
    badge: m.badge,
    channelId: 'chat-messages',
    priority: 'high',
    _contentAvailable: true,
  }));

  const chunks = expo.chunkPushNotifications(expoMessages);
  const tickets: ExpoPushTicket[] = [];

  for (const chunk of chunks) {
    try {
      const part = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...part);
    } catch (err) {
      logger.error({ err }, 'expo push send failed');
    }
  }
  return tickets;
}

export function isExpoPushToken(token: string): boolean {
  return Expo.isExpoPushToken(token);
}
