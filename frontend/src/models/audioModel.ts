import apiClient from '../services/apiClient';
import type { AxiosResponse } from 'axios';
import type {
  ProcessAudioResponse,
  HistoryResponse,
  HistoryFilter,
  TranscriptItem,
} from '../types';

/**
 * models/audioModel.ts - Model Data & Klien API Pemrosesan Audio & Riwayat
 *
 * Mengimplementasikan pemanggilan API:
 * - POST /api/process-audio (Unggah & inisiasi transkripsi/rangkuman asinkron)
 * - GET  /api/transcripts/:id (Polling status transkrip)
 * - GET  /api/history (Riwayat dengan pagination & filter)
 */

export interface UploadAudioOptions {
  sync?: boolean;
}

export const audioModel = {
  /**
   * Mengunggah berkas audio ke server untuk diproses
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
};

export default audioModel;

