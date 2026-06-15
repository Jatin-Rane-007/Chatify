import { IUserRepository } from '../users/users.repository.js';
import { AppError } from '../../shared/errors/AppError.js';
import { signJwt } from '../../shared/utils/jwt.js';
import { env } from '../../config/env.js';
import { User } from '../users/users.types.js';
import { hashPassword, verifyPassword } from '../../shared/utils/crypto.js';

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
}
