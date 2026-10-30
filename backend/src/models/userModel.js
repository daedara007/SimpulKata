'use strict';

/**
 * models/userModel.js - Data Access Object (DAO) untuk tabel 'users'
 * Berdasarkan referensi/erd.puml
 */

const db = require('../db');

class UserModel {
  /**
   * Mencari pengguna berdasarkan alamat email
   * @param {string} email
   * @returns {Promise<Object|null>}
   */
  async findByEmail(email) {
    const res = await db.query(
      `SELECT id, name, email, password_hash, balance, role, created_at, updated_at
       FROM users
       WHERE email = $1
       LIMIT 1`,
      [email.toLowerCase().trim()]
    );
    return res.rows[0] || null;
  }

  /**
   * Mencari pengguna berdasarkan ID unik
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    const res = await db.query(
      `SELECT id, name, email, balance, role, created_at, updated_at
       FROM users
       WHERE id = $1
       LIMIT 1`,
      [id]
    );
    return res.rows[0] || null;
  }

  /**
   * Membuat pengguna baru di database
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async create({ name, email, passwordHash, balance = 0, role = 'user' }) {
    const res = await db.query(
      `INSERT INTO users (name, email, password_hash, balance, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, balance, role, created_at`,
      [name.trim(), email.toLowerCase().trim(), passwordHash, balance, role]
    );
    return res.rows[0];
  }

  /**
   * Mengambil saldo sisa kuota pengguna saat ini
   * @param {string} userId
   * @returns {Promise<number>}
   */
  async getBalance(userId) {
    const res = await db.query(
      `SELECT balance FROM users WHERE id = $1 LIMIT 1`,
      [userId]
    );
    return res.rows[0]?.balance ?? 0;
  }

  /**
   * Reservasi pemotongan kuota secara atomik (CR-03, TC-QTA-007)
   * Hanya memotong jika balance >= seconds
   * @param {string} userId
   * @param {number} seconds
   * @returns {Promise<number|null>} Sisa saldo jika berhasil, null jika tidak cukup
   */
  async reserveBalance(userId, seconds) {
    const res = await db.query(
      `UPDATE users
       SET balance = balance - $1
       WHERE id = $2 AND balance >= $1
       RETURNING balance`,
      [seconds, userId]
    );
    if (res.rowCount === 0) return null;
    return res.rows[0].balance;
  }

  /**
   * Mengembalikan kuota pengguna (Refund) jika pemrosesan gagal (CR-03)
   * @param {string} userId
   * @param {number} seconds
   * @returns {Promise<number>} Saldo terbaru
   */
  async refundBalance(userId, seconds) {
    const res = await db.query(
      `UPDATE users
       SET balance = balance + $1
       WHERE id = $2
       RETURNING balance`,
      [seconds, userId]
    );
    return res.rows[0]?.balance ?? 0;
  }
}

module.exports = new UserModel();
