'use strict';

/**
 * authController.js - Controller Autentikasi Pengguna
 *
 * Mengimplementasikan:
 * - UC-01: Registrasi Akun (SD-01)
 * - UC-02: Login Pengguna (SD-02)
 *
 * Referensi: SRS Bab 4.2 (UC-01 & UC-02), SDD Bab 6
 */

const bcrypt = require('bcrypt');
const db = require('../db');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BCRYPT_SALT_ROUNDS = 10;
// Saldo kuota gratis awal untuk akun baru (1800 detik = 30 menit pemrosesan)
const INITIAL_FREE_BALANCE_SECONDS = 1800;

/**
 * POST /api/auth/register
 * Mendaftarkan akun pengguna baru (SRS UC-01 & SD-01)
 */
async function register(request, reply) {
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

    // 2. Cek apakah email sudah terdaftar (SD-01 langkah 7 & 8: cekEmailTerdaftar)
    const existingUser = await db.query(
      `SELECT id FROM users WHERE email = $1 LIMIT 1`,
      [normalizedEmail]
    );

    if (existingUser.rows.length > 0) {
      return reply.status(409).send({
        status: 'error',
        code: 'EMAIL_ALREADY_EXISTS',
        message: `Alamat email '${normalizedEmail}' sudah terdaftar. Silakan gunakan email lain atau langsung masuk.`,
      });
    }

    // 3. Hash Kata Sandi (SD-01 langkah 9: hashKataSandi)
    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    // 4. Simpan ke database (SD-01 langkah 10: insertUserBaru)
    // Sesuai instruksi: fitur OTP email dilewati untuk MVP, user langsung aktif
    const insertRes = await db.query(
      `INSERT INTO users (name, email, password_hash, balance, role)
       VALUES ($1, $2, $3, $4, 'user')
       RETURNING id, name, email, balance, role, created_at`,
      [cleanName, normalizedEmail, passwordHash, INITIAL_FREE_BALANCE_SECONDS]
    );

    const newUser = insertRes.rows[0];

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
 * Otentikasi pengguna dan pembuatan token JWT (SRS UC-02 & SD-02)
 */
async function login(request, reply) {
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

    // 2. Ambil user berdasarkan email (SD-02 langkah 6 & 7: getUserByEmail)
    const userRes = await db.query(
      `SELECT id, name, email, password_hash, balance, role FROM users WHERE email = $1 LIMIT 1`,
      [normalizedEmail]
    );

    if (userRes.rows.length === 0) {
      // SD-02 flow 9c: Akun tidak ditemukan / email tidak terdaftar
      return reply.status(401).send({
        status: 'error',
        code: 'INVALID_CREDENTIALS',
        message: 'Email atau kata sandi salah.',
      });
    }

    const user = userRes.rows[0];

    // 3. Verifikasi Hash Password (SD-02 langkah 8 & 31: verifikasiHashPassword)
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      // SD-02 flow 12b: Password Salah
      return reply.status(401).send({
        status: 'error',
        code: 'INVALID_CREDENTIALS',
        message: 'Email atau kata sandi salah.',
      });
    }

    // 4. Generate JWT Session Token (SD-02 langkah 9 & 36: generateSessionToken)
    const tokenPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const token = this.jwt.sign(tokenPayload, {
      expiresIn: '7d', // Berlaku selama 7 hari untuk kenyamanan MVP
    });

    // 5. Kembalikan data dan token (SD-02 langkah 12 & 45: return(loginSuccess, sessionToken, userData))
    return reply.status(200).send({
      status: 'success',
      message: 'Login berhasil.',
      token,
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
 * GET /api/auth/me
 * Mengambil informasi akun dan sisa kuota user yang sedang login (Protected)
 */
async function getMe(request, reply) {
  try {
    const userId = request.user?.id;
    if (!userId) {
      return reply.status(401).send({
        status: 'error',
        code: 'UNAUTHORIZED',
        message: 'Token tidak valid atau sesi telah berakhir.',
      });
    }

    const userRes = await db.query(
      `SELECT id, name, email, balance, role, created_at, updated_at FROM users WHERE id = $1 LIMIT 1`,
      [userId]
    );

    if (userRes.rows.length === 0) {
      return reply.status(404).send({
        status: 'error',
        code: 'USER_NOT_FOUND',
        message: 'Data pengguna tidak ditemukan.',
      });
    }

    return reply.status(200).send({
      status: 'success',
      data: userRes.rows[0],
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

module.exports = {
  register,
  login,
  getMe,
};
