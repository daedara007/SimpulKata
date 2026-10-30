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
} from '../types';

export class UserModel {
  /**
   * Mencari pengguna berdasarkan alamat email
   */
  async findByEmail(email: string): Promise<UserRow | null> {
    const res = await db.query<UserRow>(
      `SELECT id, name, email, password_hash, balance, role, status, created_at, updated_at
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
      `SELECT id, name, email, balance, role, status, created_at, updated_at
       FROM users
       WHERE id = $1
       LIMIT 1`,
      [id]
    );
    return res.rows[0] || null;
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
  }: CreateUserDTO): Promise<UserSafe> {
    const res = await db.query<UserSafe>(
      `INSERT INTO users (name, email, password_hash, balance, role, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, email, balance, role, status, created_at`,
      [name.trim(), email.toLowerCase().trim(), passwordHash, balance, role, status]
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
       RETURNING id, name, email, balance, role, status, created_at, updated_at`,
      [userId]
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
       RETURNING id, name, email, balance, role, status`,
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
}

export const userModel = new UserModel();
export default userModel;

