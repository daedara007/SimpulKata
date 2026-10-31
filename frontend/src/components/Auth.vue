<template>
  <div class="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 font-sans relative overflow-hidden">
    <!-- Tombol Navigasi Kembali ke Beranda -->
    <div class="absolute top-4 left-4 sm:top-6 sm:left-6 z-20">
      <button
        type="button"
        class="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-900/60 hover:bg-slate-800 border border-slate-800 backdrop-blur-sm transition-all cursor-pointer"
        @click="$emit('back-to-home')"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span>Kembali ke Beranda</span>
      </button>
    </div>

    <!-- Background Orbs Dekoratif -->
    <div class="absolute top-1/4 -left-20 w-80 h-80 bg-indigo-600/15 rounded-full blur-[100px] pointer-events-none"></div>
    <div class="absolute bottom-1/4 -right-20 w-80 h-80 bg-purple-600/15 rounded-full blur-[100px] pointer-events-none"></div>

    <div class="w-full max-w-md space-y-6 relative z-10">
      <!-- Logo & Brand Header -->
      <div class="text-center space-y-2">
        <div class="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 shadow-xl shadow-indigo-500/20 mb-1">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" />
          </svg>
        </div>
        <h1 class="text-2xl font-black tracking-tight text-white">SimpulKata</h1>
        <p class="text-xs text-slate-400">Platform Transkripsi & Rangkuman Percakapan AI</p>
      </div>

      <!-- Auth Card Container -->
      <div class="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-2xl backdrop-blur-xl space-y-6">
        <!-- Tab Navigasi Mode (Login vs Register) -->
        <div v-if="activeTab === 'login' || activeTab === 'register'" class="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-slate-950/70 border border-slate-800/80 text-xs">
          <button
            type="button"
            class="py-2.5 rounded-xl font-semibold transition-all duration-200 cursor-pointer"
            :class="activeTab === 'login' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-slate-200'"
            @click="switchTab('login')"
          >
            Masuk
          </button>
          <button
            type="button"
            class="py-2.5 rounded-xl font-semibold transition-all duration-200 cursor-pointer"
            :class="activeTab === 'register' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-slate-200'"
            @click="switchTab('register')"
          >
            Daftar Akun
          </button>
        </div>

        <!-- Banner Mode OTP -->
        <div v-else-if="activeTab === 'otp'" class="flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs">
          <span class="text-indigo-300 font-medium flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-indigo-400 animate-ping"></span>
            Verifikasi Akun Baru
          </span>
          <button
            type="button"
            class="text-slate-400 hover:text-white transition-colors cursor-pointer"
            @click="switchTab('login')"
          >
            Batal
          </button>
        </div>

        <!-- Banner Mode Pemulihan Kata Sandi -->
        <div v-else-if="activeTab === 'forgot-password'" class="flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs">
          <span class="text-rose-300 font-medium flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-rose-400"></span>
            Mode Pemulihan Kata Sandi
          </span>
          <button
            type="button"
            class="text-slate-400 hover:text-white transition-colors cursor-pointer"
            @click="switchTab('login')"
          >
            Batal
          </button>
        </div>

        <!-- Notifikasi Error Global -->
        <div
          v-if="errorMessage"
          class="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-fadeIn"
        >
          <svg class="w-4 h-4 text-rose-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div class="flex-1 leading-relaxed">{{ errorMessage }}</div>
          <button
            type="button"
            class="text-rose-400 hover:text-rose-200 cursor-pointer"
            @click="errorMessage = ''"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Notifikasi Sukses Global -->
        <div
          v-if="successMessage"
          class="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5 animate-fadeIn"
        >
          <svg class="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div class="flex-1 leading-relaxed">{{ successMessage }}</div>
        </div>

        <!-- Form 1: Login -->
        <LoginForm
          v-if="activeTab === 'login'"
          :login-form="loginForm"
          :show-password="showPassword"
          :is-loading="isLoading"
          @update:show-password="showPassword = $event"
          @switch-tab="switchTab"
          @submit="handleLogin"
          @fill-demo="fillDemoAccount"
        />

        <!-- Form 2: Registrasi -->
        <RegisterForm
          v-else-if="activeTab === 'register'"
          :register-form="registerForm"
          :show-password="showPassword"
          :is-loading="isLoading"
          @update:show-password="showPassword = $event"
          @submit="handleRegister"
        />

        <!-- Form 3: Verifikasi OTP -->
        <OtpVerificationForm
          v-else-if="activeTab === 'otp'"
          :pending-email="pendingEmail"
          :otp-code="otpCode"
          :otp-countdown="otpCountdown"
          :resend-cooldown="resendCooldown"
          :is-verifying-otp="isVerifyingOtp"
          :is-resending-otp="isResendingOtp"
          @update:otp-code="otpCode = $event"
          @submit="handleVerifyOtp"
          @resend="handleResendOtp"
        />

        <!-- Form 4: Pemulihan Kata Sandi -->
        <ForgotPasswordForm
          v-else-if="activeTab === 'forgot-password'"
          :reset-stage="resetStage"
          :forgot-email="forgotEmail"
          :reset-otp-code="resetOtpCode"
          :new-password="newPassword"
          :confirm-new-password="confirmNewPassword"
          :show-new-password="showNewPassword"
          :show-confirm-password="showConfirmPassword"
          :is-sending-reset-otp="isSendingResetOtp"
          :is-resetting-password="isResettingPassword"
          :reset-cooldown="resetCooldown"
          @update:forgot-email="forgotEmail = $event"
          @update:reset-otp-code="resetOtpCode = $event"
          @update:new-password="newPassword = $event"
          @update:confirm-new-password="confirmNewPassword = $event"
          @update:show-new-password="showNewPassword = $event"
          @update:show-confirm-password="showConfirmPassword = $event"
          @update:reset-stage="resetStage = $event"
          @submit-email="handleForgotPassword"
          @submit-reset="handleResetPassword"
          @resend-otp="handleResendResetOtp"
          @switch-tab="switchTab"
        />
      </div>

      <!-- Footer Info -->
      <p class="text-center text-xs text-slate-500">
        &copy; 2026 SimpulKata. Hak Cipta Dilindungi.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthController, type AuthTab } from '../controllers/authController';
import type { SessionData } from '../types';

import LoginForm from './auth/LoginForm.vue';
import RegisterForm from './auth/RegisterForm.vue';
import OtpVerificationForm from './auth/OtpVerificationForm.vue';
import ForgotPasswordForm from './auth/ForgotPasswordForm.vue';

interface Props {
  initialTab?: AuthTab;
}

const props = withDefaults(defineProps<Props>(), {
  initialTab: 'login',
});

const emit = defineEmits<{
  (e: 'login-success', data: SessionData): void;
  (e: 'back-to-home'): void;
}>();

const {
  activeTab,
  showPassword,
  isLoading,
  errorMessage,
  successMessage,
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
  handleForgotPassword,
  handleResetPassword,
  handleResendResetOtp,
} = useAuthController(props.initialTab, emit);
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
