/**
 * routes/admin.ts - Rute API Administrasi SimpulKata
 * Berdasarkan referensi/erd.puml dan SRS FR-ADM-01 & FR-ADM-02 / UC-15 (SD-15)
 */

import { FastifyInstance } from 'fastify';
import { adminController } from '../controllers/adminController';

export default async function adminRoutes(fastify: FastifyInstance) {
  // Semua rute admin mewajibkan autentikasi JWT
  const authGuard = { preHandler: [fastify.authenticate] };

  // GET /api/admin/logs - Daftar log sistem & filter (UC-15)
  fastify.get('/logs', authGuard, adminController.getLogs.bind(adminController));

  // GET /api/admin/logs/export - Ekspor log sistem ke CSV (UC-15)
  fastify.get('/logs/export', authGuard, adminController.exportLogs.bind(adminController));

  // GET /api/admin/users - Daftar seluruh pengguna & saldo kuota (UC-16 / SD-16)
  fastify.get('/users', authGuard, adminController.getUsers.bind(adminController));

  // GET /api/admin/users/export - Ekspor daftar pengguna ke CSV (UC-16 / SD-16)
  fastify.get('/users/export', authGuard, adminController.exportUsers.bind(adminController));
}
