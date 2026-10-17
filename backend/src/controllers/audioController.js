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
        message: 'File audio yang diunggah kosong (0 bytes). Jika di Postman terdapat tanda peringatan ⚠️ pada nama file, silakan hapus dan pilih ulang (re-select) file tersebut.',
      });
    }

    // 4. Ambil user dummy (admin) untuk MVP sebelum JWT diaktifkan di Tugas 3
    const userRes = await db.query(
      `SELECT id, email, balance FROM users WHERE email = 'admin@simpulkata.id' LIMIT 1`
    );

    if (userRes.rows.length === 0) {
      return reply.status(500).send({
        status: 'error',
        code: 'USER_NOT_FOUND',
        message: 'Data user pengunggah tidak ditemukan di sistem.',
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

    // 5. Buat record awal di tabel transcripts (status: 'processing')
    const insertRes = await db.query(
      `INSERT INTO transcripts (user_id, original_file_name, file_path, status, duration_seconds)
       VALUES ($1, $2, $3, 'processing', 0)
       RETURNING id`,
      [user.id, originalFileName, `storage/uploads/${uniqueFileName}`]
    );

    transcriptId = insertRes.rows[0].id;
    console.log(`[AudioController] Record transcript dibuat: ${transcriptId} (status: processing)`);

    // 6. Transkripsi audio menggunakan Hugging Face Whisper
    console.log(`[AudioController] Memulai transkripsi untuk transcript: ${transcriptId}...`);
    const { text: rawText, duration_seconds: durationSeconds } = await aiService.transcribeAudio(savedFilePath);

    // Cek apakah saldo cukup untuk durasi audio yang baru diketahui
    if (user.balance < durationSeconds) {
      await db.query(
        `UPDATE transcripts SET status = 'failed', duration_seconds = $1 WHERE id = $2`,
        [durationSeconds, transcriptId]
      );
      await safeUnlink(savedFilePath);

      return reply.status(402).send({
        status: 'error',
        code: 'INSUFFICIENT_QUOTA',
        message: `Durasi audio (${durationSeconds} detik) melebihi sisa saldo kuota Anda (${user.balance} detik).`,
      });
    }

    // 7. Buat rangkuman teks menggunakan Hugging Face Mistral-7B
    console.log(`[AudioController] Memulai pembuatan rangkuman teks untuk transcript: ${transcriptId}...`);
    const { summary: summaryText, tokens_used: tokensUsed } = await aiService.summarizeText(rawText);

    // 8. Update tabel transcripts menjadi 'completed' beserta hasil AI
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

    // 9. Potong kuota pengguna di tabel users
    await db.query(
      `UPDATE users
       SET balance = GREATEST(0, balance - $1)
       WHERE id = $2`,
      [durationSeconds, user.id]
    );

    // 10. Hapus file audio fisik dari server (sesuai sequence SD-09 step 16)
    await safeUnlink(savedFilePath);

    console.log(`[AudioController] Pemrosesan selesai untuk transcript: ${transcriptId}`);

    // 11. Kembalikan response sukses 200
    return reply.status(200).send({
      status: 'success',
      data: {
        transcript_id: transcriptId,
        raw_text: rawText,
        summary_text: summaryText,
        duration_seconds: durationSeconds,
        tokens_used: tokensUsed,
      },
    });

  } catch (error) {
    console.error('[AudioController] Error saat memproses audio:', error);

    // Bersihkan file fisik jika masih ada
    await safeUnlink(savedFilePath);

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
      return reply.status(413).send({
        status: 'error',
        code: 'FILE_TOO_LARGE',
        message: 'Ukuran file melebihi batas maksimal 50MB.',
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
 * GET /api/history
 * Mengambil riwayat transkripsi audio dari database (sesuai SRS UC-11 & Sequence Diagram SD-11)
 * Query parameters:
 * - page: nomor halaman (default: 1)
 * - limit: jumlah item per halaman (default: 20 sesuai SRS UC-11 / SD-11)
 * - status: filter status ('all', 'completed', 'failed', 'processing')
 */
async function getHistory(request, reply) {
  try {
    const page = Math.max(1, parseInt(request.query?.page || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(request.query?.limit || '20', 10)));
    const offset = (page - 1) * limit;
    const filterStatus = request.query?.status?.toLowerCase();

    let whereClause = '';
    const params = [];

    // Filter status jika valid dan bukan 'all'
    if (filterStatus && ['completed', 'failed', 'processing', 'pending'].includes(filterStatus)) {
      params.push(filterStatus);
      whereClause = ` WHERE status = $${params.length}`;
    }

    // 1. Hitung total records (SD-11 langkah 3 & 4: selectTranscripts -> return(transcriptList, totalRecords))
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

module.exports = {
  processAudio,
  getHistory,
};

