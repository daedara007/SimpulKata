/**
 * types/log.ts - Tipe data untuk entitas 'system_logs'
 * Berdasarkan referensi/erd.puml dan SRS UC-15 / SD-15
 */

export type LogLevel = 'INFO' | 'WARN' | 'ERROR';

export type LogSource =
  | 'AUTH'
  | 'AI_SERVICE'
  | 'AUDIO_UPLOAD'
  | 'SYSTEM'
  | 'DATABASE'
  | 'USER'
  | string;

export interface SystemLogRow {
  id: string;
  level: LogLevel;
  source: string;
  message: string;
  created_at: string | Date;
}

export interface CreateLogDTO {
  level: LogLevel;
  source: LogSource;
  message: string;
}

export interface LogFilterQuery {
  level?: string;
  source?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface LogListResult {
  logs: SystemLogRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
