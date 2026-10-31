<template>
  <form class="space-y-4" @submit.prevent="$emit('submit')">
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

    <!-- Input Kata Sandi -->
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
          placeholder="Minimal 8 karakter kombinasi huruf & angka"
          class="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
        />
        <button
          type="button"
          class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
          @click="$emit('update:showPassword', !showPassword)"
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

    <!-- Input Konfirmasi Sandi -->
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

    <!-- Indikator Ketentuan Kata Sandi -->
    <div class="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1 text-[11px] text-left">
      <p class="font-medium text-slate-400">Ketentuan kata sandi:</p>
      <div class="grid grid-cols-2 gap-1 text-[10px]">
        <div class="flex items-center gap-1.5" :class="registerForm.password.length >= 8 ? 'text-emerald-400' : 'text-slate-500'">
          <span>{{ registerForm.password.length >= 8 ? '✓' : '•' }}</span> Minimal 8 karakter
        </div>
        <div class="flex items-center gap-1.5" :class="(registerForm.password && /[A-Za-z]/.test(registerForm.password) && /\d/.test(registerForm.password)) ? 'text-emerald-400' : 'text-slate-500'">
          <span>{{ (registerForm.password && /[A-Za-z]/.test(registerForm.password) && /\d/.test(registerForm.password)) ? '✓' : '•' }}</span> Huruf & angka
        </div>
        <div class="flex items-center gap-1.5 col-span-2" :class="(registerForm.confirmPassword && registerForm.password === registerForm.confirmPassword) ? 'text-emerald-400' : 'text-slate-500'">
          <span>{{ (registerForm.confirmPassword && registerForm.password === registerForm.confirmPassword) ? '✓' : '•' }}</span> Konfirmasi cocok
        </div>
      </div>
    </div>

    <!-- Tombol Daftar -->
    <button
      type="submit"
      :disabled="isLoading || registerForm.password.length < 8 || !(/[A-Za-z]/.test(registerForm.password) && /\d/.test(registerForm.password)) || registerForm.password !== registerForm.confirmPassword"
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
</template>

<script setup lang="ts">
import type { RegisterPayload } from '../../types';

defineProps<{
  registerForm: RegisterPayload & { confirmPassword?: string };
  showPassword: boolean;
  isLoading: boolean;
}>();

defineEmits<{
  (e: 'update:showPassword', value: boolean): void;
  (e: 'submit'): void;
}>();
</script>

