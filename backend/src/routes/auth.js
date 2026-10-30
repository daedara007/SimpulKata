'use strict';

/**
 * auth.js - Route Autentikasi Pengguna
 * Prefix: /api/auth
 */

const authController = require('../controllers/authController');

async function authRoutes(fastify, options) {
  // POST /api/auth/register (Publik)
  fastify.post('/register', authController.register);

  // POST /api/auth/verify-otp (Publik - Verifikasi OTP 6-Digit & Instant Login)
  fastify.post('/verify-otp', authController.verifyOtp);

  // POST /api/auth/resend-otp (Publik - Kirim Ulang OTP dengan Cooldown 60s)
  fastify.post('/resend-otp', authController.resendOtp);

  // POST /api/auth/forgot-password (Publik - Request OTP Pemulihan Kata Sandi, UC-03 & SD-03)
  fastify.post('/forgot-password', authController.forgotPassword);

  // POST /api/auth/reset-password (Publik - Reset Kata Sandi dengan OTP, UC-03 & SD-03)
  fastify.post('/reset-password', authController.resetPassword);

  // POST /api/auth/login (Publik)
  fastify.post('/login', authController.login);

  // POST /api/auth/refresh (Publik - Refresh Token Rotation)
  fastify.post('/refresh', authController.refreshSession);

  // POST /api/auth/logout (Publik / Revoke Refresh Token)
  fastify.post('/logout', authController.logout);

  // GET /api/auth/me (Membutuhkan JWT Token)
  fastify.get('/me', { preHandler: [fastify.authenticate] }, authController.getMe);
}

module.exports = authRoutes;
