import { Router } from 'express';
import { MediaController } from './media.controller.js';
import { authMiddleware } from '../../shared/middleware/auth.middleware.js';

const router = Router();
const mediaController = new MediaController();

// Issue a signed payload for a direct browser → Cloudinary image upload.
router.post('/signature', authMiddleware, mediaController.createUploadSignature);

export { router as mediaRoutes };
