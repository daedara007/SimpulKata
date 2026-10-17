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
  fastify.post('/process-audio', audioController.processAudio);
  fastify.get('/history', audioController.getHistory);
}

module.exports = audioRoutes;
