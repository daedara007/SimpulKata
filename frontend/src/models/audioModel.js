import apiClient from '../services/apiClient';

/**
 * models/audioModel.js - Model Data & Klien API Pemrosesan Audio & Riwayat
 *
 * Mengimplementasikan pemanggilan API:
 * - POST /api/process-audio (Unggah & inisiasi transkripsi/rangkuman asinkron)
 * - GET  /api/transcripts/:id (Polling status transkrip)
 * - GET  /api/history (Riwayat dengan pagination & filter)
 */

export const audioModel = {
  /**
   * Mengunggah berkas audio ke server untuk diproses
   * @param {File} audioFile
   * @param {Object} options { sync: boolean }
   * @returns {Promise<Object>} Axios Response
   */
  async uploadAudio(audioFile, options = {}) {
    const formData = new FormData();
    formData.append('audio', audioFile);

    const query = options.sync ? '?sync=true' : '';
    return apiClient.post(`/api/process-audio${query}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  /**
   * Mengambil status terkini transkrip berdasarkan ID (untuk polling)
   * @param {string} transcriptId
   * @returns {Promise<Object>}
   */
  async getTranscriptStatus(transcriptId) {
    const response = await apiClient.get(`/api/transcripts/${transcriptId}`);
    return response.data;
  },

  /**
   * Mengambil daftar riwayat transkripsi pengguna dengan filter status & pagination
   * @param {Object} params { page, limit, status }
   * @returns {Promise<Object>}
   */
  async getHistory({ page = 1, limit = 20, status = null } = {}) {
    const params = { page, limit };
    if (status && status !== 'all') {
      params.status = status;
    }
    const response = await apiClient.get('/api/history', { params });
    return response.data;
  },
};

export default audioModel;
