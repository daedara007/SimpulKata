/**
 * routes/audio.ts - Rute untuk endpoint pemrosesan audio & riwayat
 *
 * Mendaftarkan:
 * - POST /process-audio (prefix akan dipasang di server.ts: /api)
 * - GET /transcripts/:id
 * - GET /history
 * - DELETE /history/:id
 *
 * Referensi: SRS UC-07, UC-09, UC-10, UC-11, UC-12; SDD Bab 6
 */

import { FastifyPluginAsync } from 'fastify';
import audioController from '../controllers/audioController';
import uploadController from '../controllers/uploadController';

const audioRoutes: FastifyPluginAsync = async (fastify) => {
  // Seluruh rute pemrosesan audio dan riwayat mewajibkan autentikasi JWT
  fastify.post('/process-audio', { preHandler: [fastify.authenticate] }, audioController.processAudio.bind(audioController));
  fastify.get('/transcripts/:id', { preHandler: [fastify.authenticate] }, audioController.getTranscriptStatus.bind(audioController));
  fastify.get('/history', { preHandler: [fastify.authenticate] }, audioController.getHistory.bind(audioController));
  fastify.delete('/history/:id', { preHandler: [fastify.authenticate] }, audioController.deleteHistoryItem.bind(audioController));

  // Rute Chunked Audio Upload (Bypass limit 100MB Cloudflare & anti-OOM peramban ponsel)
  fastify.post('/upload/init', { preHandler: [fastify.authenticate] }, uploadController.initUpload.bind(uploadController));
  fastify.post('/upload/chunk', { preHandler: [fastify.authenticate] }, uploadController.uploadChunk.bind(uploadController));
  fastify.post('/upload/complete', { preHandler: [fastify.authenticate] }, uploadController.completeUpload.bind(uploadController));
  fastify.post('/upload/abort', { preHandler: [fastify.authenticate] }, uploadController.abortUpload.bind(uploadController));
};

export default audioRoutes;

