/**
 * controllers/uploadController.ts - Controller Chunked Audio Upload (Bypass Limit 100MB Cloudflare)
 *
 * Mengimplementasikan:
 * - POST /api/upload/init     : Inisiasi sesi upload, validasi nama/ekstensi/ukuran (maks 200MB)
 * - POST /api/upload/chunk    : Menerima 1 kepingan chunk binary (5MB) dan simpan ke folder sesi
 * - POST /api/upload/complete : Menggabungkan kepingan chunk menjadi berkas utuh, validasi durasi & kuota, picu AI pipeline
 * - POST /api/upload/abort    : Membatalkan sesi dan membersihkan kepingan chunk sementara
 *
 * Referensi: SRS UC-07, SDD Bab 6, Aturan 1 (Relative URL), Aturan 2 (Quota Pre-check), Aturan 3 (Cleanup)
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';
import { userModel, transcriptModel } from '../models';
import aiService from '../services/aiService';
import { safeUnlink, runTranscriptionPipeline } from './audioController';

// Batasan konfigurasi upload
const ALLOWED_EXTENSIONS = new Set(['.mp3', '.wav', '.m4a', '.webm', '.ogg']);
const MAX_TOTAL_SIZE = 200 * 1024 * 1024; // 200MB
const MAX_CHUNKS = 200; // Maksimal kepingan (untuk 200MB dengan chunk 5MB = 40 keping)

// Direktori penyimpanan berkas sementara
const UPLOAD_DIR = path.resolve(__dirname, '../../storage/uploads');
const CHUNKS_DIR = path.resolve(__dirname, '../../storage/uploads/chunks');

export interface UploadSessionMeta {
  uploadId: string;
  userId: string;
  fileName: string;
  fileSize: number;
  totalChunks: number;
  createdAt: number;
}

/**
 * Pembersih direktori chunk yang kedaluwarsa atau menggantung (Garbage Collector)
 */
export async function cleanupExpiredChunks(maxAgeMs = 2 * 60 * 60 * 1000): Promise<number> {
  let cleanedCount = 0;
  try {
    if (!fs.existsSync(CHUNKS_DIR)) return 0;
    const entries = await fs.promises.readdir(CHUNKS_DIR, { withFileTypes: true });
    const now = Date.now();

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const dirPath = path.join(CHUNKS_DIR, entry.name);
        try {
          const stats = await fs.promises.stat(dirPath);
          if (now - stats.mtimeMs > maxAgeMs) {
            await fs.promises.rm(dirPath, { recursive: true, force: true });
            cleanedCount++;
          }
        } catch {
          // Abaikan kesalahan pembacaan direktori tunggal
        }
      }
    }
  } catch (err: any) {
    console.warn('[UploadController] Gagal membersihkan folder chunk kedaluwarsa:', err.message);
  }
  return cleanedCount;
}

