export type TranscriptStatus = 'processing' | 'completed' | 'failed';

export interface TranscriptItem {
  id: string;
  user_id?: string;
  original_file_name: string;
  file_path?: string;
  status: TranscriptStatus;
  raw_text?: string | null;
  summary_text?: string | null;
  duration_seconds: number;
  tokens_used?: number;
  word_count?: number;
  created_at: string;
  updated_at?: string;
}

export interface HistoryPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface HistoryFilter {
  status?: string;
  page?: number;
  limit?: number;
}

export interface HistoryData {
  items: TranscriptItem[];
  pagination: HistoryPagination;
}

export interface HistoryResponse {
  status: string;
  data: HistoryData;
}

export interface ProcessAudioResponse {
  status: string;
  code?: string;
  message?: string;
  transcript_id?: string;
  duration_seconds?: number;
  remaining_balance?: number;
  data?: TranscriptItem;
}
