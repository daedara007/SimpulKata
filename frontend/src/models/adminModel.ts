/**
 * models/adminModel.ts - HTTP Client untuk Administrasi & Log Sistem (UC-15 / SD-15)
 *
 * Mengikuti aturan arsitektur: Seluruh panggilan API WAJIB menggunakan path relatif (/api/...)
 */

import axios from 'axios';

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

export const adminModel = {
  /**
   * Mengambil riwayat log sistem dari backend (SD-15 Langkah 2)
   */
  async getLogs(params: LogFilterParams = {}): Promise<GetLogsResponse['data']> {
    const response = await axios.get<GetLogsResponse>('/api/admin/logs', {
      params,
    });
    return response.data.data;
  },

  /**
   * Mengunduh berkas laporan CSV log sistem (SD-15 Langkah 9-12)
   */
  async downloadLogsCsv(params: LogFilterParams = {}): Promise<void> {
    const response = await axios.get('/api/admin/logs/export', {
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
    const response = await axios.get<GetUsersResponse>('/api/admin/users', {
      params,
    });
    return response.data.data;
  },

  /**
   * Mengunduh berkas laporan CSV daftar pengguna (SD-16 Langkah 8-12)
   */
  async downloadUsersCsv(params: UserFilterParams = {}): Promise<void> {
    const response = await axios.get('/api/admin/users/export', {
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
};

export default adminModel;
