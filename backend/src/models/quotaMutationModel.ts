import db from '../db';
import { PoolClient } from 'pg';
import {
  QuotaMutation,
  CreateQuotaMutationParams,
  QuotaMutationFilter,
  QuotaMutationListResponse,
} from '../types/quotaMutation';

export class QuotaMutationModel {
  /**
   * Mencatat mutasi saldo kuota baru ke dalam audit ledger
   */
  async recordMutation(
    params: CreateQuotaMutationParams,
    client?: PoolClient
  ): Promise<QuotaMutation> {
    const queryExecutor = client || db;
    const query = `
      INSERT INTO quota_mutations (
        user_id,
        type,
        amount_seconds,
        balance_before,
        balance_after,
        description,
        reference_type,
        reference_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const values = [
      params.userId,
      params.type,
      params.amountSeconds,
      params.balanceBefore,
      params.balanceAfter,
      params.description,
      params.referenceType,
      params.referenceId || null,
    ];

    const res = client
      ? await client.query<QuotaMutation>(query, values)
      : await db.query<QuotaMutation>(query, values);
    return res.rows[0];
  }

  /**
   * Mengambil riwayat mutasi kuota milik pengguna dengan paginasi dan filter
   */
  async getUserMutations(
    userId: string,
    filter: QuotaMutationFilter = {}
  ): Promise<QuotaMutationListResponse> {
    const page = Math.max(1, filter.page || 1);
    const limit = Math.min(100, Math.max(1, filter.limit || 15));
    const offset = (page - 1) * limit;

    const conditions: string[] = ['user_id = $1'];
    const values: any[] = [userId];
    let paramIndex = 2;

    if (filter.type && filter.type !== 'ALL') {
      conditions.push(`type = $${paramIndex++}`);
      values.push(filter.type);
    }

    const whereClause = conditions.join(' AND ');

    // Hitung total record
    const countRes = await db.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM quota_mutations WHERE ${whereClause}`,
      values
    );
    const total = parseInt(countRes.rows[0]?.count || '0', 10);

    // Ambil data paginasi
    const dataQuery = `
      SELECT id, user_id, type, amount_seconds, balance_before, balance_after,
             description, reference_type, reference_id, created_at
      FROM quota_mutations
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    const dataRes = await db.query<QuotaMutation>(dataQuery, [...values, limit, offset]);

    return {
      mutations: dataRes.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }
}

export const quotaMutationModel = new QuotaMutationModel();

/**
 * Helper untuk memformat durasi detik ke string ringkas manusiawi (misal: "15m 30s", "450m", "45s")
 */
export function formatDurationDisplay(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  if (s === 0) return `${m}m`;
  return `${m}m ${s}s`;
}

