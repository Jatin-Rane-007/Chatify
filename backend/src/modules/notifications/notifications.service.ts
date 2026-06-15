import { prisma } from '../../infrastructure/database/prisma.js';
import { getActiveChatId } from '../../infrastructure/socket/presence.js';
import { logger } from '../../shared/logger.js';
import { sendExpoPush } from './providers/expoPush.provider.js';
import { sendWebPush } from './providers/webPush.provider.js';
import type { ChatMessageNotificationInput } from './notifications.types.js';

const PREVIEW_MAX = 140;

function truncate(s: string): string {
  if (s.length <= PREVIEW_MAX) return s;
  return s.slice(0, PREVIEW_MAX - 1) + '…';
}

/**
 * Fire-and-forget — never awaited by the HTTP handler. Caller stays
 * decoupled from provider latency / failures.
 */
export function dispatchChatMessage(input: ChatMessageNotificationInput): void {
  void runDispatch(input).catch((err) => {
    logger.error({ err, chatId: input.chatId, messageId: input.messageId }, 'dispatchChatMessage failed');
  });
}

async function runDispatch(input: ChatMessageNotificationInput): Promise<void> {
  const targets = input.recipientUserIds.filter(
    (uid) => uid !== input.senderId && getActiveChatId(uid) !== input.chatId,
  );
  if (targets.length === 0) return;

  const tokens = await prisma.deviceToken.findMany({
    where: { userId: { in: targets } },
  });
  if (tokens.length === 0) return;

  const preview = truncate(input.preview);
  const title = input.chatName || input.senderDisplayName;
  const data = {
    type: 'chat_message' as const,
    chatId: input.chatId,
    messageId: input.messageId,
    senderId: input.senderId,
  };

  const expoTokens = tokens.filter((t) => t.platform !== 'WEB');
  const webTokens = tokens.filter((t) => t.platform === 'WEB');

  const work: Array<Promise<unknown>> = [];

  if (expoTokens.length > 0) {
    work.push(
      sendExpoPush(
        expoTokens.map((t) => ({ to: t.token, title, body: preview, data })),
      ),
    );
  }

  for (const t of webTokens) {
    if (!t.endpoint || !t.p256dh || !t.auth) continue;
    work.push(
      sendWebPush(
        { endpoint: t.endpoint, keys: { p256dh: t.p256dh, auth: t.auth } },
        { type: 'chat_message', title, body: preview, data },
      ).then(async (res) => {
        if (res.gone) {
          await prisma.deviceToken.delete({ where: { id: t.id } }).catch(() => undefined);
        }
      }),
    );
  }

  await Promise.allSettled(work);
}
