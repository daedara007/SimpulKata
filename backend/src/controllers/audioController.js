'use strict';

/**
 * audioController.js - Controller untuk alur pemrosesan audio
 *
 * Mengimplementasikan orkestrasi:
 * 1. Menerima multipart file audio (field: 'audio')
 * 2. Validasi format file (.mp3, .wav, .m4a)
 * 3. Simpan file sementara di storage/uploads
 * 4. Cek saldo kuota user (MVP: akun admin dummy)
 * 5. Buat record transcript di DB (status: 'processing')
 * 6. Transkripsi audio via Whisper (aiService.transcribeAudio)
 * 7. Buat rangkuman via Mistral (aiService.summarizeText)
 * 8. Simpan hasil ke DB (status: 'completed')
 * 9. Potong kuota user sesuai durasi audio
 * 10. Hapus file audio fisik sementara
 *
 * Referensi: Sequence Diagram (SD-07, SD-09, SD-10)
 */

const fs = require('fs');
const path = require('path');
const { pipeline } = require('stream/promises');
const db = require('../db');
const aiService = require('../services/aiService');

// Daftar ekstensi yang diizinkan (sesuai SRS)
const ALLOWED_EXTENSIONS = new Set(['.mp3', '.wav', '.m4a']);

// Direktori penyimpanan file sementara
const UPLOAD_DIR = path.resolve(__dirname, '../../storage/uploads');

/**
 * Helper untuk menghapus file dengan aman jika ada
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
 * POST /api/process-audio
 * Handler utama untuk transkripsi dan rangkuman audio
 */
