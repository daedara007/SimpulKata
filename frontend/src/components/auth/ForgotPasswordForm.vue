<template>
  <div class="space-y-5">
    <!-- Tahap 1: Input Email untuk Request OTP -->
    <form v-if="resetStage === 'email'" class="space-y-4" @submit.prevent="$emit('submit-email')">
      <div class="text-center space-y-1.5">
        <div class="w-12 h-12 mx-auto rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        </div>
        <h2 class="text-lg font-bold text-white">Lupa Kata Sandi?</h2>
        <p class="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
          Masukkan email akun Anda. Kami akan mengirimkan 6-digit kode OTP untuk memverifikasi pemulihan kata sandi.
        </p>
      </div>

      <!-- Input Email -->
      <div class="space-y-1.5 text-left">
        <label class="block text-xs font-medium text-slate-300">Email Akun Terdaftar</label>
        <div class="relative">
          <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
            </svg>
          </span>
          <input
            :value="forgotEmail"
            type="email"
            required
            placeholder="nama@email.com"
            class="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all"
            @input="$emit('update:forgotEmail', ($event.target as HTMLInputElement).value)"
          />
        </div>
      </div>

      <!-- Tombol Kirim Kode OTP -->
      <button
        type="submit"
        :disabled="isSendingResetOtp"
        class="w-full mt-2 py-3 px-4 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-rose-600 via-rose-500 to-pink-600 hover:from-rose-500 hover:to-pink-500 shadow-lg shadow-rose-600/30 hover:shadow-rose-600/50 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        <svg
          v-if="isSendingResetOtp"
          class="w-4 h-4 animate-spin text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>{{ isSendingResetOtp ? 'Mengirim Kode OTP...' : 'Kirim Kode OTP Pemulihan' }}</span>
      </button>

      <!-- Tautan Kembali -->
      <div class="text-center pt-2">
        <button
          type="button"
          class="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
          @click="$emit('switch-tab', 'login')"
        >
          ← Kembali ke Halaman Masuk
        </button>
      </div>
    </form>

    <!-- Tahap 2: Input OTP & Kata Sandi Baru -->
    <form v-else-if="resetStage === 'reset'" class="space-y-4" @submit.prevent="$emit('submit-reset')">
      <div class="text-center space-y-1.5">
        <div class="w-12 h-12 mx-auto rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
          <svg class="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 class="text-lg font-bold text-white">Buat Kata Sandi Baru</h2>
        <p class="text-xs text-slate-400 leading-relaxed">
          Kode verifikasi telah dikirimkan ke <br/>
          <span class="font-semibold text-rose-300">{{ forgotEmail }}</span>
          <button
            type="button"
            class="ml-1.5 text-slate-400 hover:text-white underline text-[11px] cursor-pointer"
            @click="$emit('update:resetStage', 'email')"
          >
            (Ubah)
          </button>
        </p>
      </div>

      <!-- Input OTP 6-Digit -->
      <div class="space-y-1.5 text-left">
        <label class="block text-xs font-medium text-slate-300">Kode OTP 6-Digit</label>
        <input
          :value="resetOtpCode"
          type="text"
          inputmode="numeric"
          maxlength="6"
          required
          placeholder="• • • • • •"
          class="w-full py-2.5 px-4 rounded-xl bg-slate-950 border border-rose-500/40 text-rose-300 placeholder-slate-700 text-xl font-mono font-bold tracking-[10px] text-center focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-400 transition-all shadow-inner"
          autocomplete="one-time-code"
          @input="$emit('update:resetOtpCode', ($event.target as HTMLInputElement).value)"
        />
      </div>

      <!-- Input Kata Sandi Baru -->
      <div class="space-y-1.5 text-left">
        <label class="block text-xs font-medium text-slate-300">Kata Sandi Baru (Min. 8 karakter)</label>
        <div class="relative">
          <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </span>
          <input
            :value="newPassword"
            :type="showNewPassword ? 'text' : 'password'"
            required
            minlength="8"
            placeholder="Minimal 8 karakter kombinasi huruf & angka"
            class="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all"
            @input="$emit('update:newPassword', ($event.target as HTMLInputElement).value)"
          />
          <button
            type="button"
            class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
            @click="$emit('update:showNewPassword', !showNewPassword)"
          >
            <svg v-if="!showNewPassword" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Input Konfirmasi Kata Sandi Baru -->
      <div class="space-y-1.5 text-left">
        <label class="block text-xs font-medium text-slate-300">Konfirmasi Kata Sandi Baru</label>
        <div class="relative">
          <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
          <input
            :value="confirmNewPassword"
            :type="showConfirmPassword ? 'text' : 'password'"
            required
            minlength="8"
            placeholder="Ulangi kata sandi baru"
            class="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all"
            @input="$emit('update:confirmNewPassword', ($event.target as HTMLInputElement).value)"
          />
          <button
            type="button"
            class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
            @click="$emit('update:showConfirmPassword', !showConfirmPassword)"
          >
            <svg v-if="!showConfirmPassword" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Tombol Simpan Sandi Baru -->
      <button
        type="submit"
        :disabled="isResettingPassword || resetOtpCode.length !== 6 || newPassword.length < 8"
        class="w-full mt-2 py-3 px-4 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-rose-600 via-rose-500 to-pink-600 hover:from-rose-500 hover:to-pink-500 shadow-lg shadow-rose-600/30 hover:shadow-rose-600/50 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        <svg
          v-if="isResettingPassword"
          class="w-4 h-4 animate-spin text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>{{ isResettingPassword ? 'Menyimpan Kata Sandi...' : 'Simpan Kata Sandi Baru' }}</span>
      </button>

      <!-- Kirim Ulang OTP Reset -->
      <div class="text-center pt-2">
        <button
          type="button"
          :disabled="isSendingResetOtp || resetCooldown > 0"
          class="text-xs text-rose-400 hover:text-rose-300 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors font-medium inline-flex items-center gap-1.5 cursor-pointer"
          @click="$emit('resend-otp')"
        >
          <svg v-if="isSendingResetOtp" class="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>
            {{ resetCooldown > 0 ? `Kirim ulang kode dalam ${resetCooldown}s` : 'Tidak menerima kode? Kirim Ulang' }}
          </span>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import type { AuthTab } from '../../controllers/authController';

defineProps<{
  resetStage: 'email' | 'reset';
  forgotEmail: string;
  resetOtpCode: string;
  newPassword: string;
  confirmNewPassword: string;
  showNewPassword: boolean;
  showConfirmPassword: boolean;
  isSendingResetOtp: boolean;
  isResettingPassword: boolean;
  resetCooldown: number;
}>();

defineEmits<{
  (e: 'update:forgotEmail', value: string): void;
  (e: 'update:resetOtpCode', value: string): void;
  (e: 'update:newPassword', value: string): void;
  (e: 'update:confirmNewPassword', value: string): void;
  (e: 'update:showNewPassword', value: boolean): void;
  (e: 'update:showConfirmPassword', value: boolean): void;
  (e: 'update:resetStage', value: 'email' | 'reset'): void;
  (e: 'submit-email'): void;
  (e: 'submit-reset'): void;
  (e: 'resend-otp'): void;
  (e: 'switch-tab', tab: AuthTab): void;
}>();
</script>

