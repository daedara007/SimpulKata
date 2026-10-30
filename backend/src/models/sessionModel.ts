/**
 * models/sessionModel.ts - Data Access Object (DAO) untuk tabel 'user_sessions'
 * Berdasarkan referensi/erd.puml
 */

import db from '../db';
import {
  UserSessionRow,
  SessionWithUser,
  CreateSessionDTO,
} from '../types';

export class SessionModel {
  /**
   * Membuat rekaman sesi baru saat login
   */
  async create({
    userId,
    refreshToken,
    ipAddress = null,
    userAgent = null,
    daysValid = 7,
  }: CreateSessionDTO): Promise<UserSessionRow> {
    const res = await db.query<UserSessionRow>(
      `INSERT INTO user_sessions (user_id, refresh_token, ip_address, user_agent, expires_at)
       VALUES ($1, $2, $3, $4, NOW() + ($5 || ' days')::INTERVAL)
       RETURNING id, user_id, refresh_token, ip_address, user_agent, expires_at, created_at`,
      [userId, refreshToken, ipAddress, userAgent, daysValid]
    );
    return res.rows[0];
  }

  /**
   * Mencari sesi aktif beserta relasi user berdasarkan refresh token
   */
  async findByRefreshToken(refreshToken: string): Promise<SessionWithUser | null> {
    const res = await db.query<SessionWithUser>(
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
   */
  async rotate(
    sessionId: string,
    newRefreshToken: string,
    ipAddress: string | null = null,
    userAgent: string | null = null,
    daysValid: number = 7
  ): Promise<{ id: string; refresh_token: string; expires_at: Date | string }> {
    const res = await db.query<{ id: string; refresh_token: string; expires_at: Date | string }>(
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
   */
  async deleteByRefreshToken(refreshToken: string): Promise<number> {
    const res = await db.query(
      `DELETE FROM user_sessions WHERE refresh_token = $1`,
      [refreshToken]
    );
    return res.rowCount ?? 0;
  }

  /**
   * Menghapus seluruh sesi milik seorang pengguna (Logout dari semua perangkat)
   */
  async deleteByUserId(userId: string): Promise<number> {
    const res = await db.query(
      `DELETE FROM user_sessions WHERE user_id = $1`,
      [userId]
    );
    return res.rowCount ?? 0;
  }

  /**
   * Menghapus seluruh sesi yang sudah kedaluwarsa (Pembersihan berkala)
   */
  async deleteExpired(): Promise<number> {
    const res = await db.query(
      `DELETE FROM user_sessions WHERE expires_at < NOW()`
    );
    return res.rowCount ?? 0;
  }
}

export const sessionModel = new SessionModel();
export default sessionModel;

