import { ref, reactive } from 'vue';
import { authModel } from '../models/authModel';

/**
 * controllers/authController.js - Controller untuk Form & Alur Autentikasi (MVC)
 *
 * Mengelola:
 * - State login & registrasi pengguna
 * - Validasi input lokal
 * - Orkestrasi pemanggilan authModel
 * - Penyimpanan sesi ke localStorage
 */

export function useAuthController(initialTab = 'login', emit = null) {
  const activeTab = ref(initialTab);
  const showPassword = ref(false);
  const isLoading = ref(false);
  const errorMessage = ref('');
  const successMessage = ref('');

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
        successMessage.value = 'Registrasi berhasil! Silakan masuk dengan email dan kata sandi baru Anda.';

        // Salin email ke form login dan alihkan ke tab login
        loginForm.email = registerForm.email;
        loginForm.password = '';

        // Reset form register
        registerForm.name = '';
        registerForm.email = '';
        registerForm.password = '';
        registerForm.confirmPassword = '';

        setTimeout(() => {
          activeTab.value = 'login';
        }, 1200);

        return { success: true };
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

  return {
    activeTab,
    showPassword,
    isLoading,
    errorMessage,
    successMessage,
    loginForm,
    registerForm,
    switchTab,
    fillDemoAccount,
    handleLogin,
    handleRegister,
  };
}

export default useAuthController;

