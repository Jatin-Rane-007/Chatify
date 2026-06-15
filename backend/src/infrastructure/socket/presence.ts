/**
 * Tracks which chat (if any) each user is actively viewing.
 * Used by the notifications dispatcher to skip OS pushes for users
 * who are looking at the conversation right now.
 *
 * Single-process. For horizontal scaling, swap the Map for a Redis hash
 * keyed off the socket adapter's shared connection.
 */

const activeChatByUser = new Map<string, string>();

export function setActiveChat(userId: string, chatId: string | null): void {
  if (!userId) return;
  if (chatId) activeChatByUser.set(userId, chatId);
  else activeChatByUser.delete(userId);
}

export function getActiveChatId(userId: string): string | null {
  return activeChatByUser.get(userId) ?? null;
}
