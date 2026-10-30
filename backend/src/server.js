'use strict';

/**
 * server.js - Entry Point Fastify Server SimpulKata
 *
 * Struktur:
 * - Load environment variables (.env)
 * - Inisiasi Fastify dengan logger
 * - Register plugins: multipart (upload audio), cors
 * - Daftarkan routes dasar (health check)
 * - Test koneksi database
 * - Jalankan server di 0.0.0.0:PORT (siap untuk Docker & self-hosted)
 *
 * Referensi: SDD Bab 6 - Desain Arsitektur, SRS 2.5 - Batasan Implementasi
 */

// Load .env sebelum require modul lain (harus di baris pertama)
require('dotenv').config();

const fastify = require('fastify')({
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

const db = require('./db');

// ----------------------------------------------------------
// PLUGIN: @fastify/cors
// Mengizinkan request dari frontend Vue.js (localhost:8080)
// ----------------------------------------------------------
fastify.register(require('@fastify/cors'), {
  // Di production, ganti dengan domain spesifik
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL || 'http://localhost:8080'
    : true, // Izinkan semua origin saat development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
});

// ----------------------------------------------------------
// PLUGIN: @fastify/multipart
// Diperlukan untuk endpoint upload audio (FR-CORE-01)
// Limit: 50MB sesuai SRS UC-07
// ----------------------------------------------------------
const MAX_FILE_SIZE_MB = parseInt(process.env.MAX_UPLOAD_SIZE_MB || '50', 10);
fastify.register(require('@fastify/multipart'), {
  limits: {
    fileSize: MAX_FILE_SIZE_MB * 1024 * 1024, // Konversi MB ke bytes
    files: 1, // Maksimal 1 file per request
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

fastify.register(require('@fastify/jwt'), {
  secret: jwtSecret,
});

// Decorator untuk memproteksi routes yang mewajibkan login
fastify.decorate('authenticate', async function (request, reply) {
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

const healthHandler = async (request, reply) => {
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
 * Berguna untuk verifikasi koneksi PostgreSQL saat testing
 */
fastify.get('/health/db', async (request, reply) => {
  try {
    const result = await db.query('SELECT NOW() AS db_time, version() AS db_version');
    return {
      status: 'ok',
      database: 'connected',
      db_time: result.rows[0].db_time,
      db_version: result.rows[0].db_version,
    };
  } catch (err) {
    fastify.log.error('[Health/DB] Koneksi database gagal:', err.message);
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
fastify.register(require('./routes/auth'), { prefix: '/api/auth' });
fastify.register(require('./routes/audio'), { prefix: '/api' });


// ----------------------------------------------------------
// GLOBAL ERROR HANDLER
// Menangkap semua unhandled error dan mengembalikan response
// yang konsisten dan human-readable
// ----------------------------------------------------------
fastify.setErrorHandler((error, request, reply) => {
  fastify.log.error(error);

  // Validasi error dari Fastify (schema validation)
  if (error.validation) {
    return reply.status(400).send({
      status: 'error',
      code: 'VALIDATION_ERROR',
      message: 'Data yang dikirim tidak valid.',
      details: error.validation,
    });
  }

  // Error dari multipart (file terlalu besar)
  if (error.code === 'FST_FILES_LIMIT' || error.code === 'FST_REQ_FILE_TOO_LARGE') {
    return reply.status(413).send({
      status: 'error',
      code: 'FILE_TOO_LARGE',
      message: `Ukuran file melebihi batas maksimal ${MAX_FILE_SIZE_MB}MB.`,
    });
  }

  // Error jika request ke multipart route bukan form-data
  if (error.code === 'FST_INVALID_MULTIPART_CONTENT_TYPE') {
    return reply.status(400).send({
      status: 'error',
      code: 'INVALID_CONTENT_TYPE',
      message: 'Request harus berupa multipart/form-data dengan field file "audio".',
    });
  }

  // Generic server error
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
fastify.setNotFoundHandler((request, reply) => {
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
    // Listen di 0.0.0.0 agar dapat diakses dari Docker & jaringan lokal
    const HOST = '0.0.0.0';

    // Test koneksi database sebelum server menerima request
    fastify.log.info('[Startup] Menguji koneksi ke database...');
    await db.testConnection();

    // Jalankan server
    await fastify.listen({ port: PORT, host: HOST });
    fastify.log.info(`[Startup] SimpulKata Backend berjalan di http://${HOST}:${PORT}`);
    fastify.log.info(`[Startup] Health check: http://localhost:${PORT}/health`);
    fastify.log.info(`[Startup] DB health  : http://localhost:${PORT}/health/db`);

  } catch (err) {
    fastify.log.error('[Startup] Gagal menjalankan server:', err.message);
    process.exit(1);
  }
};

start();
