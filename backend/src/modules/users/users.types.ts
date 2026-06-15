export interface User {
  id: string;
  email: string;
  password?: string | null;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  privacySetting: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserData {
  email: string;
  password?: string;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  privacySetting?: string;
}
