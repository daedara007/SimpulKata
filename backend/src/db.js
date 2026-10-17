'use strict';

/**
 * db.js - Modul Koneksi Database PostgreSQL
 *
 * Menggunakan pg.Pool untuk connection pooling yang efisien.
 * Dengan pooling, multiple request dapat berbagi koneksi yang sama
 * tanpa harus membuka/menutup koneksi di setiap query.
 *
 * Referensi: SDD Bab 6 - Desain Arsitektur (self-hosted PostgreSQL)
 */

const { Pool } = require('pg');

// Buat pool koneksi dari DB_URL atau fallback ke variabel individual
const pool = new Pool({
  connectionString: process.env.DB_URL,
  // Konfigurasi pool (sesuaikan untuk production)
  max: 10,                // Maksimal 10 koneksi simultan
  idleTimeoutMillis: 30000, // Tutup koneksi idle setelah 30 detik
  connectionTimeoutMillis: 5000, // Timeout jika tidak bisa konek dalam 5 detik
});

// Event listener untuk logging error koneksi
pool.on('error', (err) => {
  console.error('[DB] Unexpected error on idle client:', err.message);
  process.exit(1);
});

/**
 * Fungsi query sebagai abstraksi atas pool.query()
 * Penggunaan: const { rows } = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
 *
 * @param {string} text  - SQL query string (gunakan $1, $2, ... sebagai placeholder)
 * @param {Array}  params - Array nilai untuk menggantikan placeholder
 * @returns {Promise<pg.QueryResult>}
 */
const query = (text, params) => pool.query(text, params);

/**
 * Fungsi untuk mendapatkan client dari pool (digunakan untuk transaksi)
 * Setelah selesai, SELALU panggil client.release()
 *
 * Contoh penggunaan transaksi:
 *   const client = await db.getClient();
 *   try {
 *     await client.query('BEGIN');
 *     await client.query(...);
 *     await client.query('COMMIT');
 *   } catch (e) {
 *     await client.query('ROLLBACK');
 *   } finally {
 *     client.release();
 *   }
 */
const getClient = () => pool.connect();

/**
 * Fungsi untuk menguji koneksi ke database saat startup
 * Akan throw error jika koneksi gagal
 */
const testConnection = async () => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT NOW() AS current_time');
    console.log(`[DB] Koneksi berhasil. Waktu server DB: ${result.rows[0].current_time}`);
  } finally {
    client.release();
  }
};

module.exports = { query, getClient, testConnection, pool };
