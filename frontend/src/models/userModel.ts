/**
 * models/userModel.ts - Data Access Object (DAO) untuk data profil pengguna
 * Berdasarkan SRS UC-04 & SD-04
 */

import apiClient from '../services/apiClient';
import type {
  User,
  UpdateProfilePayload,
  VerifyEmailChangePayload,
  ChangePasswordPayload,
  ApiResponse,
} from '../types';

export class UserModel {
  /**
   * Mengambil data profil pengguna terkini
   * GET /api/users/profile
   */
  async getProfile(): Promise<ApiResponse<User>> {
    const res = await apiClient.get<ApiResponse<User>>('/api/users/profile');
    return res.data;
  }

  /**
   * Memperbarui profil (nama, avatar, email) dengan verifikasi password
   * PUT /api/users/profile
   */
  async updateProfile(
    payload: UpdateProfilePayload
  ): Promise<
    ApiResponse<{
      user: User;
      emailChangePending: boolean;
      newEmail?: string;
      expiresInMinutes?: number;
    }>
  > {
    const res = await apiClient.put<
      ApiResponse<{
        user: User;
        emailChangePending: boolean;
        newEmail?: string;
        expiresInMinutes?: number;
      }>
    >('/api/users/profile', payload);
    return res.data;
  }

  /**
   * Memverifikasi kode OTP 6-digit untuk pergantian email baru
   * POST /api/users/verify-email-change
   */
  async verifyEmailChange(
    payload: VerifyEmailChangePayload
  ): Promise<ApiResponse<{ user: User }>> {
    const res = await apiClient.post<ApiResponse<{ user: User }>>(
      '/api/users/verify-email-change',
      payload
    );
    return res.data;
  }

  /**
   * Mengubah kata sandi pengguna saat login
   * PUT /api/users/change-password (SRS UC-05, SD-05)
   */
  async changePassword(payload: ChangePasswordPayload): Promise<ApiResponse> {
    const res = await apiClient.put<ApiResponse>(
      '/api/users/change-password',
      payload
    );
    return res.data;
  }
}

export const userModel = new UserModel();
export default userModel;

