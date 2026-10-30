/**
 * controllers/authController.ts - Controller Autentikasi Pengguna (MVC Architecture)
 *
 * Mengimplementasikan:
 * - UC-01: Registrasi Akun (SD-01)
 * - UC-02: Login Pengguna & Session Management (SD-02)
 * - UC-03: Memulihkan Kata Sandi Melalui Email (SD-03)
 *
 * Referensi: SRS Bab 4.2 (UC-01 s/d UC-03), SDD Bab 6, referensi/erd.puml
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { userModel, sessionModel, otpModel } from '../models';
import emailService from '../services/emailService';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BCRYPT_SALT_ROUNDS = 10;
const INITIAL_FREE_BALANCE_SECONDS = 1800; // 30 menit pemrosesan awal

export class AuthController {
  /**
   * POST /api/auth/register
   * Mendaftarkan akun pengguna baru dan mengirim kode OTP verifikasi (SRS UC-01 & SD-01)
   */
  async register(
    request: FastifyRequest<{
      Body: { name?: string; email?: string; password?: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { name, email, password } = request.body || {};

      // 1. Validasi Input (SD-01 langkah 6: validasiInput)
      if (!name || typeof name !== 'string' || name.trim().length < 2) {
        return reply.status(400).send({
          status: 'error',
          code: 'VALIDATION_ERROR',
          message: 'Nama lengkap wajib diisi (minimal 2 karakter).',
        });
      }

      if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
        return reply.status(400).send({
          status: 'error',
          code: 'VALIDATION_ERROR',
          message: 'Format email tidak valid.',
        });
      }

      if (!password || typeof password !== 'string' || password.length < 8) {
        return reply.status(400).send({
          status: 'error',
          code: 'VALIDATION_ERROR',
          message: 'Kata sandi minimal 8 karakter.',
        });
      }

      const normalizedEmail = email.trim().toLowerCase();
      const cleanName = name.trim();

      // 2. Cek apakah email sudah terdaftar via UserModel (SD-01 langkah 7 & 8)
      const existingUser = await userModel.findByEmail(normalizedEmail);
      if (existingUser && existingUser.status === 'ACTIVE') {
        return reply.status(409).send({
          status: 'error',
          code: 'EMAIL_ALREADY_EXISTS',
          message: `Alamat email '${normalizedEmail}' sudah terdaftar dan aktif. Silakan langsung masuk.`,
        });
      }

      // 3. Hash Kata Sandi (SD-01 langkah 9: hashKataSandi)
      const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

      let targetUser: { id: string; name: string; email: string };

      if (!existingUser) {
        // Buat user baru dengan status PENDING (SD-01 langkah 10: insertUserBaru)
        targetUser = await userModel.create({
          name: cleanName,
          email: normalizedEmail,
          passwordHash,
          balance: INITIAL_FREE_BALANCE_SECONDS,
          role: 'user',
          status: 'PENDING',
        });
      } else {
        // User ada tapi masih PENDING: perbarui nama & sandi baru
        const updated = await userModel.updatePendingUser(existingUser.id, {
          name: cleanName,
          passwordHash,
        });
        if (!updated) {
          throw new Error('Gagal memperbarui data user pending.');
        }
        targetUser = updated;
      }

      // 4. Generate 6-Digit OTP acak numerik (SD-01 langkah 12: generateKodeOTP)
      const otpCode = crypto.randomInt(100000, 999999).toString();

      // 5. Hanguskan OTP sebelumnya dan simpan OTP baru (SD-01 langkah 13 & 14)
      await otpModel.invalidatePrevious(targetUser.id, 'registration');
      await otpModel.create({
        userId: targetUser.id,
        otpCode,
        context: 'registration',
        minutesValid: 5,
      });

      // 6. Kirim Email OTP via Resend (SD-01 langkah 15 & 16)
      await emailService.sendOtpEmail({
        to: targetUser.email,
        name: targetUser.name,
        otpCode,
        minutesValid: 5,
      });

      // 7. Kembalikan respons berhasil (SD-01 langkah 17 & 18)
      return reply.status(201).send({
        status: 'success',
        message: 'Pendaftaran berhasil! Kode verifikasi OTP 6-digit telah dikirimkan ke email Anda.',
        data: {
          userId: targetUser.id,
          email: targetUser.email,
          requiresOtp: true,
          expiresInMinutes: 5,
        },
      });
    } catch (error: any) {
      console.error('[AuthController] Error saat registrasi:', error);
      return reply.status(500).send({
        status: 'error',
        code: 'REGISTRATION_ERROR',
        message: 'Terjadi kesalahan pada server saat mendaftarkan akun. Silakan coba sesaat lagi.',
      });
    }
  }

  /**
   * POST /api/auth/verify-otp
   * Memverifikasi kode OTP 6-digit dan mengaktifkan akun (SD-01 Langkah 21-27, Opsi B Instant Login)
   */
  async verifyOtp(
    request: FastifyRequest<{
      Body: { userId?: string; email?: string; otpCode?: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { userId, email, otpCode } = request.body || {};

      if (!otpCode || typeof otpCode !== 'string' || !/^\d{6}$/.test(otpCode.trim())) {
        return reply.status(400).send({
          status: 'error',
          code: 'VALIDATION_ERROR',
          message: 'Kode OTP harus berupa 6 digit angka.',
        });
      }

      const cleanOtp = otpCode.trim();
      let targetUserId = userId;

      if (!targetUserId && email && typeof email === 'string') {
        const user = await userModel.findByEmail(email.trim().toLowerCase());
        if (user) {
          targetUserId = user.id;
        }
      }

      if (!targetUserId) {
        return reply.status(400).send({
          status: 'error',
          code: 'VALIDATION_ERROR',
          message: 'ID pengguna atau alamat email wajib disertakan.',
        });
      }

      // 1. Cari OTP aktif yang cocok dan belum kedaluwarsa (SD-01 langkah 22 & 23)
      const validOtp = await otpModel.findLatestValid({
        userId: targetUserId,
        otpCode: cleanOtp,
        context: 'registration',
      });

      if (!validOtp) {
        return reply.status(400).send({
          status: 'error',
          code: 'INVALID_OTP',
          message: 'Kode OTP tidak valid atau telah kedaluwarsa. Silakan periksa kembali atau minta kode baru.',
        });
      }

      // 2. Tandai OTP telah digunakan (SD-01 langkah 24)
      await otpModel.markAsUsed(validOtp.id);

      // 3. Aktifkan akun pengguna: status -> 'ACTIVE' (SD-01 langkah 24 & 25)
      const activatedUser = await userModel.activateUser(targetUserId);
      if (!activatedUser) {
        return reply.status(404).send({
          status: 'error',
          code: 'USER_NOT_FOUND',
          message: 'Data pengguna tidak ditemukan.',
        });
      }

      // 4. Opsi B: Instant Login (Terbitkan Access Token 15m & Refresh Token 7d)
      const tokenPayload = {
        id: activatedUser.id,
        email: activatedUser.email,
        name: activatedUser.name,
        role: activatedUser.role,
      };

      const token = request.server.jwt.sign(tokenPayload, {
        expiresIn: '15m',
      });

      const refreshToken = crypto.randomBytes(40).toString('hex');
      const ipAddress =
        request.ip ||
        (request.headers['x-forwarded-for']
          ? String(request.headers['x-forwarded-for']).split(',')[0].trim()
          : null) ||
        null;
      const userAgent = (request.headers['user-agent'] as string) || null;

      await sessionModel.create({
        userId: activatedUser.id,
        refreshToken,
        ipAddress,
        userAgent,
        daysValid: 7,
      });

      return reply.status(200).send({
        status: 'success',
        message: 'Email berhasil diverifikasi! Selamat datang di SimpulKata.',
        token,
        refreshToken,
        user: {
          id: activatedUser.id,
          name: activatedUser.name,
          email: activatedUser.email,
          role: activatedUser.role,
          balance: activatedUser.balance,
        },
      });
    } catch (error: any) {
      console.error('[AuthController] Error saat verifikasi OTP:', error);
      return reply.status(500).send({
        status: 'error',
        code: 'VERIFY_OTP_ERROR',
        message: 'Terjadi kesalahan pada server saat memverifikasi kode OTP.',
      });
    }
  }

  /**
   * POST /api/auth/resend-otp
   * Mengirim ulang kode OTP baru dengan proteksi cooldown 60 detik
   */
  async resendOtp(
    request: FastifyRequest<{
      Body: { userId?: string; email?: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { userId, email } = request.body || {};

      let user: { id: string; name: string; email: string; status: string } | null = null;
      if (userId) {
        user = await userModel.findById(userId);
      } else if (email && typeof email === 'string') {
        user = await userModel.findByEmail(email.trim().toLowerCase());
      }

      if (!user) {
        return reply.status(404).send({
          status: 'error',
          code: 'USER_NOT_FOUND',
          message: 'Pengguna tidak ditemukan.',
        });
      }

      if (user.status === 'ACTIVE') {
        return reply.status(400).send({
          status: 'error',
          code: 'ALREADY_ACTIVE',
          message: 'Akun ini sudah aktif dan terverifikasi. Silakan langsung masuk.',
        });
      }

      // Cek jeda cooldown 60 detik
      const cooldown = await otpModel.getCooldown(user.id, 'registration', 60);
      if (cooldown.onCooldown) {
        return reply.status(429).send({
          status: 'error',
          code: 'COOLDOWN_ACTIVE',
          message: `Harap tunggu ${cooldown.remainingSeconds} detik sebelum meminta kode OTP baru.`,
          remainingSeconds: cooldown.remainingSeconds,
        });
      }

      // Hanguskan OTP lama
      await otpModel.invalidatePrevious(user.id, 'registration');

      // Generate 6-Digit OTP baru
      const newOtpCode = crypto.randomInt(100000, 999999).toString();

      // Simpan OTP baru
      await otpModel.create({
        userId: user.id,
        otpCode: newOtpCode,
        context: 'registration',
        minutesValid: 5,
      });

      // Kirim via Resend
      await emailService.sendOtpEmail({
        to: user.email,
        name: user.name,
        otpCode: newOtpCode,
        minutesValid: 5,
      });

      return reply.status(200).send({
        status: 'success',
        message: 'Kode OTP baru telah dikirimkan ke email Anda.',
        data: {
          expiresInMinutes: 5,
          cooldownSeconds: 60,
        },
      });
    } catch (error: any) {
      console.error('[AuthController] Error saat kirim ulang OTP:', error);
      return reply.status(500).send({
        status: 'error',
        code: 'RESEND_OTP_ERROR',
        message: 'Gagal mengirim ulang kode OTP. Coba beberapa saat lagi.',
      });
    }
  }

  /**
   * POST /api/auth/login
   * Otentikasi pengguna, session creation, dan pembuatan token (SRS UC-02 & SD-02)
   */
  async login(
    request: FastifyRequest<{
      Body: { email?: string; password?: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { email, password } = request.body || {};

      // 1. Validasi input (CR-17, TC-LOGIN-007)
      if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
        return reply.status(400).send({
          status: 'error',
          code: 'VALIDATION_ERROR',
          message: 'Email dan kata sandi wajib diisi dengan format string yang valid.',
        });
      }

      const normalizedEmail = email.trim().toLowerCase();

      // 2. Ambil user via UserModel (SD-02 langkah 6 & 7: getUserByEmail)
      const user = await userModel.findByEmail(normalizedEmail);
      if (!user) {
        return reply.status(401).send({
          status: 'error',
          code: 'INVALID_CREDENTIALS',
          message: 'Email atau kata sandi salah.',
        });
      }

      // 3. Verifikasi Hash Password (SD-02 langkah 8 & 31: verifikasiHashPassword)
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        return reply.status(401).send({
          status: 'error',
          code: 'INVALID_CREDENTIALS',
          message: 'Email atau kata sandi salah.',
        });
      }

      // Pengecekan status akun (SD-01 & SD-02): Jika masih PENDING, tolak dan arahkan verifikasi OTP
      if (user.status === 'PENDING') {
        return reply.status(403).send({
          status: 'error',
          code: 'ACCOUNT_NOT_VERIFIED',
          message: 'Akun Anda belum diverifikasi. Silakan masukkan kode OTP yang telah dikirimkan ke email Anda.',
          data: {
            userId: user.id,
            email: user.email,
          },
        });
      }

      // 4. Generate JWT Access Token 15 menit (SD-02 langkah 9 & 36)
      const tokenPayload = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      };

      const token = request.server.jwt.sign(tokenPayload, {
        expiresIn: '15m',
      });

      // 5. Generate Refresh Token aman dan simpan sesi ke user_sessions via SessionModel
      const refreshToken = crypto.randomBytes(40).toString('hex');
      const ipAddress =
        request.ip ||
        (request.headers['x-forwarded-for']
          ? String(request.headers['x-forwarded-for']).split(',')[0].trim()
          : null) ||
        null;
      const userAgent = (request.headers['user-agent'] as string) || null;

      await sessionModel.create({
        userId: user.id,
        refreshToken,
        ipAddress,
        userAgent,
        daysValid: 7,
      });

      // 6. Kembalikan data, access token, dan refresh token (SD-02 langkah 12 & 45)
      return reply.status(200).send({
        status: 'success',
        message: 'Login berhasil.',
        token,
        refreshToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          balance: user.balance,
        },
      });
    } catch (error: any) {
      console.error('[AuthController] Error saat login:', error);
      return reply.status(500).send({
        status: 'error',
        code: 'LOGIN_ERROR',
        message: 'Terjadi kesalahan pada server saat login.',
      });
    }
  }

  /**
   * POST /api/auth/refresh
   * Memperbarui access token menggunakan refresh token yang valid (RTR)
   */
  async refreshSession(
    request: FastifyRequest<{
      Body: { refreshToken?: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { refreshToken } = request.body || {};

      if (!refreshToken || typeof refreshToken !== 'string') {
        return reply.status(400).send({
          status: 'error',
          code: 'VALIDATION_ERROR',
          message: 'Refresh token wajib disertakan.',
        });
      }

      // 1. Cari sesi aktif via SessionModel
      const session = await sessionModel.findByRefreshToken(refreshToken);
      if (!session) {
        return reply.status(401).send({
          status: 'error',
          code: 'INVALID_REFRESH_TOKEN',
          message: 'Sesi tidak valid atau telah dicabut. Silakan login kembali.',
        });
      }

      // 2. Periksa apakah masa aktif sesi sudah habis
      if (new Date(session.expires_at) <= new Date()) {
        await sessionModel.deleteByRefreshToken(refreshToken);
        return reply.status(401).send({
          status: 'error',
          code: 'SESSION_EXPIRED',
          message: 'Sesi login telah kedaluwarsa. Silakan masuk kembali.',
        });
      }

      // 3. Terbitkan Access Token baru (15 menit)
      const tokenPayload = {
        id: session.user_pk,
        email: session.email,
        name: session.name,
        role: session.role,
      };

      const newAccessToken = request.server.jwt.sign(tokenPayload, {
        expiresIn: '15m',
      });

      // 4. Refresh Token Rotation (RTR): Terbitkan token baru dan perbarui record sesi
      const newRefreshToken = crypto.randomBytes(40).toString('hex');
      const ipAddress =
        request.ip ||
        (request.headers['x-forwarded-for']
          ? String(request.headers['x-forwarded-for']).split(',')[0].trim()
          : null) ||
        null;
      const userAgent = (request.headers['user-agent'] as string) || null;

      await sessionModel.rotate(session.id, newRefreshToken, ipAddress, userAgent, 7);

      return reply.status(200).send({
        status: 'success',
        message: 'Sesi berhasil diperbarui.',
        token: newAccessToken,
        refreshToken: newRefreshToken,
      });
    } catch (error: any) {
      console.error('[AuthController] Error saat refresh session:', error);
      return reply.status(500).send({
        status: 'error',
        code: 'REFRESH_ERROR',
        message: 'Terjadi kesalahan saat memperbarui sesi login.',
      });
    }
  }

  /**
   * POST /api/auth/logout
   * Menghapus sesi login dari tabel user_sessions (SD-02 Logout)
   */
  async logout(
    request: FastifyRequest<{
      Body: { refreshToken?: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { refreshToken } = request.body || {};

      if (refreshToken && typeof refreshToken !== 'string') {
        await sessionModel.deleteByRefreshToken(refreshToken);
      } else if (request.user?.id) {
        await sessionModel.deleteByUserId(request.user.id);
      }

      return reply.status(200).send({
        status: 'success',
        message: 'Logout berhasil. Sesi telah dicabut.',
      });
    } catch (error: any) {
      console.error('[AuthController] Error saat logout:', error);
      return reply.status(500).send({
        status: 'error',
        code: 'LOGOUT_ERROR',
        message: 'Terjadi kesalahan pada server saat logout.',
      });
    }
  }

  /**
   * GET /api/auth/me
   * Mengambil informasi akun dan sisa kuota user yang sedang login (Protected)
   */
  async getMe(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = request.user?.id;
      if (!userId) {
        return reply.status(401).send({
          status: 'error',
          code: 'UNAUTHORIZED',
          message: 'Token tidak valid atau sesi telah berakhir.',
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
          created_at: user.created_at,
          updated_at: user.updated_at,
        },
      });
    } catch (error: any) {
      console.error('[AuthController] Error saat getMe:', error);
      return reply.status(500).send({
        status: 'error',
        code: 'GET_PROFILE_ERROR',
        message: 'Gagal mengambil data profil pengguna.',
      });
    }
  }

  /**
   * POST /api/auth/forgot-password
   * Meminta kode OTP pemulihan kata sandi melalui email (SRS UC-03 & SD-03 Langkah 5-13)
   */
  async forgotPassword(
    request: FastifyRequest<{
      Body: { email?: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { email } = request.body || {};

      // 1. Validasi Input Email
      if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
        return reply.status(400).send({
          status: 'error',
          code: 'VALIDATION_ERROR',
          message: 'Format email tidak valid.',
        });
      }

      const normalizedEmail = email.toLowerCase().trim();

      // 2. Cek apakah email terdaftar di database (SD-03 langkah 6-7, SRS UC-03 A1)
      const user = await userModel.findByEmail(normalizedEmail);
      if (!user) {
        return reply.status(404).send({
          status: 'error',
          code: 'EMAIL_NOT_FOUND',
          message: 'Email tidak ditemukan dalam database.',
        });
      }

      // 3. Cek Jeda Cooldown 60 detik untuk mencegah spam pengiriman OTP
      const cooldown = await otpModel.getCooldown(user.id, 'password_reset', 60);
      if (cooldown.onCooldown) {
        return reply.status(429).send({
          status: 'error',
          code: 'COOLDOWN_ACTIVE',
          message: `Harap tunggu ${cooldown.remainingSeconds} detik sebelum meminta kode OTP reset baru.`,
          remainingSeconds: cooldown.remainingSeconds,
        });
      }

      // 4. Invalidate OTP reset lama yang belum terpakai
      await otpModel.invalidatePrevious(user.id, 'password_reset');

      // 5. Generate Kode OTP 6-Digit Acak Aman (SD-03 Langkah 8)
      const otpCode = String(crypto.randomInt(100000, 1000000));

      // 6. Simpan OTP ke tabel otp_requests dengan expiredAt 5 menit (SD-03 Langkah 9-10)
      await otpModel.create({
        userId: user.id,
        otpCode,
        context: 'password_reset',
        minutesValid: 5,
      });

      // 7. Kirim email OTP via Resend (SD-03 Langkah 11-12)
      await emailService.sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        otpCode,
        minutesValid: 5,
      });

      // 8. Berikan respon sukses (SD-03 Langkah 13)
      return reply.status(200).send({
        status: 'success',
        message: 'Kode OTP pemulihan kata sandi telah dikirim ke email Anda.',
        data: {
          email: user.email,
          userId: user.id,
          expiresInMinutes: 5,
        },
      });
    } catch (error: any) {
      console.error('[AuthController] Error saat forgotPassword:', error);
      return reply.status(500).send({
        status: 'error',
        code: 'FORGOT_PASSWORD_ERROR',
        message: 'Gagal mengirim OTP pemulihan kata sandi. Silakan coba lagi nanti.',
      });
    }
  }

  /**
   * POST /api/auth/reset-password
   * Memverifikasi OTP dan menyetel kata sandi baru pengguna (SRS UC-03 & SD-03 Langkah 17-26)
   */
  async resetPassword(
    request: FastifyRequest<{
      Body: { email?: string; otpCode?: string; newPassword?: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { email, otpCode, newPassword } = request.body || {};

      // 1. Validasi Input (SD-03 Langkah 17 & SRS UC-03)
      if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
        return reply.status(400).send({
          status: 'error',
          code: 'VALIDATION_ERROR',
          message: 'Format email tidak valid.',
        });
      }

      if (!otpCode || typeof otpCode !== 'string' || !/^\d{6}$/.test(otpCode.trim())) {
        return reply.status(400).send({
          status: 'error',
          code: 'VALIDATION_ERROR',
          message: 'Kode OTP harus berupa 6 digit angka.',
        });
      }

      if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
        return reply.status(400).send({
          status: 'error',
          code: 'VALIDATION_ERROR',
          message: 'Kata sandi baru minimal 8 karakter.',
        });
      }

      const normalizedEmail = email.toLowerCase().trim();
      const sanitizedOtp = otpCode.trim();

      // 2. Ambil data pengguna
      const user = await userModel.findByEmail(normalizedEmail);
      if (!user) {
        return reply.status(404).send({
          status: 'error',
          code: 'EMAIL_NOT_FOUND',
          message: 'Email tidak ditemukan dalam database.',
        });
      }

      // 3. Verifikasi OTP aktif dari tabel otp_requests terlebih dahulu (SD-03 Langkah 18-19, E2)
      // OTP WAJIB divalidasi terlebih dahulu sebelum memeriksa password baru untuk mencegah
      // eksploitasi password oracle (menebak password lama pengguna tanpa mengetahui OTP)
      const validOtp = await otpModel.findLatestValid({
        userId: user.id,
        otpCode: sanitizedOtp,
        context: 'password_reset',
      });

      if (!validOtp) {
        return reply.status(400).send({
          status: 'error',
          code: 'INVALID_OTP',
          message: 'OTP tidak valid atau sudah kadaluarsa.',
        });
      }

      // 4. Setelah OTP valid, verifikasi apakah kata sandi baru sama dengan kata sandi lama (SRS UC-03 Alur A3)
      const isSamePassword = await bcrypt.compare(newPassword, user.password_hash);
      if (isSamePassword) {
        return reply.status(400).send({
          status: 'error',
          code: 'PASSWORD_UNCHANGED',
          message: 'Password baru harus berbeda dengan password lama.',
        });
      }

      // 5. Hash kata sandi baru (SD-03 Langkah 20)
      const newPasswordHash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);

      // 6. Update kata sandi pengguna di database (SD-03 Langkah 21-22)
      await userModel.updatePassword(user.id, newPasswordHash);

      // 7. Hanguskan OTP (SD-03 Langkah 23-24)
      await otpModel.markAsUsed(validOtp.id);

      // 8. Hapus seluruh sesi aktif lama pengguna (Mitigasi Keamanan Sesi)
      await sessionModel.deleteByUserId(user.id);

      // 9. Berikan respon sukses (SD-03 Langkah 25)
      return reply.status(200).send({
        status: 'success',
        message: 'Kata sandi berhasil dipulihkan. Silakan masuk dengan kata sandi baru Anda.',
      });
    } catch (error: any) {
      console.error('[AuthController] Error saat resetPassword:', error);
      return reply.status(500).send({
        status: 'error',
        code: 'RESET_PASSWORD_ERROR',
        message: 'Gagal memulihkan kata sandi. Silakan coba lagi nanti.',
      });
    }
  }
}

export const authController = new AuthController();
export default authController;

