import type { Server, Socket } from 'socket.io';
import { verifyJwt } from '../../shared/utils/jwt.js';
import { env } from '../../config/env.js';
import { logger } from '../../shared/logger.js';

function extractToken(socket: Socket): string | null {
  const fromAuth = (socket.handshake.auth as { token?: string } | undefined)?.token;
  if (typeof fromAuth === 'string' && fromAuth.length > 0) return fromAuth;

  const fromQuery = socket.handshake.query?.token;
  if (typeof fromQuery === 'string' && fromQuery.length > 0) return fromQuery;

  const header = socket.handshake.headers.authorization;
  if (typeof header === 'string' && header.startsWith('Bearer ')) {
    return header.slice(7);
  }
  return null;
}

export function registerSocketAuth(io: Server): void {
  io.use((socket, next) => {
    try {
      const token = extractToken(socket);
      if (!token) return next(new Error('UNAUTHORIZED: missing token'));

      const payload = verifyJwt(token, env.ACCESS_TOKEN_SECRET);
      if (!payload?.userId || !payload?.email) {
        return next(new Error('UNAUTHORIZED: invalid token payload'));
      }

      socket.data = { userId: payload.userId, email: payload.email };
      next();
    } catch (err) {
      logger.warn({ err: (err as Error).message, sid: socket.id }, 'socket auth rejected');
      next(new Error('UNAUTHORIZED: token verification failed'));
    }
  });
}
