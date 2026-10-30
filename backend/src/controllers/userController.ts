/**
 * controllers/userController.ts - Controller Profil Pengguna (MVC Architecture)
 *
 * Mengimplementasikan:
 * - UC-04: Mengubah Profil Pengguna (SD-04)
 *   - Mengubah nama lengkap & avatar
 *   - Verifikasi kata sandi saat ini (keamanan)
 *   - Verifikasi email baru via OTP 6-digit (Resend)
 *
 * Referensi: SRS Bab 4.2 (UC-04), SDD SD-04
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { userModel, otpModel, sessionModel } from '../models';
import emailService from '../services/emailService';
import { ChangePasswordDTO } from '../types';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class UserController {
  /**
   * GET /api/users/profile
   * Mengambil data profil pengguna yang sedang login (SD-04 Langkah 2-6)
   */
  async getProfile(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = request.user?.id;
      if (!userId) {
        return reply.status(401).send({
          status: 'error',
          code: 'UNAUTHORIZED',
          message: 'Akses ditolak. Silakan login terlebih dahulu.',
        });
      }

      const user = await userModel.findById(userId);
      if (!user) {
        return reply.status(404).send({
          status: 'error',
          code: 'USER_NOT_FOUND',
          message: 'Data pengguna tidak ditemukan.',
        });
      }

      return reply.status(200).send({
        status: 'success',
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          balance: user.balance,
          role: user.role,
          status: user.status,
          avatar_url: user.avatar_url || null,
          created_at: user.created_at,
          updated_at: user.updated_at,
        },
      });
    } catch (error: any) {
      console.error('[UserController] Error saat getProfile:', error);
      return reply.status(500).send({
        status: 'error',
        code: 'GET_PROFILE_ERROR',
        message: 'Gagal memuat profil pengguna.',
      });
    }
  }

  /**
   * PUT /api/users/profile
   * Memperbarui profil (nama, avatar, email) dengan verifikasi password (SD-04 Langkah 9-20)
   */
  async updateProfile(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      const { name, avatarUrl, email, currentPassword } = (request.body || {}) as {
        name?: string;
        avatarUrl?: string | null;
        email?: string;
        currentPassword?: string;
      };
      const userId = request.user?.id;

      if (!userId) {
        return reply.status(401).send({
          status: 'error',
          code: 'UNAUTHORIZED',
          message: 'Akses ditolak. Silakan login terlebih dahulu.',
        });
      }

      // 1. Validasi Input Nama (SRS UC-04 A3)
      if (!name || typeof name !== 'string' || name.trim().length < 2) {
        return reply.status(400).send({
          status: 'error',
          code: 'VALIDATION_ERROR',
          message: 'Nama lengkap wajib diisi (minimal 2 karakter).',
        });
      }

      if (name.trim().length > 100) {
        return reply.status(400).send({
          status: 'error',
          code: 'VALIDATION_ERROR',
          message: 'Nama lengkap maksimal 100 karakter.',
        });
      }

      // 2. Validasi Konfirmasi Password Saat Ini (SD-04 Langkah 12 & SRS UC-04 Langkah 5)
      if (!currentPassword || typeof currentPassword !== 'string') {
        return reply.status(400).send({
          status: 'error',
          code: 'VALIDATION_ERROR',
          message: 'Password saat ini wajib diisi untuk mengonfirmasi perubahan profil.',
        });
      }

      // 3. Ambil data pengguna saat ini dari database
      const currentUser = await userModel.findById(userId);
      if (!currentUser) {
        return reply.status(404).send({
          status: 'error',
          code: 'USER_NOT_FOUND',
          message: 'Pengguna tidak ditemukan.',
        });
      }

      // 4. Verifikasi Password Saat Ini via Bcrypt (SD-04 Langkah 10-12, A2)
      const currentHash = await userModel.getPasswordHash(userId);
      if (!currentHash) {
        return reply.status(404).send({
          status: 'error',
          code: 'USER_NOT_FOUND',
          message: 'Data kredensial pengguna tidak ditemukan.',
        });
      }

      const isPasswordCorrect = await bcrypt.compare(currentPassword, currentHash);
      if (!isPasswordCorrect) {
        return reply.status(400).send({
          status: 'error',
          code: 'INVALID_PASSWORD',
          message: 'Password saat ini salah.',
        });
      }

      let emailChangePending = false;
      let targetNewEmail: string | undefined = undefined;

      // 5. Pengecekan Perubahan Email (SD-04 Langkah 13-17)
      if (email && typeof email === 'string') {
        const normalizedNewEmail = email.toLowerCase().trim();
        const normalizedCurrentEmail = currentUser.email.toLowerCase().trim();

        if (normalizedNewEmail !== normalizedCurrentEmail) {
          if (!EMAIL_REGEX.test(normalizedNewEmail)) {
            return reply.status(400).send({
              status: 'error',
              code: 'VALIDATION_ERROR',
              message: 'Format alamat email baru tidak valid.',
            });
          }

          // Cek apakah email baru sudah terdaftar dan aktif oleh user lain
          const existingUserWithEmail = await userModel.findByEmail(normalizedNewEmail);
          if (existingUserWithEmail && existingUserWithEmail.id !== userId) {
            return reply.status(409).send({
              status: 'error',
              code: 'EMAIL_ALREADY_EXISTS',
              message: `Alamat email '${normalizedNewEmail}' sudah terdaftar pada akun lain.`,
            });
          }

          // Cek cooldown kirim OTP email
          const cooldown = await otpModel.getCooldown(userId, 'email_change', 60);
          if (cooldown.onCooldown) {
            return reply.status(429).send({
              status: 'error',
              code: 'COOLDOWN_ACTIVE',
              message: `Harap tunggu ${cooldown.remainingSeconds} detik sebelum meminta kode OTP verifikasi email baru.`,
              remainingSeconds: cooldown.remainingSeconds,
            });
          }

          // Invalidate OTP email_change sebelumnya
          await otpModel.invalidatePrevious(userId, 'email_change');

          // Generate 6-Digit OTP baru (SD-04 Langkah 13)
          const otpCode = crypto.randomInt(100000, 999999).toString();

          // Simpan OTP ke tabel otp_requests (SD-04 Langkah 14)
          await otpModel.create({
            userId,
            otpCode,
            context: 'email_change',
            minutesValid: 5,
          });

          // Kirim email verifikasi ke alamat email baru (SD-04 Langkah 16)
          await emailService.sendEmailChangeOtp({
            to: normalizedNewEmail,
            name: name.trim(),
            otpCode,
            minutesValid: 5,
          });

          emailChangePending = true;
          targetNewEmail = normalizedNewEmail;
        }
      }

      // 6. Update Nama dan Avatar di tabel users (SD-04 Langkah 18)
      const cleanAvatar =
        avatarUrl !== undefined
          ? avatarUrl && typeof avatarUrl === 'string'
            ? avatarUrl.trim()
            : null
          : undefined;
      const updatedUser = await userModel.updateProfile(userId, {
        name: name.trim(),
        avatarUrl: cleanAvatar,
      });

      if (!updatedUser) {
        return reply.status(500).send({
          status: 'error',
          code: 'UPDATE_FAILED',
          message: 'Gagal memperbarui profil pengguna.',
        });
      }

      // 7. Kembalikan respon sukses (SD-04 Langkah 20-21)
      const successMessage = emailChangePending
        ? 'Profil berhasil diperbarui! Kode OTP verifikasi telah dikirimkan ke alamat email baru Anda.'
        : 'Profil berhasil diperbarui.';

      return reply.status(200).send({
        status: 'success',
        message: successMessage,
        data: {
          user: updatedUser,
          emailChangePending,
          ...(emailChangePending ? { newEmail: targetNewEmail, expiresInMinutes: 5 } : {}),
        },
      });
    } catch (error: any) {
      console.error('[UserController] Error saat updateProfile:', error);
      return reply.status(500).send({
        status: 'error',
        code: 'UPDATE_PROFILE_ERROR',
        message: 'Terjadi kesalahan pada server saat memperbarui profil.',
      });
    }
  }

  /**
   * POST /api/users/verify-email-change
   * Memverifikasi kode OTP dan meresmikan pembaruan alamat email pengguna
   */
  async verifyEmailChange(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      const { otpCode, newEmail } = (request.body || {}) as {
        otpCode?: string;
        newEmail?: string;
      };
      const userId = request.user?.id;

      if (!userId) {
        return reply.status(401).send({
          status: 'error',
          code: 'UNAUTHORIZED',
          message: 'Akses ditolak. Silakan login terlebih dahulu.',
        });
      }

      if (!otpCode || typeof otpCode !== 'string' || !/^\d{6}$/.test(otpCode.trim())) {
        return reply.status(400).send({
          status: 'error',
          code: 'VALIDATION_ERROR',
          message: 'Kode OTP harus berupa 6 digit angka.',
        });
      }

      if (!newEmail || typeof newEmail !== 'string' || !EMAIL_REGEX.test(newEmail.trim())) {
        return reply.status(400).send({
          status: 'error',
          code: 'VALIDATION_ERROR',
          message: 'Format alamat email baru tidak valid.',
        });
      }

      const normalizedNewEmail = newEmail.toLowerCase().trim();

      // 1. Verifikasi OTP aktif dari tabel otp_requests
      const validOtp = await otpModel.findLatestValid({
        userId,
        otpCode: otpCode.trim(),
        context: 'email_change',
      });

      if (!validOtp) {
        return reply.status(400).send({
          status: 'error',
          code: 'INVALID_OTP',
          message: 'Kode OTP tidak valid atau sudah kedaluwarsa.',
        });
      }

      // 2. Pastikan email baru tidak diambil oleh pengguna lain saat proses verifikasi berjalan
      const existingUser = await userModel.findByEmail(normalizedNewEmail);
      if (existingUser && existingUser.id !== userId) {
        return reply.status(409).send({
          status: 'error',
          code: 'EMAIL_ALREADY_EXISTS',
          message: `Alamat email '${normalizedNewEmail}' telah digunakan oleh akun lain.`,
        });
      }

      // 3. Perbarui email pengguna di database
      const updatedUser = await userModel.updateEmail(userId, normalizedNewEmail);
      if (!updatedUser) {
        return reply.status(500).send({
          status: 'error',
          code: 'EMAIL_UPDATE_ERROR',
          message: 'Gagal memperbarui alamat email di sistem.',
        });
      }

      // 4. Tandai OTP telah digunakan
      await otpModel.markAsUsed(validOtp.id);

      return reply.status(200).send({
        status: 'success',
        message: 'Alamat email berhasil diperbarui.',
        data: {
          user: updatedUser,
        },
      });
    } catch (error: any) {
      console.error('[UserController] Error saat verifyEmailChange:', error);
      return reply.status(500).send({
        status: 'error',
        code: 'VERIFY_EMAIL_CHANGE_ERROR',
        message: 'Terjadi kesalahan pada server saat memverifikasi pergantian email.',
      });
    }
  }

  /**
   * PUT /api/users/change-password
   * Mengubah kata sandi pengguna yang sedang login (SRS UC-05, Sequence SD-05)
   */
  async changePassword(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = request.user?.id;
      if (!userId) {
        return reply.status(401).send({
          status: 'error',
          code: 'UNAUTHORIZED',
          message: 'Akses ditolak. Silakan login terlebih dahulu.',
        });
      }

      const { currentPassword, newPassword, confirmPassword } = (request.body || {}) as Partial<ChangePasswordDTO>;

      // 1. Validasi Keberadaan Field (SD-05 Langkah 6)
      if (!currentPassword || !newPassword || !confirmPassword) {
        return reply.status(400).send({
          status: 'error',
          code: 'VALIDATION_ERROR',
          message: 'Password saat ini, password baru, dan konfirmasi password wajib diisi.',
        });
      }

      // 2. Validasi Panjang Password Baru (SRS UC-05 A2)
      if (typeof newPassword !== 'string' || newPassword.length < 8) {
        return reply.status(400).send({
          status: 'error',
          code: 'VALIDATION_ERROR',
          message: 'Password minimal 8 karakter.',
        });
      }

      // 3. Validasi Kompleksitas Password (SRS UC-05 E2: Mengandung huruf dan angka)
      const hasLetter = /[A-Za-z]/.test(newPassword);
      const hasDigit = /\d/.test(newPassword);
      if (!hasLetter || !hasDigit) {
        return reply.status(400).send({
          status: 'error',
          code: 'VALIDATION_ERROR',
          message: 'Password harus mengandung huruf dan angka.',
        });
      }

      // 4. Validasi Kesesuaian Konfirmasi Password (SRS UC-05 A3, SD-05 A3)
      if (newPassword !== confirmPassword) {
        return reply.status(400).send({
          status: 'error',
          code: 'VALIDATION_ERROR',
          message: 'Kedua password tidak cocok.',
        });
      }

      // 5. Validasi Password Baru Tidak Boleh Sama dengan Password Lama (SRS UC-05 / Aturan Keamanan)
      if (currentPassword === newPassword) {
        return reply.status(400).send({
          status: 'error',
          code: 'SAME_PASSWORD',
          message: 'Password baru tidak boleh sama dengan password lama.',
        });
      }

      // 6. Ambil Hash Password Saat Ini dari Database (SD-05 Langkah 7-8)
      const currentHash = await userModel.getPasswordHash(userId);
      if (!currentHash) {
        return reply.status(404).send({
          status: 'error',
          code: 'USER_NOT_FOUND',
          message: 'Data kredensial pengguna tidak ditemukan.',
        });
      }

      // 7. Verifikasi Password Lama via Bcrypt (SD-05 Langkah 9, A1)
      const isPasswordCorrect = await bcrypt.compare(currentPassword, currentHash);
      if (!isPasswordCorrect) {
        return reply.status(400).send({
          status: 'error',
          code: 'INVALID_PASSWORD',
          message: 'Password saat ini tidak benar.',
        });
      }

      // 8. Hash Password Baru (SD-05 Langkah 10)
      const saltRounds = 10;
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

      // 9. Simpan Hash Password Baru ke Tabel users (SD-05 Langkah 11-12)
      const updateSuccess = await userModel.updatePassword(userId, newPasswordHash);
      if (!updateSuccess) {
        return reply.status(500).send({
          status: 'error',
          code: 'UPDATE_PASSWORD_ERROR',
          message: 'Gagal mengubah password. Silakan coba lagi.',
        });
      }

      // 10. Cabut Seluruh Sesi Aktif di Tabel user_sessions (SD-05 Langkah 13-14)
      await sessionModel.deleteByUserId(userId);

      // 11. Kembalikan Respons Sukses (SD-05 Langkah 15)
      return reply.status(200).send({
        status: 'success',
        message: 'Kata sandi berhasil diubah. Silakan login kembali dengan kata sandi baru Anda.',
      });
    } catch (error: any) {
      console.error('[UserController] Error saat changePassword:', error);
      return reply.status(500).send({
        status: 'error',
        code: 'CHANGE_PASSWORD_ERROR',
        message: 'Terjadi kesalahan pada server saat mengubah kata sandi.',
      });
    }
  }
}

export const userController = new UserController();
export default userController;
