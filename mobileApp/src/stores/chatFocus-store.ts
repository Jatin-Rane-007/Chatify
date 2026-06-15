/**
 * Tracks which chat the user is currently looking at.
 * Used by the push-notification foreground handler to suppress the OS
 * banner when an incoming push matches the active chat.
 *
 * Singleton pattern matches `auth-store.ts` — no Zustand dependency.
 */
import { useEffect, useState } from 'react';

let activeChatId: string | null = null;
const listeners = new Set<() => void>();

export const ChatFocusStore = {
  get(): string | null {
    return activeChatId;
  },
  set(chatId: string | null): void {
    if (activeChatId === chatId) return;
    activeChatId = chatId;
    listeners.forEach((l) => l());
  },
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

export function useActiveChatId(): string | null {
  const [value, setValue] = useState<string | null>(ChatFocusStore.get());
  useEffect(() => ChatFocusStore.subscribe(() => setValue(ChatFocusStore.get())), []);
  return value;
}
