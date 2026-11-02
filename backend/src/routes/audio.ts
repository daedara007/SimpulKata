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

const audioRoutes: FastifyPluginAsync = async (fastify) => {
  // Seluruh rute pemrosesan audio dan riwayat mewajibkan autentikasi JWT
  fastify.post('/process-audio', { preHandler: [fastify.authenticate] }, audioController.processAudio.bind(audioController));
  fastify.get('/transcripts/:id', { preHandler: [fastify.authenticate] }, audioController.getTranscriptStatus.bind(audioController));
  fastify.get('/history', { preHandler: [fastify.authenticate] }, audioController.getHistory.bind(audioController));
  fastify.delete('/history/:id', { preHandler: [fastify.authenticate] }, audioController.deleteHistoryItem.bind(audioController));
};

export default audioRoutes;

