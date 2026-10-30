export type TranscriptStatus = 'processing' | 'completed' | 'failed' | 'pending';

export interface TranscriptRow {
  id: string;
  user_id?: string;
  original_file_name: string;
  file_path?: string;
  status: TranscriptStatus;
  raw_text: string | null;
  summary_text: string | null;
  duration_seconds: number;
  tokens_used: number;
  word_count?: number;
  created_at: Date | string;
  updated_at?: Date | string;
}

export interface CreateTranscriptDTO {
  userId: string;
  originalFileName: string;
  filePath: string;
  durationSeconds: number;
  status?: TranscriptStatus;
}

export interface UpdateCompletedDTO {
  rawText: string;
  summaryText: string;
  durationSeconds: number;
  tokensUsed?: number;
}

export interface UpdateFailedDTO {
  summaryText?: string | null;
  rawText?: string | null;
}

export interface FindHistoryParams {
  userId: string;
  status?: string | null;
  limit?: number;
  offset?: number;
}

export interface CountHistoryParams {
  userId: string;
  status?: string | null;
}

