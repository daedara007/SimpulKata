<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
    <!-- Background Ambient Glow -->
    <div class="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none"></div>
    <div class="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none"></div>

    <div class="w-full max-w-md relative z-10 space-y-6">
      <!-- Navigation Back to Home -->
      <div class="flex items-center justify-between">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer group"
          @click="$emit('back-to-home')"
        >
          <svg class="w-4 h-4 text-slate-400 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Kembali ke Beranda</span>
        </button>
      </div>
      <!-- Brand Header -->
      <div class="text-center space-y-2">
        <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold tracking-wide">
          <svg class="w-4 h-4 text-indigo-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          SimpulKata AI Platform
        </div>
        <h1 class="text-3xl font-extrabold tracking-tight text-white">
          Simpul<span class="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Kata</span>
        </h1>
        <p class="text-xs sm:text-sm text-slate-400">
          Transkripsi Rapat & Kuliah Akurat dengan Rangkuman AI Otomatis
        </p>
      </div>

      <!-- Main Auth Card -->
      <div class="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
        <!-- Tab Selector: Masuk / Daftar -->
        <div class="flex p-1 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs font-semibold">
          <button
            type="button"
            class="flex-1 py-2.5 rounded-xl transition-all duration-200"
            :class="activeTab === 'login' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25' : 'text-slate-400 hover:text-white'"
            @click="switchTab('login')"
          >
            Masuk
          </button>
          <button
            type="button"
            class="flex-1 py-2.5 rounded-xl transition-all duration-200"
            :class="activeTab === 'register' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25' : 'text-slate-400 hover:text-white'"
            @click="switchTab('register')"
          >
            Daftar Akun Baru
          </button>
        </div>

        <!-- Alert Error Message -->
        <div
          v-if="errorMessage"
          class="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-fadeIn"
        >
          <svg class="w-4 h-4 shrink-0 mt-0.5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div class="flex-1">{{ errorMessage }}</div>
        </div>

        <!-- Alert Success Message -->
        <div
          v-if="successMessage"
          class="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5 animate-fadeIn"
        >
          <svg class="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div class="flex-1">{{ successMessage }}</div>
        </div>

        <!-- ========================================================= -->
        <!-- FORM LOGIN (SRS UC-02 & SD-02)                           -->
        <!-- ========================================================= -->
        <form v-if="activeTab === 'login'" class="space-y-4" @submit.prevent="handleLogin">
          <!-- Input Email -->
          <div class="space-y-1.5 text-left">
            <label class="block text-xs font-medium text-slate-300">Alamat Email</label>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </span>
              <input
                v-model="loginForm.email"
                type="email"
                required
                placeholder="nama@email.com"
                class="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          <!-- Input Kata Sandi -->
          <div class="space-y-1.5 text-left">
            <label class="block text-xs font-medium text-slate-300">Kata Sandi</label>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </span>
              <input
                v-model="loginForm.password"
                :type="showPassword ? 'text' : 'password'"
                required
                placeholder="••••••••"
                class="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
              <button
                type="button"
                class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                @click="showPassword = !showPassword"
              >
                <svg v-if="!showPassword" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Tombol Masuk -->
          <button
            type="submit"
            :disabled="isLoading"
            class="w-full mt-2 py-3 px-4 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <svg
              v-if="isLoading"
              class="w-4 h-4 animate-spin text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>{{ isLoading ? 'Memverifikasi...' : 'Masuk ke Aplikasi' }}</span>
          </button>

          <!-- Tombol Cepat Akun Demo Testing -->
          <div class="pt-2 border-t border-slate-800/80 text-center">
            <button
              type="button"
              class="text-[11px] text-slate-400 hover:text-indigo-400 transition-colors"
              @click="fillDemoAccount"
            >
              Gunakan Akun Admin Demo (<span class="font-mono text-indigo-400">admin@simpulkata.id</span>)
            </button>
          </div>
        </form>

        <!-- ========================================================= -->
        <!-- FORM REGISTRASI (SRS UC-01 & SD-01)                       -->
        <!-- ========================================================= -->
        <form v-else class="space-y-4" @submit.prevent="handleRegister">
          <!-- Banner Bonus Kuota Akun Baru -->
          <div class="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[11px] flex items-center gap-2">
            <span>🎉</span>
            <span>Pendaftaran baru otomatis mendapatkan <strong>30 menit kuota gratis</strong> untuk transkripsi audio!</span>
          </div>

          <!-- Input Nama Lengkap -->
          <div class="space-y-1.5 text-left">
            <label class="block text-xs font-medium text-slate-300">Nama Lengkap</label>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </span>
              <input
                v-model="registerForm.name"
                type="text"
                required
                placeholder="Contoh: Kevin Pratama"
                class="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          <!-- Input Email -->
          <div class="space-y-1.5 text-left">
            <label class="block text-xs font-medium text-slate-300">Alamat Email</label>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </span>
              <input
                v-model="registerForm.email"
                type="email"
                required
                placeholder="nama@email.com"
                class="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          <!-- Input Kata Sandi (Minimal 8 Karakter sesuai SD-01 langkah 6) -->
          <div class="space-y-1.5 text-left">
            <div class="flex items-center justify-between">
              <label class="block text-xs font-medium text-slate-300">Kata Sandi</label>
              <span class="text-[10px] text-slate-500 font-mono">Min. 8 karakter</span>
            </div>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </span>
              <input
                v-model="registerForm.password"
                :type="showPassword ? 'text' : 'password'"
                required
                minlength="8"
                placeholder="Minimal 8 karakter"
                class="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
              <button
                type="button"
                class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                @click="showPassword = !showPassword"
              >
                <svg v-if="!showPassword" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Input Konfirmasi Sandi (Kecocokan Sandi sesuai SD-01) -->
          <div class="space-y-1.5 text-left">
            <label class="block text-xs font-medium text-slate-300">Konfirmasi Kata Sandi</label>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </span>
              <input
                v-model="registerForm.confirmPassword"
                :type="showPassword ? 'text' : 'password'"
                required
                minlength="8"
                placeholder="Ulangi kata sandi"
                class="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
            </div>
            <p
              v-if="registerForm.confirmPassword && registerForm.password !== registerForm.confirmPassword"
              class="text-[11px] text-rose-400 font-medium"
            >
              Konfirmasi kata sandi tidak cocok.
            </p>
          </div>

          <!-- Tombol Daftar -->
          <button
            type="submit"
            :disabled="isLoading || (registerForm.confirmPassword && registerForm.password !== registerForm.confirmPassword)"
            class="w-full mt-2 py-3 px-4 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <svg
              v-if="isLoading"
              class="w-4 h-4 animate-spin text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>{{ isLoading ? 'Mendaftarkan Akun...' : 'Daftar Sekarang' }}</span>
          </button>
        </form>
      </div>

      <!-- Footer Info -->
      <p class="text-center text-xs text-slate-500">
        &copy; 2026 SimpulKata. Hak Cipta Dilindungi.
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import axios from 'axios';

