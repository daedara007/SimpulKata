/**
 * models/userModel.ts - Data Access Object (DAO) untuk tabel 'users'
 * Berdasarkan referensi/erd.puml
 */

import db from '../db';
import {
  UserRow,
  UserSafe,
  CreateUserDTO,
  UpdatePendingUserDTO,
  UserFilterQuery,
  UserListResult,
  UserStats,
} from '../types';

export class UserModel {
  /**
   * Mencari pengguna berdasarkan alamat email
   */
  async findByEmail(email: string): Promise<UserRow | null> {
    const res = await db.query<UserRow>(
      `SELECT id, name, email, password_hash, balance, role, status, avatar_url, created_at, updated_at
       FROM users
       WHERE email = $1
       LIMIT 1`,
      [email.toLowerCase().trim()]
    );
    return res.rows[0] || null;
  }

  /**
   * Mencari pengguna berdasarkan ID unik
   */
  async findById(id: string): Promise<UserSafe | null> {
    const res = await db.query<UserSafe>(
      `SELECT id, name, email, balance, role, status, avatar_url, created_at, updated_at
       FROM users
       WHERE id = $1
       LIMIT 1`,
      [id]
    );
    return res.rows[0] || null;
  }

  /**
   * Mengambil hash password saat ini untuk verifikasi keamanan (SD-04 Langkah 10-11)
   */
  async getPasswordHash(userId: string): Promise<string | null> {
    const res = await db.query<{ password_hash: string }>(
      `SELECT password_hash FROM users WHERE id = $1 LIMIT 1`,
      [userId]
    );
    return res.rows[0]?.password_hash || null;
  }

  /**
   * Membuat pengguna baru di database dengan status awal
   */
  async create({
    name,
    email,
    passwordHash,
    balance = 0,
    role = 'user',
    status = 'PENDING',
    avatarUrl = null,
  }: CreateUserDTO): Promise<UserSafe> {
    const res = await db.query<UserSafe>(
      `INSERT INTO users (name, email, password_hash, balance, role, status, avatar_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, name, email, balance, role, status, avatar_url, created_at`,
      [name.trim(), email.toLowerCase().trim(), passwordHash, balance, role, status, avatarUrl]
    );
    return res.rows[0];
  }

  /**
   * Mengaktifkan akun pengguna setelah verifikasi kode OTP berhasil (SD-01 Langkah 24)
   */
  async activateUser(userId: string): Promise<UserRow | null> {
    const res = await db.query<UserRow>(
      `UPDATE users
       SET status = 'ACTIVE'
       WHERE id = $1
       RETURNING id, name, email, balance, role, status, avatar_url, created_at, updated_at`,
      [userId]
    );
    return res.rows[0] || null;
  }

  /**
   * Memperbarui data profil pengguna (Nama dan Avatar) (SD-04 Langkah 18)
   */
  async updateProfile(
    userId: string,
    { name, avatarUrl }: { name: string; avatarUrl?: string | null }
  ): Promise<UserSafe | null> {
    let sql: string;
    let params: any[];

    if (avatarUrl !== undefined) {
      sql = `UPDATE users
             SET name = $1, avatar_url = $2, updated_at = NOW()
             WHERE id = $3
             RETURNING id, name, email, balance, role, status, avatar_url, created_at, updated_at`;
      params = [name.trim(), avatarUrl, userId];
    } else {
      sql = `UPDATE users
             SET name = $1, updated_at = NOW()
             WHERE id = $2
             RETURNING id, name, email, balance, role, status, avatar_url, created_at, updated_at`;
      params = [name.trim(), userId];
    }

    const res = await db.query<UserSafe>(sql, params);
    return res.rows[0] || null;
  }

  /**
   * Memperbarui alamat email pengguna setelah verifikasi OTP email baru
   */
  async updateEmail(userId: string, newEmail: string): Promise<UserSafe | null> {
    const res = await db.query<UserSafe>(
      `UPDATE users
       SET email = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, name, email, balance, role, status, avatar_url, created_at, updated_at`,
      [newEmail.toLowerCase().trim(), userId]
    );
    return res.rows[0] || null;
  }

  /**
   * Memperbarui data pengguna yang masih berstatus PENDING
   */
  async updatePendingUser(
    id: string,
    { name, passwordHash }: UpdatePendingUserDTO
  ): Promise<UserSafe | null> {
    const res = await db.query<UserSafe>(
      `UPDATE users
       SET name = $1, password_hash = $2
       WHERE id = $3 AND status = 'PENDING'
       RETURNING id, name, email, balance, role, status, avatar_url`,
      [name, passwordHash, id]
    );
    return res.rows[0] || null;
  }

