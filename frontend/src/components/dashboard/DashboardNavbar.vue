<template>
  <header class="border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
      <!-- 1. Logo & Brand -->
      <RouterLink to="/dashboard" class="flex items-center gap-2 sm:gap-2.5 shrink-0 group">
        <img
          src="/logo.png"
          alt="SimpulKata Logo"
          class="w-8 h-8 sm:w-9 sm:h-9 rounded-xl object-cover shadow-lg shadow-indigo-500/20 shrink-0 border border-indigo-500/20 group-hover:scale-105 transition-transform"
        />
        <div>
          <h1 class="text-base sm:text-lg font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            SimpulKata
          </h1>
          <p class="hidden 2xl:block text-[11px] text-slate-400 -mt-0.5">Transkripsi & Rangkuman AI</p>
        </div>
      </RouterLink>

      <!-- 2. Navigasi Menu Tengah (Desktop >= 1024px) -->
      <nav class="hidden lg:flex items-center gap-1 p-1 rounded-2xl bg-slate-950/80 border border-slate-800/80 shadow-inner">
        <RouterLink
          to="/dashboard"
          class="flex items-center gap-1.5 px-3 py-1.5 xl:px-4 xl:py-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer"
          :class="isTranscribeActive
            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/25'
            : 'text-slate-400 hover:text-white hover:bg-slate-800/60'"
        >
          <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" />
          </svg>
          <span><span class="hidden xl:inline">Studio </span>Transkripsi</span>
        </RouterLink>

        <RouterLink
          to="/history"
          class="flex items-center gap-1.5 px-3 py-1.5 xl:px-4 xl:py-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer"
          :class="isHistoryActive
            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/25'
            : 'text-slate-400 hover:text-white hover:bg-slate-800/60'"
        >
          <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span><span class="hidden xl:inline">Riwayat </span>Arsip</span>
        </RouterLink>

        <!-- Menu Tagihan & Transaksi Pembelian Kuota (SRS UC-18) -->
        <RouterLink
          to="/transactions"
          class="flex items-center gap-1.5 px-3 py-1.5 xl:px-4 xl:py-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer"
          :class="isTransactionsActive
            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/25'
            : 'text-slate-400 hover:text-white hover:bg-slate-800/60'"
        >
          <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          <span>Tagihan</span>
        </RouterLink>

        <!-- Menu Khusus Administrator (SRS UC-15, UC-16, UC-17) -->
        <RouterLink
          v-if="userData?.role === 'admin'"
          to="/admin/users"
          class="flex items-center gap-1.5 px-3 py-1.5 xl:px-4 xl:py-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer"
          :class="isAdminActive
            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/25'
            : 'text-amber-400/90 hover:text-amber-300 hover:bg-amber-500/10'"
        >
          <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <span><span class="hidden xl:inline">Panel </span>Admin</span>
        </RouterLink>
      </nav>

      <!-- 3. Menu Aksi Kanan -->
      <div class="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <!-- Tombol Beranda (Hanya tampil di layar sangat lebar >= 1280px agar tidak memenuhi navbar) -->
        <RouterLink
          to="/"
          class="hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span>Beranda</span>
        </RouterLink>

        <!-- Profil & Kuota (Desktop >= 640px) -->
        <div v-if="userData?.name" class="hidden sm:flex items-center gap-1.5 sm:gap-2">
          <!-- Tombol Profil Pengguna -->
          <button
            type="button"
            class="inline-flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-full text-xs font-medium bg-slate-800/80 hover:bg-indigo-500/10 text-slate-200 hover:text-white border border-slate-700 hover:border-indigo-500/40 transition-all cursor-pointer group shrink-0"
            title="Pengaturan Profil"
            @click="$emit('open-profile')"
          >
            <img
              v-if="userData.avatar_url"
              :src="userData.avatar_url"
              :alt="userData.name"
              class="w-6 h-6 rounded-full object-cover border border-indigo-400/40 group-hover:scale-105 transition-transform shrink-0"
            />
            <span
              v-else
              class="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white text-[11px] font-bold flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform shrink-0"
            >
              {{ userData.name.charAt(0).toUpperCase() }}
            </span>
            <span class="max-w-[70px] md:max-w-[100px] xl:max-w-[130px] truncate font-medium">{{ userData.name }}</span>
            <svg class="w-3 h-3 text-slate-400 group-hover:text-indigo-300 transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>

          <!-- Unified Quota & Top Up Pill (Sangat hemat tempat & responsif) -->
          <button
            type="button"
            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium border shadow-sm whitespace-nowrap transition-all cursor-pointer group hover:border-indigo-400/60 shrink-0"
            :class="quotaBadgeClass"
            title="Klik untuk Tambah Saldo Kuota"
            @click="$emit('open-topup')"
          >
            <span>⏱️ {{ formatDuration(userData.balance || 0) }}</span>
            <span class="w-px h-3 bg-slate-700/80 mx-0.5"></span>
            <span class="text-indigo-400 group-hover:text-indigo-200 font-bold flex items-center gap-0.5">
              <span>⚡</span>
              <span class="hidden md:inline font-sans font-semibold">Top Up</span>
              <span class="md:hidden font-bold">+</span>
            </span>
          </button>
        </div>

        <!-- Tampilan Ponsel (< 640px): Avatar & Ringkasan Kuota -->
        <div v-if="userData?.name" class="flex sm:hidden items-center gap-1.5 shrink-0">
          <button
            type="button"
            class="p-0.5 rounded-full border border-slate-700 hover:border-indigo-400 transition-all cursor-pointer shrink-0"
            title="Pengaturan Profil"
            @click="$emit('open-profile')"
          >
            <img
              v-if="userData.avatar_url"
              :src="userData.avatar_url"
              :alt="userData.name"
              class="w-7 h-7 rounded-full object-cover"
            />
            <span
              v-else
              class="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white text-[10px] font-bold flex items-center justify-center shadow-sm"
            >
              {{ userData.name.charAt(0).toUpperCase() }}
            </span>
          </button>

          <button
            type="button"
            class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-mono font-medium border whitespace-nowrap shrink-0 hover:bg-slate-800 transition-colors cursor-pointer"
            :class="quotaBadgeClass"
            title="Tambah Kuota"
            @click="$emit('open-topup')"
          >
            <span>⏱️ {{ formatDuration(userData.balance || 0) }}</span>
            <span class="text-indigo-400 font-bold">+</span>
          </button>
        </div>

        <!-- Tombol Logout (Desktop >= 640px) -->
        <button
          type="button"
          class="hidden sm:inline-flex items-center gap-1.5 p-1.5 xl:px-3 xl:py-1.5 rounded-xl text-xs font-medium bg-slate-800/80 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-slate-700/80 hover:border-rose-500/30 transition-all cursor-pointer shrink-0"
          title="Keluar dari akun"
          @click="$emit('logout')"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span class="hidden xl:inline">Keluar</span>
        </button>

        <!-- Tombol Hamburger Menu (Khusus Layar < 1024px / lg:hidden) -->
        <button
          type="button"
          class="inline-flex lg:hidden items-center justify-center p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-colors cursor-pointer shrink-0 ml-0.5"
          :aria-expanded="isMobileMenuOpen"
          aria-label="Toggle Navigation Menu"
          @click="isMobileMenuOpen = !isMobileMenuOpen"
        >
          <svg v-if="!isMobileMenuOpen" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <svg v-else class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Mobile / Tablet Drawer Dropdown Menu (< 1024px) -->
    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div
        v-if="isMobileMenuOpen"
        class="lg:hidden border-b border-slate-800 bg-slate-950/95 backdrop-blur-xl px-4 py-4 space-y-3 shadow-2xl"
      >
        <!-- Navigasi Menu Utama Mobile -->
        <div class="space-y-1">
          <p class="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 py-1">Menu Navigasi</p>
          <RouterLink
            to="/dashboard"
            class="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-colors"
            :class="isTranscribeActive ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-300 hover:bg-slate-900'"
            @click="isMobileMenuOpen = false"
          >
            <span class="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">🎙️</span>
            <span>Studio Transkripsi</span>
          </RouterLink>

          <RouterLink
            to="/history"
            class="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-colors"
            :class="isHistoryActive ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-300 hover:bg-slate-900'"
            @click="isMobileMenuOpen = false"
          >
            <span class="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">⏱️</span>
            <span>Riwayat Arsip Dokumen</span>
          </RouterLink>

          <RouterLink
            to="/transactions"
            class="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-colors"
            :class="isTransactionsActive ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-300 hover:bg-slate-900'"
            @click="isMobileMenuOpen = false"
          >
            <span class="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">💳</span>
            <span>Riwayat Tagihan & Pembelian</span>
          </RouterLink>

          <RouterLink
            v-if="userData?.role === 'admin'"
            to="/admin/users"
            class="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-colors"
            :class="isAdminActive ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-amber-400/90 hover:bg-slate-900'"
            @click="isMobileMenuOpen = false"
          >
            <span class="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">🛡️</span>
            <span>Panel Administrasi</span>
          </RouterLink>

          <RouterLink
            to="/"
            class="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
            @click="isMobileMenuOpen = false"
          >
            <span class="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300">🏠</span>
            <span>Halaman Depan (Beranda)</span>
          </RouterLink>
        </div>

        <!-- Profile & Account Info Drawer -->
        <div v-if="userData" class="pt-3 border-t border-slate-800/80 space-y-2">
          <div class="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <div class="flex items-center gap-2.5 truncate">
              <img
                v-if="userData.avatar_url"
                :src="userData.avatar_url"
                :alt="userData.name"
                class="w-9 h-9 rounded-full object-cover border border-indigo-400/40 shrink-0"
              />
              <span
                v-else
                class="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white text-xs font-bold flex items-center justify-center shadow-sm shrink-0"
              >
                {{ userData.name?.charAt(0).toUpperCase() }}
              </span>
              <div class="truncate">
                <p class="text-xs font-semibold text-white truncate">{{ userData.name }}</p>
                <p class="text-[10px] text-slate-400 truncate">{{ userData.email }}</p>
              </div>
            </div>
            <button
              type="button"
              class="px-2.5 py-1 rounded-lg text-xs font-semibold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 cursor-pointer shrink-0"
              @click="$emit('open-profile'); isMobileMenuOpen = false"
            >
              Ubah
            </button>
          </div>

          <!-- Kuota & Top Up -->
          <div class="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <div class="text-xs">
              <span class="text-slate-400 text-[11px]">Sisa Kuota: </span>
              <span class="font-mono font-bold text-white">{{ formatDuration(userData.balance || 0) }}</span>
            </div>
            <button
              type="button"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 cursor-pointer shadow-md shadow-indigo-600/30"
              @click="$emit('open-topup'); isMobileMenuOpen = false"
            >
              <span>⚡</span>
              <span>Top Up Kuota</span>
            </button>
          </div>

          <!-- Tombol Logout Mobile -->
          <button
            type="button"
            class="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-colors cursor-pointer"
            @click="$emit('logout'); isMobileMenuOpen = false"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Keluar dari Akun</span>
          </button>
        </div>
      </div>
    </transition>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import type { User } from '../../types';
