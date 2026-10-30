/**
 * routes/user.ts - Rute untuk endpoint pengguna & profil (UC-04, SD-04)
 * Prefix: /api/users
 */

import { FastifyPluginAsync } from 'fastify';
import userController from '../controllers/userController';

const userRoutes: FastifyPluginAsync = async (fastify) => {
  // Seluruh rute profil mewajibkan autentikasi JWT
  fastify.get('/profile', { preHandler: [fastify.authenticate] }, userController.getProfile.bind(userController));
  fastify.put('/profile', { preHandler: [fastify.authenticate] }, userController.updateProfile.bind(userController));
  fastify.post('/verify-email-change', { preHandler: [fastify.authenticate] }, userController.verifyEmailChange.bind(userController));
};

export default userRoutes;