async function processAudio(request, reply) {
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

    // Validasi nama field
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

    // 4. Ambil user pengunggah dari token JWT yang sudah terautentikasi
    userId = request.user?.id;
    if (!userId) {
      await safeUnlink(savedFilePath);
      return reply.status(401).send({
        status: 'error',
        code: 'UNAUTHORIZED',
        message: 'Akses tidak sah. Silakan login terlebih dahulu.',
      });
    }

    const userRes = await db.query(
      `SELECT id, email, balance FROM users WHERE id = $1 LIMIT 1`,
      [userId]
    );

    if (userRes.rows.length === 0) {
      await safeUnlink(savedFilePath);
      return reply.status(404).send({
        status: 'error',
        code: 'USER_NOT_FOUND',
        message: 'Data pengguna tidak ditemukan di sistem.',
      });
    }

    const user = userRes.rows[0];

    // Cek saldo awal
    if (user.balance <= 0) {
      await safeUnlink(savedFilePath);
      return reply.status(402).send({
        status: 'error',
        code: 'INSUFFICIENT_QUOTA',
        message: 'Kuota pemrosesan Anda telah habis. Silakan hubungi admin untuk top up.',
      });
    }

    // 5. Ekstrak durasi audio secara lokal sebelum memanggil AI Whisper (Hemat biaya & waktu!)
    durationSeconds = await aiService.getAudioDuration(savedFilePath);
    console.log(`[AudioController] Durasi audio terdeteksi: ${durationSeconds} detik (Saldo user: ${user.balance} detik)`);

    // Validasi file audio dan durasi (CR-02, TC-UPL-008, TC-QTA-006)
    if (!durationSeconds || durationSeconds <= 0) {
      await safeUnlink(savedFilePath);
      return reply.status(400).send({
        status: 'error',
        code: 'INVALID_AUDIO_FILE',
        message: 'File audio tidak valid, rusak, atau durasinya tidak dapat ditentukan (0 detik). Pastikan file merupakan berkas audio yang benar.',
      });
    }

    // 5b. Reservasi kuota secara atomik di awal untuk mencegah race condition (CR-03, TC-QTA-007)
    const reserveRes = await db.query(
      `UPDATE users
       SET balance = balance - $1
       WHERE id = $2 AND balance >= $1
       RETURNING balance`,
      [durationSeconds, user.id]
    );

    if (reserveRes.rowCount === 0) {
      await safeUnlink(savedFilePath);
      const currentBalanceRes = await db.query('SELECT balance FROM users WHERE id = $1', [user.id]);
      const currentBalance = currentBalanceRes.rows[0]?.balance ?? 0;
      return reply.status(402).send({
        status: 'error',
        code: 'INSUFFICIENT_QUOTA',
        message: `Durasi audio (${durationSeconds} detik) melebihi sisa saldo kuota Anda (${currentBalance} detik). Silakan hubungi admin atau top up kuota.`,
      });
    }

    isQuotaReserved = true;
    console.log(`[AudioController] Kuota berhasil direservasi di awal: -${durationSeconds}s (Sisa saldo: ${reserveRes.rows[0].balance}s)`);

    // 6. Buat record awal di tabel transcripts (status: 'processing', durasi sudah dicatat)
    const insertRes = await db.query(
      `INSERT INTO transcripts (user_id, original_file_name, file_path, status, duration_seconds)
       VALUES ($1, $2, $3, 'processing', $4)
       RETURNING id`,
      [user.id, originalFileName, `storage/uploads/${uniqueFileName}`, durationSeconds]
    );

    transcriptId = insertRes.rows[0].id;
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
    // Tanggung jawab refund & cleanup audio dialihkan ke runTranscriptionPipeline
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

    // Kembalikan reservasi kuota jika pemrosesan gagal (CR-03 Refund)
    if (isQuotaReserved && userId && durationSeconds > 0) {
      try {
        await db.query(
          `UPDATE users
           SET balance = balance + $1
           WHERE id = $2`,
          [durationSeconds, userId]
        );
        console.log(`[AudioController] Mengembalikan kuota ${durationSeconds}s ke user ${userId} karena pemrosesan gagal`);
      } catch (refundErr) {
        console.error('[AudioController] Gagal mengembalikan kuota:', refundErr.message);
      }
    }

    // Tandai status transcript sebagai 'failed' jika record sudah dibuat di DB
    if (transcriptId) {
      try {
        await db.query(
          `UPDATE transcripts SET status = 'failed' WHERE id = $1`,
          [transcriptId]
        );
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

    // Error umum
    return reply.status(500).send({
      status: 'error',
      code: error.code || 'INTERNAL_SERVER_ERROR',
      message: error.message || 'Terjadi kesalahan pada server saat memproses audio.',
    });
  }
}

/**
 * Menjalankan pipeline transkripsi Whisper dan perangkum LLM (CR-06, CR-08)
 * Dapat dipanggil secara asinkron di latar belakang atau secara sinkron
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
        await db.query(
          `UPDATE users SET balance = balance + $1 WHERE id = $2`,
          [durationSeconds, userId]
        );
        isQuotaReserved = false;
        console.log(`[AudioPipeline] Kuota dikembalikan karena audio hening (tidak ada ucapan)`);
      }

      await db.query(
        `UPDATE transcripts
         SET raw_text = '(Tidak ada ucapan yang terdeteksi)',
             summary_text = 'Tidak ada ucapan atau percakapan yang terdeteksi dalam rekaman audio ini. Kuota telah dikembalikan.',
             status = 'failed'
         WHERE id = $1`,
        [transcriptId]
      );

      const error = new Error('Tidak ada ucapan atau percakapan yang terdeteksi dalam rekaman audio ini.');
      error.code = 'NO_SPEECH_DETECTED';
      error.statusCode = 422;
      throw error;
    }

    // 2. Simpan raw_text segera setelah Whisper selesai agar transkrip tidak hilang jika LLM gagal (CR-08, TC-SUM-004, TC-SUM-006)
    await db.query(
      `UPDATE transcripts
       SET raw_text = $1
       WHERE id = $2`,
      [rawText, transcriptId]
    );

    // 3. Buat rangkuman teks menggunakan Hugging Face LLM (dengan penanganan error gracefully)
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

    // 4. Update tabel transcripts menjadi 'completed' beserta hasil transkripsi & rangkuman
    await db.query(
      `UPDATE transcripts
       SET raw_text = $1,
           summary_text = $2,
           duration_seconds = $3,
           tokens_used = $4,
           status = 'completed'
       WHERE id = $5`,
      [rawText, summaryText, durationSeconds, tokensUsed, transcriptId]
    );

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

    // Bersihkan file fisik jika masih ada
    await safeUnlink(savedFilePath);

    // Kembalikan reservasi kuota jika pemrosesan gagal (CR-03 Refund)
    if (isQuotaReserved && error.code !== 'NO_SPEECH_DETECTED' && userId && durationSeconds > 0) {
      try {
        await db.query(
          `UPDATE users
           SET balance = balance + $1
           WHERE id = $2`,
          [durationSeconds, userId]
        );
        console.log(`[AudioPipeline] Mengembalikan kuota ${durationSeconds}s ke user ${userId} karena pemrosesan gagal`);
      } catch (refundErr) {
        console.error('[AudioPipeline] Gagal mengembalikan kuota:', refundErr.message);
      }
    }

    // Tandai status transcript sebagai 'failed' jika record sudah dibuat di DB
    if (error.code !== 'NO_SPEECH_DETECTED' && transcriptId) {
      try {
        await db.query(
          `UPDATE transcripts
           SET status = 'failed',
               summary_text = $1
           WHERE id = $2`,
          [`Gagal memproses audio: ${error.message || 'Terjadi kesalahan sistem saat pemrosesan AI'}`, transcriptId]
        );
      } catch (dbErr) {
        console.error('[AudioPipeline] Gagal update status transcript ke failed:', dbErr.message);
      }
    }

    throw error;
  }
}

/**
 * GET /api/history
 * Mengambil riwayat transkripsi audio dari database (sesuai SRS UC-11 & Sequence Diagram SD-11)
 * Query parameters:
 * - page: nomor halaman (default: 1)
 * - limit: jumlah item per halaman (default: 20 sesuai SRS UC-11 / SD-11)
 * - status: filter status ('all', 'completed', 'failed', 'processing')
 */
async function getHistory(request, reply) {
  try {
    // 1. Sanitasi page & limit dengan aman (CR-07, TC-HIST-011)
    const rawPage = parseInt(request.query?.page, 10);
    const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;

    const rawLimit = parseInt(request.query?.limit, 10);
    const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 100) : 20;

    const offset = (page - 1) * limit;

    // 2. Sanitasi filter status (tangani array query ?status=a&status=b atau string non-valid)
    let filterStatus = null;
    if (typeof request.query?.status === 'string') {
      filterStatus = request.query.status.toLowerCase().trim();
    } else if (Array.isArray(request.query?.status) && typeof request.query.status[0] === 'string') {
      filterStatus = request.query.status[0].toLowerCase().trim();
    }

    const userId = request.user?.id;
    let whereClause = ' WHERE user_id = $1';
    const params = [userId];

    // Filter status jika valid dan bukan 'all'
    if (filterStatus && ['completed', 'failed', 'processing', 'pending'].includes(filterStatus)) {
      params.push(filterStatus);
      whereClause += ` AND status = $${params.length}`;
    }

    // 1. Hitung total records pengguna (SD-11 langkah 3 & 4: selectTranscripts -> return(transcriptList, totalRecords))
    const countRes = await db.query(`SELECT COUNT(*) AS total FROM transcripts${whereClause}`, params);
    const totalRecords = parseInt(countRes.rows[0]?.total || '0', 10);

    // 2. Query data transkripsi dengan limit & offset
    const dataParams = [...params, limit, offset];
    const dataQuery = `
      SELECT id, original_file_name, status, raw_text, summary_text,
             duration_seconds, tokens_used, created_at, updated_at
      FROM transcripts
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}
    `;
    const result = await db.query(dataQuery, dataParams);

    // 3. Format data riwayat (SD-11 langkah 5: formatDataRiwayat(transcriptList, totalRecords))
    // Hitung word_count dari raw_text sesuai SRS UC-11 Post Conditions
    const historyData = result.rows.map((row) => {
      const wordCount = row.raw_text
        ? row.raw_text.trim().split(/\s+/).filter(Boolean).length
        : 0;
      return {
        ...row,
        word_count: wordCount,
      };
    });

    // 4. Kembalikan data dan total records (SD-11 langkah 6: return(historyData, totalRecords))
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

/**
 * GET /api/transcripts/:id
 * Mengambil status dan hasil transkrip tertentu (CR-06, TC-TRS-011)
 * Digunakan oleh frontend untuk polling status pemrosesan asinkron
 */
async function getTranscriptStatus(request, reply) {
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

    const res = await db.query(
      `SELECT id, original_file_name, status, raw_text, summary_text,
              duration_seconds, tokens_used, created_at, updated_at
       FROM transcripts
       WHERE id = $1 AND user_id = $2
       LIMIT 1`,
      [id, userId]
    );

    if (res.rows.length === 0) {
      return reply.status(404).send({
        status: 'error',
        code: 'NOT_FOUND',
        message: 'Data transkrip tidak ditemukan.',
      });
    }

    const row = res.rows[0];
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

module.exports = {
  processAudio,
  getTranscriptStatus,
  getHistory,
};

