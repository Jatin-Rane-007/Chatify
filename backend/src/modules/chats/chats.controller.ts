import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../infrastructure/database/prisma.js';
import { AppError } from '../../shared/errors/AppError.js';
import {
  broadcastMessageDeleted,
  broadcastMessageRead,
  broadcastNewMessage,
  broadcastRequestNew,
  broadcastRequestUpdated,
  broadcastRoomCreated,
} from '../../infrastructure/socket/broadcast.js';
import { dispatchChatMessage } from '../notifications/notifications.service.js';


export class ChatsController {
  /**
   * Send a chat request
   */
  sendRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as any;
      const senderId = authReq.user?.userId;
      const { receiverId } = req.body;

      if (!senderId) {
        throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
      }
      if (!receiverId) {
        throw new AppError('Receiver ID is required', 400, 'BAD_REQUEST');
      }
      if (senderId === receiverId) {
        throw new AppError('You cannot send a chat request to yourself', 400, 'BAD_REQUEST');
      }

      // Check if receiver exists
      const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
      if (!receiver) {
        throw new AppError('Receiver not found', 404, 'NOT_FOUND');
      }

      // Respect "Nobody" privacy setting
      if (receiver.privacySetting === 'NOBODY') {
        throw new AppError('This user does not accept chat requests.', 403, 'PRIVACY_RESTRICTION');
      }

      // Check existing requests between these two users
      const existingRequest = await prisma.chatRequest.findFirst({
        where: {
          OR: [
            { senderId, receiverId },
            { senderId: receiverId, receiverId: senderId }
          ]
        }
      });

      if (existingRequest) {
        if (existingRequest.status === 'BLOCKED') {
          throw new AppError('This communication is blocked.', 403, 'BLOCKED');
        }
        if (existingRequest.status === 'ACCEPTED') {
          throw new AppError('You are already connected with this user.', 400, 'ALREADY_CONNECTED');
        }
        if (existingRequest.status === 'PENDING') {
          throw new AppError('A pending chat request already exists between you.', 400, 'PENDING_REQUEST');
        }
        // If it was DECLINED, we can reset it to PENDING and set the sender to current user
        await prisma.chatRequest.update({
          where: { id: existingRequest.id },
          data: {
            senderId,
            receiverId,
            status: 'PENDING',
          }
        });
      } else {
        // Create new pending request
        await prisma.chatRequest.create({
          data: {
            senderId,
            receiverId,
            status: 'PENDING'
          }
        });
      }

      broadcastRequestNew(receiverId, { fromUserId: senderId, toUserId: receiverId });
      broadcastRequestUpdated([senderId], { fromUserId: senderId, toUserId: receiverId, status: 'PENDING' });

