<template>
  <header class="border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
      <!-- 1. Logo & Brand -->
      <RouterLink to="/dashboard" class="flex items-center gap-2 shrink-0 group">
        <img
          src="/logo.png"
          alt="SimpulKata Logo"
          class="w-8 h-8 sm:w-9 sm:h-9 rounded-xl object-cover shadow-lg shadow-indigo-500/20 shrink-0 border border-indigo-500/20 group-hover:scale-105 transition-transform"
        />
        <h1 class="text-base sm:text-lg font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
          SimpulKata
        </h1>
      </RouterLink>

      <!-- 2. Navigasi Tab Tengah (Tampil di layar >= 640px / sm:flex) -->
      <nav class="hidden sm:flex items-center gap-1 p-1 rounded-2xl bg-slate-950/80 border border-slate-800/80 shadow-inner">
        <RouterLink
          to="/dashboard"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer"
          :class="isTranscribeActive
            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/25'
            : 'text-slate-400 hover:text-white hover:bg-slate-800/60'"
        >
          <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" />
          </svg>
          <span>Transkripsi</span>
        </RouterLink>

        <RouterLink
          to="/history"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer"
          :class="isHistoryActive
            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/25'
            : 'text-slate-400 hover:text-white hover:bg-slate-800/60'"
        >
          <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Riwayat</span>
        </RouterLink>

        <RouterLink
          to="/transactions"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer"
          :class="isTransactionsActive
            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/25'
            : 'text-slate-400 hover:text-white hover:bg-slate-800/60'"
        >
          <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          <span>Tagihan</span>
        </RouterLink>

        <RouterLink
          v-if="userData?.role === 'admin'"
          to="/admin/users"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer"
          :class="isAdminActive
            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/25'
            : 'text-amber-400/90 hover:text-amber-300 hover:bg-amber-500/10'"
        >
          <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <span>Admin</span>
        </RouterLink>
      </nav>

      <!-- 3. Menu Aksi Kanan -->
      <div class="flex items-center gap-2 shrink-0">
        <!-- Profil Pengguna -->
        <button
          v-if="userData?.name"
          type="button"
          class="inline-flex items-center gap-1.5 p-1 sm:px-2.5 sm:py-1 rounded-full text-xs font-medium bg-slate-800/80 hover:bg-indigo-500/10 text-slate-200 hover:text-white border border-slate-700 hover:border-indigo-500/40 transition-all cursor-pointer group shrink-0"
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
          <span class="hidden sm:inline max-w-[80px] md:max-w-[120px] truncate font-medium">{{ userData.name }}</span>
        </button>

        <!-- Unified Quota & Top Up Pill -->
        <button
          v-if="userData?.name"
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

        <!-- Tombol Logout -->
        <button
          type="button"
          class="inline-flex items-center justify-center p-2 rounded-xl text-xs font-medium bg-slate-800/80 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-slate-700/80 hover:border-rose-500/30 transition-all cursor-pointer shrink-0"
          title="Keluar dari akun"
          @click="$emit('logout')"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue';
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
    return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
  } else if (balance >= 300) {
    return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
  } else {
    return 'bg-rose-500/10 text-rose-300 border-rose-500/30 animate-pulse';
  }
});
</script>
