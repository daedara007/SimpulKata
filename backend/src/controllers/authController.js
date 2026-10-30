'use strict';

/**
 * controllers/authController.js - Controller Autentikasi Pengguna (MVC Architecture)
 *
 * Mengimplementasikan:
 * - UC-01: Registrasi Akun (SD-01)
 * - UC-02: Login Pengguna & Session Management (SD-02)
 *
 * Referensi: SRS Bab 4.2 (UC-01 & UC-02), SDD Bab 6, referensi/erd.puml
 */

const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { userModel, sessionModel } = require('../models');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BCRYPT_SALT_ROUNDS = 10;
const INITIAL_FREE_BALANCE_SECONDS = 1800; // 30 menit pemrosesan awal

class AuthController {
  /**
   * POST /api/auth/register
   * Mendaftarkan akun pengguna baru (SRS UC-01 & SD-01)
   */
  async register(request, reply) {
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
      if (existingUser) {
        return reply.status(409).send({
          status: 'error',
          code: 'EMAIL_ALREADY_EXISTS',
          message: `Alamat email '${normalizedEmail}' sudah terdaftar. Silakan gunakan email lain atau langsung masuk.`,
        });
      }

      // 3. Hash Kata Sandi (SD-01 langkah 9: hashKataSandi)
      const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

      // 4. Simpan ke database via UserModel (SD-01 langkah 10: insertUserBaru)
      const newUser = await userModel.create({
        name: cleanName,
        email: normalizedEmail,
        passwordHash,
        balance: INITIAL_FREE_BALANCE_SECONDS,
        role: 'user',
      });

      return reply.status(201).send({
        status: 'success',
        message: 'Registrasi berhasil! Silakan masuk dengan akun baru Anda.',
        data: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          balance: newUser.balance,
          role: newUser.role,
          created_at: newUser.created_at,
        },
      });
    } catch (error) {
      console.error('[AuthController] Error saat registrasi:', error);
      return reply.status(500).send({
        status: 'error',
        code: 'REGISTRATION_ERROR',
        message: 'Terjadi kesalahan pada server saat mendaftarkan akun. Silakan coba sesaat lagi.',
      });
    }
  }

  /**
   * POST /api/auth/login
   * Otentikasi pengguna, session creation, dan pembuatan token (SRS UC-02 & SD-02)
   */
  async login(request, reply) {
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

      // 4. Generate JWT Access Token 15 menit (SD-02 langkah 9 & 36)
      const tokenPayload = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      };

      const token = (request.server.jwt || this.jwt).sign(tokenPayload, {
        expiresIn: '15m',
      });

      // 5. Generate Refresh Token aman dan simpan sesi ke user_sessions via SessionModel
      const refreshToken = crypto.randomBytes(40).toString('hex');
      const ipAddress = request.ip || (request.headers['x-forwarded-for'] ? request.headers['x-forwarded-for'].split(',')[0].trim() : null) || null;
      const userAgent = request.headers['user-agent'] || null;

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
    } catch (error) {
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
  async refreshSession(request, reply) {
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

      const newAccessToken = (request.server.jwt || this.jwt).sign(tokenPayload, {
        expiresIn: '15m',
      });

      // 4. Refresh Token Rotation (RTR): Terbitkan token baru dan perbarui record sesi
      const newRefreshToken = crypto.randomBytes(40).toString('hex');
      const ipAddress = request.ip || (request.headers['x-forwarded-for'] ? request.headers['x-forwarded-for'].split(',')[0].trim() : null) || null;
      const userAgent = request.headers['user-agent'] || null;

      await sessionModel.rotate(session.id, newRefreshToken, ipAddress, userAgent, 7);

      return reply.status(200).send({
        status: 'success',
        message: 'Sesi berhasil diperbarui.',
        token: newAccessToken,
        refreshToken: newRefreshToken,
      });
    } catch (error) {
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
  async logout(request, reply) {
    try {
      const { refreshToken } = request.body || {};

      if (refreshToken && typeof refreshToken === 'string') {
        await sessionModel.deleteByRefreshToken(refreshToken);
      } else if (request.user?.id) {
        await sessionModel.deleteByUserId(request.user.id);
      }

      return reply.status(200).send({
        status: 'success',
        message: 'Logout berhasil. Sesi telah dicabut.',
      });
    } catch (error) {
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
  async getMe(request, reply) {
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
    } catch (error) {
      console.error('[AuthController] Error saat getMe:', error);
      return reply.status(500).send({
        status: 'error',
        code: 'GET_PROFILE_ERROR',
        message: 'Gagal mengambil data profil pengguna.',
      });
    }
  }
}

const authController = new AuthController();

module.exports = {
  register: authController.register.bind(authController),
  login: authController.login.bind(authController),
  refreshSession: authController.refreshSession.bind(authController),
  logout: authController.logout.bind(authController),
  getMe: authController.getMe.bind(authController),
};
