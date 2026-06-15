import type { Server } from 'socket.io';
import { logger } from '../../shared/logger.js';

/**
 * Adapter factory. Default is socket.io's in-memory adapter.
 *
 * To enable horizontal scaling, install `@socket.io/redis-adapter` and
 * `ioredis`, then swap this implementation:
 *
 *   import { createAdapter } from '@socket.io/redis-adapter';
 *   import { Redis } from 'ioredis';
 *   const pub = new Redis(env.REDIS_URL);
 *   const sub = pub.duplicate();
 *   io.adapter(createAdapter(pub, sub));
 *
 * Everything else (rooms, presence, broadcasts) is already adapter-safe.
 */
export function attachAdapter(_io: Server): void {
  logger.info('socket adapter: in-memory (single-instance)');
}
