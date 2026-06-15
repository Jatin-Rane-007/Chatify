import { Response, NextFunction } from 'express';
import { prisma } from '../../infrastructure/database/prisma.js';
import { AppError } from '../../shared/errors/AppError.js';
import type { AuthenticatedRequest } from '../../shared/middleware/auth.middleware.js';
import type { RegisterDeviceDto } from './notifications.types.js';

export class NotificationsController {
  registerDevice = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');

      const { platform, token, endpoint, p256dh, auth } = req.body as RegisterDeviceDto;

      await prisma.deviceToken.upsert({
        where: { token },
        create: {
          userId,
          platform,
          token,
          endpoint: endpoint ?? null,
          p256dh: p256dh ?? null,
          auth: auth ?? null,
        },
        update: {
          userId,
          platform,
          endpoint: endpoint ?? null,
          p256dh: p256dh ?? null,
          auth: auth ?? null,
          lastSeenAt: new Date(),
        },
      });

      res.status(201).json({ success: true });
    } catch (err) {
      next(err);
    }
  };

  unregisterDevice = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');

      const token = decodeURIComponent(req.params.token ?? '');
      if (!token) throw new AppError('Token is required', 400, 'BAD_REQUEST');

      await prisma.deviceToken.deleteMany({ where: { token, userId } });
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  };
}
