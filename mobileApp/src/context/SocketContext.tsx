import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { createChatSocket, type ChatSocket } from '@/lib/socket/client';

export type SocketStatus = 'idle' | 'connecting' | 'connected' | 'disconnected';

interface SocketContextValue {
  socket: ChatSocket | null;
  status: SocketStatus;
}

const SocketContext = createContext<SocketContextValue | undefined>(undefined);

export function SocketProvider({ children }: { readonly children: ReactNode }) {
  const { token } = useAuthStore();
  const tokenRef = useRef<string | null>(token);
  tokenRef.current = token;

  const [status, setStatus] = useState<SocketStatus>('idle');

  const socket = useMemo<ChatSocket>(
    () => createChatSocket(() => tokenRef.current),
    [],
  );

  useEffect(() => {
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

  useEffect(() => {
    return () => {
      socket.disconnect();
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