export class UploadController {
  /**
   * POST /api/upload/init
   * Menginisialisasi sesi chunked upload
   */
  async initUpload(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = request.user?.id;
      if (!userId) {
        return reply.status(401).send({
          status: 'error',
          code: 'UNAUTHORIZED',
          message: 'Akses tidak sah. Silakan login terlebih dahulu.',
        });
      }

      const body = (request.body || {}) as {
        fileName?: string;
        fileSize?: number;
        totalChunks?: number;
      };

      const { fileName, fileSize, totalChunks } = body;

      if (!fileName || typeof fileName !== 'string') {
        return reply.status(400).send({
          status: 'error',
          code: 'INVALID_FILENAME',
          message: 'Nama berkas wajib disertakan.',
        });
      }

      const ext = path.extname(fileName).toLowerCase();
      if (!ALLOWED_EXTENSIONS.has(ext)) {
        return reply.status(400).send({
          status: 'error',
          code: 'INVALID_FORMAT',
          message: `Format file '${ext}' tidak didukung. Gunakan format .mp3, .wav, .m4a, .webm, atau .ogg.`,
        });
      }

      if (typeof fileSize !== 'number' || fileSize <= 0 || fileSize > MAX_TOTAL_SIZE) {
        return reply.status(400).send({
          status: 'error',
          code: 'INVALID_FILE_SIZE',
          message: 'Ukuran berkas tidak valid atau melebihi batas maksimal 200MB.',
        });
      }

      if (typeof totalChunks !== 'number' || totalChunks <= 0 || totalChunks > MAX_CHUNKS) {
        return reply.status(400).send({
          status: 'error',
          code: 'INVALID_TOTAL_CHUNKS',
          message: 'Jumlah kepingan chunk tidak valid.',
        });
      }

      // Validasi kuota pengguna di awal
      const user = await userModel.findById(userId);
      if (!user) {
        return reply.status(404).send({
          status: 'error',
          code: 'USER_NOT_FOUND',
          message: 'Pengguna tidak ditemukan.',
        });
      }

      if (user.balance <= 0) {
        return reply.status(402).send({
          status: 'error',
          code: 'INSUFFICIENT_QUOTA',
          message: 'Saldo kuota Anda telah habis. Silakan hubungi admin untuk top up.',
        });
      }

      // Buat folder chunk untuk sesi ini
      const uploadId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const sessionDir = path.join(CHUNKS_DIR, uploadId);
      await fs.promises.mkdir(sessionDir, { recursive: true });

      const meta: UploadSessionMeta = {
        uploadId,
        userId,
        fileName,
        fileSize,
        totalChunks,
        createdAt: Date.now(),
      };

      await fs.promises.writeFile(path.join(sessionDir, 'meta.json'), JSON.stringify(meta), 'utf-8');

      console.log(`[UploadController] Sesi chunked upload diinisiasi: ${uploadId} (${fileName}, ${fileSize} bytes, ${totalChunks} chunks)`);

      return reply.status(200).send({
        status: 'success',
        data: {
          uploadId,
          chunkSize: 5 * 1024 * 1024, // 5MB
          totalChunks,
        },
      });
    } catch (error: any) {
      console.error('[UploadController] Inisiasi upload gagal:', error);
      return reply.status(500).send({
        status: 'error',
        code: 'INIT_UPLOAD_ERROR',
        message: 'Gagal menginisiasi sesi unggah berkas.',
      });
    }
  }

  /**
   * POST /api/upload/chunk
   * Menerima satu kepingan berkas audio
   */
  async uploadChunk(request: FastifyRequest, reply: FastifyReply) {
    let chunkFilePath: string | null = null;

    try {
      const userId = request.user?.id;
      if (!userId) {
        return reply.status(401).send({
          status: 'error',
          code: 'UNAUTHORIZED',
          message: 'Akses tidak sah.',
        });
      }

      // Ambil metadata chunk dari headers atau query params untuk keandalan maksimal
      const uploadId =
        (request.query as any)?.uploadId ||
        (request.headers['x-upload-id'] as string);

      const rawChunkIndex =
        (request.query as any)?.chunkIndex ??
        (request.headers['x-chunk-index'] as string);

      if (!uploadId || typeof uploadId !== 'string') {
        return reply.status(400).send({
          status: 'error',
          code: 'MISSING_UPLOAD_ID',
          message: 'Upload ID tidak ditemukan.',
        });
      }

      const chunkIndex = parseInt(rawChunkIndex, 10);
      if (Number.isNaN(chunkIndex) || chunkIndex < 0) {
        return reply.status(400).send({
          status: 'error',
          code: 'INVALID_CHUNK_INDEX',
          message: 'Indeks kepingan chunk tidak valid.',
        });
      }

      const sessionDir = path.join(CHUNKS_DIR, uploadId);
      const metaPath = path.join(sessionDir, 'meta.json');

      if (!fs.existsSync(metaPath)) {
        return reply.status(404).send({
          status: 'error',
          code: 'SESSION_NOT_FOUND',
          message: 'Sesi unggahan tidak ditemukan atau telah kedaluwarsa.',
        });
      }

      const meta: UploadSessionMeta = JSON.parse(await fs.promises.readFile(metaPath, 'utf-8'));
      if (meta.userId !== userId) {
        return reply.status(403).send({
          status: 'error',
          code: 'FORBIDDEN',
          message: 'Akses ditolak untuk sesi unggahan ini.',
        });
      }

      if (chunkIndex >= meta.totalChunks) {
        return reply.status(400).send({
          status: 'error',
          code: 'CHUNK_OUT_OF_BOUNDS',
          message: `Indeks kepingan ${chunkIndex} melebihi total kepingan ${meta.totalChunks}.`,
        });
      }

      // Ambil berkas binary multipart
      const part = await request.file();
      if (!part) {
        return reply.status(400).send({
          status: 'error',
          code: 'MISSING_FILE_PART',
          message: 'Data kepingan chunk tidak ditemukan.',
        });
      }

      chunkFilePath = path.join(sessionDir, `chunk-${chunkIndex}.part`);
      await pipeline(part.file, fs.createWriteStream(chunkFilePath));

      const stat = await fs.promises.stat(chunkFilePath);
      if (stat.size === 0) {
        await safeUnlink(chunkFilePath);
        return reply.status(400).send({
          status: 'error',
          code: 'EMPTY_CHUNK',
          message: `Kepingan chunk ke-${chunkIndex} kosong (0 bytes).`,
        });
      }

      return reply.status(200).send({
        status: 'success',
        message: `Kepingan ${chunkIndex + 1}/${meta.totalChunks} berhasil diterima.`,
        data: {
          uploadId,
          chunkIndex,
          bytesReceived: stat.size,
        },
      });
    } catch (error: any) {
      console.error('[UploadController] Gagal menerima chunk:', error);
      if (chunkFilePath) {
        await safeUnlink(chunkFilePath);
      }
      return reply.status(500).send({
        status: 'error',
        code: 'CHUNK_UPLOAD_ERROR',
        message: error.message || 'Gagal menyimpan potongan berkas ke server.',
      });
    }
  }

  /**
   * POST /api/upload/complete
   * Menggabungkan seluruh kepingan chunk menjadi satu berkas utuh,
   * lalu memicu AI pipeline (pre-check durasi, reservasi kuota, transkripsi Whisper & LLM)
   */
  async completeUpload(request: FastifyRequest, reply: FastifyReply) {
    let targetFilePath: string | null = null;
    let transcriptId: string | null = null;
    let durationSeconds = 0;
    let userId: string | null = null;
    let isQuotaReserved = false;

    try {
      userId = request.user?.id || null;
      if (!userId) {
        return reply.status(401).send({
          status: 'error',
          code: 'UNAUTHORIZED',
          message: 'Akses tidak sah.',
        });
      }

      const body = (request.body || {}) as { uploadId?: string };
      const uploadId = body.uploadId;

      if (!uploadId || typeof uploadId !== 'string') {
        return reply.status(400).send({
          status: 'error',
          code: 'MISSING_UPLOAD_ID',
          message: 'Upload ID wajib disertakan.',
        });
      }

      const sessionDir = path.join(CHUNKS_DIR, uploadId);
      const metaPath = path.join(sessionDir, 'meta.json');

      if (!fs.existsSync(metaPath)) {
        return reply.status(404).send({
          status: 'error',
          code: 'SESSION_NOT_FOUND',
          message: 'Sesi unggahan tidak ditemukan atau telah kedaluwarsa.',
        });
      }

      const meta: UploadSessionMeta = JSON.parse(await fs.promises.readFile(metaPath, 'utf-8'));
      if (meta.userId !== userId) {
        return reply.status(403).send({
          status: 'error',
          code: 'FORBIDDEN',
          message: 'Akses ditolak untuk sesi unggahan ini.',
        });
      }

      // 1. Verifikasi kelengkapan seluruh kepingan chunk
      for (let i = 0; i < meta.totalChunks; i++) {
        const chunkPath = path.join(sessionDir, `chunk-${i}.part`);
        if (!fs.existsSync(chunkPath)) {
          return reply.status(400).send({
            status: 'error',
            code: 'INCOMPLETE_CHUNKS',
            message: `Kepingan ke-${i + 1} dari ${meta.totalChunks} hilang. Silakan unggah ulang berkas.`,
          });
        }
      }

      // 2. Gabungkan potongan chunk secara streaming menjadi berkas utuh di UPLOAD_DIR
      await fs.promises.mkdir(UPLOAD_DIR, { recursive: true });
      const ext = path.extname(meta.fileName).toLowerCase() || '.mp3';
      const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}${ext}`;
      targetFilePath = path.join(UPLOAD_DIR, uniqueFileName);

      console.log(`[UploadController] Merangkai ${meta.totalChunks} kepingan untuk ${meta.fileName} -> ${uniqueFileName}...`);

      const writeStream = fs.createWriteStream(targetFilePath, { flags: 'w' });

      for (let i = 0; i < meta.totalChunks; i++) {
        const chunkPath = path.join(sessionDir, `chunk-${i}.part`);
        await new Promise<void>((resolve, reject) => {
          const readStream = fs.createReadStream(chunkPath);
          readStream.on('error', reject);
          readStream.on('end', () => resolve());
          readStream.pipe(writeStream, { end: false });
        });
      }

      writeStream.end();
      await new Promise<void>((resolve, reject) => {
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      });

      // 3. Bersihkan direktori kepingan chunk sementara
      await fs.promises.rm(sessionDir, { recursive: true, force: true }).catch(() => {});
      console.log(`[UploadController] Sesi ${uploadId} selesai dirangkai & folder chunk dibersihkan.`);

      // 4. Validasi berkas gabungan
      const fileStats = await fs.promises.stat(targetFilePath);
      if (fileStats.size === 0) {
        await safeUnlink(targetFilePath);
        return reply.status(400).send({
          status: 'error',
          code: 'EMPTY_FILE',
          message: 'Berkas hasil penggabungan kosong. Silakan unggah kembali berkas audio Anda.',
        });
      }

      // 5. Cek data user dan saldo kuota
      const user = await userModel.findById(userId);
      if (!user) {
        await safeUnlink(targetFilePath);
        return reply.status(404).send({
          status: 'error',
          code: 'USER_NOT_FOUND',
          message: 'Data pengguna tidak ditemukan.',
        });
      }

      if (user.balance <= 0) {
        await safeUnlink(targetFilePath);
        return reply.status(402).send({
          status: 'error',
          code: 'INSUFFICIENT_QUOTA',
          message: 'Kuota pemrosesan Anda telah habis. Silakan hubungi admin untuk top up.',
        });
      }

      // 6. Pre-check durasi audio lokal sebelum panggil AI (Rule 2)
      try {
        durationSeconds = await aiService.getAudioDuration(targetFilePath);
      } catch (durErr: any) {
        await safeUnlink(targetFilePath);
        return reply.status(400).send({
          status: 'error',
          code: 'INVALID_AUDIO_FILE',
          message: 'Berkas audio tidak dapat dibaca atau rusak. Pastikan berkas merupakan format audio yang valid.',
        });
      }

      if (!durationSeconds || durationSeconds <= 0) {
        await safeUnlink(targetFilePath);
        return reply.status(400).send({
          status: 'error',
          code: 'INVALID_AUDIO_FILE',
          message: 'Berkas audio tidak valid, rusak, atau durasinya tidak dapat ditentukan (0 detik).',
        });
      }

      console.log(`[UploadController] Durasi terdeteksi: ${durationSeconds}s (Saldo user: ${user.balance}s)`);

      // 7. Reservasi kuota secara atomik
      const remainingBalance = await userModel.reserveBalance(user.id, durationSeconds);
      if (remainingBalance === null) {
        await safeUnlink(targetFilePath);
        const currentBalance = await userModel.getBalance(user.id);
        return reply.status(402).send({
          status: 'error',
          code: 'INSUFFICIENT_QUOTA',
          message: `Durasi audio (${durationSeconds} detik) melebihi sisa saldo kuota Anda (${currentBalance} detik). Silakan hubungi admin atau top up kuota.`,
        });
      }

      isQuotaReserved = true;
      console.log(`[UploadController] Kuota direservasi: -${durationSeconds}s (Sisa: ${remainingBalance}s)`);

      // 8. Buat entri transcript di database
      const newTranscript = await transcriptModel.create({
        userId: user.id,
        originalFileName: meta.fileName,
        filePath: `storage/uploads/${uniqueFileName}`,
        durationSeconds,
        status: 'processing',
      });

      transcriptId = newTranscript.id;

      const isSync = (request.query as { sync?: string } | undefined)?.sync === 'true';

      if (isSync) {
        // Mode Sinkron (jika diminta)
        const pipelineResult = await runTranscriptionPipeline({
          transcriptId,
          savedFilePath: targetFilePath,
          durationSeconds,
          userId,
        });

        return reply.status(200).send({
          status: 'success',
          data: pipelineResult,
        });
      }

      // Mode Asinkron Default (Status 202 Accepted)
      isQuotaReserved = false;

      reply.status(202).send({
        status: 'processing',
        message: 'Audio berhasil dirangkai dan sedang diproses di antrean latar belakang.',
        data: {
          transcript_id: transcriptId,
          status: 'processing',
          duration_seconds: durationSeconds,
        },
      });

      // Jalankan transkripsi Whisper & LLM di latar belakang
      runTranscriptionPipeline({
        transcriptId,
        savedFilePath: targetFilePath,
        durationSeconds,
        userId,
      }).catch((bgErr: any) => {
        console.error(`[UploadController] Background pipeline gagal untuk ${transcriptId}:`, bgErr.message);
      });

    } catch (error: any) {
      console.error('[UploadController] Error saat menyelesaikan upload:', error);

      if (targetFilePath) {
        await safeUnlink(targetFilePath);
      }

      if (isQuotaReserved && userId && durationSeconds > 0) {
        try {
          await userModel.refundBalance(userId, durationSeconds);
          console.log(`[UploadController] Mengembalikan kuota ${durationSeconds}s ke user ${userId} karena complete gagal`);
        } catch (refundErr: any) {
          console.error('[UploadController] Gagal mengembalikan kuota:', refundErr.message);
        }
      }

      if (transcriptId) {
        try {
          await transcriptModel.updateFailed(transcriptId, {
            summaryText: `Gagal memproses audio: ${error.message || 'Kesalahan sistem saat penggabungan berkas'}`,
          });
        } catch (dbErr: any) {
          console.error('[UploadController] Gagal update status failed:', dbErr.message);
        }
      }

      return reply.status(500).send({
        status: 'error',
        code: error.code || 'COMPLETE_UPLOAD_ERROR',
        message: error.message || 'Terjadi kesalahan pada server saat merangkai berkas audio.',
      });
    }
  }

  /**
   * POST /api/upload/abort
   * Membatalkan sesi upload dan menghapus kepingan chunk yang terlanjur terkirim
   */
  async abortUpload(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = request.user?.id;
      const body = (request.body || {}) as { uploadId?: string };
      const uploadId = body.uploadId;

      if (!uploadId || typeof uploadId !== 'string') {
        return reply.status(400).send({
          status: 'error',
          code: 'INVALID_UPLOAD_ID',
          message: 'Upload ID tidak valid.',
        });
      }

      const sessionDir = path.join(CHUNKS_DIR, uploadId);
      const metaPath = path.join(sessionDir, 'meta.json');

      if (fs.existsSync(metaPath)) {
        try {
          const meta = JSON.parse(await fs.promises.readFile(metaPath, 'utf-8'));
          if (meta.userId !== userId) {
            return reply.status(403).send({
              status: 'error',
              code: 'FORBIDDEN',
              message: 'Akses ditolak untuk sesi unggahan ini.',
            });
          }
        } catch {
          // Abaikan kesalahan pembacaan meta
        }
      }

      if (fs.existsSync(sessionDir)) {
        await fs.promises.rm(sessionDir, { recursive: true, force: true }).catch(() => {});
      }

      console.log(`[UploadController] Sesi upload ${uploadId} berhasil dibatalkan dan dibersihkan.`);

      return reply.status(200).send({
        status: 'success',
        message: 'Sesi unggahan berhasil dibatalkan.',
      });
    } catch (error: any) {
      console.error('[UploadController] Gagal membatalkan upload:', error);
      return reply.status(500).send({
        status: 'error',
        code: 'ABORT_UPLOAD_ERROR',
        message: 'Gagal membatalkan sesi unggahan.',
      });
    }
  }
}

export const uploadController = new UploadController();
export default uploadController;

