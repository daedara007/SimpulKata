/**
 * models/orderModel.ts - Data Access Object (DAO) untuk tabel 'orders'
 * Berdasarkan referensi/erd.puml dan SRS FR-FIN-03 / UC-13 & FR-FIN-04 / UC-14
 */

import db from '../db';
import {
  OrderRow,
  CreateOrderDTO,
  OrderFilterQuery,
  OrderListResult,
} from '../types';

export class OrderModel {
  /**
   * Menyimpan entri pesanan baru ke basis data (status: 'pending') (SD-13 Langkah 7-8)
   */
  async create({
    userId,
    orderNumber,
    packageId,
    packageName,
    packageMinutes,
    amount,
    paymentUrl = null,
    snapToken = null,
  }: CreateOrderDTO): Promise<OrderRow> {
    const res = await db.query<OrderRow>(
      `INSERT INTO orders (
        user_id, order_number, package_id, package_name, package_minutes, amount, status, payment_url, snap_token
      ) VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, $8)
      RETURNING *`,
      [userId, orderNumber, packageId, packageName, packageMinutes, amount, paymentUrl, snapToken]
    );
    return res.rows[0];
  }

  /**
   * Mencari data pesanan berdasarkan nomor order unik
   */
  async findByOrderNumber(orderNumber: string): Promise<OrderRow | null> {
    const res = await db.query<OrderRow>(
      `SELECT * FROM orders WHERE order_number = $1 LIMIT 1`,
      [orderNumber]
    );
    return res.rows[0] || null;
  }

  /**
   * Mencari data pesanan berdasarkan UUID id
   */
  async findById(id: string): Promise<OrderRow | null> {
    const res = await db.query<OrderRow>(
      `SELECT * FROM orders WHERE id = $1 LIMIT 1`,
      [id]
    );
    return res.rows[0] || null;
  }

  /**
   * Memperbarui Snap Token dan Payment URL setelah integrasi gateway (SD-13 Langkah 11-12)
   */
  async updateGatewayToken(orderNumber: string, snapToken: string, paymentUrl: string): Promise<OrderRow | null> {
    const res = await db.query<OrderRow>(
      `UPDATE orders
       SET snap_token = $2, payment_url = $3, updated_at = NOW()
       WHERE order_number = $1
       RETURNING *`,
      [orderNumber, snapToken, paymentUrl]
    );
    return res.rows[0] || null;
  }

  /**
   * Mengubah status pesanan menjadi 'completed' dan webhook_processed = true (SD-14 Langkah 5-6)
   */
  async markCompleted(orderNumber: string, paymentType?: string): Promise<OrderRow | null> {
    const res = await db.query<OrderRow>(
      `UPDATE orders
       SET status = 'completed', payment_type = COALESCE($2, payment_type), webhook_processed = TRUE, updated_at = NOW()
       WHERE order_number = $1
       RETURNING *`,
      [orderNumber, paymentType || null]
    );
    return res.rows[0] || null;
  }

  /**
   * Mengubah status pesanan menjadi 'failed' atau 'cancelled'
   */
  async markFailed(orderNumber: string, status: 'failed' | 'cancelled' = 'failed'): Promise<OrderRow | null> {
    const res = await db.query<OrderRow>(
      `UPDATE orders
       SET status = $2, webhook_processed = TRUE, updated_at = NOW()
       WHERE order_number = $1
       RETURNING *`,
      [orderNumber, status]
    );
    return res.rows[0] || null;
  }

  /**
   * Mengambil riwayat pesanan milik pengguna tertentu (SD-18 Langkah 3-4)
   */
  async findUserOrders(userId: string, page = 1, limit = 20): Promise<OrderListResult> {
    const offset = (page - 1) * limit;

    const countRes = await db.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM orders WHERE user_id = $1`,
      [userId]
    );
    const total = parseInt(countRes.rows[0]?.count || '0', 10);
    const totalPages = Math.ceil(total / limit) || 1;

    const dataRes = await db.query<OrderRow>(
      `SELECT * FROM orders
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    return {
      orders: dataRes.rows,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Mengambil riwayat transaksi global seluruh pengguna untuk Administrator (SD-17 Langkah 4-5)
   */
  async findGlobalOrders({
    status,
    search,
    startDate,
    endDate,
    page = 1,
    limit = 50,
  }: OrderFilterQuery): Promise<OrderListResult> {
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (status && status.trim() !== '' && status.toUpperCase() !== 'ALL') {
      conditions.push(`o.status = $${paramIndex++}`);
      values.push(status.toLowerCase());
    }

    if (search && search.trim() !== '') {
      conditions.push(`(o.order_number ILIKE $${paramIndex} OR u.name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`);
      values.push(`%${search.trim()}%`);
      paramIndex++;
    }

    if (startDate && startDate.trim() !== '') {
      conditions.push(`o.created_at >= $${paramIndex++}`);
      values.push(new Date(startDate));
    }

    if (endDate && endDate.trim() !== '') {
      conditions.push(`o.created_at <= $${paramIndex++}`);
      values.push(new Date(endDate));
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await db.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM orders o
       JOIN users u ON o.user_id = u.id
       ${whereClause}`,
      values
    );
    const total = parseInt(countRes.rows[0]?.count || '0', 10);
    const totalPages = Math.ceil(total / limit) || 1;

    const offset = (page - 1) * limit;
    values.push(limit);
    const limitParam = paramIndex++;
    values.push(offset);
    const offsetParam = paramIndex++;

    const dataRes = await db.query<OrderRow>(
      `SELECT o.*, u.name AS user_name, u.email AS user_email
       FROM orders o
       JOIN users u ON o.user_id = u.id
       ${whereClause}
       ORDER BY o.created_at DESC
       LIMIT $${limitParam} OFFSET $${offsetParam}`,
      values
    );

    return {
      orders: dataRes.rows,
      total,
      page,
      limit,
      totalPages,
    };
  }
}

export const orderModel = new OrderModel();
export default orderModel;
