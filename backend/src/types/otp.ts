export type OtpContext = 'registration' | 'forgot_password' | string;

export interface OtpRequestRow {
  id: string;
  user_id: string;
  otp_code: string;
  context: OtpContext;
  expires_at: Date | string;
  is_used: boolean;
  created_at: Date | string;
}

export interface CreateOtpDTO {
  userId: string;
  otpCode: string;
  context?: OtpContext;
  minutesValid?: number;
}

export interface FindOtpDTO {
  userId: string;
  otpCode: string;
  context?: OtpContext;
}

export interface OtpCooldownResult {
  onCooldown: boolean;
  remainingSeconds: number;
}

