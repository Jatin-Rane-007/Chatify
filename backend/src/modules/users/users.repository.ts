import { PrismaClient } from '@prisma/client';
import { User, CreateUserData } from './users.types.js';

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  create(data: CreateUserData): Promise<User>;
  update(id: string, data: Partial<User>): Promise<User>;
}

export class UserRepository implements IUserRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: string): Promise<User | null> {
    return this.db.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.db.user.findUnique({
      where: { email },
    });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.db.user.findUnique({
      where: { username },
    });
  }

  async create(data: CreateUserData): Promise<User> {
    const generatedUsername = `user_${Math.random().toString(36).substring(2, 12)}`;
    return this.db.user.create({
      data: {
        email: data.email,
        password: data.password,
        username: data.username ?? generatedUsername,
        displayName: data.displayName ?? data.email.split('@')[0],
        avatarUrl: data.avatarUrl,
        bio: data.bio,
        privacySetting: data.privacySetting ?? 'EVERYONE',
      },
    });
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    return this.db.user.update({
      where: { id },
      data,
    });
  }
}
