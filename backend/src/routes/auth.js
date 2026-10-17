'use strict';

/**
 * auth.js - Route Autentikasi Pengguna
 * Prefix: /api/auth
 */

const authController = require('../controllers/authController');

async function authRoutes(fastify, options) {
  // POST /api/auth/register (Publik)
  fastify.post('/register', authController.register);

  // POST /api/auth/login (Publik)
  fastify.post('/login', authController.login);

  // GET /api/auth/me (Membutuhkan JWT Token)
  fastify.get('/me', { preHandler: [fastify.authenticate] }, authController.getMe);
}

module.exports = authRoutes;
