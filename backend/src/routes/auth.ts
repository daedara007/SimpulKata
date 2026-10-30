/**
 * auth.ts - Route Autentikasi Pengguna
 * Prefix: /api/auth
 */

import { FastifyPluginAsync } from 'fastify';
import authController from '../controllers/authController';

const authRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /api/auth/register (Publik)
  fastify.post('/register', authController.register.bind(authController));

  // POST /api/auth/verify-otp (Publik - Verifikasi OTP 6-Digit & Instant Login)
  fastify.post('/verify-otp', authController.verifyOtp.bind(authController));

  // POST /api/auth/resend-otp (Publik - Kirim Ulang OTP dengan Cooldown 60s)
  fastify.post('/resend-otp', authController.resendOtp.bind(authController));

  // POST /api/auth/forgot-password (Publik - Request OTP Pemulihan Kata Sandi, UC-03 & SD-03)
  fastify.post('/forgot-password', authController.forgotPassword.bind(authController));

  // POST /api/auth/reset-password (Publik - Reset Kata Sandi dengan OTP, UC-03 & SD-03)
  fastify.post('/reset-password', authController.resetPassword.bind(authController));

  // POST /api/auth/login (Publik)
  fastify.post('/login', authController.login.bind(authController));

  // POST /api/auth/refresh (Publik - Refresh Token Rotation)
  fastify.post('/refresh', authController.refreshSession.bind(authController));

  // POST /api/auth/logout (Publik / Revoke Refresh Token)
  fastify.post('/logout', authController.logout.bind(authController));

  // GET /api/auth/me (Membutuhkan JWT Token)
  fastify.get('/me', { preHandler: [fastify.authenticate] }, authController.getMe.bind(authController));
};

export default authRoutes;

