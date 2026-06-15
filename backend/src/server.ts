import { createServer } from 'http';
import { app } from './app.js';
import { env } from './config/env.js';
import { logger } from './shared/logger.js';
import { initSocketServer } from './infrastructure/socket/socket.js';

const httpServer = createServer(app);

// Initialize Socket.io server
initSocketServer(httpServer);

const server = httpServer.listen(env.PORT, () => {
  logger.info(`Server is running on port ${env.PORT} in ${env.NODE_ENV} mode`);
});

const gracefulShutdown = (signal: string) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
