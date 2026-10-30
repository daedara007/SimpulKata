/**
 * services/emailService.ts - Layanan Pengiriman Email Transaksional via Resend
 *
 * Mengimplementasikan:
 * - SD-01 Langkah 15: kirimEmailOTP(Email, kodeOTP)
 * - SD-03 Langkah 11: kirimEmailResetOTP(Email, kodeOTP)
 * - Template HTML responsif modern bertema SimpulKata
 * - Fallback dev logger jika kuota/sandbox Resend terbatas saat pengujian lokal
 */

import { Resend } from 'resend';

export interface SendOtpEmailParams {
  to: string;
  name?: string | null;
  otpCode: string;
  minutesValid?: number;
}

export interface EmailResult {
  success: boolean;
  delivered?: boolean;
  mock?: boolean;
  message?: string;
  warning?: string;
  id?: string;
  otpCode?: string;
}

export class EmailService {
  private apiKey: string;
  private fromEmail: string;
  private client: Resend | null;

  constructor() {
    this.apiKey = process.env.RESEND_API_KEY || '';
    this.fromEmail = process.env.EMAIL_FROM || 'SimpulKata <onboarding@resend.dev>';
    this.client = this.apiKey ? new Resend(this.apiKey) : null;
  }

  /**
   * Menghasilkan template email HTML untuk kode verifikasi OTP
   */
  generateOtpEmailTemplate({
    name,
    otpCode,
    minutesValid = 5,
  }: {
    name?: string | null;
    otpCode: string;
    minutesValid?: number;
  }): string {
    const safeName = name ? String(name).replace(/[<>&"]/g, '') : 'Pengguna';

    return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verifikasi Akun SimpulKata</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f1f5f9;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0b0f19; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 540px; background: linear-gradient(145deg, #131b2e 0%, #0f172a 100%); border-radius: 24px; border: 1px solid rgba(99, 102, 241, 0.2); box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4); overflow: hidden;">
          <!-- Header Banner -->
          <tr>
            <td style="padding: 36px 36px 20px 36px; text-align: center; border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
              <div style="display: inline-block; padding: 8px 16px; background: rgba(99, 102, 241, 0.12); border: 1px solid rgba(99, 102, 241, 0.25); border-radius: 9999px; font-size: 12px; font-weight: 600; color: #818cf8; letter-spacing: 0.5px; margin-bottom: 12px;">
                ✨ SimpulKata AI Platform
              </div>
              <h1 style="margin: 0; font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                Verifikasi Akun Anda
              </h1>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 32px 36px 24px 36px;">
              <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #cbd5e1;">
                Halo <strong>${safeName}</strong>,
              </p>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #94a3b8;">
                Terima kasih telah mendaftar di <strong>SimpulKata</strong>. Untuk melanjutkan dan mengaktifkan akun Anda, silakan masukkan 6-digit kode OTP di bawah ini pada layar verifikasi:
              </p>

              <!-- OTP Code Display Card -->
              <div style="background: rgba(15, 23, 42, 0.8); border: 2px dashed rgba(99, 102, 241, 0.4); border-radius: 16px; padding: 24px 16px; text-align: center; margin: 24px 0;">
                <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 12px; color: #a5b4fc; display: inline-block; padding-left: 12px;">
                  ${otpCode}
                </span>
                <div style="margin-top: 10px; font-size: 12px; color: #64748b;">
                  ⏱️ Berlaku selama <strong>${minutesValid} menit</strong>
                </div>
              </div>

              <!-- Warning Box -->
              <div style="background: rgba(244, 63, 94, 0.08); border-left: 3px solid #f43f5e; border-radius: 4px; padding: 12px 16px; margin: 24px 0;">
                <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #fda4af;">
                  <strong>Penting:</strong> Jangan pernah memberikan kode ini kepada siapa pun. Tim SimpulKata tidak akan pernah meminta kode OTP Anda.
                </p>
              </div>

              <p style="margin: 24px 0 0 0; font-size: 13px; line-height: 1.5; color: #64748b;">
                Jika Anda tidak merasa melakukan pendaftaran akun di SimpulKata, Anda dapat mengabaikan email ini dengan aman.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 36px 28px 36px; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.05); background: rgba(11, 15, 25, 0.5);">
              <p style="margin: 0; font-size: 12px; color: #475569;">
                &copy; 2026 SimpulKata AI • Implementasi & Pengujian Perangkat Lunak
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  /**
   * Mengirim email kode verifikasi OTP ke pengguna
   */
  async sendOtpEmail({
    to,
    name,
    otpCode,
    minutesValid = 5,
  }: SendOtpEmailParams): Promise<EmailResult> {
    const subject = `Kode Verifikasi Akun SimpulKata: ${otpCode}`;
    const htmlContent = this.generateOtpEmailTemplate({ name, otpCode, minutesValid });
    const textContent = `Halo ${name || 'Pengguna'},\n\nKode verifikasi OTP akun SimpulKata Anda adalah: ${otpCode}\nKode ini berlaku selama ${minutesValid} menit.\n\nJangan berikan kode ini kepada siapapun.\n\nSalam,\nTim SimpulKata`;

    console.log(`[EmailService] 📧 Menyiapkan pengiriman OTP [${otpCode}] ke ${to} (Berlaku: ${minutesValid}m)`);

    if (!this.client || !this.apiKey) {
      console.warn(`[EmailService] ⚠️ RESEND_API_KEY belum dikonfigurasi. Kode OTP dicatat di konsol: [ ${otpCode} ]`);
      return {
        success: true,
        mock: true,
        message: 'Email OTP diproses dalam mode lokal/mock.',
        otpCode,
      };
    }

    try {
      const response = await this.client.emails.send({
        from: this.fromEmail,
        to: [to],
        subject,
        html: htmlContent,
        text: textContent,
      });

      if (response.error) {
        console.warn(`[EmailService] ⚠️ Resend API returned error:`, response.error);
        console.log(`[EmailService] 💡 [DEV FALLBACK] Kode OTP Anda adalah: [ ${otpCode} ]`);
        return {
          success: true,
          delivered: false,
          warning: response.error.message,
          otpCode,
        };
      }

      console.log(`[EmailService] ✅ Email OTP berhasil dikirim ke ${to} (Resend ID: ${response.data?.id})`);
      return {
        success: true,
        delivered: true,
        id: response.data?.id,
      };
    } catch (err: any) {
      console.error(`[EmailService] ❌ Gagal mengirim email via Resend:`, err.message);
      console.log(`[EmailService] 💡 [DEV FALLBACK] Kode OTP Anda adalah: [ ${otpCode} ]`);
      return {
        success: true,
        delivered: false,
        warning: err.message,
        otpCode,
      };
    }
  }

  /**
   * Menghasilkan template email HTML untuk pemulihan kata sandi (SD-03)
   */
  generatePasswordResetEmailTemplate({
    name,
    otpCode,
    minutesValid = 5,
  }: {
    name?: string | null;
    otpCode: string;
    minutesValid?: number;
  }): string {
    const safeName = name ? String(name).replace(/[<>&"]/g, '') : 'Pengguna';

    return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pemulihan Kata Sandi SimpulKata</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f1f5f9;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0b0f19; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 540px; background: linear-gradient(145deg, #131b2e 0%, #0f172a 100%); border-radius: 24px; border: 1px solid rgba(244, 63, 94, 0.2); box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4); overflow: hidden;">
          <!-- Header Banner -->
          <tr>
            <td style="padding: 36px 36px 20px 36px; text-align: center; border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
              <div style="display: inline-block; padding: 8px 16px; background: rgba(244, 63, 94, 0.12); border: 1px solid rgba(244, 63, 94, 0.25); border-radius: 9999px; font-size: 12px; font-weight: 600; color: #fb7185; letter-spacing: 0.5px; margin-bottom: 12px;">
                🔐 SimpulKata Keamanan Akun
              </div>
              <h1 style="margin: 0; font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                Pemulihan Kata Sandi
              </h1>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 32px 36px 24px 36px;">
              <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #cbd5e1;">
                Halo <strong>${safeName}</strong>,
              </p>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #94a3b8;">
                Kami menerima permintaan untuk menyetel ulang kata sandi akun <strong>SimpulKata</strong> Anda. Gunakan kode OTP 6-digit berikut untuk memverifikasi permintaan pemulihan kata sandi:
              </p>

              <!-- OTP Code Display Card -->
              <div style="background: rgba(15, 23, 42, 0.8); border: 2px dashed rgba(244, 63, 94, 0.4); border-radius: 16px; padding: 24px 16px; text-align: center; margin: 24px 0;">
                <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 12px; color: #fda4af; display: inline-block; padding-left: 12px;">
                  ${otpCode}
                </span>
                <div style="margin-top: 10px; font-size: 12px; color: #64748b;">
                  ⏱️ Berlaku selama <strong>${minutesValid} menit</strong>
                </div>
              </div>

              <!-- Warning Box -->
              <div style="background: rgba(244, 63, 94, 0.08); border-left: 3px solid #f43f5e; border-radius: 4px; padding: 12px 16px; margin: 24px 0;">
                <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #fda4af;">
                  <strong>Penting:</strong> Jangan pernah membagikan kode ini kepada siapa pun. Jika Anda tidak merasa meminta reset kata sandi, akun Anda tetap aman dan Anda dapat mengabaikan email ini.
                </p>
              </div>

              <p style="margin: 24px 0 0 0; font-size: 13px; line-height: 1.5; color: #64748b;">
                Setelah memasukkan kode OTP di aplikasi, Anda dapat langsung membuat kata sandi baru minimal 8 karakter.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 36px 28px 36px; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.05); background: rgba(11, 15, 25, 0.5);">
              <p style="margin: 0; font-size: 12px; color: #475569;">
                &copy; 2026 SimpulKata AI • Implementasi & Pengujian Perangkat Lunak
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  /**
   * Mengirim email kode pemulihan kata sandi (SD-03 Langkah 11)
   */
  async sendPasswordResetEmail({
    to,
    name,
    otpCode,
    minutesValid = 5,
  }: SendOtpEmailParams): Promise<EmailResult> {
    const subject = `Kode Pemulihan Kata Sandi SimpulKata: ${otpCode}`;
    const htmlContent = this.generatePasswordResetEmailTemplate({ name, otpCode, minutesValid });
    const textContent = `Halo ${name || 'Pengguna'},\n\nKami menerima permintaan untuk mereset kata sandi akun SimpulKata Anda.\nKode OTP pemulihan kata sandi Anda adalah: ${otpCode}\nKode ini berlaku selama ${minutesValid} menit.\n\nJangan berikan kode ini kepada siapapun.\nJika Anda tidak meminta reset kata sandi, abaikan email ini.\n\nSalam,\nTim SimpulKata`;

    console.log(`[EmailService] 📧 Menyiapkan pengiriman OTP Reset Password [${otpCode}] ke ${to} (Berlaku: ${minutesValid}m)`);

    if (!this.client || !this.apiKey) {
      console.warn(`[EmailService] ⚠️ RESEND_API_KEY belum dikonfigurasi. Kode OTP Reset dicatat di konsol: [ ${otpCode} ]`);
      return {
        success: true,
        mock: true,
        message: 'Email OTP Reset diproses dalam mode lokal/mock.',
        otpCode,
      };
    }

    try {
      const response = await this.client.emails.send({
        from: this.fromEmail,
        to: [to],
        subject,
        html: htmlContent,
        text: textContent,
      });

      if (response.error) {
        console.warn(`[EmailService] ⚠️ Resend API returned error:`, response.error);
        console.log(`[EmailService] 💡 [DEV FALLBACK] Kode OTP Reset Password Anda adalah: [ ${otpCode} ]`);
        return {
          success: true,
          delivered: false,
          warning: response.error.message,
          otpCode,
        };
      }

      console.log(`[EmailService] ✅ Email OTP Reset Password berhasil dikirim ke ${to} (Resend ID: ${response.data?.id})`);
      return {
        success: true,
        delivered: true,
        id: response.data?.id,
      };
    } catch (err: any) {
      console.error(`[EmailService] ❌ Gagal mengirim email reset via Resend:`, err.message);
      console.log(`[EmailService] 💡 [DEV FALLBACK] Kode OTP Reset Password Anda adalah: [ ${otpCode} ]`);
      return {
        success: true,
        delivered: false,
        warning: err.message,
        otpCode,
      };
    }
  }

  /**
   * Menghasilkan template email HTML untuk verifikasi pergantian email (SD-04 Langkah 16)
   */
  generateEmailChangeOtpTemplate({
    name,
    otpCode,
    minutesValid = 5,
  }: {
    name?: string | null;
    otpCode: string;
    minutesValid?: number;
  }): string {
    const safeName = name ? String(name).replace(/[<>&"]/g, '') : 'Pengguna';

    return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verifikasi Alamat Email Baru - SimpulKata</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f1f5f9;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0b0f19; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 540px; background: linear-gradient(145deg, #131b2e 0%, #0f172a 100%); border-radius: 24px; border: 1px solid rgba(16, 185, 129, 0.25); box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4); overflow: hidden;">
          <!-- Header Banner -->
          <tr>
            <td style="padding: 36px 36px 20px 36px; text-align: center; border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
              <div style="display: inline-block; padding: 8px 16px; background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 9999px; font-size: 12px; font-weight: 600; color: #34d399; letter-spacing: 0.5px; margin-bottom: 12px;">
                🔄 Verifikasi Email Baru
              </div>
              <h1 style="margin: 0; font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                Konfirmasi Pergantian Email
              </h1>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 32px 36px 24px 36px;">
              <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #cbd5e1;">
                Halo <strong>${safeName}</strong>,
              </p>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #94a3b8;">
                Kami menerima permintaan untuk memperbarui alamat email akun <strong>SimpulKata</strong> Anda ke alamat email ini. Masukkan kode OTP 6-digit berikut pada aplikasi untuk mengonfirmasi:
              </p>

              <!-- OTP Code Display Card -->
              <div style="background: rgba(15, 23, 42, 0.8); border: 2px dashed rgba(16, 185, 129, 0.4); border-radius: 16px; padding: 24px 16px; text-align: center; margin: 24px 0;">
                <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 12px; color: #6ee7b7; display: inline-block; padding-left: 12px;">
                  ${otpCode}
                </span>
                <div style="margin-top: 10px; font-size: 12px; color: #64748b;">
                  ⏱️ Berlaku selama <strong>${minutesValid} menit</strong>
                </div>
              </div>

              <!-- Warning Box -->
              <div style="background: rgba(244, 63, 94, 0.08); border-left: 3px solid #f43f5e; border-radius: 4px; padding: 12px 16px; margin: 24px 0;">
                <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #fda4af;">
                  <strong>Penting:</strong> Jika Anda tidak pernah meminta pergantian alamat email ini, abaikan email ini dan akun Anda akan tetap menggunakan email sebelumnya.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 36px 28px 36px; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.05); background: rgba(11, 15, 25, 0.5);">
              <p style="margin: 0; font-size: 12px; color: #475569;">
                &copy; 2026 SimpulKata AI • Implementasi & Pengujian Perangkat Lunak
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  /**
   * Mengirim email kode verifikasi pergantian email baru (SD-04 Langkah 16)
   */
  async sendEmailChangeOtp({
    to,
    name,
    otpCode,
    minutesValid = 5,
  }: SendOtpEmailParams): Promise<EmailResult> {
    const subject = `Kode Verifikasi Email Baru SimpulKata: ${otpCode}`;
    const htmlContent = this.generateEmailChangeOtpTemplate({ name, otpCode, minutesValid });
    const textContent = `Halo ${name || 'Pengguna'},\n\nKode verifikasi OTP untuk konfirmasi pergantian email akun SimpulKata Anda adalah: ${otpCode}\nKode ini berlaku selama ${minutesValid} menit.\n\nJangan berikan kode ini kepada siapapun.\n\nSalam,\nTim SimpulKata`;

    console.log(`[EmailService] 📧 Menyiapkan pengiriman OTP Pergantian Email [${otpCode}] ke ${to} (Berlaku: ${minutesValid}m)`);

    if (!this.client || !this.apiKey) {
      console.warn(`[EmailService] ⚠️ RESEND_API_KEY belum dikonfigurasi. Kode OTP Pergantian Email dicatat di konsol: [ ${otpCode} ]`);
      return {
        success: true,
        mock: true,
        message: 'Email OTP Pergantian Email diproses dalam mode lokal/mock.',
        otpCode,
      };
    }

    try {
      const response = await this.client.emails.send({
        from: this.fromEmail,
        to: [to],
        subject,
        html: htmlContent,
        text: textContent,
      });

      if (response.error) {
        console.warn(`[EmailService] ⚠️ Resend API returned error:`, response.error);
        console.log(`[EmailService] 💡 [DEV FALLBACK] Kode OTP Pergantian Email Anda adalah: [ ${otpCode} ]`);
        return {
          success: true,
          delivered: false,
          warning: response.error.message,
          otpCode,
        };
      }

      console.log(`[EmailService] ✅ Email OTP Pergantian Email berhasil dikirim ke ${to} (Resend ID: ${response.data?.id})`);
      return {
        success: true,
        delivered: true,
        id: response.data?.id,
      };
    } catch (err: any) {
      console.error(`[EmailService] ❌ Gagal mengirim email pergantian via Resend:`, err.message);
      console.log(`[EmailService] 💡 [DEV FALLBACK] Kode OTP Pergantian Email Anda adalah: [ ${otpCode} ]`);
      return {
        success: true,
        delivered: false,
        warning: err.message,
        otpCode,
      };
    }
  }
}

export const emailService = new EmailService();
export default emailService;

