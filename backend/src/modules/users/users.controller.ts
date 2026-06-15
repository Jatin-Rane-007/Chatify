import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../infrastructure/database/prisma.js';
import { AppError } from '../../shared/errors/AppError.js';

export class UserController {
  /**
   * Search for other users by username or display name
   */
  searchUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as any;
      const currentUserId = authReq.user?.userId;
      if (!currentUserId) {
        throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
      }

      const { q } = req.query;
      const searchTerm = typeof q === 'string' ? q.trim() : '';

      if (!searchTerm) {
        res.status(200).json({ success: true, data: [] });
        return;
      }

      // 1. Find all blocked relationships involving the current user
      const blockedRelations = await prisma.chatRequest.findMany({
        where: {
          status: 'BLOCKED',
          OR: [
            { senderId: currentUserId },
            { receiverId: currentUserId },
          ],
        },
      });

      // Collect IDs of users that are blocked by or have blocked the current user
      const blockedUserIds = blockedRelations.map(rel => 
        rel.senderId === currentUserId ? rel.receiverId : rel.senderId
      );

      // 2. Search users in DB matching username or displayName
      const users = await prisma.user.findMany({
        where: {
          id: {
            not: currentUserId,
            notIn: blockedUserIds,
          },
          privacySetting: {
            not: 'NOBODY', // Respect the "Nobody: No chat requests" privacy setting by hiding them
          },
          OR: [
            { username: { contains: searchTerm, mode: 'insensitive' } },
            { displayName: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          bio: true,
          privacySetting: true,
        },
      });

      // 3. For each user, fetch their current request relationship with the searcher
      // (so that the frontend can render the appropriate state: 'Request Chat', 'Pending', or 'Accepted')
      const userRelationships = await prisma.chatRequest.findMany({
        where: {
          OR: [
            { senderId: currentUserId, receiverId: { in: users.map(u => u.id) } },
            { receiverId: currentUserId, senderId: { in: users.map(u => u.id) } },
          ],
        },
      });

      const data = users.map(user => {
        const relation = userRelationships.find(
          r => (r.senderId === currentUserId && r.receiverId === user.id) ||
               (r.receiverId === currentUserId && r.senderId === user.id)
        );

        return {
          ...user,
          relationship: relation ? {
            id: relation.id,
            senderId: relation.senderId,
            receiverId: relation.receiverId,
            status: relation.status,
          } : null,
        };
      });

      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  };
}
