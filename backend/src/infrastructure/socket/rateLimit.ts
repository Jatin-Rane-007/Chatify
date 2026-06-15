import type { Socket } from 'socket.io';

/**
 * Sliding-window per-socket per-event rate limiter.
 * In-memory only — sufficient for a single instance. With the Redis adapter
 * this stays correct because each connection is sticky to one node.
 */

interface Bucket {
  hits: number[];
}

interface LimiterConfig {
  windowMs: number;
  max: number;
}

const DEFAULT_LIMITS: Record<string, LimiterConfig> = {
  'message:send': { windowMs: 10_000, max: 20 },
  'message:markRead': { windowMs: 5_000, max: 30 },
  'message:delete': { windowMs: 10_000, max: 10 },
  'typing:set': { windowMs: 5_000, max: 30 },
  'room:join': { windowMs: 10_000, max: 20 },
  'room:leave': { windowMs: 10_000, max: 20 },
  'presence:query': { windowMs: 10_000, max: 20 },
};

const SOCKET_BUCKETS = new WeakMap<Socket, Map<string, Bucket>>();

export function checkRate(socket: Socket, event: string): boolean {
  const cfg = DEFAULT_LIMITS[event];
  if (!cfg) return true;

  let perEvent = SOCKET_BUCKETS.get(socket);
  if (!perEvent) {
    perEvent = new Map();
    SOCKET_BUCKETS.set(socket, perEvent);
  }

  const bucket = perEvent.get(event) ?? { hits: [] };
  const now = Date.now();
  const cutoff = now - cfg.windowMs;
  bucket.hits = bucket.hits.filter((t) => t > cutoff);

  if (bucket.hits.length >= cfg.max) {
    perEvent.set(event, bucket);
    return false;
  }
  bucket.hits.push(now);
  perEvent.set(event, bucket);
  return true;
}
