/**
 * server.ts - Entry Point Fastify Server SimpulKata
 *
 * Struktur:
 * - Load environment variables (.env)
 * - Inisiasi Fastify dengan logger pino-pretty
 * - Register plugins: multipart (upload audio), cors, jwt
 * - Daftarkan routes dasar & health check
 * - Test koneksi database PostgreSQL
 * - Jalankan server di 0.0.0.0:PORT (siap untuk Docker & self-hosted)
 *
 * Referensi: SDD Bab 6 - Desain Arsitektur, SRS 2.5 - Batasan Implementasi
 */

import dotenv from 'dotenv';
dotenv.config();

import Fastify, { FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import jwt from '@fastify/jwt';

import db from './db';
import { transcriptModel, sessionModel, otpModel } from './models';
import authRoutes from './routes/auth';
import audioRoutes from './routes/audio';
import userRoutes from './routes/user';

const fastify = Fastify({
  logger: {
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
        colorize: true,
      },
    },
  },
});

// ----------------------------------------------------------
// PLUGIN: @fastify/cors
// Mengizinkan request dari frontend Vue.js
// ----------------------------------------------------------
fastify.register(cors, {
  origin:
    process.env.NODE_ENV === 'production'
      ? process.env.FRONTEND_URL || 'http://localhost:8080'
      : true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
});

// ----------------------------------------------------------
// PLUGIN: @fastify/multipart
// Limit: 50MB sesuai SRS UC-07
// ----------------------------------------------------------
const MAX_FILE_SIZE_MB = parseInt(process.env.MAX_UPLOAD_SIZE_MB || '50', 10);
fastify.register(multipart, {
  limits: {
    fileSize: MAX_FILE_SIZE_MB * 1024 * 1024,
    files: 1,
  },
});

// ----------------------------------------------------------
// PLUGIN: @fastify/jwt
// Autentikasi berbasis token JWT (SRS UC-01 & UC-02)
// ----------------------------------------------------------
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || jwtSecret.trim() === '' || jwtSecret === 'simpulkata-jwt-default-secret-key-change-me') {
  fastify.log.fatal('[Security] JWT_SECRET wajib dikonfigurasi dan tidak boleh kosong atau menggunakan default insecure key.');
  throw new Error('JWT_SECRET wajib dikonfigurasi dan tidak boleh kosong atau menggunakan default insecure key.');
}

fastify.register(jwt, {
  secret: jwtSecret,
});

// Decorator untuk memproteksi routes yang mewajibkan login
fastify.decorate('authenticate', async function (request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    return reply.status(401).send({
      status: 'error',
      code: 'UNAUTHORIZED',
      message: 'Akses ditolak. Token autentikasi tidak valid atau telah kedaluwarsa. Silakan login kembali.',
    });
  }
});

// ----------------------------------------------------------
// ROUTES DASAR
// ----------------------------------------------------------
const healthHandler = async () => {
  return {
    status: 'ok',
    service: 'SimpulKata Backend',
    version: '1.0.0-mvp',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  };
};

fastify.get('/health', healthHandler);
fastify.get('/api/health', healthHandler);

/**
 * GET /health/db
 * Health check khusus untuk koneksi database
 */
fastify.get('/health/db', async (_request: FastifyRequest, reply: FastifyReply) => {
  try {
    const result = await db.query('SELECT NOW() AS db_time, version() AS db_version');
    return {
      status: 'ok',
      database: 'connected',
      db_time: result.rows[0].db_time,
      db_version: result.rows[0].db_version,
    };
  } catch (err) {
    fastify.log.error({ err }, '[Health/DB] Koneksi database gagal');
    return reply.status(503).send({
      status: 'error',
      database: 'disconnected',
      message: 'Database tidak dapat dijangkau. Pastikan PostgreSQL berjalan.',
    });
  }
});

// ----------------------------------------------------------
// ROUTES APLIKASI
// ----------------------------------------------------------
fastify.register(authRoutes, { prefix: '/api/auth' });
fastify.register(audioRoutes, { prefix: '/api' });
fastify.register(userRoutes, { prefix: '/api/users' });

