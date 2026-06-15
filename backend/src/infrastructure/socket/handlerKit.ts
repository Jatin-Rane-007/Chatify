import type { ZodSchema } from 'zod';
import type { Socket } from 'socket.io';
import { logger } from '../../shared/logger.js';
import { AppError } from '../../shared/errors/AppError.js';
import { checkRate } from './rateLimit.js';
import { ackErr, ackOk, type Ack, type AckErrorCode } from './events.js';
import type { AuthedSocket } from './types.js';

type Handler<TPayload, TResult> = (
  socket: AuthedSocket,
  payload: TPayload,
) => Promise<TResult>;

const ERR_MAP: Record<string, AckErrorCode> = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  BLOCKED: 'BLOCKED',
  PRIVACY_RESTRICTION: 'BLOCKED',
  BAD_REQUEST: 'BAD_REQUEST',
};

function toAckError(err: unknown): { code: AckErrorCode; message: string } {
  if (err instanceof AppError) {
    return { code: ERR_MAP[err.code] ?? 'INTERNAL', message: err.message };
  }
  return { code: 'INTERNAL', message: 'Unexpected server error' };
}

/**
 * Wraps a socket event handler with: rate-limit -> validation -> exec -> ack.
 * The last argument from the client must be the ack callback.
 */
export function bind<TPayload, TResult>(
  socket: Socket,
  event: string,
  schema: ZodSchema<TPayload>,
  handler: Handler<TPayload, TResult>,
): void {
  socket.on(event, async (raw: unknown, ack?: (res: Ack<TResult>) => void) => {
    const respond = typeof ack === 'function' ? ack : () => undefined;

    if (!checkRate(socket, event)) {
      return respond(ackErr('RATE_LIMITED', `Too many ${event} requests`));
    }

    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      return respond(ackErr('BAD_REQUEST', parsed.error.issues[0]?.message ?? 'Invalid payload'));
    }

    try {
      const result = await handler(socket as AuthedSocket, parsed.data);
      respond(ackOk(result));
    } catch (err) {
      const { code, message } = toAckError(err);
      if (code === 'INTERNAL') {
        logger.error({ err, event, sid: socket.id }, 'socket handler crashed');
      } else {
        logger.debug({ event, code, message, sid: socket.id }, 'socket handler rejected');
      }
      respond(ackErr(code, message));
    }
  });
}