import { formatDuration } from '../../utils';

const props = defineProps<{
  userData?: User | null;
  historyCount?: number;
}>();

defineEmits<{
  (e: 'navigate', view: string): void;
  (e: 'open-profile'): void;
  (e: 'open-topup'): void;
  (e: 'logout'): void;
}>();

const route = useRoute();
const isMobileMenuOpen = ref<boolean>(false);

// Tutup menu drawer otomatis saat berganti rute
watch(
  () => route.path,
  () => {
    isMobileMenuOpen.value = false;
  }
);

const isTranscribeActive = computed(() => {
  return route.path === '/dashboard' || route.path === '/transcribe' || route.path.startsWith('/app/dashboard');
});

const isHistoryActive = computed(() => {
  return route.path === '/history' || route.path.startsWith('/app/history');
});

const isTransactionsActive = computed(() => {
  return route.path === '/transactions' || route.path.startsWith('/app/transactions') || route.path === '/orders';
});

const isAdminActive = computed(() => {
  return route.path.startsWith('/admin');
});

// Indikator visual ambang batas sisa kuota (SRS UC-06 & Sequence SD-06)
const quotaBadgeClass = computed(() => {
  const balance = props.userData?.balance || 0;
  if (balance > 600) {
    // Hijau: Cukup (> 10 menit / > 600s)
    return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
  } else if (balance >= 300) {
    // Kuning: Menipis (5 - 10 menit / 300s - 600s)
    return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
  } else {
    // Merah: Kritis / Habis (< 5 menit / < 300s)
    return 'bg-rose-500/10 text-rose-300 border-rose-500/30 animate-pulse';
  }
});
</script>
