import { ref, reactive, onUnmounted } from 'vue';
import { authModel } from '../models/authModel';
import type { LoginCredentials, RegisterPayload } from '../types';

/**
 * controllers/authController.ts - Controller untuk Form & Alur Autentikasi (MVC)
 *
 * Mengelola:
 * - State login, registrasi, dan verifikasi OTP 6-digit (SRS UC-01 & SD-01)
 * - State lupa kata sandi & pemulihan via OTP (SRS UC-03 & SD-03)
 * - Timer kedaluwarsa OTP (5 menit) dan cooldown kirim ulang (60 detik)
 * - Validasi input lokal
 * - Orkestrasi pemanggilan authModel
 * - Penyimpanan sesi ke localStorage
 */

export type AuthTab = 'login' | 'register' | 'otp' | 'forgot-password';

export function useAuthController(initialTab: AuthTab = 'login', emit?: (...args: any[]) => any) {
  const activeTab = ref<AuthTab>(initialTab);
  const showPassword = ref<boolean>(false);
  const isLoading = ref<boolean>(false);
  const errorMessage = ref<string>('');
  const successMessage = ref<string>('');

  // State Verifikasi OTP Registrasi
  const pendingUserId = ref<string>('');
  const pendingEmail = ref<string>('');
  const otpCode = ref<string>('');
  const isVerifyingOtp = ref<boolean>(false);
  const isResendingOtp = ref<boolean>(false);
  const otpCountdown = ref<number>(300); // 5 menit dalam detik
  const resendCooldown = ref<number>(0); // Cooldown kirim ulang (60 detik)

  // State Pemulihan Kata Sandi (SRS UC-03 & SD-03)
  const forgotEmail = ref<string>('');
  const resetOtpCode = ref<string>('');
  const newPassword = ref<string>('');
  const confirmNewPassword = ref<string>('');
  const showNewPassword = ref<boolean>(false);
  const showConfirmPassword = ref<boolean>(false);
  const resetStage = ref<'email' | 'reset'>('email');
  const isSendingResetOtp = ref<boolean>(false);
  const isResettingPassword = ref<boolean>(false);
  const resetCooldown = ref<number>(0);

  let otpTimerInterval: ReturnType<typeof setInterval> | null = null;
  let cooldownTimerInterval: ReturnType<typeof setInterval> | null = null;
  let resetCooldownTimerInterval: ReturnType<typeof setInterval> | null = null;

  const loginForm = reactive<LoginCredentials>({
    email: '',
    password: '',
  });

  const registerForm = reactive<RegisterPayload & { confirmPassword?: string }>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  function clearTimers() {
    if (otpTimerInterval) {
      clearInterval(otpTimerInterval);
      otpTimerInterval = null;
    }
    if (cooldownTimerInterval) {
      clearInterval(cooldownTimerInterval);
      cooldownTimerInterval = null;
    }
    if (resetCooldownTimerInterval) {
      clearInterval(resetCooldownTimerInterval);
      resetCooldownTimerInterval = null;
    }
  }

  function startResetCooldown(seconds = 60) {
    if (resetCooldownTimerInterval) clearInterval(resetCooldownTimerInterval);
    resetCooldown.value = seconds;

    resetCooldownTimerInterval = setInterval(() => {
      if (resetCooldown.value > 0) {
        resetCooldown.value--;
      } else {
        clearInterval(resetCooldownTimerInterval!);
        resetCooldownTimerInterval = null;
      }
    }, 1000);
  }

  function startOtpCountdown(seconds = 300) {
    if (otpTimerInterval) clearInterval(otpTimerInterval);
    otpCountdown.value = seconds;

    otpTimerInterval = setInterval(() => {
      if (otpCountdown.value > 0) {
        otpCountdown.value--;
      } else {
        clearInterval(otpTimerInterval!);
        otpTimerInterval = null;
      }
    }, 1000);
  }

  function startResendCooldown(seconds = 60) {
    if (cooldownTimerInterval) clearInterval(cooldownTimerInterval);
    resendCooldown.value = seconds;

    cooldownTimerInterval = setInterval(() => {
      if (resendCooldown.value > 0) {
        resendCooldown.value--;
      } else {
        clearInterval(cooldownTimerInterval!);
        cooldownTimerInterval = null;
      }
    }, 1000);
  }

  function switchTab(tab: AuthTab) {
    activeTab.value = tab;
    errorMessage.value = '';
    successMessage.value = '';
    if (tab === 'forgot-password') {
      resetStage.value = 'email';
      if (loginForm.email) forgotEmail.value = loginForm.email;
    }
  }

  function fillDemoAccount() {
    loginForm.email = 'admin@simpulkata.id';
    loginForm.password = 'admin123';
    errorMessage.value = '';
  }

  async function handleLogin() {
    errorMessage.value = '';
    successMessage.value = '';
    isLoading.value = true;

    try {
      const data = await authModel.login({
        email: loginForm.email.trim(),
        password: loginForm.password,
      });

      if (data?.status === 'success' && data?.token && data?.user) {
        authModel.setSession({
          token: data.token,
          refreshToken: data.refreshToken,
          user: data.user,
        });

        if (emit) {
          emit('login-success', {
            token: data.token,
            refreshToken: data.refreshToken,
            user: data.user,
          });
        }
        return { success: true, token: data.token, user: data.user };
      } else {
        throw new Error(data?.message || 'Login gagal.');
      }
    } catch (err: any) {
      console.error('[AuthController] Login error:', err);

      // Cek apakah akun belum diverifikasi OTP (SRS UC-01 & SD-01)
      if (err.response?.status === 403 && err.response?.data?.code === 'ACCOUNT_NOT_VERIFIED') {
        const payload = err.response.data;
        pendingUserId.value = payload.userId || '';
        pendingEmail.value = payload.email || loginForm.email;
        activeTab.value = 'otp';
        otpCode.value = '';
        startOtpCountdown(300);
        startResendCooldown(60);
        errorMessage.value = payload.message || 'Akun Anda belum aktif. Masukkan kode OTP verifikasi.';
        return { success: false, requiresOtp: true };
      }

      if (err.response?.status === 401) {
        errorMessage.value = 'Email atau kata sandi tidak cocok. Silakan coba lagi.';
      } else if (err.code === 'ERR_NETWORK' || !err.response) {
        errorMessage.value = 'Gagal menghubungi server. Pastikan koneksi internet aktif.';
      } else if (err.response?.status >= 500) {
        errorMessage.value = 'Terjadi gangguan internal pada server. Silakan coba beberapa saat lagi.';
      } else {
        errorMessage.value = err.response?.data?.message || 'Gagal masuk. Periksa kembali email dan kata sandi Anda.';
      }
      return { success: false, error: errorMessage.value };
    } finally {
      isLoading.value = false;
    }
  }

  async function handleRegister() {
    errorMessage.value = '';
    successMessage.value = '';

    const name = registerForm.name.trim();
    const email = registerForm.email.trim();
    const password = registerForm.password;
    const confirmPassword = registerForm.confirmPassword;

    if (!name || name.length < 2) {
      errorMessage.value = 'Nama lengkap wajib diisi (minimal 2 karakter).';
      return { success: false };
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errorMessage.value = 'Format email tidak valid.';
      return { success: false };
    }

    if (!password || password.length < 8) {
      errorMessage.value = 'Kata sandi minimal 8 karakter.';
      return { success: false };
    }

    if (password !== confirmPassword) {
      errorMessage.value = 'Konfirmasi kata sandi tidak cocok.';
      return { success: false };
    }

    isLoading.value = true;

    try {
      const data = await authModel.register({
        name,
        email,
        password,
      });

      if (data?.status === 'success') {
        if (data.requiresOtp) {
          pendingUserId.value = data.userId || '';
          pendingEmail.value = data.email || email;
          activeTab.value = 'otp';
          otpCode.value = '';
          startOtpCountdown(300);
          startResendCooldown(60);
          successMessage.value = data.message || 'Kode verifikasi telah dikirimkan ke email Anda.';
          return { success: true, requiresOtp: true };
        } else {
          loginForm.email = email;
          loginForm.password = '';
          activeTab.value = 'login';
          successMessage.value = 'Akun berhasil didaftarkan! Silakan masuk dengan kata sandi baru Anda.';
          return { success: true };
        }
      } else {
        throw new Error(data?.message || 'Registrasi gagal.');
      }
    } catch (err: any) {
      console.error('[AuthController] Register error:', err);
      if (err.response?.status === 409) {
        errorMessage.value = 'Email sudah terdaftar. Silakan gunakan email lain atau masuk.';
      } else if (err.response?.data?.message) {
        errorMessage.value = err.response.data.message;
      } else if (err.code === 'ERR_NETWORK' || !err.response) {
        errorMessage.value = 'Gagal mendaftarkan akun. Silakan coba lagi.';
      } else if (err.response?.status >= 500) {
        errorMessage.value = 'Terjadi gangguan internal pada server. Silakan coba beberapa saat lagi.';
      } else {
        errorMessage.value = 'Gagal mendaftarkan akun. Silakan coba lagi.';
      }
      return { success: false, error: errorMessage.value };
    } finally {
      isLoading.value = false;
    }
  }

  async function handleVerifyOtp() {
    errorMessage.value = '';
    successMessage.value = '';

    const cleanOtp = otpCode.value.trim();
    if (!cleanOtp || cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
      errorMessage.value = 'Masukkan 6 digit angka kode verifikasi OTP.';
      return { success: false };
    }

    isVerifyingOtp.value = true;

    try {
      const data = await authModel.verifyOtp({
        userId: pendingUserId.value,
        email: pendingEmail.value,
        otpCode: cleanOtp,
      });

      if (data?.status === 'success' && data.token && data.user) {
        clearTimers();
        const { token, refreshToken, user } = data;

        // Opsi B: Instant Login setelah OTP berhasil diverifikasi
        authModel.setSession({ token, refreshToken, user });

        if (emit) {
          emit('login-success', { token, refreshToken, user });
        }
        return { success: true, token, refreshToken, user };
      } else {
        throw new Error(data?.message || 'Verifikasi OTP gagal.');
      }
    } catch (err: any) {
      console.error('[AuthController] Verify OTP error:', err);
      if (err.response?.data?.message) {
        errorMessage.value = err.response.data.message;
      } else if (err.code === 'ERR_NETWORK' || !err.response) {
        errorMessage.value = 'Gagal menghubungi server. Pastikan koneksi internet aktif.';
      } else {
        errorMessage.value = 'Kode OTP tidak valid atau telah kedaluwarsa.';
      }
      return { success: false, error: errorMessage.value };
    } finally {
      isVerifyingOtp.value = false;
    }
  }

  async function handleResendOtp() {
    if (resendCooldown.value > 0) return;

    errorMessage.value = '';
    successMessage.value = '';
    isResendingOtp.value = true;

    try {
      const data = await authModel.resendOtp({
        userId: pendingUserId.value,
        email: pendingEmail.value,
      });

      if (data?.status === 'success') {
        successMessage.value = data.message || 'Kode OTP baru telah dikirimkan ke email Anda.';
        otpCode.value = '';
        startOtpCountdown(300);
        startResendCooldown(60);
      } else {
        throw new Error(data?.message || 'Gagal mengirim ulang OTP.');
      }
    } catch (err: any) {
      console.error('[AuthController] Resend OTP error:', err);
      if (err.response?.data?.message) {
        errorMessage.value = err.response.data.message;
      } else {
        errorMessage.value = 'Gagal mengirim ulang kode OTP. Coba beberapa saat lagi.';
      }
    } finally {
      isResendingOtp.value = false;
    }
  }

  async function handleForgotPassword() {
    errorMessage.value = '';
    successMessage.value = '';

    const cleanEmail = forgotEmail.value.trim();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      errorMessage.value = 'Masukkan format email yang valid.';
      return { success: false };
    }

    isSendingResetOtp.value = true;

    try {
      const data = await authModel.forgotPassword(cleanEmail);
      if (data?.status === 'success') {
        successMessage.value = data.message || 'Kode OTP telah dikirim ke email Anda.';
        resetStage.value = 'reset';
        resetOtpCode.value = '';
        startResetCooldown(60);
        return { success: true };
      } else {
        throw new Error(data?.message || 'Gagal meminta kode OTP.');
      }
    } catch (err: any) {
      console.error('[AuthController] Forgot password error:', err);
      if (err.response?.data?.message) {
        errorMessage.value = err.response.data.message;
      } else if (err.code === 'ERR_NETWORK' || !err.response) {
        errorMessage.value = 'Gagal menghubungi server. Pastikan koneksi internet aktif.';
      } else {
        errorMessage.value = 'Gagal memproses permintaan reset kata sandi.';
      }
      return { success: false, error: errorMessage.value };
    } finally {
      isSendingResetOtp.value = false;
    }
  }

  async function handleResetPassword() {
    errorMessage.value = '';
    successMessage.value = '';

    const cleanEmail = forgotEmail.value.trim();
    const cleanOtp = resetOtpCode.value.trim();
    const pass = newPassword.value;
    const confirmPass = confirmNewPassword.value;

    if (!cleanOtp || cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
      errorMessage.value = 'Masukkan 6 digit angka kode OTP pemulihan.';
      return { success: false };
    }

    if (!pass || pass.length < 8) {
      errorMessage.value = 'Kata sandi baru minimal 8 karakter.';
      return { success: false };
    }

    if (pass !== confirmPass) {
      errorMessage.value = 'Konfirmasi kata sandi tidak cocok.';
      return { success: false };
    }

    isResettingPassword.value = true;

    try {
      const data = await authModel.resetPassword({
        email: cleanEmail,
        otpCode: cleanOtp,
        newPassword: pass,
      });

      if (data?.status === 'success') {
        clearTimers();
        loginForm.email = cleanEmail;
        loginForm.password = '';
        activeTab.value = 'login';
        successMessage.value = data.message || 'Kata sandi berhasil dipulihkan. Silakan masuk.';
        newPassword.value = '';
        confirmNewPassword.value = '';
        resetOtpCode.value = '';
        return { success: true };
      } else {
        throw new Error(data?.message || 'Gagal mereset kata sandi.');
      }
    } catch (err: any) {
      console.error('[AuthController] Reset password error:', err);
      if (err.response?.data?.message) {
        errorMessage.value = err.response.data.message;
      } else if (err.code === 'ERR_NETWORK' || !err.response) {
        errorMessage.value = 'Gagal menghubungi server. Pastikan koneksi internet aktif.';
      } else {
        errorMessage.value = 'Gagal menyetel kata sandi baru. Pastikan OTP valid.';
      }
      return { success: false, error: errorMessage.value };
    } finally {
      isResettingPassword.value = false;
    }
  }

  async function handleResendResetOtp() {
    if (resetCooldown.value > 0) return;

    errorMessage.value = '';
    successMessage.value = '';
    isSendingResetOtp.value = true;

    try {
      const data = await authModel.forgotPassword(forgotEmail.value.trim());
      if (data?.status === 'success') {
        successMessage.value = data.message || 'Kode OTP baru telah dikirimkan ke email Anda.';
        resetOtpCode.value = '';
        startResetCooldown(60);
      } else {
        throw new Error(data?.message || 'Gagal mengirim ulang OTP.');
      }
    } catch (err: any) {
      console.error('[AuthController] Resend Reset OTP error:', err);
      if (err.response?.data?.message) {
        errorMessage.value = err.response.data.message;
      } else {
        errorMessage.value = 'Gagal mengirim ulang kode OTP. Coba beberapa saat lagi.';
      }
    } finally {
      isSendingResetOtp.value = false;
    }
  }

  onUnmounted(() => {
    clearTimers();
  });

  return {
    activeTab,
    showPassword,
    isLoading,
    errorMessage,
    successMessage,
    pendingUserId,
    pendingEmail,
    otpCode,
    isVerifyingOtp,
    isResendingOtp,
    otpCountdown,
    resendCooldown,
    forgotEmail,
    resetOtpCode,
    newPassword,
    confirmNewPassword,
    showNewPassword,
    showConfirmPassword,
    resetStage,
    isSendingResetOtp,
    isResettingPassword,
    resetCooldown,
    loginForm,
    registerForm,
    switchTab,
    fillDemoAccount,
    handleLogin,
    handleRegister,
    handleVerifyOtp,
    handleResendOtp,
    handleForgotPassword,
    handleResetPassword,
    handleResendResetOtp,
  };
}

export default useAuthController;
