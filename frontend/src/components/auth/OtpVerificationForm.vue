<template>
  <form class="space-y-5" @submit.prevent="$emit('submit')">
    <div class="text-center space-y-2">
      <div class="w-12 h-12 mx-auto rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
        <svg class="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </div>
      <h2 class="text-lg font-bold text-white">Masukkan Kode OTP</h2>
      <p class="text-xs text-slate-400 leading-relaxed">
        Kode verifikasi 6-digit telah dikirimkan ke <br/>
        <span class="font-semibold text-slate-200">{{ pendingEmail }}</span>
      </p>
    </div>

    <!-- Input OTP 6-Digit -->
    <div class="space-y-2">
      <input
        :value="otpCode"
        type="text"
        inputmode="numeric"
        maxlength="6"
        required
        placeholder="• • • • • •"
        class="w-full py-3 px-4 rounded-xl bg-slate-950 border border-indigo-500/40 text-indigo-300 placeholder-slate-700 text-2xl font-mono font-bold tracking-[14px] text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 transition-all shadow-inner"
        autocomplete="one-time-code"
        @input="$emit('update:otpCode', ($event.target as HTMLInputElement).value)"
      />
      <div class="flex items-center justify-between text-[11px] text-slate-400 px-1">
        <span>Masa berlaku kode:</span>
        <span class="font-mono font-semibold" :class="otpCountdown > 60 ? 'text-indigo-400' : 'text-rose-400 animate-pulse'">
          {{ Math.floor(otpCountdown / 60).toString().padStart(2, '0') }}:{{ (otpCountdown % 60).toString().padStart(2, '0') }}
        </span>
      </div>
    </div>

    <!-- Tombol Verifikasi & Masuk -->
    <button
      type="submit"
      :disabled="isVerifyingOtp || otpCode.length !== 6"
      class="w-full py-3 px-4 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
    >
      <svg
        v-if="isVerifyingOtp"
        class="w-4 h-4 animate-spin text-white"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span>{{ isVerifyingOtp ? 'Memverifikasi...' : 'Verifikasi & Masuk' }}</span>
    </button>

    <!-- Kirim Ulang OTP -->
    <div class="text-center pt-2">
      <button
        type="button"
        :disabled="isResendingOtp || resendCooldown > 0"
        class="text-xs text-indigo-400 hover:text-indigo-300 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors font-medium inline-flex items-center gap-1.5 cursor-pointer"
        @click="$emit('resend')"
      >
        <svg v-if="isResendingOtp" class="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>
          {{ resendCooldown > 0 ? `Kirim ulang kode dalam ${resendCooldown}s` : 'Tidak menerima kode? Kirim Ulang' }}
        </span>
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
defineProps<{
  pendingEmail: string;
  otpCode: string;
  otpCountdown: number;
  resendCooldown: number;
  isVerifyingOtp: boolean;
  isResendingOtp: boolean;
}>();

defineEmits<{
  (e: 'update:otpCode', value: string): void;
  (e: 'submit'): void;
  (e: 'resend'): void;
}>();
</script>