// ----------------------------------------------------------
// GLOBAL ERROR HANDLER
// ----------------------------------------------------------
fastify.setErrorHandler((error: any, _request: FastifyRequest, reply: FastifyReply) => {
  fastify.log.error(error);

  if (error.validation) {
    return reply.status(400).send({
      status: 'error',
      code: 'VALIDATION_ERROR',
      message: 'Data yang dikirim tidak valid.',
      details: error.validation,
    });
  }

  if (error.code === 'FST_FILES_LIMIT' || error.code === 'FST_REQ_FILE_TOO_LARGE') {
    return reply.status(413).send({
      status: 'error',
      code: 'FILE_TOO_LARGE',
      message: `Ukuran file melebihi batas maksimal ${MAX_FILE_SIZE_MB}MB.`,
    });
  }

  if (error.code === 'FST_INVALID_MULTIPART_CONTENT_TYPE') {
    return reply.status(400).send({
      status: 'error',
      code: 'INVALID_CONTENT_TYPE',
      message: 'Request harus berupa multipart/form-data dengan field file "audio".',
    });
  }

  const statusCode = error.statusCode || 500;
  return reply.status(statusCode).send({
    status: 'error',
    code: error.code || 'INTERNAL_SERVER_ERROR',
    message: error.message || 'Terjadi kesalahan pada server.',
  });
});

// ----------------------------------------------------------
// NOT FOUND HANDLER
// ----------------------------------------------------------
fastify.setNotFoundHandler((request: FastifyRequest, reply: FastifyReply) => {
  return reply.status(404).send({
    status: 'error',
    code: 'NOT_FOUND',
    message: `Route ${request.method} ${request.url} tidak ditemukan.`,
  });
});

// ----------------------------------------------------------
// START SERVER
// ----------------------------------------------------------
const start = async () => {
  try {
    const PORT = parseInt(process.env.PORT || '3000', 10);
    const HOST = '0.0.0.0';

    // Test koneksi database sebelum server menerima request
    fastify.log.info('[Startup] Menguji koneksi ke database...');
    await db.testConnection();

    // Pembersihan transkrip berstatus 'processing' yang menggantung akibat restart/crash (CR-19, TC-TRS-010)
    try {
      const affectedRows = await transcriptModel.cleanupHangingProcessing();
      if (affectedRows > 0) {
        fastify.log.info(`[Startup] Membersihkan ${affectedRows} record transkrip menggantung ('processing' -> 'failed').`);
      }
    } catch (cleanupErr: any) {
      fastify.log.warn({ err: cleanupErr }, '[Startup] Gagal membersihkan record transkrip menggantung');
    }

    // Pembersihan sesi login yang sudah kedaluwarsa di tabel user_sessions (referensi/erd.puml)
    try {
      const deletedSessions = await sessionModel.deleteExpired();
      if (deletedSessions > 0) {
        fastify.log.info(`[Startup] Membersihkan ${deletedSessions} sesi login yang kedaluwarsa.`);
      }
    } catch (sessionErr: any) {
      fastify.log.warn({ err: sessionErr }, '[Startup] Gagal membersihkan sesi login kedaluwarsa');
    }

    // Pembersihan kode OTP yang sudah kedaluwarsa di tabel otp_requests (referensi/erd.puml)
    try {
      const deletedOtps = await otpModel.deleteExpired();
      if (deletedOtps > 0) {
        fastify.log.info(`[Startup] Membersihkan ${deletedOtps} rekaman OTP yang kedaluwarsa.`);
      }
    } catch (otpErr: any) {
      fastify.log.warn({ err: otpErr }, '[Startup] Gagal membersihkan record OTP kedaluwarsa');
    }

    // Jalankan server
    await fastify.listen({ port: PORT, host: HOST });
    fastify.log.info(`[Startup] SimpulKata Backend berjalan di http://${HOST}:${PORT}`);
    fastify.log.info(`[Startup] Health check: http://localhost:${PORT}/health`);
    fastify.log.info(`[Startup] DB health  : http://localhost:${PORT}/health/db`);

  } catch (err) {
    fastify.log.error({ err }, '[Startup] Gagal menjalankan server');
    process.exit(1);
  }
};

start();

