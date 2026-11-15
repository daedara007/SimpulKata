/**
 * models/paymentModel.ts - HTTP Client & Helper untuk Pembelian Kuota (SRS UC-13 & UC-14)
 * Menggunakan apiClient terpusat dengan Bearer Token JWT otomatis (Reverse Proxy relative path)
 */

import apiClient from '../services/apiClient';

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
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  payment_url: string | null;
  snap_token: string | null;
  payment_type: string | null;
  webhook_processed: boolean;
  created_at: string;
  updated_at: string;
}

export interface CheckoutResult {
  order: OrderRow;
  package: OrderPackage;
  snapToken: string;
  redirectUrl: string;
  clientKey: string;
  isMock: boolean;
}

export interface SimulatePayResult {
  success: boolean;
  orderNumber: string;
  addedMinutes: number;
  newBalance: number;
}

declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        options: {
          onSuccess?: (result: any) => void;
          onPending?: (result: any) => void;
          onError?: (result: any) => void;
          onClose?: () => void;
        }
      ) => void;
    };
  }
}

export const paymentModel = {
  /**
   * Mengambil daftar paket kuota resmi dari backend
   */
  async getPackages(): Promise<OrderPackage[]> {
    const response = await apiClient.get<{
      status: string;
      data: { packages: OrderPackage[] };
    }>('/api/orders/packages');
    return response.data.data.packages;
  },

  /**
   * Inisiasi transaksi checkout pembelian kuota (SRS UC-13 / SD-13)
   */
  async checkout(packageId: string): Promise<CheckoutResult> {
    const response = await apiClient.post<{
      status: string;
      message: string;
      data: CheckoutResult;
    }>('/api/orders/checkout', {
      packageId,
    });
    return response.data.data;
  },

  /**
   * Mengambil status pesanan terkini berdasarkan nomor order
   */
  async getOrderDetail(orderNumber: string): Promise<OrderRow> {
    const response = await apiClient.get<{
      status: string;
      data: { order: OrderRow };
    }>(`/api/orders/${orderNumber}`);
    return response.data.data.order;
  },

  /**
   * Pemicu simulasi pembayaran sukses sandbox (pengujian lokal)
   */
  async simulatePay(orderNumber: string): Promise<SimulatePayResult> {
    const response = await apiClient.post<{
      status: string;
      message: string;
      data: SimulatePayResult;
    }>(`/api/orders/${orderNumber}/simulate-pay`);
    return response.data.data;
  },

  /**
   * Mengambil riwayat transaksi pembelian kuota milik user yang sedang login (SRS UC-18 / SD-18)
   */
  async getMyOrders(page = 1, limit = 20): Promise<{
    orders: OrderRow[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const response = await apiClient.get<{
      status: string;
      data: {
        orders: OrderRow[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    }>('/api/orders/my-orders', {
      params: { page, limit },
    });
    return response.data.data;
  },

  /**
   * Memuat script Midtrans Snap JS Sandbox secara dinamis jika belum ada
   */
  loadSnapScript(clientKey?: string): Promise<boolean> {
    return new Promise((resolve) => {
      if (window.snap) {
        return resolve(true);
      }

      const existingScript = document.getElementById('midtrans-snap-script');
      if (existingScript) {
        return resolve(true);
      }

      const script = document.createElement('script');
      script.id = 'midtrans-snap-script';
      script.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
      if (clientKey) {
        script.setAttribute('data-client-key', clientKey);
      }
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => {
        console.warn('[paymentModel] Gagal memuat script Midtrans Snap JS.');
        resolve(false);
      };
      document.head.appendChild(script);
    });
  },
};

export default paymentModel;
