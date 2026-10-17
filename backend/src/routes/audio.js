'use strict';

/**
 * routes/audio.js - Rute untuk endpoint pemrosesan audio
 *
 * Mendaftarkan:
 * POST /process-audio (prefix akan dipasang di server.js: /api/process-audio)
 *
 * Referensi: SRS UC-07, UC-09, UC-10; SDD Bab 6
 */

const audioController = require('../controllers/audioController');

async function audioRoutes(fastify, options) {
  // Seluruh rute pemrosesan audio dan riwayat mewajibkan autentikasi JWT
  fastify.post('/process-audio', { preHandler: [fastify.authenticate] }, audioController.processAudio);
  fastify.get('/history', { preHandler: [fastify.authenticate] }, audioController.getHistory);
}

module.exports = audioRoutes;
