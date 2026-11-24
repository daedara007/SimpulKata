export type QuotaMutationType = 'CREDIT' | 'DEBIT';

export type QuotaMutationReferenceType =
  | 'TOPUP'
  | 'TRANSCRIPTION'
  | 'REGISTRATION'
  | 'REFUND'
  | 'MANUAL_ADJUSTMENT';

export interface QuotaMutation {
  id: string;
  user_id: string;
  type: QuotaMutationType;
  amount_seconds: number;
  balance_before: number;
  balance_after: number;
  description: string;
  reference_type: QuotaMutationReferenceType;
  reference_id: string | null;
  created_at: string;
}

export interface CreateQuotaMutationParams {
  userId: string;
  type: QuotaMutationType;
  amountSeconds: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  referenceType: QuotaMutationReferenceType;
  referenceId?: string | null;
}

export interface QuotaMutationFilter {
  page?: number;
  limit?: number;
  type?: 'ALL' | QuotaMutationType;
}

export interface QuotaMutationListResponse {
  mutations: QuotaMutation[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
