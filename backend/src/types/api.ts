export interface ApiSuccessResponse<T = unknown> {
  status: 'success';
  message?: string;
  data: T;
  [key: string]: unknown;
}

export interface ApiErrorResponse {
  status: 'error';
  code: string;
  message: string;
  details?: unknown;
  detail?: string;
}

