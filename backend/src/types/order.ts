/**
 * types/order.ts - Tipe data untuk entitas 'orders' dan integrasi pembayaran Midtrans
 * Berdasarkan referensi/erd.puml dan SRS FR-FIN-03 / UC-13 & FR-FIN-04 / UC-14
 */

export type OrderStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

export interface OrderPackage {
  id: string;
  name: string;
  minutes: number;
  amount: number;
  description: string;
  badge?: string;
  features: string[];
}

export interface OrderRow {
  id: string;
  user_id: string;
  order_number: string;
  package_id: string;
  package_name: string;
  package_minutes: number;
  amount: number | string;
  status: OrderStatus;
  payment_url: string | null;
  snap_token: string | null;
  payment_type: string | null;
  webhook_processed: boolean;
  created_at: string | Date;
  updated_at: string | Date;
  // Join fields opsional untuk admin/riwayat
  user_name?: string;
  user_email?: string;
}

export interface CreateOrderDTO {
  userId: string;
  orderNumber: string;
  packageId: string;
  packageName: string;
  packageMinutes: number;
  amount: number;
  paymentUrl?: string | null;
  snapToken?: string | null;
}

export interface MidtransWebhookPayload {
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
  transaction_status: string;
  fraud_status?: string;
  payment_type?: string;
  transaction_time?: string;
  transaction_id?: string;
}

export interface OrderFilterQuery {
  userId?: string;
  status?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface OrderListResult {
  orders: OrderRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface RevenueStats {
  totalRevenue: number;
  completedCount: number;
  pendingCount: number;
  failedCount: number;
  totalOrders: number;
}
