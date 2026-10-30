export type UserRole = 'user' | 'admin';
export type UserStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED';

export interface UserRow {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  balance: number;
  role: UserRole;
  status: UserStatus;
  created_at: Date | string;
  updated_at?: Date | string;
}

export type UserSafe = Omit<UserRow, 'password_hash'>;

export interface CreateUserDTO {
  name: string;
  email: string;
  passwordHash: string;
  balance?: number;
  role?: UserRole;
  status?: UserStatus;
}

export interface UpdatePendingUserDTO {
  name: string;
  passwordHash: string;
}

export interface UserSessionRow {
  id: string;
  user_id: string;
  refresh_token: string;
  ip_address: string | null;
  user_agent: string | null;
  expires_at: Date | string;
  created_at: Date | string;
}

export interface SessionWithUser {
  id: string;
  user_id: string;
  expires_at: Date | string;
  created_at: Date | string;
  user_pk: string;
  name: string;
  email: string;
  role: UserRole;
  balance: number;
}

export interface CreateSessionDTO {
  userId: string;
  refreshToken: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  daysValid?: number;
}

