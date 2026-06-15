'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';
import { createChatSocket, type ChatSocket } from '@/lib/socket/client';
import {
  useSwMessageBridge,
  type ServiceWorkerToastPayload,
} from '@/lib/notifications/useSwMessageBridge';

export type SocketStatus = 'idle' | 'connecting' | 'connected' | 'disconnected';

interface SocketContextValue {
  socket: ChatSocket | null;
  status: SocketStatus;
}

const SocketContext = createContext<SocketContextValue | undefined>(undefined);

export function SocketProvider({ children }: { readonly children: React.ReactNode }) {
  const { token } = useAuth();
  const router = useRouter();
  const tokenRef = useRef<string | null>(token);
  tokenRef.current = token;

  const [status, setStatus] = useState<SocketStatus>('idle');

  const handleChatMessage = useCallback(
    (p: ServiceWorkerToastPayload) => {
      // A push arrived while this tab is focused — the SW relays it here instead
      // of popping an OS banner, so surface it as an in-app toast.
      const chatId = p.data?.chatId;
      toast(p.title, {
        description: p.body,
        action: chatId
          ? {
              label: 'Open',
              onClick: () => router.push(`/?openChatId=${encodeURIComponent(chatId)}`),
            }
          : undefined,
      });
    },
    [router],
  );

  const handleNavigate = useCallback(
    (url: string) => {
      router.push(url);
    },
    [router],
  );

  useSwMessageBridge({ onChatMessage: handleChatMessage, onNavigate: handleNavigate });

  // Build the socket once and reuse — it reads token from a ref so refreshing
  // the JWT doesn't require recreating the connection.
  const socket = useMemo<ChatSocket | null>(() => {
    if (typeof window === 'undefined') return null;
    return createChatSocket(() => tokenRef.current);
  }, []);

  useEffect(() => {
    if (!socket) return;

    const raw = socket.raw;
    const onConnecting = () => setStatus('connecting');
    const onConnect = () => setStatus('connected');
    const onDisconnect = () => setStatus('disconnected');
    const onConnectError = () => setStatus('disconnected');

    raw.io.on('reconnect_attempt', onConnecting);
    raw.on('connect', onConnect);
    raw.on('disconnect', onDisconnect);
    raw.on('connect_error', onConnectError);

    if (token) {
      setStatus('connecting');
      socket.connect();
    } else {
      socket.disconnect();
      setStatus('idle');
    }

    return () => {
      raw.io.off('reconnect_attempt', onConnecting);
      raw.off('connect', onConnect);
      raw.off('disconnect', onDisconnect);
      raw.off('connect_error', onConnectError);
    };
  }, [socket, token]);

  // Tear down completely on unmount (page navigation away from app root).
  useEffect(() => {
    return () => {
      socket?.disconnect();
    };
  }, [socket]);

  const value = useMemo(() => ({ socket, status }), [socket, status]);

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket(): SocketContextValue {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within a SocketProvider');
  return ctx;
}
