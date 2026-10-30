export interface User {
  id: string;
  name: string;
  email: string;
  balance: number;
  role: 'user' | 'admin' | string;
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | string;
  created_at?: string;
  updated_at?: string;
}

export interface SessionData {
  token: string;
  refreshToken?: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface VerifyOtpPayload {
  userId?: string;
  email?: string;
  otpCode: string;
}

export interface ResendOtpPayload {
  userId?: string;
  email?: string;
}

export interface ResetPasswordPayload {
  email: string;
  otpCode: string;
  newPassword: string;
}

export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  code?: string;
  message?: string;
  data?: T;
  token?: string;
  refreshToken?: string;
  user?: User;
  requiresOtp?: boolean;
  userId?: string;
  email?: string;
  expiresInMinutes?: number;
  remainingSeconds?: number;
}

