import { Router } from 'express';
import { UserController } from './users.controller.js';
import { authMiddleware } from '../../shared/middleware/auth.middleware.js';

const router = Router();
const userController = new UserController();

router.get('/search', authMiddleware, userController.searchUsers);

export { router as userRoutes };
