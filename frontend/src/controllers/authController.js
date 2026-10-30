import { ref, reactive, onUnmounted } from 'vue';
import { authModel } from '../models/authModel';

/**
 * controllers/authController.js - Controller untuk Form & Alur Autentikasi (MVC)
 *
 * Mengelola:
 * - State login, registrasi, dan verifikasi OTP 6-digit (SRS UC-01 & SD-01)
 * - Timer kedaluwarsa OTP (5 menit) dan cooldown kirim ulang (60 detik)
 * - Validasi input lokal
 * - Orkestrasi pemanggilan authModel
 * - Penyimpanan sesi ke localStorage
 */

export function useAuthController(initialTab = 'login', emit = null) {
  const activeTab = ref(initialTab); // 'login' | 'register' | 'otp'
  const showPassword = ref(false);
  const isLoading = ref(false);
  const errorMessage = ref('');
  const successMessage = ref('');

  // State Verifikasi OTP
  const pendingUserId = ref('');
  const pendingEmail = ref('');
  const otpCode = ref('');
  const isVerifyingOtp = ref(false);
  const isResendingOtp = ref(false);
  const otpCountdown = ref(300); // 5 menit dalam detik
  const resendCooldown = ref(0); // Cooldown kirim ulang (60 detik)

  let otpTimerInterval = null;
  let cooldownTimerInterval = null;

  const loginForm = reactive({
    email: '',
    password: '',
  });

  const registerForm = reactive({
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
  }

  function startOtpCountdown(seconds = 300) {
    if (otpTimerInterval) clearInterval(otpTimerInterval);
    otpCountdown.value = seconds;

    otpTimerInterval = setInterval(() => {
      if (otpCountdown.value > 0) {
        otpCountdown.value--;
      } else {
        clearInterval(otpTimerInterval);
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
        clearInterval(cooldownTimerInterval);
        cooldownTimerInterval = null;
      }
    }, 1000);
  }

  function switchTab(tab) {
    activeTab.value = tab;
    errorMessage.value = '';
    successMessage.value = '';
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
        email: loginForm.email,
        password: loginForm.password,
      });

      if (data?.status === 'success') {
        const { token, refreshToken, user } = data;

        // Simpan sesi ke storage via Model
        authModel.setSession({ token, refreshToken, user });

        if (emit) {
          emit('login-success', { token, refreshToken, user });
        }
        return { success: true, token, refreshToken, user };
      } else {
        throw new Error(data?.message || 'Login gagal.');
      }
    } catch (err) {
      console.error('[AuthController] Login error:', err);

      // Jika akun belum diverifikasi OTP (SD-01 & SD-02), arahkan langsung ke layar OTP
      if (err.response?.data?.code === 'ACCOUNT_NOT_VERIFIED') {
        pendingUserId.value = err.response.data.data?.userId || '';
        pendingEmail.value = err.response.data.data?.email || loginForm.email;
        activeTab.value = 'otp';
        otpCode.value = '';
        errorMessage.value = err.response.data.message || 'Akun Anda belum diverifikasi. Silakan masukkan kode OTP yang telah dikirim ke email.';
        startOtpCountdown(300);
        startResendCooldown(60);
        return { success: false, unverified: true };
      }

      if (err.response?.data?.message) {
        errorMessage.value = err.response.data.message;
      } else if (err.code === 'ERR_NETWORK' || !err.response) {
        errorMessage.value = 'Terjadi kesalahan saat masuk. Pastikan server backend aktif.';
      } else if (err.response?.status >= 500) {
        errorMessage.value = 'Terjadi kesalahan pada server. Silakan coba beberapa saat lagi.';
      } else {
        errorMessage.value = 'Terjadi kesalahan saat masuk. Pastikan server backend aktif.';
      }
      return { success: false, error: errorMessage.value };
    } finally {
      isLoading.value = false;
    }
  }

  async function handleRegister() {
    errorMessage.value = '';
    successMessage.value = '';

    // Validasi lokal SD-01
    if (registerForm.password.length < 8) {
      errorMessage.value = 'Kata sandi minimal 8 karakter.';
      return { success: false, error: errorMessage.value };
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      errorMessage.value = 'Konfirmasi kata sandi tidak cocok.';
      return { success: false, error: errorMessage.value };
    }

    isLoading.value = true;

    try {
      const data = await authModel.register({
        name: registerForm.name,
        email: registerForm.email,
        password: registerForm.password,
      });

      if (data?.status === 'success') {
        // Alihkan ke layar verifikasi OTP (SD-01 Langkah 18)
        pendingUserId.value = data.data?.userId || '';
        pendingEmail.value = data.data?.email || registerForm.email;
        otpCode.value = '';
        activeTab.value = 'otp';
        successMessage.value = data.message || 'Kode verifikasi telah dikirimkan ke email Anda.';

        startOtpCountdown(300);
        startResendCooldown(60);

        // Reset form register
        registerForm.name = '';
        registerForm.email = '';
        registerForm.password = '';
        registerForm.confirmPassword = '';

        return { success: true, requiresOtp: true };
      } else {
        throw new Error(data?.message || 'Registrasi gagal.');
      }
    } catch (err) {
      console.error('[AuthController] Register error:', err);
      if (err.response?.data?.message) {
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

      if (data?.status === 'success') {
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
    } catch (err) {
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
    } catch (err) {
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
    loginForm,
    registerForm,
    switchTab,
    fillDemoAccount,
    handleLogin,
    handleRegister,
    handleVerifyOtp,
    handleResendOtp,
  };
}

export default useAuthController;
