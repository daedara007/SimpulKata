<template>
  <header class="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <!-- Logo & Brand -->
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" />
          </svg>
        </div>
        <div>
          <h1 class="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            SimpulKata
          </h1>
          <p class="text-xs text-slate-400">Transkripsi & Rangkuman AI</p>
        </div>
      </div>

      <!-- Menu Aksi Kanan -->
      <div class="flex items-center gap-3">
        <!-- Tombol Beranda -->
        <button
          type="button"
          class="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          @click="$emit('navigate', 'home')"
        >
          <svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span>Beranda</span>
        </button>

        <!-- Info Sisa Kuota Ringkas untuk Layar Ponsel (< 640px) -->
        <div v-if="userData?.name" class="flex sm:hidden items-center gap-2">
          <button
            type="button"
            class="flex items-center gap-1.5 p-1 rounded-full bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition-all cursor-pointer"
            title="Pengaturan Profil (Ubah Nama & Avatar)"
            @click="$emit('open-profile')"
          >
            <img
              v-if="userData.avatar_url"
              :src="userData.avatar_url"
              :alt="userData.name"
              class="w-6 h-6 rounded-full object-cover border border-indigo-400/40"
            />
            <span
              v-else
              class="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white text-[10px] font-bold flex items-center justify-center shadow-sm"
            >
              {{ userData.name.charAt(0).toUpperCase() }}
            </span>
          </button>
          <span
            class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-slate-800 text-slate-300 border border-slate-700"
            :title="'Sisa kuota: ' + (userData.balance || 0) + ' detik'"
          >
            ⏱️ {{ formatDuration(userData.balance || 0) }}
          </span>
        </div>

        <!-- Info User & Sisa Saldo untuk Layar Desktop (>= 640px) -->
        <div v-if="userData?.name" class="hidden sm:flex items-center gap-2">
          <button
            type="button"
            class="inline-flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full text-xs font-medium bg-slate-800/80 hover:bg-indigo-500/10 text-slate-200 hover:text-white border border-slate-700 hover:border-indigo-500/40 transition-all cursor-pointer group"
            title="Pengaturan Profil (Ubah Nama & Avatar)"
            @click="$emit('open-profile')"
          >
            <img
              v-if="userData.avatar_url"
              :src="userData.avatar_url"
              :alt="userData.name"
              class="w-6 h-6 rounded-full object-cover border border-indigo-400/40 group-hover:scale-105 transition-transform"
            />
            <span
              v-else
              class="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white text-[11px] font-bold flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform"
            >
              {{ userData.name.charAt(0).toUpperCase() }}
            </span>
            <span class="max-w-[130px] truncate font-medium">{{ userData.name }}</span>
            <svg class="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-slate-800 text-slate-300 border border-slate-700" :title="'Sisa kuota: ' + (userData.balance || 0) + ' detik'">
            ⏱️ {{ formatDuration(userData.balance || 0) }} kuota
          </span>
        </div>

        <!-- Tombol Logout -->
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-800/80 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-slate-700/80 hover:border-rose-500/30 transition-all cursor-pointer"
          title="Keluar dari akun"
          @click="$emit('logout')"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>Keluar</span>
        </button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import type { User } from '../../types';
import { formatDuration } from '../../utils';

defineProps<{
  userData?: User | null;
}>();

defineEmits<{
  (e: 'navigate', view: string): void;
  (e: 'open-profile'): void;
  (e: 'logout'): void;
}>();
</script>

