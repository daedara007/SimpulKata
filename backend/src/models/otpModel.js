'use strict';

/**
 * models/otpModel.js - Data Access Object (DAO) untuk tabel 'otp_requests'
 * Berdasarkan referensi/erd.puml dan SD-01
 */

const db = require('../db');

class OtpModel {
  /**
   * Membuat rekaman kode OTP baru dengan batas kedaluwarsa
   * @param {Object} param0
   * @returns {Promise<Object>}
   */
  async create({ userId, otpCode, context = 'registration', minutesValid = 5 }) {
    const res = await db.query(
      `INSERT INTO otp_requests (user_id, otp_code, context, expires_at)
       VALUES ($1, $2, $3, NOW() + ($4 || ' minutes')::INTERVAL)
       RETURNING id, user_id, otp_code, context, expires_at, is_used, created_at`,
      [userId, otpCode, context, minutesValid]
    );
    return res.rows[0];
  }

  /**
   * Mencari OTP aktif yang cocok dan belum kadaluwarsa (SD-01 Langkah 22)
   * @param {Object} param0
   * @returns {Promise<Object|null>}
   */
  async findLatestValid({ userId, otpCode, context = 'registration' }) {
    const res = await db.query(
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
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  async markAsUsed(id) {
    const res = await db.query(
      `UPDATE otp_requests
       SET is_used = TRUE
       WHERE id = $1`,
      [id]
    );
    return res.rowCount > 0;
  }

  /**
   * Menghanguskan OTP lama saat meminta OTP baru
   * @param {string} userId
   * @param {string} context
   * @returns {Promise<number>}
   */
  async invalidatePrevious(userId, context = 'registration') {
    const res = await db.query(
      `UPDATE otp_requests
       SET is_used = TRUE
       WHERE user_id = $1 AND context = $2 AND is_used = FALSE`,
      [userId, context]
    );
    return res.rowCount;
  }

  /**
   * Memeriksa jeda cooldown kirim ulang OTP (mencegah spamming email)
   * @param {string} userId
   * @param {string} context
   * @param {number} cooldownSeconds
   * @returns {Promise<Object>} { onCooldown: boolean, remainingSeconds: number }
   */
  async getCooldown(userId, context = 'registration', cooldownSeconds = 60) {
    const res = await db.query(
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
   * @returns {Promise<number>}
   */
  async deleteExpired() {
    const res = await db.query(
      `DELETE FROM otp_requests
       WHERE expires_at < NOW() - INTERVAL '1 day'
          OR (is_used = TRUE AND created_at < NOW() - INTERVAL '1 day')`
    );
    return res.rowCount;
  }
}

module.exports = new OtpModel();

