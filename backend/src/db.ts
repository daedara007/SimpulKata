/**
 * db.ts - Modul Koneksi Database PostgreSQL
 *
 * Menggunakan pg.Pool untuk connection pooling yang efisien.
 * Dengan pooling, multiple request dapat berbagi koneksi yang sama
 * tanpa harus membuka/menutup koneksi di setiap query.
 *
 * Referensi: SDD Bab 6 - Desain Arsitektur (self-hosted PostgreSQL)
 */

import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

// Buat pool koneksi dari DB_URL atau fallback ke konfigurasi default
export const pool = new Pool({
  connectionString: process.env.DB_URL,
  max: 10, // Maksimal 10 koneksi simultan
  idleTimeoutMillis: 30000, // Tutup koneksi idle setelah 30 detik
  connectionTimeoutMillis: 5000, // Timeout jika tidak bisa konek dalam 5 detik
});

// Event listener untuk logging error koneksi
pool.on('error', (err: Error) => {
  console.error('[DB] Unexpected error on idle client:', err.message);
  process.exit(1);
});

/**
 * Fungsi query sebagai abstraksi atas pool.query()
 * @param text SQL query string
 * @param params Parameter placeholder ($1, $2, ...)
 */
export const query = <R extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<R>> => pool.query<R>(text, params);

/**
 * Fungsi untuk mendapatkan client dari pool (digunakan untuk transaksi)
 * Setelah selesai, SELALU panggil client.release()
 */
export const getClient = (): Promise<PoolClient> => pool.connect();

/**
 * Fungsi untuk menguji koneksi ke database saat startup
 */
export const testConnection = async (): Promise<void> => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT NOW() AS current_time');
    console.log(`[DB] Koneksi berhasil. Waktu server DB: ${result.rows[0].current_time}`);
  } finally {
    client.release();
  }
};

export default { query, getClient, testConnection, pool };