  /**
   * Memperbarui kata sandi pengguna (SD-03 Langkah 21, SD-05)
   */
  async updatePassword(userId: string, newPasswordHash: string): Promise<boolean> {
    const res = await db.query(
      `UPDATE users
       SET password_hash = $1, updated_at = NOW()
       WHERE id = $2`,
      [newPasswordHash, userId]
    );
    return (res.rowCount ?? 0) > 0;
  }

  /**
   * Mengambil saldo sisa kuota pengguna saat ini
   */
  async getBalance(userId: string): Promise<number> {
    const res = await db.query<{ balance: number }>(
      `SELECT balance FROM users WHERE id = $1 LIMIT 1`,
      [userId]
    );
    return res.rows[0]?.balance ?? 0;
  }

  /**
   * Reservasi pemotongan kuota secara atomik (CR-03, TC-QTA-007)
   * Hanya memotong jika balance >= seconds
   */
  async reserveBalance(userId: string, seconds: number): Promise<number | null> {
    const res = await db.query<{ balance: number }>(
      `UPDATE users
       SET balance = balance - $1
       WHERE id = $2 AND balance >= $1
       RETURNING balance`,
      [seconds, userId]
    );
    if ((res.rowCount ?? 0) === 0) return null;
    return res.rows[0].balance;
  }

  /**
   * Mengembalikan kuota pengguna (Refund) jika pemrosesan gagal (CR-03)
   */
  async refundBalance(userId: string, seconds: number): Promise<number> {
    const res = await db.query<{ balance: number }>(
      `UPDATE users
       SET balance = balance + $1
       WHERE id = $2
       RETURNING balance`,
      [seconds, userId]
    );
    return res.rows[0]?.balance ?? 0;
  }

  /**
   * Mengambil daftar pengguna dengan paginasi dan filter (SRS UC-16 / SD-16 Langkah 4)
   */
  async findUsers({
    status,
    search,
    page = 1,
    limit = 50,
  }: UserFilterQuery): Promise<UserListResult> {
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (status && status.toUpperCase() !== 'ALL') {
      conditions.push(`status = $${paramIndex++}`);
      values.push(status.toUpperCase());
    }

    if (search && search.trim() !== '') {
      conditions.push(`(name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`);
      values.push(`%${search.trim()}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Query total pengguna & statistik secara paralel
    const [countRes, stats] = await Promise.all([
      db.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM users ${whereClause}`,
        values
      ),
      this.getUserStats(),
    ]);

    const total = parseInt(countRes.rows[0]?.count || '0', 10);
    const safeLimit = Math.max(1, Math.min(limit, 100));
    const safePage = Math.max(1, page);
    const offset = (safePage - 1) * safeLimit;
    const totalPages = Math.ceil(total / safeLimit) || 1;

    // Ambil data pengguna aman (tanpa password_hash)
    const dataValues = [...values, safeLimit, offset];
    const dataRes = await db.query<UserSafe>(
      `SELECT id, name, email, balance, role, status, avatar_url, created_at, updated_at
       FROM users
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
      dataValues
    );

    return {
      users: dataRes.rows,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages,
      stats,
    };
  }

  /**
   * Mengambil data pengguna untuk ekspor berkas CSV (SD-16 Langkah 8-12)
   */
  async getUsersForExport({
    status,
    search,
    limit = 5000,
  }: UserFilterQuery): Promise<UserSafe[]> {
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (status && status.toUpperCase() !== 'ALL') {
      conditions.push(`status = $${paramIndex++}`);
      values.push(status.toUpperCase());
    }

    if (search && search.trim() !== '') {
      conditions.push(`(name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`);
      values.push(`%${search.trim()}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const safeLimit = Math.max(1, Math.min(limit, 10000));
    values.push(safeLimit);

    const res = await db.query<UserSafe>(
      `SELECT id, name, email, balance, role, status, avatar_url, created_at, updated_at
       FROM users
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIndex}`,
      values
    );

    return res.rows;
  }

  /**
   * Menghitung statistik ringkas pengguna untuk widget dashboard admin
   */
  async getUserStats(): Promise<UserStats> {
    const res = await db.query<{
      total: string;
      active: string;
      pending: string;
      suspended: string;
      total_balance: string;
    }>(
      `SELECT
         COUNT(*)::text AS total,
         COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END)::text AS active,
         COUNT(CASE WHEN status = 'PENDING' THEN 1 END)::text AS pending,
         COUNT(CASE WHEN status = 'SUSPENDED' THEN 1 END)::text AS suspended,
         COALESCE(SUM(balance), 0)::text AS total_balance
       FROM users`
    );

    const row = res.rows[0];
    return {
      total: parseInt(row?.total || '0', 10),
      active: parseInt(row?.active || '0', 10),
      pending: parseInt(row?.pending || '0', 10),
      suspended: parseInt(row?.suspended || '0', 10),
      totalBalanceSeconds: parseInt(row?.total_balance || '0', 10),
    };
  }
}

export const userModel = new UserModel();
export default userModel;