      res.status(201).json({
        success: true,
        message: 'Chat request sent successfully',
        data: {
          fromUser: senderId,
          toUser: receiverId,
          status: 'PENDING'
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Start (or fetch) a direct chat room with another user.
   * WhatsApp-style: any user can message any other user, no acceptance required.
   * Refuses if receiver has blocked sender (or vice versa) or privacy = NOBODY.
   * Idempotent — returns the existing room if one already exists.
   */
  startDirectChat = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as any;
      const senderId = authReq.user?.userId;
      const { recipientUserId } = req.body;

      if (!senderId) {
        throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
      }
      if (!recipientUserId || typeof recipientUserId !== 'string') {
        throw new AppError('recipientUserId is required', 400, 'BAD_REQUEST');
      }
      if (senderId === recipientUserId) {
        throw new AppError('You cannot start a chat with yourself', 400, 'BAD_REQUEST');
      }

      const recipient = await prisma.user.findUnique({ where: { id: recipientUserId } });
      if (!recipient) {
        throw new AppError('User not found', 404, 'NOT_FOUND');
      }
      if (recipient.privacySetting === 'NOBODY') {
        throw new AppError('This user does not accept messages.', 403, 'PRIVACY_RESTRICTION');
      }

      // Reject if either party has blocked the other.
      const blockedRel = await prisma.chatRequest.findFirst({
        where: {
          status: 'BLOCKED',
          OR: [
            { senderId, receiverId: recipientUserId },
            { senderId: recipientUserId, receiverId: senderId },
          ],
        },
      });
      if (blockedRel) {
        throw new AppError('This conversation is blocked.', 403, 'BLOCKED');
      }

      // Auto-accept: ensure a request exists in ACCEPTED state (creates if missing,
      // promotes PENDING/DECLINED to ACCEPTED).
      const existingRequest = await prisma.chatRequest.findFirst({
        where: {
          OR: [
            { senderId, receiverId: recipientUserId },
            { senderId: recipientUserId, receiverId: senderId },
          ],
        },
      });
      if (existingRequest) {
        if (existingRequest.status !== 'ACCEPTED') {
          await prisma.chatRequest.update({
            where: { id: existingRequest.id },
            data: { status: 'ACCEPTED' },
          });
        }
      } else {
        await prisma.chatRequest.create({
          data: { senderId, receiverId: recipientUserId, status: 'ACCEPTED' },
        });
      }

      const user1Id = senderId < recipientUserId ? senderId : recipientUserId;
      const user2Id = senderId < recipientUserId ? recipientUserId : senderId;

      let chatRoom = await prisma.chatRoom.findUnique({
        where: { user1Id_user2Id: { user1Id, user2Id } },
      });
      const created = !chatRoom;
      if (!chatRoom) {
        chatRoom = await prisma.chatRoom.create({ data: { user1Id, user2Id } });
      }

      if (created) {
        broadcastRoomCreated([senderId, recipientUserId], { chatRoomId: chatRoom.id });
      }

      res.status(created ? 201 : 200).json({
        success: true,
        data: { chatRoomId: chatRoom.id, created },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get all chat requests (incoming, outgoing, blocked)
   */
  getRequests = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as any;
      const userId = authReq.user?.userId;

      if (!userId) {
        throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
      }

      const requests = await prisma.chatRequest.findMany({
        where: {
          OR: [
            { senderId: userId },
            { receiverId: userId }
          ]
        },
        include: {
          sender: {
            select: { id: true, username: true, displayName: true, avatarUrl: true, bio: true }
          },
          receiver: {
            select: { id: true, username: true, displayName: true, avatarUrl: true, bio: true }
          }
        }
      });

      const incoming = requests.filter(r => r.receiverId === userId && r.status === 'PENDING');
      const outgoing = requests.filter(r => r.senderId === userId && r.status === 'PENDING');
      const blocked = requests.filter(r => r.status === 'BLOCKED' && (r.senderId === userId || r.receiverId === userId));
      const declined = requests.filter(r => r.status === 'DECLINED' && (r.senderId === userId || r.receiverId === userId));

      res.status(200).json({
        success: true,
        data: {
          incoming,
          outgoing,
          blocked,
          declined,
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Respond to a chat request (Accept, Decline, Block)
   */
  respondRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as any;
      const userId = authReq.user?.userId;
      const { requestId } = req.params;
      const { status } = req.body; // 'ACCEPTED', 'DECLINED', 'BLOCKED'

      if (!userId) {
        throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
      }
      if (!['ACCEPTED', 'DECLINED', 'BLOCKED'].includes(status)) {
        throw new AppError('Invalid response status. Must be ACCEPTED, DECLINED, or BLOCKED', 400, 'BAD_REQUEST');
      }

      const chatRequest = await prisma.chatRequest.findUnique({
        where: { id: requestId }
      });

      if (!chatRequest) {
        throw new AppError('Chat request not found', 404, 'NOT_FOUND');
      }

      // Security check: Only the receiver can ACCEPT or DECLINE. Anyone can BLOCK.
      if (status === 'ACCEPTED' || status === 'DECLINED') {
        if (chatRequest.receiverId !== userId) {
          throw new AppError('Only the recipient of a chat request can accept or decline it', 403, 'FORBIDDEN');
        }
      }

      if (status === 'ACCEPTED') {
        // 1. Update request status to ACCEPTED
        await prisma.chatRequest.update({
          where: { id: requestId },
          data: { status: 'ACCEPTED' }
        });

        // 2. Create chat room (user1Id < user2Id to maintain uniqueness)
        const user1Id = chatRequest.senderId < chatRequest.receiverId ? chatRequest.senderId : chatRequest.receiverId;
        const user2Id = chatRequest.senderId < chatRequest.receiverId ? chatRequest.receiverId : chatRequest.senderId;

        let chatRoom = await prisma.chatRoom.findUnique({
          where: {
            user1Id_user2Id: { user1Id, user2Id }
          }
        });

        if (!chatRoom) {
          chatRoom = await prisma.chatRoom.create({
            data: { user1Id, user2Id }
          });
        }

        const participants = [chatRequest.senderId, chatRequest.receiverId];
        broadcastRequestUpdated(participants, {
          requestId,
          status: 'ACCEPTED',
          chatRoomId: chatRoom.id,
        });
        broadcastRoomCreated(participants, { chatRoomId: chatRoom.id });

        res.status(200).json({
          success: true,
          message: 'Chat request accepted',
          data: {
            status: 'ACCEPTED',
            chatRoomId: chatRoom.id,
          }
        });
      } else if (status === 'DECLINED') {
        // Update status to DECLINED or delete it. Let's update status so the sender knows it was declined.
        await prisma.chatRequest.update({
          where: { id: requestId },
          data: { status: 'DECLINED' }
        });

        broadcastRequestUpdated([chatRequest.senderId, chatRequest.receiverId], {
          requestId,
          status: 'DECLINED',
        });

        res.status(200).json({
          success: true,
          message: 'Chat request declined',
          data: { status: 'DECLINED' }
        });
      } else if (status === 'BLOCKED') {
        // Block user: Mark request as BLOCKED and ensure senderId is the blocker, receiverId is the blocked
        // (If sender is blocking, update senderId=userId, receiverId=otherUser)
        const blockerId = userId;
        const blockedId = chatRequest.senderId === userId ? chatRequest.receiverId : chatRequest.senderId;

        await prisma.chatRequest.update({
          where: { id: requestId },
          data: {
            senderId: blockerId,
            receiverId: blockedId,
            status: 'BLOCKED'
          }
        });

        // Also delete any existing chat rooms between these two users
        const user1Id = blockerId < blockedId ? blockerId : blockedId;
        const user2Id = blockerId < blockedId ? blockedId : blockerId;
        
        await prisma.chatRoom.deleteMany({
          where: { user1Id, user2Id }
        });

        broadcastRequestUpdated([blockerId, blockedId], {
          requestId,
          status: 'BLOCKED',
        });

        res.status(200).json({
          success: true,
          message: 'User blocked and active chats removed',
          data: { status: 'BLOCKED' }
        });
      }
    } catch (error) {
      next(error);
    }
  };

  /**
   * Block a user directly (without an active request)
   */
  blockUserDirectly = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as any;
      const blockerId = authReq.user?.userId;
      const { userIdToBlock } = req.body;

      if (!blockerId) {
        throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
      }
      if (!userIdToBlock) {
        throw new AppError('User ID to block is required', 400, 'BAD_REQUEST');
      }
      if (blockerId === userIdToBlock) {
        throw new AppError('You cannot block yourself', 400, 'BAD_REQUEST');
      }

      // Check if user to block exists
      const userToBlock = await prisma.user.findUnique({ where: { id: userIdToBlock } });
      if (!userToBlock) {
        throw new AppError('User not found', 404, 'NOT_FOUND');
      }

      // Delete or update any existing request relationship
      const existing = await prisma.chatRequest.findFirst({
        where: {
          OR: [
            { senderId: blockerId, receiverId: userIdToBlock },
            { senderId: userIdToBlock, receiverId: blockerId }
          ]
        }
      });

      if (existing) {
        await prisma.chatRequest.update({
          where: { id: existing.id },
          data: {
            senderId: blockerId,
            receiverId: userIdToBlock,
            status: 'BLOCKED'
          }
        });
      } else {
        await prisma.chatRequest.create({
          data: {
            senderId: blockerId,
            receiverId: userIdToBlock,
            status: 'BLOCKED'
          }
        });
      }

      // Delete active chat rooms
      const user1Id = blockerId < userIdToBlock ? blockerId : userIdToBlock;
      const user2Id = blockerId < userIdToBlock ? userIdToBlock : blockerId;

      await prisma.chatRoom.deleteMany({
        where: { user1Id, user2Id }
      });

      broadcastRequestUpdated([blockerId, userIdToBlock], {
        fromUserId: blockerId,
        toUserId: userIdToBlock,
        status: 'BLOCKED',
      });

      res.status(200).json({
        success: true,
        message: 'User blocked successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Unblock a user
   */
  unblockUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as any;
      const blockerId = authReq.user?.userId;
      const { userIdToUnblock } = req.params;

      if (!blockerId) {
        throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
      }

      // Find the BLOCKED request where blocker is the sender
      const relation = await prisma.chatRequest.findFirst({
        where: {
          senderId: blockerId,
          receiverId: userIdToUnblock,
          status: 'BLOCKED'
        }
      });

      if (!relation) {
        throw new AppError('Blocked relationship not found or you are not the blocker', 400, 'BAD_REQUEST');
      }

      // Delete the request record completely to unblock
      await prisma.chatRequest.delete({
        where: { id: relation.id }
      });

      broadcastRequestUpdated([blockerId, userIdToUnblock], {
        fromUserId: blockerId,
        toUserId: userIdToUnblock,
        status: 'UNBLOCKED',
      });

      res.status(200).json({
        success: true,
        message: 'User unblocked successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get all active chat rooms
   */
  getChatRooms = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as any;
      const userId = authReq.user?.userId;

      if (!userId) {
        throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
      }

      // Fetch chat rooms involving current user
      const chatRooms = await prisma.chatRoom.findMany({
        where: {
          OR: [
            { user1Id: userId },
            { user2Id: userId }
          ]
        },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1, // Get the last message
          }
        }
      });

      // Map details of the partner in the chat room
      const data = await Promise.all(chatRooms.map(async (room) => {
        const partnerId = room.user1Id === userId ? room.user2Id : room.user1Id;
        const partner = await prisma.user.findUnique({
          where: { id: partnerId },
          select: { id: true, username: true, displayName: true, avatarUrl: true, bio: true }
        });

        // Count unread messages sent by the partner
        const unreadCount = await prisma.message.count({
          where: {
            chatRoomId: room.id,
            senderId: partnerId,
            isRead: false,
          }
        });

        return {
          id: room.id,
          createdAt: room.createdAt,
          partner,
          lastMessage: room.messages[0] || null,
          unreadCount,
        };
      }));

      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get message history for a chat room
   */
  getRoomMessages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as any;
      const userId = authReq.user?.userId;
      const { roomId } = req.params;

      if (!userId) {
        throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
      }

      const room = await prisma.chatRoom.findUnique({
        where: { id: roomId }
      });

      if (!room) {
        throw new AppError('Chat room not found', 404, 'NOT_FOUND');
      }

      if (room.user1Id !== userId && room.user2Id !== userId) {
        throw new AppError('Access denied', 403, 'FORBIDDEN');
      }

      const messages = await prisma.message.findMany({
        where: { chatRoomId: roomId },
        orderBy: { createdAt: 'asc' }
      });

      res.status(200).json({
        success: true,
        data: messages,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Send a message
   */
  sendMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as any;
      const senderId = authReq.user?.userId;
      const { roomId } = req.params;
      const { content, messageType, replyToId } = req.body;

      if (!senderId) {
        throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
      }
      if (!content || typeof content !== 'string' || !content.trim()) {
        throw new AppError('Message content cannot be empty', 400, 'BAD_REQUEST');
      }

      const room = await prisma.chatRoom.findUnique({
        where: { id: roomId }
      });

      if (!room) {
        throw new AppError('Chat room not found', 404, 'NOT_FOUND');
      }

      if (room.user1Id !== senderId && room.user2Id !== senderId) {
        throw new AppError('Access denied to this chat room', 403, 'FORBIDDEN');
      }

      const message = await prisma.message.create({
        data: {
          chatRoomId: roomId,
          senderId,
          content: content.trim(),
          messageType: messageType || 'TEXT',
          replyToId: replyToId || null,
          isRead: false
        }
      });

      broadcastNewMessage(room.id, [room.user1Id, room.user2Id], message);

      // Fire-and-forget push fan-out. Errors are logged inside the service;
      // never blocks or fails the HTTP response.
      const sender = await prisma.user.findUnique({
        where: { id: senderId },
        select: { displayName: true, username: true, email: true },
      });
      const senderDisplayName =
        sender?.displayName || sender?.username || sender?.email || 'New message';
      const recipientUserIds = [room.user1Id, room.user2Id].filter((id) => id !== senderId);
      dispatchChatMessage({
        chatId: room.id,
        messageId: message.id,
        senderId,
        senderDisplayName,
        chatName: senderDisplayName,
        preview: message.messageType === 'TEXT' ? message.content : '📷 New message',
        recipientUserIds,
      });

      res.status(201).json({
        success: true,
        data: message,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete own message
   */
  deleteMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as any;
      const userId = authReq.user?.userId;
      const { messageId } = req.params;

      if (!userId) {
        throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
      }

      const message = await prisma.message.findUnique({
        where: { id: messageId }
      });

      if (!message) {
        throw new AppError('Message not found', 404, 'NOT_FOUND');
      }

      if (message.senderId !== userId) {
        throw new AppError('You can only delete your own messages', 403, 'FORBIDDEN');
      }

      await prisma.message.delete({
        where: { id: messageId }
      });

      broadcastMessageDeleted(message.chatRoomId, messageId);

      res.status(200).json({
        success: true,
        message: 'Message deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Mark all messages in a room as read
   */
  markRoomAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as any;
      const userId = authReq.user?.userId;
      const { roomId } = req.params;

      if (!userId) {
        throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
      }

      const room = await prisma.chatRoom.findUnique({
        where: { id: roomId }
      });

      if (!room) {
        throw new AppError('Chat room not found', 404, 'NOT_FOUND');
      }

      if (room.user1Id !== userId && room.user2Id !== userId) {
        throw new AppError('Access denied to this chat room', 403, 'FORBIDDEN');
      }

      // Mark all incoming messages as read (sender is NOT the current user)
      const result = await prisma.message.updateMany({
        where: {
          chatRoomId: roomId,
          senderId: { not: userId },
          isRead: false
        },
        data: {
          isRead: true
        }
      });

      broadcastMessageRead(roomId, userId, result.count, [room.user1Id, room.user2Id]);

      res.status(200).json({
        success: true,
        message: 'Room messages marked as read'
      });
    } catch (error) {
      next(error);
    }
  };
}
