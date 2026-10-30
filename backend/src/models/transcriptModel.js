'use strict';

/**
 * models/transcriptModel.js - Data Access Object (DAO) untuk tabel 'transcripts'
 * Berdasarkan referensi/erd.puml
 */

const db = require('../db');

class TranscriptModel {
  /**
   * Membuat rekaman transkrip baru dengan status awal
   * @param {Object} param0
   * @returns {Promise<Object>}
   */
  async create({ userId, originalFileName, filePath, durationSeconds, status = 'processing' }) {
    const res = await db.query(
      `INSERT INTO transcripts (user_id, original_file_name, file_path, status, duration_seconds)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, user_id, original_file_name, status, duration_seconds, created_at`,
      [userId, originalFileName, filePath, status, durationSeconds]
    );
    return res.rows[0];
  }

  /**
   * Mengambil detail transkrip berdasarkan ID dan pemilik (user_id) untuk mencegah IDOR
   * @param {string} id
   * @param {string} userId
   * @returns {Promise<Object|null>}
   */
  async findByIdAndUserId(id, userId) {
    const res = await db.query(
      `SELECT id, original_file_name, status, raw_text, summary_text,
              duration_seconds, tokens_used, created_at, updated_at
       FROM transcripts
       WHERE id = $1 AND user_id = $2
       LIMIT 1`,
      [id, userId]
    );
    return res.rows[0] || null;
  }

  /**
   * Menyimpan raw_text segera setelah Whisper selesai (CR-08)
   * @param {string} id
   * @param {string} rawText
   * @returns {Promise<boolean>}
   */
  async updateRawText(id, rawText) {
    const res = await db.query(
      `UPDATE transcripts
       SET raw_text = $1
       WHERE id = $2`,
      [rawText, id]
    );
    return res.rowCount > 0;
  }

  /**
   * Memperbarui transkrip menjadi 'completed' beserta hasil rangkuman
   * @param {string} id
   * @param {Object} param1
   * @returns {Promise<boolean>}
   */
  async updateCompleted(id, { rawText, summaryText, durationSeconds, tokensUsed = 0 }) {
    const res = await db.query(
      `UPDATE transcripts
       SET raw_text = $1,
           summary_text = $2,
           duration_seconds = $3,
           tokens_used = $4,
           status = 'completed'
       WHERE id = $5`,
      [rawText, summaryText, durationSeconds, tokensUsed, id]
    );
    return res.rowCount > 0;
  }

  /**
   * Memperbarui status transkrip menjadi 'failed' dengan catatan error
   * @param {string} id
   * @param {Object} param1
   * @returns {Promise<boolean>}
   */
  async updateFailed(id, { summaryText = null, rawText = null }) {
    let query = `UPDATE transcripts SET status = 'failed'`;
    const params = [];

    if (summaryText !== null) {
      params.push(summaryText);
      query += `, summary_text = $${params.length}`;
    }
    if (rawText !== null) {
      params.push(rawText);
      query += `, raw_text = $${params.length}`;
    }

    params.push(id);
    query += ` WHERE id = $${params.length}`;

    const res = await db.query(query, params);
    return res.rowCount > 0;
  }

  /**
   * Menghitung total riwayat pengguna dengan filter status opsional (SD-11)
   * @param {Object} param0
   * @returns {Promise<number>}
   */
  async countHistory({ userId, status = null }) {
    let whereClause = ' WHERE user_id = $1';
    const params = [userId];

    if (status && ['completed', 'failed', 'processing', 'pending'].includes(status)) {
      params.push(status);
      whereClause += ` AND status = $${params.length}`;
    }

    const res = await db.query(`SELECT COUNT(*) AS total FROM transcripts${whereClause}`, params);
    return parseInt(res.rows[0]?.total || '0', 10);
  }

  /**
   * Mengambil daftar riwayat dengan pagination dan filter status (SD-11)
   * @param {Object} param0
   * @returns {Promise<Array>}
   */
  async findHistory({ userId, status = null, limit = 20, offset = 0 }) {
    let whereClause = ' WHERE user_id = $1';
    const params = [userId];

    if (status && ['completed', 'failed', 'processing', 'pending'].includes(status)) {
      params.push(status);
      whereClause += ` AND status = $${params.length}`;
    }

    const dataParams = [...params, limit, offset];
    const dataQuery = `
      SELECT id, original_file_name, status, raw_text, summary_text,
             duration_seconds, tokens_used, created_at, updated_at
      FROM transcripts
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}
    `;

    const res = await db.query(dataQuery, dataParams);
    return res.rows.map((row) => ({
      ...row,
      word_count: row.raw_text
        ? row.raw_text.trim().split(/\s+/).filter(Boolean).length
        : 0,
    }));
  }

  /**
   * Membersihkan status transkrip 'processing' yang menggantung saat server restart/crash (CR-19, TC-TRS-010)
   * @returns {Promise<number>} Jumlah baris yang diperbarui
   */
  async cleanupHangingProcessing() {
    const res = await db.query(
      `UPDATE transcripts
       SET status = 'failed'
       WHERE status = 'processing'`
    );
    return res.rowCount;
  }
}

module.exports = new TranscriptModel();
