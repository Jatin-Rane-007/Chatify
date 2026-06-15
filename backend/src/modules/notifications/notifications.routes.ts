import { Router } from 'express';
import { authMiddleware } from '../../shared/middleware/auth.middleware.js';
import { validate } from '../../shared/middleware/validate.middleware.js';
import { NotificationsController } from './notifications.controller.js';
import { RegisterDeviceSchema } from './notifications.types.js';

const router = Router();
const controller = new NotificationsController();

router.post(
  '/devices',
  authMiddleware,
  validate(RegisterDeviceSchema),
  controller.registerDevice,
);
router.delete('/devices/:token', authMiddleware, controller.unregisterDevice);

export { router as notificationsRoutes };
