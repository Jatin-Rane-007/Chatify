import { Router } from 'express';
import { prisma } from '../../infrastructure/database/prisma.js';
import { UserRepository } from '../users/users.repository.js';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { SignupSchema, LoginSchema } from './auth.types.js';
import { validate } from '../../shared/middleware/validate.middleware.js';
import { authMiddleware } from '../../shared/middleware/auth.middleware.js';

const router = Router();

// Instantiate layers with dependency injection
const userRepository = new UserRepository(prisma);
const authService = new AuthService(userRepository);
const authController = new AuthController(authService);

// Bind routes
router.post('/signup', validate(SignupSchema), authController.signup);
router.post('/login', validate(LoginSchema), authController.login);
router.get('/profile/check-username', authController.checkUsername);
router.put('/profile', authMiddleware, authController.updateProfile);

export { router as authRoutes };
