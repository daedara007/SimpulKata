'use strict';

/**
 * models/sessionModel.js - Data Access Object (DAO) untuk tabel 'user_sessions'
 * Berdasarkan referensi/erd.puml
 */

const db = require('../db');

class SessionModel {
  /**
   * Membuat rekaman sesi baru saat login
   * @param {Object} param0
   * @returns {Promise<Object>}
   */
  async create({ userId, refreshToken, ipAddress = null, userAgent = null, daysValid = 7 }) {
    const res = await db.query(
      `INSERT INTO user_sessions (user_id, refresh_token, ip_address, user_agent, expires_at)
       VALUES ($1, $2, $3, $4, NOW() + ($5 || ' days')::INTERVAL)
       RETURNING id, user_id, refresh_token, ip_address, user_agent, expires_at, created_at`,
      [userId, refreshToken, ipAddress, userAgent, daysValid]
    );
    return res.rows[0];
  }

  /**
   * Mencari sesi aktif beserta relasi user berdasarkan refresh token
   * @param {string} refreshToken
   * @returns {Promise<Object|null>}
   */
  async findByRefreshToken(refreshToken) {
    const res = await db.query(
      `SELECT s.id, s.user_id, s.expires_at, s.created_at,
              u.id AS user_pk, u.name, u.email, u.role, u.balance
       FROM user_sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.refresh_token = $1
       LIMIT 1`,
      [refreshToken]
    );
    return res.rows[0] || null;
  }

  /**
   * Melakukan Refresh Token Rotation (RTR):
   * Memperbarui refresh token dan masa berlaku sesi yang aktif
   * @param {string} sessionId
   * @param {string} newRefreshToken
   * @param {string|null} ipAddress
   * @param {string|null} userAgent
   * @param {number} daysValid
   * @returns {Promise<Object>}
   */
  async rotate(sessionId, newRefreshToken, ipAddress = null, userAgent = null, daysValid = 7) {
    const res = await db.query(
      `UPDATE user_sessions
       SET refresh_token = $1,
           ip_address = COALESCE($2, ip_address),
           user_agent = COALESCE($3, user_agent),
           expires_at = NOW() + ($4 || ' days')::INTERVAL
       WHERE id = $5
       RETURNING id, refresh_token, expires_at`,
      [newRefreshToken, ipAddress, userAgent, daysValid, sessionId]
    );
    return res.rows[0];
  }

  /**
   * Menghapus sesi berdasarkan refresh token (Logout spesifik sesi)
   * @param {string} refreshToken
   * @returns {Promise<number>} Jumlah baris yang terhapus
   */
  async deleteByRefreshToken(refreshToken) {
    const res = await db.query(
      `DELETE FROM user_sessions WHERE refresh_token = $1`,
      [refreshToken]
    );
    return res.rowCount;
  }

  /**
   * Menghapus seluruh sesi milik seorang pengguna (Logout dari semua perangkat)
   * @param {string} userId
   * @returns {Promise<number>}
   */
  async deleteByUserId(userId) {
    const res = await db.query(
      `DELETE FROM user_sessions WHERE user_id = $1`,
      [userId]
    );
    return res.rowCount;
  }

  /**
   * Menghapus seluruh sesi yang sudah kedaluwarsa (Pembersihan berkala)
   * @returns {Promise<number>}
   */
  async deleteExpired() {
    const res = await db.query(
      `DELETE FROM user_sessions WHERE expires_at < NOW()`
    );
    return res.rowCount;
  }
}

module.exports = new SessionModel();
