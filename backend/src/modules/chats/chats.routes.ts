import { Router } from 'express';
import { ChatsController } from './chats.controller.js';
import { authMiddleware } from '../../shared/middleware/auth.middleware.js';

const router = Router();
const chatsController = new ChatsController();

// Chat Request Routes
router.post('/requests', authMiddleware, chatsController.sendRequest);
router.get('/requests', authMiddleware, chatsController.getRequests);
router.post('/requests/:requestId/respond', authMiddleware, chatsController.respondRequest);

// Blocking Direct Routes
router.post('/blocked', authMiddleware, chatsController.blockUserDirectly);
router.delete('/blocked/:userIdToUnblock', authMiddleware, chatsController.unblockUser);

// Chat Room Routes
router.post('/rooms/direct', authMiddleware, chatsController.startDirectChat);
router.get('/rooms', authMiddleware, chatsController.getChatRooms);
router.get('/rooms/:roomId/messages', authMiddleware, chatsController.getRoomMessages);
router.post('/rooms/:roomId/messages', authMiddleware, chatsController.sendMessage);
router.post('/rooms/:roomId/read', authMiddleware, chatsController.markRoomAsRead);

// Direct Message Actions
router.delete('/messages/:messageId', authMiddleware, chatsController.deleteMessage);

export { router as chatRoutes };
