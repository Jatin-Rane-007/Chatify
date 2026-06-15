'use client';

import { useEffect } from 'react';

export interface ServiceWorkerToastPayload {
  title: string;
  body: string;
  data?: { chatId?: string };
}

interface BridgeOptions {
  onChatMessage?: (payload: ServiceWorkerToastPayload) => void;
  onNavigate?: (url: string) => void;
}

/**
 * Listens for messages posted by the push service worker — used when a push
 * arrives while a tab is visible (the SW relays instead of showing an OS
 * banner) and when a notification click wants to focus + navigate.
 */
export function useSwMessageBridge({ onChatMessage, onNavigate }: BridgeOptions): void {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    const handler = (e: MessageEvent): void => {
      const data = e.data;
      if (!data || typeof data !== 'object') return;
      if (data.type === 'chat_message' && onChatMessage) {
        onChatMessage(data.payload as ServiceWorkerToastPayload);
      } else if (data.type === 'navigate' && typeof data.url === 'string' && onNavigate) {
        onNavigate(data.url);
      }
    };

    navigator.serviceWorker.addEventListener('message', handler);
    return () => navigator.serviceWorker.removeEventListener('message', handler);
  }, [onChatMessage, onNavigate]);
}
