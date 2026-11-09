/**
 * models/logModel.ts - Data Access Object (DAO) untuk tabel 'system_logs'
 * Berdasarkan referensi/erd.puml dan SRS FR-ADM-02 / UC-15 (SD-15)
 */

import db from '../db';
import {
  SystemLogRow,
  CreateLogDTO,
  LogFilterQuery,
  LogListResult,
} from '../types';

export class LogModel {
  /**
   * Menyimpan entri log baru ke basis data
   */
  async create({
    level,
    source,
    message,
  }: CreateLogDTO): Promise<SystemLogRow> {
    const res = await db.query<SystemLogRow>(
      `INSERT INTO system_logs (level, source, message)
       VALUES ($1, $2, $3)
       RETURNING id, level, source, message, created_at`,
      [level, source, message]
    );
    return res.rows[0];
  }

  /**
   * Mengambil riwayat log dengan paginasi dan filter (SD-15 Langkah 4)
   */
  async findLogs({
    level,
    source,
    search,
    startDate,
    endDate,
    page = 1,
    limit = 50,
  }: LogFilterQuery): Promise<LogListResult> {
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (level && level.trim() !== '' && level.toUpperCase() !== 'ALL') {
      const levels = level
        .split(',')
        .map((l) => l.trim().toUpperCase())
        .filter((l) => ['INFO', 'WARN', 'ERROR'].includes(l));

      if (levels.length === 1) {
        conditions.push(`level = $${paramIndex++}`);
        values.push(levels[0]);
      } else if (levels.length > 1) {
        conditions.push(`level = ANY($${paramIndex++}::varchar[])`);
        values.push(levels);
      } else {
        conditions.push(`1 = 0`);
      }
    }

    if (source && source.trim() !== '' && source.toUpperCase() !== 'ALL') {
      const sources = source
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      if (sources.length === 1) {
        if (sources[0].toUpperCase() === 'NONE') {
          conditions.push('1 = 0');
        } else {
          conditions.push(`source ILIKE $${paramIndex++}`);
          values.push(`%${sources[0]}%`);
        }
      } else if (sources.length > 1) {
        const sourceConds = sources.map((s) => {
          values.push(`%${s}%`);
          return `source ILIKE $${paramIndex++}`;
        });
        conditions.push(`(${sourceConds.join(' OR ')})`);
      }
    }

    if (search && search.trim() !== '') {
      conditions.push(`(message ILIKE $${paramIndex} OR source ILIKE $${paramIndex})`);
      values.push(`%${search.trim()}%`);
      paramIndex++;
    }

    if (startDate && startDate.trim() !== '') {
      conditions.push(`created_at >= $${paramIndex++}`);
      values.push(new Date(startDate));
    }

    if (endDate && endDate.trim() !== '') {
      conditions.push(`created_at <= $${paramIndex++}`);
      values.push(new Date(endDate));
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Hitung total log yang cocok dengan filter
    const countRes = await db.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM system_logs ${whereClause}`,
      values
    );
    const total = parseInt(countRes.rows[0]?.count || '0', 10);

    const safeLimit = Math.max(1, Math.min(limit, 200));
    const safePage = Math.max(1, page);
    const offset = (safePage - 1) * safeLimit;
    const totalPages = Math.ceil(total / safeLimit) || 1;

    // Ambil baris log terurut dari yang paling baru
    const dataValues = [...values, safeLimit, offset];
    const dataRes = await db.query<SystemLogRow>(
      `SELECT id, level, source, message, created_at
       FROM system_logs
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
      dataValues
    );

    return {
      logs: dataRes.rows,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages,
    };
  }

  /**
   * Mengambil data log untuk keperluan ekspor berkas CSV (SD-15 Langkah 9-10)
   * Batas maksimal 2000 entri untuk menjaga stabilitas memori server
   */
  async getLogsForExport({
    level,
    source,
    search,
    startDate,
    endDate,
    limit = 2000,
  }: LogFilterQuery): Promise<SystemLogRow[]> {
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (level && level.trim() !== '' && level.toUpperCase() !== 'ALL') {
      const levels = level
        .split(',')
        .map((l) => l.trim().toUpperCase())
        .filter((l) => ['INFO', 'WARN', 'ERROR'].includes(l));

      if (levels.length === 1) {
        conditions.push(`level = $${paramIndex++}`);
        values.push(levels[0]);
      } else if (levels.length > 1) {
        conditions.push(`level = ANY($${paramIndex++}::varchar[])`);
        values.push(levels);
      } else {
        conditions.push(`1 = 0`);
      }
    }

    if (source && source.trim() !== '' && source.toUpperCase() !== 'ALL') {
      const sources = source
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      if (sources.length === 1) {
        if (sources[0].toUpperCase() === 'NONE') {
          conditions.push('1 = 0');
        } else {
          conditions.push(`source ILIKE $${paramIndex++}`);
          values.push(`%${sources[0]}%`);
        }
      } else if (sources.length > 1) {
        const sourceConds = sources.map((s) => {
          values.push(`%${s}%`);
          return `source ILIKE $${paramIndex++}`;
        });
        conditions.push(`(${sourceConds.join(' OR ')})`);
      }
    }

    if (search && search.trim() !== '') {
      conditions.push(`(message ILIKE $${paramIndex} OR source ILIKE $${paramIndex})`);
      values.push(`%${search.trim()}%`);
      paramIndex++;
    }

    if (startDate && startDate.trim() !== '') {
      conditions.push(`created_at >= $${paramIndex++}`);
      values.push(new Date(startDate));
    }

    if (endDate && endDate.trim() !== '') {
      conditions.push(`created_at <= $${paramIndex++}`);
      values.push(new Date(endDate));
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const safeLimit = Math.max(1, Math.min(limit, 5000));
    values.push(safeLimit);

    const res = await db.query<SystemLogRow>(
      `SELECT id, level, source, message, created_at
       FROM system_logs
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIndex}`,
      values
    );

    return res.rows;
  }

  /**
   * Mengambil statistik ringkas log sistem untuk dasbor admin
   */
  async getLogStats(): Promise<{
    total: number;
    errors: number;
    warnings: number;
    info: number;
  }> {
    const res = await db.query<{
      total: string;
      errors: string;
      warnings: string;
      info: string;
    }>(
      `SELECT
         COUNT(*)::text AS total,
         COUNT(CASE WHEN level = 'ERROR' THEN 1 END)::text AS errors,
         COUNT(CASE WHEN level = 'WARN' THEN 1 END)::text AS warnings,
         COUNT(CASE WHEN level = 'INFO' THEN 1 END)::text AS info
       FROM system_logs`
    );

    const row = res.rows[0];
    return {
      total: parseInt(row?.total || '0', 10),
      errors: parseInt(row?.errors || '0', 10),
      warnings: parseInt(row?.warnings || '0', 10),
      info: parseInt(row?.info || '0', 10),
    };
  }
}

export const logModel = new LogModel();
export default logModel;
