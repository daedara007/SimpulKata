<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
    @click.self="handleClose"
  >
    <div class="relative w-full max-w-lg bg-slate-900/95 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-7 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
      <!-- Header Modal & Tab Navigasi -->
      <div class="pb-4 border-b border-slate-800">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <svg v-if="activeTab === 'profile'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <h3 class="text-lg font-bold text-white tracking-tight">Pengaturan Akun</h3>
              <p class="text-xs text-slate-400">Kelola identitas profil dan keamanan kata sandi Anda</p>
            </div>
          </div>
          <button
            type="button"
            class="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Tutup"
            @click="handleClose"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Tab Navigasi -->
        <div class="flex gap-2 p-1 bg-slate-950/60 rounded-xl border border-slate-800/80">
          <button
            type="button"
            class="flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
            :class="activeTab === 'profile' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'"
            @click="activeTab = 'profile'"
          >
            <span>👤</span> Profil Saya
          </button>
          <button
            type="button"
            class="flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
            :class="activeTab === 'password' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'"
            @click="activeTab = 'password'"
          >
            <span>🔒</span> Ubah Sandi
          </button>
        </div>
      </div>

      <!-- ========================================== -->
      <!-- TAB 1: PENGATURAN PROFIL                  -->
      <!-- ========================================== -->
      <div v-if="activeTab === 'profile'">
        <!-- Notifikasi Error & Sukses Profil -->
        <div v-if="errorMessage" class="mt-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
          <svg class="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{{ errorMessage }}</span>
        </div>

        <div v-if="successMessage" class="mt-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5">
          <svg class="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          <span>{{ successMessage }}</span>
        </div>

        <!-- FORM UTAMA PROFIL -->
        <form v-if="!emailChangePending" class="mt-5 space-y-5" @submit.prevent="onSaveProfile">
          <!-- Pemilihan Avatar -->
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-2.5">Foto / Avatar Profil</label>
            <div class="flex items-center gap-4">
              <!-- Pratinjau Avatar Terpilih -->
              <div class="relative">
                <img
                  v-if="avatarUrl"
                  :src="avatarUrl"
                  alt="Avatar"
                  class="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-500 shadow-lg shadow-indigo-500/20 bg-slate-800"
                />
                <div
                  v-else
                  class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white text-2xl font-bold flex items-center justify-center shadow-lg border-2 border-indigo-500/50"
                >
                  {{ (name || userData?.name || 'U').charAt(0).toUpperCase() }}
                </div>
              </div>

              <!-- Pilihan Preset Avatar -->
              <div class="flex-1">
                <p class="text-[11px] text-slate-400 mb-2">Pilih avatar preset AI atau gunakan inisial nama:</p>
                <div class="flex flex-wrap gap-2">
                  <!-- Pilihan Inisial -->
                  <button
                    type="button"
                    class="w-9 h-9 rounded-xl border flex items-center justify-center text-xs font-bold transition-all cursor-pointer"
                    :class="!avatarUrl ? 'border-indigo-400 bg-indigo-500/20 text-white ring-2 ring-indigo-500/40' : 'border-slate-800 bg-slate-800/80 text-slate-400 hover:text-white hover:border-slate-700'"
                    title="Gunakan Inisial Nama"
                    @click="selectAvatar(null)"
                  >
                    {{ (name || userData?.name || 'U').charAt(0).toUpperCase() }}
                  </button>

                  <!-- 6 Preset Avatar Bot/AI -->
                  <button
                    v-for="preset in AVATAR_PRESETS"
                    :key="preset.id"
                    type="button"
                    class="w-9 h-9 rounded-xl border p-0.5 transition-all cursor-pointer overflow-hidden"
                    :class="avatarUrl === preset.url ? 'border-indigo-400 bg-indigo-500/20 ring-2 ring-indigo-500/40 scale-105' : 'border-slate-800 bg-slate-800/80 hover:border-slate-700 opacity-70 hover:opacity-100'"
                    :title="preset.label"
                    @click="selectAvatar(preset.url)"
                  >
                    <img :src="preset.url" :alt="preset.label" class="w-full h-full object-cover rounded-lg" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Input Nama Lengkap -->
          <div>
            <div class="flex justify-between items-center mb-1.5">
              <label for="profile-name" class="block text-xs font-semibold text-slate-300">Nama Lengkap</label>
              <span class="text-[11px] text-slate-500">{{ name.length }}/100</span>
            </div>
            <input
              id="profile-name"
              v-model="name"
              type="text"
              maxlength="100"
              required
              placeholder="Masukkan nama lengkap Anda"
              class="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
          </div>

          <!-- Input Email -->
          <div>
            <div class="flex justify-between items-center mb-1.5">
              <label for="profile-email" class="block text-xs font-semibold text-slate-300">Alamat Email</label>
              <span v-if="email.toLowerCase() !== originalEmail.toLowerCase()" class="text-[11px] text-amber-400 font-medium">
                ⚠️ Memerlukan verifikasi OTP
              </span>
            </div>
            <input
              id="profile-email"
              v-model="email"
              type="email"
              required
              placeholder="nama@email.com"
              class="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
            <p class="text-[11px] text-slate-500 mt-1">
              Jika email diubah, kami akan mengirimkan kode verifikasi OTP 6-digit ke email baru.
            </p>
          </div>

          <!-- Input Password Saat Ini -->
          <div>
            <label for="profile-current-password" class="block text-xs font-semibold text-slate-300 mb-1.5">
              Konfirmasi Password Saat Ini <span class="text-rose-400">*</span>
            </label>
            <div class="relative">
              <input
                id="profile-current-password"
                v-model="currentPassword"
                :type="showPassword ? 'text' : 'password'"
                required
                placeholder="Masukkan kata sandi akun Anda"
                class="w-full pl-3.5 pr-10 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                @click="showPassword = !showPassword"
              >
                <svg v-if="showPassword" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                </svg>
                <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
            </div>
            <p class="text-[11px] text-slate-500 mt-1">
              Dibutuhkan untuk memastikan otorisasi perubahan profil pemilik akun.
            </p>
          </div>

          <!-- Tombol Aksi Modal Profil -->
          <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              class="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              :disabled="isLoading"
              @click="handleClose"
            >
              Batal
            </button>
            <button
              type="submit"
              class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              :disabled="isLoading || !name || !currentPassword"
            >
              <svg v-if="isLoading" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>{{ isLoading ? 'Menyimpan...' : 'Simpan Perubahan' }}</span>
            </button>
          </div>
        </form>

        <!-- DIALOG VERIFIKASI OTP PERGANTIAN EMAIL -->
        <div v-else class="mt-5 space-y-4">
          <div class="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-slate-300 text-xs space-y-1.5">
            <p class="font-semibold text-amber-300 flex items-center gap-1.5">
              <span>📩</span> Verifikasi Alamat Email Baru
            </p>
            <p>
              Kami telah mengirimkan 6-digit kode OTP ke <strong>{{ newPendingEmail }}</strong>. Masukkan kode tersebut untuk meresmikan alamat email baru Anda:
            </p>
          </div>

          <div v-if="otpErrorMessage" class="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {{ otpErrorMessage }}
          </div>
          <div v-if="otpSuccessMessage" class="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
            {{ otpSuccessMessage }}
          </div>

          <div>
            <label for="email-otp-code" class="block text-xs font-semibold text-slate-300 mb-1.5">Kode OTP (6 Digit)</label>
            <input
              id="email-otp-code"
              v-model="otpCode"
              type="text"
              maxlength="6"
              placeholder="Contoh: 123456"
              class="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-center text-lg font-mono tracking-widest text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div class="flex items-center justify-between pt-3 border-t border-slate-800">
            <button
              type="button"
              class="text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              @click="cancelEmailChange"
            >
              ← Batal Ganti Email
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50 cursor-pointer"
              :disabled="isVerifyingOtp || otpCode.length !== 6"
              @click="onVerifyEmailOtp"
            >
              <svg v-if="isVerifyingOtp" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>{{ isVerifyingOtp ? 'Memverifikasi...' : 'Verifikasi & Perbarui' }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ============================================== -->
      <!-- TAB 2: FORM UBAH KATA SANDI                    -->
      <!-- ============================================== -->
      <div v-else-if="activeTab === 'password'" class="mt-4 space-y-4">
        <!-- Notifikasi Error & Sukses Kata Sandi -->
        <div v-if="pwdErrorMessage" class="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
          <svg class="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{{ pwdErrorMessage }}</span>
        </div>

        <div v-if="pwdSuccessMessage" class="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5">
          <svg class="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          <span>{{ pwdSuccessMessage }}</span>
        </div>

        <form class="space-y-4" @submit.prevent="onChangePassword">
          <!-- Password Saat Ini -->
          <div>
            <label for="pwd-current" class="block text-xs font-semibold text-slate-300 mb-1.5">
              Password Saat Ini <span class="text-rose-400">*</span>
            </label>
            <div class="relative">
              <input
                id="pwd-current"
                v-model="pwdCurrent"
                :type="showPwdCurrent ? 'text' : 'password'"
                required
                placeholder="Masukkan password akun Anda saat ini"
                class="w-full pl-3.5 pr-10 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                @click="showPwdCurrent = !showPwdCurrent"
              >
                <svg v-if="showPwdCurrent" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                </svg>
                <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Password Baru -->
          <div>
            <label for="pwd-new" class="block text-xs font-semibold text-slate-300 mb-1.5">
              Password Baru <span class="text-rose-400">*</span>
            </label>
            <div class="relative">
              <input
                id="pwd-new"
                v-model="pwdNew"
                :type="showPwdNew ? 'text' : 'password'"
                required
                placeholder="Minimal 8 karakter kombinasi huruf & angka"
                class="w-full pl-3.5 pr-10 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                @click="showPwdNew = !showPwdNew"
              >
                <svg v-if="showPwdNew" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                </svg>
                <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Konfirmasi Password Baru -->
          <div>
            <label for="pwd-confirm" class="block text-xs font-semibold text-slate-300 mb-1.5">
              Konfirmasi Password Baru <span class="text-rose-400">*</span>
            </label>
            <div class="relative">
              <input
                id="pwd-confirm"
                v-model="pwdConfirm"
                :type="showPwdConfirm ? 'text' : 'password'"
                required
                placeholder="Ulangi password baru Anda"
                class="w-full pl-3.5 pr-10 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                @click="showPwdConfirm = !showPwdConfirm"
              >
                <svg v-if="showPwdConfirm" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                </svg>
                <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Syarat & Ketentuan Keamanan Password -->
          <div class="p-3 bg-slate-950/50 rounded-xl border border-slate-800/80 space-y-1.5 text-[11px]">
            <p class="font-medium text-slate-400">Ketentuan kata sandi:</p>
            <div class="grid grid-cols-2 gap-1.5">
              <div class="flex items-center gap-1.5" :class="pwdHasMinLength ? 'text-emerald-400' : 'text-slate-500'">
                <span>{{ pwdHasMinLength ? '✓' : '•' }}</span> Minimal 8 karakter
              </div>
              <div class="flex items-center gap-1.5" :class="(pwdHasLetter && pwdHasDigit) ? 'text-emerald-400' : 'text-slate-500'">
                <span>{{ (pwdHasLetter && pwdHasDigit) ? '✓' : '•' }}</span> Huruf & angka
              </div>
              <div class="flex items-center gap-1.5" :class="pwdIsMatched ? 'text-emerald-400' : 'text-slate-500'">
                <span>{{ pwdIsMatched ? '✓' : '•' }}</span> Konfirmasi cocok
              </div>
              <div class="flex items-center gap-1.5" :class="pwdIsNotSame ? 'text-emerald-400' : 'text-slate-500'">
                <span>{{ pwdIsNotSame ? '✓' : '•' }}</span> Berbeda dari sandi lama
              </div>
            </div>
            <p class="text-[10px] text-slate-500 pt-1 border-t border-slate-800/50">
              🔒 Mengubah kata sandi akan otomatis mencabut seluruh sesi login Anda di perangkat lain demi keamanan akun.
            </p>
          </div>

          <!-- Tombol Aksi Form Ubah Sandi -->
          <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              class="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              :disabled="pwdIsLoading"
              @click="handleClose"
            >
              Batal
            </button>
            <button
              type="submit"
              class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              :disabled="pwdIsLoading || !isPwdFormValid"
            >
              <svg v-if="pwdIsLoading" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>{{ pwdIsLoading ? 'Memproses...' : 'Ubah Kata Sandi' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch } from 'vue';
import { useProfileController, AVATAR_PRESETS } from '../../controllers/useProfileController';
import type { User } from '../../types';

const props = defineProps<{
  isOpen: boolean;
  userData?: User | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'user-updated', user: User): void;
  (e: 'logout'): void;
}>();

const {
  activeTab,
  name,
  email,
  originalEmail,
  avatarUrl,
  currentPassword,
  showPassword,
  isLoading,
  errorMessage,
  successMessage,
  emailChangePending,
  newPendingEmail,
  otpCode,
  isVerifyingOtp,
  otpErrorMessage,
  otpSuccessMessage,
  pwdCurrent,
  pwdNew,
  pwdConfirm,
  showPwdCurrent,
  showPwdNew,
  showPwdConfirm,
  pwdIsLoading,
  pwdErrorMessage,
  pwdSuccessMessage,
  pwdHasMinLength,
  pwdHasLetter,
  pwdHasDigit,
  pwdIsMatched,
  pwdIsNotSame,
  isPwdFormValid,
  openModal,
  closeModal,
  selectAvatar,
  handleSaveProfile,
  handleVerifyEmailOtp,
  cancelEmailChange,
  handleChangePassword,
} = useProfileController();

watch(
  () => props.isOpen,
  (newVal) => {
    if (newVal && props.userData) {
      openModal(props.userData);
    }
  }
);

function handleClose() {
  closeModal();
  emit('close');
}

async function onSaveProfile() {
  await handleSaveProfile((updatedUser) => {
    emit('user-updated', updatedUser);
  });
}

async function onVerifyEmailOtp() {
  await handleVerifyEmailOtp((updatedUser) => {
    emit('user-updated', updatedUser);
  });
}

async function onChangePassword() {
  await handleChangePassword(() => {
    emit('logout');
  });
}
</script>