const props = defineProps({
  initialTab: {
    type: String,
    default: 'login',
  },
});

const emit = defineEmits(['login-success', 'back-to-home']);

const activeTab = ref(props.initialTab || 'login');
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
    const response = await axios.post('/api/auth/login', {
      email: loginForm.email,
      password: loginForm.password,
    });

    if (response.data?.status === 'success') {
      const { token, user } = response.data;
      
      // Simpan ke localStorage sesuai spesifikasi tugas
      localStorage.setItem('simpulkata_token', token);
      localStorage.setItem('simpulkata_user', JSON.stringify(user));

      emit('login-success', { token, user });
    } else {
      throw new Error(response.data?.message || 'Login gagal.');
    }
  } catch (err) {
    console.error('[Auth] Login error:', err);
    if (err.response?.data?.message) {
      errorMessage.value = err.response.data.message;
    } else if (err.code === 'ERR_NETWORK' || !err.response) {
      errorMessage.value = 'Terjadi kesalahan saat masuk. Pastikan server backend aktif.';
    } else if (err.response?.status >= 500) {
      errorMessage.value = 'Terjadi kesalahan pada server. Silakan coba beberapa saat lagi.';
    } else {
      errorMessage.value = 'Terjadi kesalahan saat masuk. Pastikan server backend aktif.';
    }
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
    return;
  }

  if (registerForm.password !== registerForm.confirmPassword) {
    errorMessage.value = 'Konfirmasi kata sandi tidak cocok.';
    return;
  }

  isLoading.value = true;

  try {
    const response = await axios.post('/api/auth/register', {
      name: registerForm.name,
      email: registerForm.email,
      password: registerForm.password,
    });

    if (response.data?.status === 'success') {
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
    } else {
      throw new Error(response.data?.message || 'Registrasi gagal.');
    }
  } catch (err) {
    console.error('[Auth] Register error:', err);
    if (err.response?.data?.message) {
      errorMessage.value = err.response.data.message;
    } else if (err.code === 'ERR_NETWORK' || !err.response) {
      errorMessage.value = 'Gagal mendaftarkan akun. Silakan coba lagi.';
    } else if (err.response?.status >= 500) {
      errorMessage.value = 'Terjadi gangguan internal pada server. Silakan coba beberapa saat lagi.';
    } else {
      errorMessage.value = 'Gagal mendaftarkan akun. Silakan coba lagi.';
    }
  } finally {
    isLoading.value = false;
  }
}
</script>

<style scoped>
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-fadeIn {
  animation: fadeIn 0.2s ease-out forwards;
}
</style>
