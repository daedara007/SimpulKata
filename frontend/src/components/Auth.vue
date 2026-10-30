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
        <div v-if="activeTab !== 'otp' && activeTab !== 'forgot-password'" class="flex p-1 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs font-semibold">
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

        <!-- Banner Mode Verifikasi OTP -->
        <div v-else-if="activeTab === 'otp'" class="flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs">
          <span class="text-indigo-300 font-medium flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-indigo-400 animate-ping"></span>
            Verifikasi Email OTP
          </span>
          <button
            type="button"
            class="text-slate-400 hover:text-white underline text-[11px] cursor-pointer transition-colors"
            @click="switchTab('login')"
          >
            Kembali ke Login
          </button>
        </div>

        <!-- Banner Mode Pemulihan Kata Sandi (SRS UC-03 & SD-03) -->
        <div v-else-if="activeTab === 'forgot-password'" class="flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs">
          <span class="text-rose-300 font-medium flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-rose-400"></span>
            Pemulihan Kata Sandi
          </span>
          <button
            type="button"
            class="text-slate-400 hover:text-white underline text-[11px] cursor-pointer transition-colors"
            @click="switchTab('login')"
          >
            Kembali ke Login
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
            <div class="flex items-center justify-between">
              <label class="block text-xs font-medium text-slate-300">Kata Sandi</label>
              <button
                type="button"
                class="text-[11px] font-medium text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                @click="switchTab('forgot-password')"
              >
                Lupa kata sandi?
              </button>
            </div>
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
        <form v-else-if="activeTab === 'register'" class="space-y-4" @submit.prevent="handleRegister">
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
            :disabled="isLoading || Boolean(registerForm.confirmPassword && registerForm.password !== registerForm.confirmPassword)"
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

        <!-- ========================================================= -->
        <!-- FORM VERIFIKASI OTP (SRS UC-01 & SD-01)                  -->
        <!-- ========================================================= -->
        <form v-else-if="activeTab === 'otp'" class="space-y-5" @submit.prevent="handleVerifyOtp">
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
              v-model="otpCode"
              type="text"
              inputmode="numeric"
              maxlength="6"
              required
              placeholder="• • • • • •"
              class="w-full py-3 px-4 rounded-xl bg-slate-950 border border-indigo-500/40 text-indigo-300 placeholder-slate-700 text-2xl font-mono font-bold tracking-[14px] text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 transition-all shadow-inner"
              autocomplete="one-time-code"
            />
            <div class="flex items-center justify-between text-[11px] text-slate-400 px-1">
              <span>Masa berlaku kode:</span>
              <span class="font-mono font-semibold" :class="otpCountdown > 60 ? 'text-indigo-400' : 'text-rose-400 animate-pulse'">
                {{ Math.floor(otpCountdown / 60).toString().padStart(2, '0') }}:{{ (otpCountdown % 60).toString().padStart(2, '0') }}
              </span>
            </div>
          </div>

          <!-- Tombol Verifikasi & Instant Login (Opsi B) -->
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
              @click="handleResendOtp"
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

        <!-- ========================================================= -->
        <!-- FORM PEMULIHAN KATA SANDI (SRS UC-03 & SD-03)             -->
        <!-- ========================================================= -->
        <div v-else-if="activeTab === 'forgot-password'" class="space-y-5">
          <!-- Tahap 1: Input Email untuk Request OTP (SD-03 Langkah 1-4) -->
          <form v-if="resetStage === 'email'" class="space-y-4" @submit.prevent="handleForgotPassword">
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
                  v-model="forgotEmail"
                  type="email"
                  required
                  placeholder="nama@email.com"
                  class="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all"
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
                @click="switchTab('login')"
              >
                ← Kembali ke Halaman Masuk
              </button>
            </div>
          </form>

          <!-- Tahap 2: Input OTP & Kata Sandi Baru (SD-03 Langkah 14-16) -->
          <form v-else-if="resetStage === 'reset'" class="space-y-4" @submit.prevent="handleResetPassword">
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
                  @click="resetStage = 'email'"
                >
                  (Ubah)
                </button>
              </p>
            </div>

            <!-- Input OTP 6-Digit -->
            <div class="space-y-1.5 text-left">
              <label class="block text-xs font-medium text-slate-300">Kode OTP 6-Digit</label>
              <input
                v-model="resetOtpCode"
                type="text"
                inputmode="numeric"
                maxlength="6"
                required
                placeholder="• • • • • •"
                class="w-full py-2.5 px-4 rounded-xl bg-slate-950 border border-rose-500/40 text-rose-300 placeholder-slate-700 text-xl font-mono font-bold tracking-[10px] text-center focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-400 transition-all shadow-inner"
                autocomplete="one-time-code"
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
                  v-model="newPassword"
                  :type="showNewPassword ? 'text' : 'password'"
                  required
                  minlength="8"
                  placeholder="Minimal 8 karakter"
                  class="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all"
                />
                <button
                  type="button"
                  class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                  @click="showNewPassword = !showNewPassword"
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
                  v-model="confirmNewPassword"
                  :type="showConfirmPassword ? 'text' : 'password'"
                  required
                  minlength="8"
                  placeholder="Ulangi kata sandi baru"
                  class="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all"
                />
                <button
                  type="button"
                  class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                  @click="showConfirmPassword = !showConfirmPassword"
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
                @click="handleResendResetOtp"
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
