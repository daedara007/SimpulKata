/**
 * models/otpModel.ts - Data Access Object (DAO) untuk tabel 'otp_requests'
 * Berdasarkan referensi/erd.puml dan SD-01
 */

import db from '../db';
import {
  OtpRequestRow,
  CreateOtpDTO,
  FindOtpDTO,
  OtpCooldownResult,
} from '../types';

export class OtpModel {
  /**
   * Membuat rekaman kode OTP baru dengan batas kedaluwarsa
   */
  async create({
    userId,
    otpCode,
    context = 'registration',
    minutesValid = 5,
  }: CreateOtpDTO): Promise<OtpRequestRow> {
    const res = await db.query<OtpRequestRow>(
      `INSERT INTO otp_requests (user_id, otp_code, context, expires_at)
       VALUES ($1, $2, $3, NOW() + ($4 || ' minutes')::INTERVAL)
       RETURNING id, user_id, otp_code, context, expires_at, is_used, created_at`,
      [userId, otpCode, context, minutesValid]
    );
    return res.rows[0];
  }

  /**
   * Mencari OTP aktif yang cocok dan belum kadaluwarsa (SD-01 Langkah 22)
   */
  async findLatestValid({
    userId,
    otpCode,
    context = 'registration',
  }: FindOtpDTO): Promise<OtpRequestRow | null> {
    const res = await db.query<OtpRequestRow>(
      `SELECT id, user_id, otp_code, context, expires_at, is_used, created_at
       FROM otp_requests
       WHERE user_id = $1
         AND otp_code = $2
         AND context = $3
         AND is_used = FALSE
         AND expires_at > NOW()
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId, otpCode, context]
    );
    return res.rows[0] || null;
  }

  /**
   * Menandai OTP telah digunakan (SD-01 Langkah 24)
   */
  async markAsUsed(id: string): Promise<boolean> {
    const res = await db.query(
      `UPDATE otp_requests
       SET is_used = TRUE
       WHERE id = $1`,
      [id]
    );
    return (res.rowCount ?? 0) > 0;
  }

  /**
   * Menghanguskan OTP lama saat meminta OTP baru
   */
  async invalidatePrevious(userId: string, context: string = 'registration'): Promise<number> {
    const res = await db.query(
      `UPDATE otp_requests
       SET is_used = TRUE
       WHERE user_id = $1 AND context = $2 AND is_used = FALSE`,
      [userId, context]
    );
    return res.rowCount ?? 0;
  }

  /**
   * Memeriksa jeda cooldown kirim ulang OTP (mencegah spamming email)
   */
  async getCooldown(
    userId: string,
    context: string = 'registration',
    cooldownSeconds: number = 60
  ): Promise<OtpCooldownResult> {
    const res = await db.query<{ elapsed_seconds: string }>(
      `SELECT EXTRACT(EPOCH FROM (NOW() - created_at)) AS elapsed_seconds
       FROM otp_requests
       WHERE user_id = $1 AND context = $2
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId, context]
    );

    if (res.rows.length === 0) {
      return { onCooldown: false, remainingSeconds: 0 };
    }

    const elapsed = parseFloat(res.rows[0].elapsed_seconds || '999');
    if (elapsed < cooldownSeconds) {
      return {
        onCooldown: true,
        remainingSeconds: Math.ceil(cooldownSeconds - elapsed),
      };
    }

    return { onCooldown: false, remainingSeconds: 0 };
  }

  /**
   * Menghapus record OTP kedaluwarsa atau yang sudah digunakan lebih dari 1 hari
   */
  async deleteExpired(): Promise<number> {
    const res = await db.query(
      `DELETE FROM otp_requests
       WHERE expires_at < NOW() - INTERVAL '1 day'
          OR (is_used = TRUE AND created_at < NOW() - INTERVAL '1 day')`
    );
    return res.rowCount ?? 0;
  }
}

export const otpModel = new OtpModel();
export default otpModel;

