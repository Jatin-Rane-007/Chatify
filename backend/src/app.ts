import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { globalErrorHandler, notFoundHandler } from './shared/middleware/error.middleware.js';
import { requestIdMiddleware } from './shared/middleware/requestId.middleware.js';
import { httpLogger } from './shared/middleware/httpLogger.middleware.js';
import { globalRateLimiter } from './shared/middleware/rateLimiter.middleware.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { userRoutes } from './modules/users/users.routes.js';
import { chatRoutes } from './modules/chats/chats.routes.js';
import { notificationsRoutes } from './modules/notifications/notifications.routes.js';
import { env } from './config/env.js';

const app = express();

const corsOrigins = env.NODE_ENV === 'production'
  ? env.CORS_ORIGIN.split(',').map((s) => s.trim()).filter(Boolean)
  : true;

app.use(helmet());
app.use(cors({
  origin: corsOrigins,
  credentials: true,
}));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(requestIdMiddleware);
app.use(httpLogger);
app.use(globalRateLimiter);
app.use(compression() as any);

// Authentication routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/chats', chatRoutes);
app.use('/api/v1/notifications', notificationsRoutes);

// Health check endpoint as specified in backend/AGENTS.md
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    version: '1.0.0',
  });
});

// Post-route middleware
app.use(notFoundHandler);
app.use(globalErrorHandler);

export { app };
