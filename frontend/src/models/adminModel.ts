/**
 * models/adminModel.ts - HTTP Client untuk Administrasi & Log Sistem (UC-15 / SD-15)
 *
 * Mengikuti aturan arsitektur: Seluruh panggilan API WAJIB menggunakan path relatif (/api/...)
 */

import apiClient from '../services/apiClient';
import type { QuotaMutation } from './paymentModel';

export interface SystemLog {
  id: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  source: string;
  message: string;
  created_at: string;
}

export interface LogStats {
  total: number;
  errors: number;
  warnings: number;
  info: number;
}

export interface GetLogsResponse {
  status: string;
  data: {
    logs: SystemLog[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    stats: LogStats;
  };
}

export interface LogFilterParams {
  level?: string;
  source?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface AdminUserItem {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED';
  balance: number;
  avatar_url?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface AdminUserStats {
  total: number;
  active: number;
  pending: number;
  suspended: number;
  totalBalanceSeconds: number;
}

export interface GetUsersResponse {
  status: string;
  data: {
    users: AdminUserItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    stats: AdminUserStats;
  };
}

export interface UserFilterParams {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface AdminTransactionItem {
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
  user_name?: string;
  user_email?: string;
}

export interface AdminTransactionStats {
  totalRevenue: number;
  completedCount: number;
  pendingCount: number;
  failedCount: number;
  totalOrders: number;
}

export interface GetTransactionsResponse {
  status: string;
  data: {
    orders: AdminTransactionItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    stats: AdminTransactionStats;
  };
}

export interface TransactionFilterParams {
  status?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface AdminUserMutationsFilter {
  page?: number;
  limit?: number;
  type?: 'ALL' | 'CREDIT' | 'DEBIT';
}

export interface GetAdminUserMutationsResponse {
  status: string;
  data: {
    user: AdminUserItem;
    mutations: QuotaMutation[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AddUserQuotaPayload {
  minutes: number;
  note?: string;
}

export interface AddUserQuotaResponse {
  status: string;
  message: string;
  data: {
    user: AdminUserItem;
    mutation: QuotaMutation;
  };
}

export const adminModel = {
  /**
   * Mengambil riwayat log sistem dari backend (SD-15 Langkah 2)
   */
  async getLogs(params: LogFilterParams = {}): Promise<GetLogsResponse['data']> {
    const response = await apiClient.get<GetLogsResponse>('/api/admin/logs', {
      params,
    });
    return response.data.data;
  },

  /**
   * Mengunduh berkas laporan CSV log sistem (SD-15 Langkah 9-12)
   */
  async downloadLogsCsv(params: LogFilterParams = {}): Promise<void> {
    const response = await apiClient.get('/api/admin/logs/export', {
      params,
      responseType: 'blob',
    });

    const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `simpulkata-logs-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  /**
   * Mengambil daftar seluruh pengguna dari backend (SRS UC-16 / SD-16 Langkah 2)
   */
  async getUsers(params: UserFilterParams = {}): Promise<GetUsersResponse['data']> {
    const response = await apiClient.get<GetUsersResponse>('/api/admin/users', {
      params,
    });
    return response.data.data;
  },

  /**
   * Mengunduh berkas laporan CSV daftar pengguna (SD-16 Langkah 8-12)
   */
  async downloadUsersCsv(params: UserFilterParams = {}): Promise<void> {
    const response = await apiClient.get('/api/admin/users/export', {
      params,
      responseType: 'blob',
    });

    const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `simpulkata-users-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  /**
   * Mengambil riwayat transaksi global seluruh pengguna untuk Administrator (SRS UC-17 / SD-17)
   */
  async getTransactions(params: TransactionFilterParams = {}): Promise<GetTransactionsResponse['data']> {
    const response = await apiClient.get<GetTransactionsResponse>('/api/admin/transactions', {
      params,
    });
    return response.data.data;
  },

  /**
   * Mengunduh berkas laporan CSV transaksi global (SD-17 Langkah 8-12)
   */
  async downloadTransactionsCsv(params: TransactionFilterParams = {}): Promise<void> {
    const response = await apiClient.get('/api/admin/transactions/export', {
      params,
      responseType: 'blob',
    });

    const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `simpulkata-transactions-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  /**
   * Mengambil riwayat mutasi kuota milik pengguna tertentu untuk Administrator (keterangan tersanitasi privasi)
   */
  async getUserQuotaMutations(
    userId: string,
    params: AdminUserMutationsFilter = {}
  ): Promise<GetAdminUserMutationsResponse['data']> {
    const response = await apiClient.get<GetAdminUserMutationsResponse>(
      `/api/admin/users/${userId}/quota-mutations`,
      { params }
    );
    return response.data.data;
  },

  /**
   * Menambahkan saldo kuota langsung ke pengguna tertentu oleh Administrator (MANUAL_ADJUSTMENT)
   */
  async addUserQuota(
    userId: string,
    payload: AddUserQuotaPayload
  ): Promise<{ message: string; user: AdminUserItem; mutation: QuotaMutation }> {
    const response = await apiClient.post<AddUserQuotaResponse>(
      `/api/admin/users/${userId}/quota`,
      payload
    );
    return {
      message: response.data.message,
      user: response.data.data.user,
      mutation: response.data.data.mutation,
    };
  },

  /**
   * Menangguhkan ('SUSPENDED') atau mengaktifkan kembali ('ACTIVE') akun pengguna
   */
  async updateUserStatus(
    userId: string,
    status: 'ACTIVE' | 'SUSPENDED'
  ): Promise<{ message: string; user: AdminUserItem }> {
    const response = await apiClient.patch<{
      status: string;
      message: string;
      data: { user: AdminUserItem };
    }>(`/api/admin/users/${userId}/status`, { status });
    return {
      message: response.data.message,
      user: response.data.data.user,
    };
  },
};

export default adminModel;
