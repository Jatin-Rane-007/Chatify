import { IUserRepository } from '../users/users.repository.js';
import { AppError } from '../../shared/errors/AppError.js';
import { signJwt } from '../../shared/utils/jwt.js';
import { env } from '../../config/env.js';
import { prisma } from '../../infrastructure/database/prisma.js';
import { User } from '../users/users.types.js';
import { hashPassword, verifyPassword } from '../../shared/utils/crypto.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface AuthResponse {
  user: User;
  token: string;
}

export class AuthService {
  constructor(private readonly userRepo: IUserRepository) {}

  async signup(email: string, password: string): Promise<AuthResponse> {
    if (!password || password.length < 8) {
      throw new AppError('Password must be at least 8 characters long', 400, 'PASSWORD_REQUIRED');
    }

    const existingUser = await this.userRepo.findByEmail(email);
    if (existingUser) {
      throw new AppError('Email is already in use', 400, 'EMAIL_IN_USE');
    }

    const user = await this.userRepo.create({
      email,
      password: hashPassword(password),
    });

    const token = signJwt({ userId: user.id, email: user.email }, env.ACCESS_TOKEN_SECRET);

    return { user, token };
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    if (!password) {
      throw new AppError('Password is required', 400, 'PASSWORD_REQUIRED');
    }

    const user = await this.userRepo.findByEmail(email);
    if (!user || !user.password) {
      // Treat legacy passwordless accounts as missing — they were wiped.
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    if (!verifyPassword(password, user.password)) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    const token = signJwt({ userId: user.id, email: user.email }, env.ACCESS_TOKEN_SECRET);

    return { user, token };
  }

  async checkUsernameAvailable(username: string): Promise<boolean> {
    const user = await this.userRepo.findByUsername(username);
    return !user;
  }

  async updateProfile(userId: string, data: Partial<User>): Promise<User> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new AppError('No user found with this ID', 404, 'USER_NOT_FOUND');
    }

    if (data.username) {
      const trimmedUsername = data.username.trim().toLowerCase();
      // Enforce alphanumeric/underscore, length between 3 and 20
      if (!/^[a-zA-Z0-9_]{3,20}$/.test(trimmedUsername)) {
        throw new AppError('Username must be 3-20 characters and contain only letters, numbers, or underscores', 400, 'INVALID_USERNAME');
      }
      
      if (trimmedUsername !== user.username) {
        const existing = await this.userRepo.findByUsername(trimmedUsername);
        if (existing) {
          throw new AppError('Username is already taken', 400, 'USERNAME_TAKEN');
        }
        data.username = trimmedUsername;
      }
    }

    return this.userRepo.update(userId, data);
  }

  /** Change the account email after verifying the current password. */
  async changeEmail(userId: string, newEmail: string, currentPassword: string): Promise<User> {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new AppError('No user found with this ID', 404, 'USER_NOT_FOUND');
    if (!user.password) {
      throw new AppError('Set a password before changing your email', 400, 'NO_PASSWORD');
    }
    if (!verifyPassword(currentPassword, user.password)) {
      throw new AppError('Password is incorrect', 401, 'INVALID_CREDENTIALS');
    }

    const email = newEmail.trim().toLowerCase();
    if (!EMAIL_RE.test(email)) {
      throw new AppError('Please enter a valid email address', 400, 'BAD_REQUEST');
    }
    if (email === user.email) {
      throw new AppError('That is already your email address', 400, 'BAD_REQUEST');
    }
    const existing = await this.userRepo.findByEmail(email);
    if (existing) {
      throw new AppError('That email is already in use', 400, 'EMAIL_IN_USE');
    }

    return this.userRepo.update(userId, { email });
  }

  /** Change the account password after verifying the current one. */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new AppError('No user found with this ID', 404, 'USER_NOT_FOUND');
    if (!user.password) {
      throw new AppError('No password is set on this account', 400, 'NO_PASSWORD');
    }
    if (!verifyPassword(currentPassword, user.password)) {
      throw new AppError('Current password is incorrect', 401, 'INVALID_CREDENTIALS');
    }
    if (!newPassword || newPassword.length < 8) {
      throw new AppError('New password must be at least 8 characters long', 400, 'PASSWORD_REQUIRED');
    }
    if (verifyPassword(newPassword, user.password)) {
      throw new AppError('New password must be different from the current one', 400, 'BAD_REQUEST');
    }
    await this.userRepo.update(userId, { password: hashPassword(newPassword) });
  }

  /**
   * Permanently delete the account. Verifies the current password, then removes
   * the user (chat requests + device tokens cascade via FK) and any chat rooms
   * the user is part of (ChatRoom has no FK to User, so it's cleaned manually;
   * its messages cascade via the ChatRoom relation).
   */
  async deleteAccount(userId: string, currentPassword: string): Promise<void> {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new AppError('No user found with this ID', 404, 'USER_NOT_FOUND');
    if (user.password && !verifyPassword(currentPassword, user.password)) {
      throw new AppError('Password is incorrect', 401, 'INVALID_CREDENTIALS');
    }

    await prisma.chatRoom.deleteMany({
      where: { OR: [{ user1Id: userId }, { user2Id: userId }] },
    });
    await prisma.user.delete({ where: { id: userId } });
  }
}
