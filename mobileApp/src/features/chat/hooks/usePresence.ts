import { useEffect, useState } from 'react';
import { useSocket } from '@/context/SocketContext';
import { SOCKET_EVENTS } from '@/lib/socket/events';

/**
 * Tracks online status for a list of users. Batch-queries once on connect,
 * then keeps the map in sync via `presence:update` push events.
 */
export function usePresence(userIds: string[]): Record<string, boolean> {
  const { socket, status } = useSocket();
  const [online, setOnline] = useState<Record<string, boolean>>({});

  const key = userIds.slice().sort().join(',');

  useEffect(() => {
    if (!socket || status !== 'connected' || userIds.length === 0) return;

    let cancelled = false;
    void socket.presenceQuery(userIds).then((ack) => {
      if (!cancelled && ack.ok) setOnline(ack.data);
    });

    const off = socket.on(SOCKET_EVENTS.PRESENCE_UPDATE, (p) => {
      if (!userIds.includes(p.userId)) return;
      setOnline((prev) => ({ ...prev, [p.userId]: p.status === 'online' }));
    });

    return () => {
      cancelled = true;
      off();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, status, key]);

  return online;
}
