/**
 * models/transcriptModel.ts - Data Access Object (DAO) untuk tabel 'transcripts'
 * Berdasarkan referensi/erd.puml
 */

import db from '../db';
import {
  TranscriptRow,
  CreateTranscriptDTO,
  UpdateCompletedDTO,
  UpdateFailedDTO,
  FindHistoryParams,
  CountHistoryParams,
} from '../types';

export class TranscriptModel {
  /**
   * Membuat rekaman transkrip baru dengan status awal
   */
  async create({
    userId,
    originalFileName,
    filePath,
    durationSeconds,
    status = 'processing',
  }: CreateTranscriptDTO): Promise<TranscriptRow> {
    const res = await db.query<TranscriptRow>(
      `INSERT INTO transcripts (user_id, original_file_name, file_path, status, duration_seconds)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, user_id, original_file_name, status, duration_seconds, created_at`,
      [userId, originalFileName, filePath, status, durationSeconds]
    );
    return res.rows[0];
  }

  /**
   * Mengambil detail transkrip berdasarkan ID dan pemilik (user_id) untuk mencegah IDOR
   */
  async findByIdAndUserId(id: string, userId: string): Promise<TranscriptRow | null> {
    const res = await db.query<TranscriptRow>(
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
   */
  async updateRawText(id: string, rawText: string): Promise<boolean> {
    const res = await db.query(
      `UPDATE transcripts
       SET raw_text = $1
       WHERE id = $2`,
      [rawText, id]
    );
    return (res.rowCount ?? 0) > 0;
  }

  /**
   * Memperbarui transkrip menjadi 'completed' beserta hasil rangkuman
   */
  async updateCompleted(
    id: string,
    { rawText, summaryText, durationSeconds, tokensUsed = 0 }: UpdateCompletedDTO
  ): Promise<boolean> {
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
    return (res.rowCount ?? 0) > 0;
  }

  /**
   * Memperbarui status transkrip menjadi 'failed' dengan catatan error
   */
  async updateFailed(
    id: string,
    { summaryText = null, rawText = null }: UpdateFailedDTO
  ): Promise<boolean> {
    let sql = `UPDATE transcripts SET status = 'failed'`;
    const params: any[] = [];

    if (summaryText !== null) {
      params.push(summaryText);
      sql += `, summary_text = $${params.length}`;
    }
    if (rawText !== null) {
      params.push(rawText);
      sql += `, raw_text = $${params.length}`;
    }

    params.push(id);
    sql += ` WHERE id = $${params.length}`;

    const res = await db.query(sql, params);
    return (res.rowCount ?? 0) > 0;
  }

  /**
   * Menghitung total riwayat pengguna dengan filter status opsional (SD-11)
   */
  async countHistory({ userId, status = null }: CountHistoryParams): Promise<number> {
    let whereClause = ' WHERE user_id = $1';
    const params: any[] = [userId];

    if (status && ['completed', 'failed', 'processing', 'pending'].includes(status)) {
      params.push(status);
      whereClause += ` AND status = $${params.length}`;
    }

    const res = await db.query<{ total: string }>(
      `SELECT COUNT(*) AS total FROM transcripts${whereClause}`,
      params
    );
    return parseInt(res.rows[0]?.total || '0', 10);
  }

  /**
   * Mengambil daftar riwayat dengan pagination dan filter status (SD-11)
   */
  async findHistory({
    userId,
    status = null,
    limit = 20,
    offset = 0,
  }: FindHistoryParams): Promise<TranscriptRow[]> {
    let whereClause = ' WHERE user_id = $1';
    const params: any[] = [userId];

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

    const res = await db.query<TranscriptRow>(dataQuery, dataParams);
    return res.rows.map((row) => ({
      ...row,
      word_count: row.raw_text
        ? row.raw_text.trim().split(/\s+/).filter(Boolean).length
        : 0,
    }));
  }

  /**
   * Membersihkan status transkrip 'processing' yang menggantung saat server restart/crash (CR-19, TC-TRS-010)
   */
  async cleanupHangingProcessing(): Promise<number> {
    const res = await db.query(
      `UPDATE transcripts
       SET status = 'failed'
       WHERE status = 'processing'`
    );
    return res.rowCount ?? 0;
  }
}

export const transcriptModel = new TranscriptModel();
export default transcriptModel;

