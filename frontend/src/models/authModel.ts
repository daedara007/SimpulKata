import apiClient from '../services/apiClient';
import type {
  User,
  LoginCredentials,
  RegisterPayload,
  VerifyOtpPayload,
  ResendOtpPayload,
  ResetPasswordPayload,
  ApiResponse,
  SessionData,
} from '../types';

/**
 * models/authModel.ts - Model Data & Klien API Autentikasi Pengguna
 *
 * Mengimplementasikan pemanggilan API:
 * - POST /api/auth/login
 * - POST /api/auth/register
 * - POST /api/auth/verify-otp
 * - POST /api/auth/resend-otp
 * - POST /api/auth/forgot-password
 * - POST /api/auth/reset-password
 * - GET  /api/auth/me
 * - POST /api/auth/refresh
 * - POST /api/auth/logout
 * Serta helper persistensi sesi di localStorage (referensi/erd.puml)
 */

export const authModel = {
  /**
   * Mengirim kredensial login ke server
   */
  async login(credentials: LoginCredentials): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>('/api/auth/login', credentials);
    return response.data;
  },

  /**
   * Mendaftarkan akun baru
   */
  async register(payload: RegisterPayload): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>('/api/auth/register', payload);
    return response.data;
  },

  /**
   * Memverifikasi kode OTP 6-digit
   */
  async verifyOtp(payload: VerifyOtpPayload): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>('/api/auth/verify-otp', payload);
    return response.data;
  },

  /**
   * Mengirim ulang kode OTP baru
   */
  async resendOtp(payload: ResendOtpPayload): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>('/api/auth/resend-otp', payload);
    return response.data;
  },

  /**
   * Meminta kode OTP pemulihan kata sandi
   */
  async forgotPassword(email: string): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>('/api/auth/forgot-password', { email });
    return response.data;
  },

  /**
   * Mengirim OTP dan kata sandi baru untuk pemulihan kata sandi
   */
  async resetPassword(payload: ResetPasswordPayload): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>('/api/auth/reset-password', payload);
    return response.data;
  },

  /**
   * Mengambil data profil dan saldo kuota pengguna terkini
   */
  async getProfile(): Promise<ApiResponse<User>> {
    const response = await apiClient.get<ApiResponse<User>>('/api/auth/me');
    return response.data;
  },

  /**
   * Melakukan rotasi sesi secara manual
   */
  async refreshSession(refreshToken: string): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>('/api/auth/refresh', { refreshToken });
    return response.data;
  },

  /**
   * Mencabut sesi aktif di server
   */
  async logout(refreshToken: string): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>('/api/auth/logout', { refreshToken });
    return response.data;
  },

  // =========================================================
  // HELPER STORAGE SESI
  // =========================================================

  getStoredToken(): string {
    return localStorage.getItem('simpulkata_token') || '';
  },

  getStoredRefreshToken(): string {
    return localStorage.getItem('simpulkata_refresh_token') || '';
  },

  getStoredUser(): User | null {
    try {
      const user = localStorage.getItem('simpulkata_user');
      return user ? (JSON.parse(user) as User) : null;
    } catch (_) {
      return null;
    }
  },

  setSession({ token, refreshToken, user }: SessionData): void {
    if (token) localStorage.setItem('simpulkata_token', token);
    if (refreshToken) localStorage.setItem('simpulkata_refresh_token', refreshToken);
    if (user) localStorage.setItem('simpulkata_user', JSON.stringify(user));
  },

  clearSession(): void {
    localStorage.removeItem('simpulkata_token');
    localStorage.removeItem('simpulkata_refresh_token');
    localStorage.removeItem('simpulkata_user');
  },
};

export default authModel;

