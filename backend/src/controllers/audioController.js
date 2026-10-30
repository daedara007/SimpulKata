'use strict';

/**
 * controllers/audioController.js - Controller Pemrosesan Audio & Riwayat (MVC Architecture)
 *
 * Mengimplementasikan orkestrasi:
 * - UC-07: Mengunggah berkas audio (SD-07)
 * - UC-09: Memproses audio menjadi transkrip (SD-09)
 * - UC-10: Merangkum transkrip audio (SD-10)
 * - UC-11: Melihat riwayat transkripsi (SD-11)
 *
 * Menggunakan:
 * - UserModel (models/userModel.js)
 * - TranscriptModel (models/transcriptModel.js)
 * - AiService (services/aiService.js)
 */

const fs = require('fs');
const path = require('path');
const { pipeline } = require('stream/promises');
const { userModel, transcriptModel } = require('../models');
const aiService = require('../services/aiService');

// Daftar ekstensi audio yang didukung (sesuai SRS UC-07)
const ALLOWED_EXTENSIONS = new Set(['.mp3', '.wav', '.m4a']);

// Direktori penyimpanan berkas sementara
const UPLOAD_DIR = path.resolve(__dirname, '../../storage/uploads');

/**
 * Helper untuk menghapus file sementara dari disk dengan aman (Rule 3)
 * @param {string} filePath
 */
async function safeUnlink(filePath) {
  if (filePath && fs.existsSync(filePath)) {
    try {
      await fs.promises.unlink(filePath);
      console.log(`[AudioController] File sementara dibersihkan: ${filePath}`);
    } catch (err) {
      console.warn(`[AudioController] Gagal menghapus file sementara: ${err.message}`);
    }
  }
}

/**
 * Pipeline pemrosesan transkripsi Whisper dan perangkum LLM
 * Dapat dijalankan secara asinkron di latar belakang (CR-06) atau sinkron
 * @param {Object} param0
 * @returns {Promise<Object>}
 */
async function runTranscriptionPipeline({ transcriptId, savedFilePath, durationSeconds, userId }) {
  let isQuotaReserved = true;

  try {
    console.log(`[AudioPipeline] Memulai transkripsi Whisper untuk transcript: ${transcriptId}...`);
    const { text: rawText } = await aiService.transcribeAudio(savedFilePath, durationSeconds);

    // 1. Validasi hasil transkripsi (CR-08, TC-TRS-005: Audio hening / tanpa ucapan)
    if (!rawText || !rawText.trim()) {
      await safeUnlink(savedFilePath);

      // Kembalikan kuota karena tidak ada ucapan terdeteksi
      if (userId && durationSeconds > 0) {
        await userModel.refundBalance(userId, durationSeconds);
        isQuotaReserved = false;
        console.log(`[AudioPipeline] Kuota dikembalikan karena audio hening (tidak ada ucapan)`);
      }

      await transcriptModel.updateFailed(transcriptId, {
        rawText: '(Tidak ada ucapan yang terdeteksi)',
        summaryText: 'Tidak ada ucapan atau percakapan yang terdeteksi dalam rekaman audio ini. Kuota telah dikembalikan.',
      });

      const error = new Error('Tidak ada ucapan atau percakapan yang terdeteksi dalam rekaman audio ini.');
      error.code = 'NO_SPEECH_DETECTED';
      error.statusCode = 422;
      throw error;
    }

    // 2. Simpan raw_text segera setelah Whisper selesai agar transkrip tidak hilang jika LLM gagal (CR-08, TC-SUM-004, TC-SUM-006)
    await transcriptModel.updateRawText(transcriptId, rawText);

    // 3. Buat rangkuman teks menggunakan Hugging Face LLM (dengan penanganan gracefully)
    console.log(`[AudioPipeline] Memulai pembuatan rangkuman teks untuk transcript: ${transcriptId}...`);
    let summaryText = '';
    let tokensUsed = 0;
    let summaryWarning = null;

    try {
      const summaryResult = await aiService.summarizeText(rawText);
      summaryText = summaryResult.summary;
      tokensUsed = summaryResult.tokens_used;
    } catch (sumErr) {
      console.warn(`[AudioPipeline] Gagal membuat rangkuman teks untuk transcript ${transcriptId}:`, sumErr.message);
      summaryWarning = sumErr.message || 'Layanan rangkuman AI sedang tidak tersedia.';
      summaryText = `*(Rangkuman otomatis belum tersedia: ${summaryWarning}. Transkripsi lengkap telah berhasil disimpan.)*`;
    }

    // 4. Update status transkrip menjadi 'completed' via TranscriptModel
    await transcriptModel.updateCompleted(transcriptId, {
      rawText,
      summaryText,
      durationSeconds,
      tokensUsed,
    });

    // 5. Hapus file audio fisik dari server (sesuai sequence SD-09 step 16 & Rule 3)
    await safeUnlink(savedFilePath);
    console.log(`[AudioPipeline] Pemrosesan selesai sukses untuk transcript: ${transcriptId}`);

    return {
      transcript_id: transcriptId,
      raw_text: rawText,
      summary_text: summaryText,
      duration_seconds: durationSeconds,
      tokens_used: tokensUsed,
      ...(summaryWarning ? { warning: summaryWarning } : {}),
    };
  } catch (error) {
    console.error(`[AudioPipeline] Error saat memproses pipeline transcript ${transcriptId}:`, error);

    // Bersihkan berkas fisik
    await safeUnlink(savedFilePath);

    // Kembalikan reservasi kuota jika pemrosesan gagal (CR-03 Refund)
    if (isQuotaReserved && error.code !== 'NO_SPEECH_DETECTED' && userId && durationSeconds > 0) {
      try {
        await userModel.refundBalance(userId, durationSeconds);
        console.log(`[AudioPipeline] Mengembalikan kuota ${durationSeconds}s ke user ${userId} karena pemrosesan gagal`);
      } catch (refundErr) {
        console.error('[AudioPipeline] Gagal mengembalikan kuota:', refundErr.message);
      }
    }

    // Tandai status transcript sebagai 'failed' jika belum
    if (error.code !== 'NO_SPEECH_DETECTED' && transcriptId) {
      try {
        await transcriptModel.updateFailed(transcriptId, {
          summaryText: `Gagal memproses audio: ${error.message || 'Terjadi kesalahan sistem saat pemrosesan AI'}`,
        });
      } catch (dbErr) {
        console.error('[AudioPipeline] Gagal update status transcript ke failed:', dbErr.message);
      }
    }

    throw error;
  }
}

