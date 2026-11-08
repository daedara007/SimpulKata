import apiClient from '../services/apiClient';
import type { AxiosResponse } from 'axios';
import type {
  ProcessAudioResponse,
  HistoryResponse,
  HistoryFilter,
  TranscriptItem,
  ChunkUploadProgress,
  InitUploadResponse,
} from '../types';

/**
 * models/audioModel.ts - Model Data & Klien API Pemrosesan Audio & Riwayat
 *
 * Mengimplementasikan pemanggilan API:
 * - POST /api/upload/init (Inisiasi sesi chunked upload)
 * - POST /api/upload/chunk (Unggah kepingan 5MB)
 * - POST /api/upload/complete (Gabungkan kepingan & mulai transkripsi)
 * - POST /api/upload/abort (Batalkan sesi upload)
 * - POST /api/process-audio (Metode legacy single-request fallback)
 * - GET  /api/transcripts/:id (Polling status transkrip)
 * - GET  /api/history (Riwayat dengan pagination & filter)
 */

export interface UploadAudioOptions {
  sync?: boolean;
}

export interface ChunkUploadOptions {
  chunkSize?: number; // Default: 5MB (5 * 1024 * 1024 bytes)
  sync?: boolean;
  onProgress?: (progress: ChunkUploadProgress) => void;
  signal?: AbortSignal;
}

export const audioModel = {
  /**
   * Mengunggah berkas audio menggunakan mekanisme Chunked Upload (5MB per request)
   * Kebal batas 100MB Cloudflare Edge & aman dari OOM crash pada peramban mobile.
   */
  async uploadAudioChunked(
    audioFile: File,
    options: ChunkUploadOptions = {}
  ): Promise<AxiosResponse<ProcessAudioResponse>> {
    const chunkSize = options.chunkSize || 5 * 1024 * 1024; // 5MB
    const totalChunks = Math.max(1, Math.ceil(audioFile.size / chunkSize));
    let uploadId = '';

    try {
      // 1. Inisiasi sesi upload di server
      const initRes = await apiClient.post<InitUploadResponse>('/api/upload/init', {
        fileName: audioFile.name,
        fileSize: audioFile.size,
        totalChunks,
      });

      uploadId = initRes.data.data.uploadId;

      // 2. Unggah berkas kepingan demi kepingan secara berurutan
      let loadedBytes = 0;
      for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, audioFile.size);
        const chunkBlob = audioFile.slice(start, end);

        const formData = new FormData();
        formData.append('chunk', chunkBlob, `chunk-${i}.part`);

        await apiClient.post(
          `/api/upload/chunk?uploadId=${encodeURIComponent(uploadId)}&chunkIndex=${i}`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              'x-upload-id': uploadId,
              'x-chunk-index': String(i),
              'x-total-chunks': String(totalChunks),
            },
            signal: options.signal,
          }
        );

        loadedBytes = end;
        const percent = Math.min(100, Math.round((loadedBytes / audioFile.size) * 100));

        if (options.onProgress) {
          options.onProgress({
            percent,
            loadedBytes,
            totalBytes: audioFile.size,
            currentChunk: i + 1,
            totalChunks,
            phase: 'uploading',
          });
        }
      }

      // 3. Beri sinyal penyatuan kepingan di antarmuka
      if (options.onProgress) {
        options.onProgress({
          percent: 100,
          loadedBytes: audioFile.size,
          totalBytes: audioFile.size,
          currentChunk: totalChunks,
          totalChunks,
          phase: 'assembling',
        });
      }

      // 4. Selesaikan upload & picu pipeline AI di server
      const query = options.sync ? '?sync=true' : '';
      const completeRes = await apiClient.post<ProcessAudioResponse>(
        `/api/upload/complete${query}`,
        { uploadId },
        { signal: options.signal }
      );

      return completeRes;
    } catch (err) {
      if (uploadId) {
        // Bersihkan kepingan di server jika gagal di tengah jalan
        apiClient.post('/api/upload/abort', { uploadId }).catch(() => {});
      }
      throw err;
    }
  },

  /**
   * Mengunggah berkas audio secara utuh (Metode fallback)
   */
  async uploadAudio(
    audioFile: File,
    options: UploadAudioOptions = {}
  ): Promise<AxiosResponse<ProcessAudioResponse>> {
    const formData = new FormData();
    formData.append('audio', audioFile);

    const query = options.sync ? '?sync=true' : '';
    return apiClient.post<ProcessAudioResponse>(`/api/process-audio${query}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  /**
   * Mengambil status terkini transkrip berdasarkan ID (untuk polling)
   */
  async getTranscriptStatus(transcriptId: string): Promise<{ status: string; data: TranscriptItem }> {
    const response = await apiClient.get<{ status: string; data: TranscriptItem }>(
      `/api/transcripts/${transcriptId}`
    );
    return response.data;
  },

  /**
   * Mengambil daftar riwayat transkripsi pengguna dengan filter status & pagination
   */
  async getHistory({ page = 1, limit = 20, status }: HistoryFilter = {}): Promise<HistoryResponse> {
    const params: Record<string, any> = { page, limit };
    if (status && status !== 'all') {
      params.status = status;
    }
    const response = await apiClient.get<HistoryResponse>('/api/history', { params });
    return response.data;
  },

  /**
   * Menghapus rekaman riwayat transkripsi berdasarkan ID (SRS UC-12, Sequence SD-12)
   */
  async deleteHistory(transcriptId: string): Promise<{ status: string; message: string; data?: { id: string } }> {
    const response = await apiClient.delete<{ status: string; message: string; data?: { id: string } }>(
      `/api/history/${transcriptId}`
    );
    return response.data;
  },
};

export default audioModel;

