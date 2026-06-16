import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service.js';
import { AppError } from '../../shared/errors/AppError.js';

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  signup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body;
      const result = await this.authService.signup(email, password);

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body;
      const result = await this.authService.login(email, password);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  checkUsername = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { username } = req.query;
      if (!username || typeof username !== 'string') {
        throw new AppError('Username parameter is required.', 400, 'BAD_REQUEST');
      }
      const isAvailable = await this.authService.checkUsernameAvailable(username);
      res.status(200).json({
        success: true,
        data: {
          available: isAvailable,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as any;
      const userId = authReq.user?.userId;
      if (!userId) {
        throw new AppError('Unauthorized access. Please log in first.', 401, 'UNAUTHORIZED');
      }

      const { name, username, displayName, bio, avatarUrl, privacySetting } = req.body;
      
      const updateData: any = {};
      if (displayName !== undefined) {
        updateData.displayName = displayName;
      } else if (name !== undefined) {
        updateData.displayName = name;
      }
      
      if (username !== undefined) updateData.username = username;
      if (bio !== undefined) updateData.bio = bio;
      if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
      if (privacySetting !== undefined) updateData.privacySetting = privacySetting;

      const updatedUser = await this.authService.updateProfile(userId, updateData);

      res.status(200).json({
        success: true,
        data: {
          user: updatedUser,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  changeEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');

      const { newEmail, currentPassword } = req.body;
      if (!newEmail || !currentPassword) {
        throw new AppError('New email and current password are required', 400, 'BAD_REQUEST');
      }

      const user = await this.authService.changeEmail(userId, newEmail, currentPassword);
      res.status(200).json({ success: true, data: { user } });
    } catch (error) {
      next(error);
    }
  };

  changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');

      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        throw new AppError('Current and new password are required', 400, 'BAD_REQUEST');
      }

      await this.authService.changePassword(userId, currentPassword, newPassword);
      res.status(200).json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
      next(error);
    }
  };

  deleteAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');

      const { currentPassword } = req.body;
      await this.authService.deleteAccount(userId, currentPassword ?? '');
      res.status(200).json({ success: true, message: 'Account deleted' });
    } catch (error) {
      next(error);
    }
  };
}