class AudioController {
  /**
   * POST /api/process-audio
   * Handler utama untuk unggah, validasi durasi & kuota, serta pemrosesan transkrip
   */
  async processAudio(request, reply) {
    let savedFilePath = null;
    let transcriptId = null;
    let durationSeconds = 0;
    let userId = null;
    let isQuotaReserved = false;

    try {
      // 1. Ambil file dari request multipart
      const part = await request.file();
      if (!part) {
        return reply.status(400).send({
          status: 'error',
          code: 'MISSING_FILE',
          message: 'File audio tidak ditemukan. Kirim file dengan multipart form-data (field: "audio").',
        });
      }

      if (part.fieldname !== 'audio') {
        return reply.status(400).send({
          status: 'error',
          code: 'INVALID_FIELD',
          message: `Field form-data tidak valid ('${part.fieldname}'). Gunakan field name 'audio'.`,
        });
      }

      // 2. Validasi ekstensi file
      const originalFileName = part.filename || 'audio.mp3';
      const ext = path.extname(originalFileName).toLowerCase();

      if (!ALLOWED_EXTENSIONS.has(ext)) {
        return reply.status(400).send({
          status: 'error',
          code: 'INVALID_FORMAT',
          message: `Format file '${ext}' tidak didukung. Gunakan format .mp3, .wav, atau .m4a.`,
        });
      }

      // 3. Simpan file sementara ke disk
      await fs.promises.mkdir(UPLOAD_DIR, { recursive: true });
      const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}${ext}`;
      savedFilePath = path.join(UPLOAD_DIR, uniqueFileName);

      await pipeline(part.file, fs.createWriteStream(savedFilePath));
      const fileStats = await fs.promises.stat(savedFilePath);
      console.log(`[AudioController] File disimpan di: ${savedFilePath} (${fileStats.size} bytes)`);

      if (fileStats.size === 0) {
        await safeUnlink(savedFilePath);
        return reply.status(400).send({
          status: 'error',
          code: 'EMPTY_FILE',
          message: 'File audio yang diunggah kosong (0 bytes). Silakan periksa dan unggah kembali file audio yang valid.',
        });
      }

      // 4. Ambil user pengunggah dari token JWT
      userId = request.user?.id;
      if (!userId) {
        await safeUnlink(savedFilePath);
        return reply.status(401).send({
          status: 'error',
          code: 'UNAUTHORIZED',
          message: 'Akses tidak sah. Silakan login terlebih dahulu.',
        });
      }

      const user = await userModel.findById(userId);
      if (!user) {
        await safeUnlink(savedFilePath);
        return reply.status(404).send({
          status: 'error',
          code: 'USER_NOT_FOUND',
          message: 'Data pengguna tidak ditemukan di sistem.',
        });
      }

      // Cek saldo awal
      if (user.balance <= 0) {
        await safeUnlink(savedFilePath);
        return reply.status(402).send({
          status: 'error',
          code: 'INSUFFICIENT_QUOTA',
          message: 'Kuota pemrosesan Anda telah habis. Silakan hubungi admin untuk top up.',
        });
      }

      // 5. Ekstrak durasi audio secara lokal sebelum memanggil AI Whisper (Rule 2)
      durationSeconds = await aiService.getAudioDuration(savedFilePath);
      console.log(`[AudioController] Durasi audio terdeteksi: ${durationSeconds} detik (Saldo user: ${user.balance} detik)`);

      // Validasi durasi (CR-02, TC-UPL-008, TC-QTA-006)
      if (!durationSeconds || durationSeconds <= 0) {
        await safeUnlink(savedFilePath);
        return reply.status(400).send({
          status: 'error',
          code: 'INVALID_AUDIO_FILE',
          message: 'File audio tidak valid, rusak, atau durasinya tidak dapat ditentukan (0 detik). Pastikan file merupakan berkas audio yang benar.',
        });
      }

      // 5b. Reservasi kuota secara atomik di awal via UserModel (CR-03, TC-QTA-007)
      const remainingBalance = await userModel.reserveBalance(user.id, durationSeconds);
      if (remainingBalance === null) {
        await safeUnlink(savedFilePath);
        const currentBalance = await userModel.getBalance(user.id);
        return reply.status(402).send({
          status: 'error',
          code: 'INSUFFICIENT_QUOTA',
          message: `Durasi audio (${durationSeconds} detik) melebihi sisa saldo kuota Anda (${currentBalance} detik). Silakan hubungi admin atau top up kuota.`,
        });
      }

      isQuotaReserved = true;
      console.log(`[AudioController] Kuota berhasil direservasi di awal: -${durationSeconds}s (Sisa saldo: ${remainingBalance}s)`);

      // 6. Buat record awal di tabel transcripts via TranscriptModel
      const newTranscript = await transcriptModel.create({
        userId: user.id,
        originalFileName,
        filePath: `storage/uploads/${uniqueFileName}`,
        durationSeconds,
        status: 'processing',
      });

      transcriptId = newTranscript.id;
      console.log(`[AudioController] Record transcript dibuat: ${transcriptId} (status: processing, durasi: ${durationSeconds}s)`);

      const isSync = request.query?.sync === 'true';

      if (isSync) {
        // Mode Sinkron (Kompatibilitas): Menunggu AI pipeline selesai dalam satu request HTTP
        const pipelineResult = await runTranscriptionPipeline({
          transcriptId,
          savedFilePath,
          durationSeconds,
          userId,
        });

        return reply.status(200).send({
          status: 'success',
          data: pipelineResult,
        });
      }

      // Mode Asinkron Default (CR-06, TC-TRS-011):
      // Kembalikan respons 202 Accepted dalam 1-2 detik ke client untuk mencegah 524 HTTP Timeout di Cloudflare Tunnel
      isQuotaReserved = false;

      reply.status(202).send({
        status: 'processing',
        message: 'Audio berhasil diunggah dan sedang diproses di antrean latar belakang.',
        data: {
          transcript_id: transcriptId,
          status: 'processing',
          duration_seconds: durationSeconds,
        },
      });

      // Jalankan pipeline AI di latar belakang secara asinkron
      runTranscriptionPipeline({
        transcriptId,
        savedFilePath,
        durationSeconds,
        userId,
      }).catch((bgErr) => {
        console.error(`[AudioController] Background pipeline gagal untuk ${transcriptId}:`, bgErr.message);
      });

    } catch (error) {
      console.error('[AudioController] Error saat memproses audio:', error);

      // Bersihkan file fisik jika masih ada
      await safeUnlink(savedFilePath);

      // Kembalikan reservasi kuota jika pemrosesan gagal di controller (CR-03 Refund)
      if (isQuotaReserved && userId && durationSeconds > 0) {
        try {
          await userModel.refundBalance(userId, durationSeconds);
          console.log(`[AudioController] Mengembalikan kuota ${durationSeconds}s ke user ${userId} karena pemrosesan gagal`);
        } catch (refundErr) {
          console.error('[AudioController] Gagal mengembalikan kuota:', refundErr.message);
        }
      }

      // Tandai status transcript sebagai 'failed' jika record sudah dibuat di DB
      if (transcriptId) {
        try {
          await transcriptModel.updateFailed(transcriptId, {
            summaryText: `Gagal memproses audio: ${error.message || 'Kesalahan sistem'}`,
          });
        } catch (dbErr) {
          console.error('[AudioController] Gagal update status transcript ke failed:', dbErr.message);
        }
      }

      // Tangani tipe error spesifik
      if (error.code === 'FST_INVALID_MULTIPART_CONTENT_TYPE') {
        return reply.status(400).send({
          status: 'error',
          code: 'INVALID_CONTENT_TYPE',
          message: 'Request harus berupa multipart/form-data dengan field file "audio".',
        });
      }

      if (error.code === 'FST_REQ_FILE_TOO_LARGE' || error.code === 'FST_FILES_LIMIT') {
        const maxMb = process.env.MAX_UPLOAD_SIZE_MB || '50';
        return reply.status(413).send({
          status: 'error',
          code: 'FILE_TOO_LARGE',
          message: `Ukuran file melebihi batas maksimal ${maxMb}MB.`,
        });
      }

      if (error.code === 'TEXT_TOO_LONG') {
        return reply.status(422).send({
          status: 'error',
          code: 'TEXT_TOO_LONG',
          message: error.message,
        });
      }

      if (error.code === 'AI_SERVICE_ERROR') {
        return reply.status(503).send({
          status: 'error',
          code: 'AI_SERVICE_ERROR',
          message: 'Layanan AI Hugging Face sedang mengalami kendala. Silakan coba sesaat lagi.',
          detail: error.message,
        });
      }

      return reply.status(500).send({
        status: 'error',
        code: error.code || 'INTERNAL_SERVER_ERROR',
        message: error.message || 'Terjadi kesalahan pada server saat memproses audio.',
      });
    }
  }

  /**
   * GET /api/transcripts/:id
   * Mengambil status dan hasil transkrip tertentu (CR-06, TC-TRS-011)
   */
  async getTranscriptStatus(request, reply) {
    try {
      const { id } = request.params;
      const userId = request.user?.id;

      if (!id || typeof id !== 'string') {
        return reply.status(400).send({
          status: 'error',
          code: 'INVALID_ID',
          message: 'ID transkrip tidak valid.',
        });
      }

      const row = await transcriptModel.findByIdAndUserId(id, userId);
      if (!row) {
        return reply.status(404).send({
          status: 'error',
          code: 'NOT_FOUND',
          message: 'Data transkrip tidak ditemukan.',
        });
      }

      const wordCount = row.raw_text
        ? row.raw_text.trim().split(/\s+/).filter(Boolean).length
        : 0;

      return reply.status(200).send({
        status: 'success',
        data: {
          ...row,
          word_count: wordCount,
        },
      });
    } catch (error) {
      console.error('[AudioController] Gagal mengambil status transkrip:', error);
      return reply.status(500).send({
        status: 'error',
        code: 'TRANSCRIPT_FETCH_ERROR',
        message: 'Gagal memuat status transkrip dari database.',
      });
    }
  }

  /**
   * GET /api/history
   * Mengambil riwayat transkripsi audio dari database (SRS UC-11 & Sequence Diagram SD-11)
   */
  async getHistory(request, reply) {
    try {
      // 1. Sanitasi page & limit dengan aman (CR-07, TC-HIST-011)
      const rawPage = parseInt(request.query?.page, 10);
      const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;

      const rawLimit = parseInt(request.query?.limit, 10);
      const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 100) : 20;

      const offset = (page - 1) * limit;

      // 2. Sanitasi filter status
      let filterStatus = null;
      if (typeof request.query?.status === 'string') {
        filterStatus = request.query.status.toLowerCase().trim();
      } else if (Array.isArray(request.query?.status) && typeof request.query.status[0] === 'string') {
        filterStatus = request.query.status[0].toLowerCase().trim();
      }

      const userId = request.user?.id;

      // 3. Hitung total records pengguna via TranscriptModel
      const totalRecords = await transcriptModel.countHistory({ userId, status: filterStatus });

      // 4. Query data riwayat via TranscriptModel
      const historyData = await transcriptModel.findHistory({
        userId,
        status: filterStatus,
        limit,
        offset,
      });

      // 5. Kembalikan data dan total records (SD-11 langkah 6)
      return reply.status(200).send({
        status: 'success',
        data: historyData,
        totalRecords,
        page,
        limit,
        totalPages: Math.ceil(totalRecords / limit) || 1,
      });
    } catch (error) {
      console.error('[AudioController] Gagal mengambil riwayat transkripsi:', error);
      return reply.status(500).send({
        status: 'error',
        code: 'HISTORY_FETCH_ERROR',
        message: 'Gagal memuat riwayat transkripsi dari database. Coba refresh halaman.',
      });
    }
  }
}

const audioController = new AudioController();

module.exports = {
  processAudio: audioController.processAudio.bind(audioController),
  getTranscriptStatus: audioController.getTranscriptStatus.bind(audioController),
  getHistory: audioController.getHistory.bind(audioController),
};
