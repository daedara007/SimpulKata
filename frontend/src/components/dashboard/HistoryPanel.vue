<template>
  <aside class="lg:col-span-4 space-y-4">
    <div class="rounded-2xl bg-slate-900/60 border border-slate-800 p-4 sm:p-5 shadow-xl space-y-4 backdrop-blur-sm sticky top-24">
      <!-- Header Panel Riwayat -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 class="font-bold text-sm sm:text-base text-white">Riwayat Transkripsi</h3>
          </div>
          <span class="ml-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-slate-800 text-slate-300 border border-slate-700">
            {{ totalRecords }}
          </span>
        </div>

        <!-- Tombol Refresh Riwayat -->
        <button
          type="button"
          class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          title="Refresh Riwayat"
          :disabled="isLoading"
          @click="$emit('refresh')"
        >
          <svg
            class="w-4 h-4 transition-transform duration-300"
            :class="{ 'animate-spin text-indigo-400': isLoading }"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      <!-- Filter Status (Semua, Selesai, Gagal) -->
      <div class="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs">
        <button
          type="button"
          class="flex-1 py-1.5 px-2 rounded-lg font-medium transition-all cursor-pointer"
          :class="statusFilter === 'all' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'"
          @click="$emit('filter-change', 'all')"
        >
          Semua
        </button>
        <button
          type="button"
          class="flex-1 py-1.5 px-2 rounded-lg font-medium transition-all cursor-pointer"
          :class="statusFilter === 'completed' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'"
          @click="$emit('filter-change', 'completed')"
        >
          Completed
        </button>
        <button
          type="button"
          class="flex-1 py-1.5 px-2 rounded-lg font-medium transition-all cursor-pointer"
          :class="statusFilter === 'failed' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'"
          @click="$emit('filter-change', 'failed')"
        >
          Failed
        </button>
      </div>

      <!-- Error State: Database Query Timeout / Error -->
      <div
        v-if="historyError"
        class="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-2"
      >
        <p class="font-medium">{{ historyError }}</p>
        <button
          type="button"
          class="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium text-[11px] transition-colors cursor-pointer"
          @click="$emit('refresh')"
        >
          Coba Refresh
        </button>
      </div>

      <!-- Loading Skeleton -->
      <div v-else-if="isLoading && historyList.length === 0" class="space-y-2.5 py-2">
        <div v-for="n in 3" :key="n" class="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 animate-pulse space-y-2">
          <div class="h-4 bg-slate-700/50 rounded w-3/4"></div>
          <div class="h-3 bg-slate-800 rounded w-1/2"></div>
        </div>
      </div>

      <!-- Empty State: Filter aktif tapi tidak cocok -->
      <div
        v-else-if="statusFilter !== 'all' && (historyList.length === 0 || totalRecords === 0)"
        class="text-center py-8 px-4 rounded-xl border border-dashed border-slate-800 bg-slate-950/40 space-y-2"
      >
        <p class="text-xs font-semibold text-slate-300">Tidak ada data sesuai filter</p>
        <p class="text-[11px] text-slate-500">Coba ganti filter status di atas ke "Semua".</p>
        <button
          type="button"
          class="mt-2 text-xs text-indigo-400 hover:text-indigo-300 font-medium underline cursor-pointer"
          @click="$emit('filter-change', 'all')"
        >
          Reset Filter
        </button>
      </div>

      <!-- Empty State: Belum ada data di database -->
      <div
        v-else-if="totalRecords === 0 || historyList.length === 0"
        class="text-center py-10 px-4 rounded-xl border border-dashed border-slate-800 bg-slate-950/40 space-y-3"
      >
        <div class="w-12 h-12 mx-auto rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <div>
          <p class="text-xs sm:text-sm font-semibold text-slate-200">Belum ada transkripsi</p>
          <p class="text-[11px] text-slate-400 mt-1">Silakan unggah atau rekam audio untuk memulai.</p>
        </div>
      </div>

      <!-- Daftar Riwayat Transkripsi -->
      <div v-else class="space-y-2 max-h-[520px] overflow-y-auto pr-1">
        <button
          v-for="item in historyList"
          :key="item.id"
          type="button"
          class="w-full text-left p-3.5 rounded-xl border transition-all duration-200 group relative block cursor-pointer"
          :class="[
            selectedHistoryId === item.id
              ? 'border-indigo-500 bg-indigo-500/10 shadow-md shadow-indigo-500/10 ring-1 ring-indigo-500/50'
              : 'border-slate-800/80 hover:border-slate-700 bg-slate-950/60 hover:bg-slate-900/60'
          ]"
          @click="$emit('select', item)"
        >
          <!-- Indikator Aktif -->
          <div
            v-if="selectedHistoryId === item.id"
            class="absolute -left-1 top-3.5 bottom-3.5 w-1 rounded-r-full bg-indigo-500"
          ></div>

          <div class="flex items-start justify-between gap-2">
            <!-- Nama File Audio -->
            <div class="flex items-center gap-2 truncate pr-1">
              <svg class="w-4 h-4 shrink-0 text-slate-400 group-hover:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
              <span class="text-xs font-semibold text-slate-200 truncate group-hover:text-white" :title="item.original_file_name">
                {{ item.original_file_name }}
              </span>
            </div>

            <!-- Badge Status -->
            <span
              class="shrink-0 text-[10px] uppercase font-mono px-2 py-0.5 rounded-full border font-semibold"
              :class="getStatusBadgeClass(item.status)"
            >
              {{ formatStatusLabel(item.status) }}
            </span>
          </div>

          <!-- Metadata Item: Tanggal, Durasi, Word Count -->
          <div class="mt-2.5 flex items-center justify-between text-[11px] text-slate-400">
            <span>{{ formatDate(item.created_at) }}</span>
            <div class="flex items-center gap-2 text-[10px]">
              <span v-if="item.duration_seconds > 0" class="text-slate-300 font-mono">⏱️ {{ formatDuration(item.duration_seconds) }}</span>
              <span v-if="Boolean(item.word_count && item.word_count > 0)" class="text-indigo-400 font-medium">📝 {{ item.word_count }} kata</span>
            </div>
          </div>
        </button>
      </div>

      <!-- Pagination Bar -->
      <div
        v-if="totalPages > 1"
        class="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs"
      >
        <button
          type="button"
          class="px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          :disabled="currentPage <= 1 || isLoading"
          @click="$emit('page-change', currentPage - 1)"
        >
          &larr; Prev
        </button>
        <span class="text-[11px] text-slate-400 font-medium">
          Hal {{ currentPage }} dari {{ totalPages }}
        </span>
        <button
          type="button"
          class="px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          :disabled="currentPage >= totalPages || isLoading"
          @click="$emit('page-change', currentPage + 1)"
        >
          Next &rarr;
        </button>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import type { TranscriptItem } from '../../types';
import type { HistoryStatusFilter } from '../../controllers/historyController';
import {
  formatDate,
  formatDuration,
  formatStatusLabel,
  getStatusBadgeClass,
} from '../../utils';

defineProps<{
  historyList: TranscriptItem[];
  totalRecords: number;
  currentPage: number;
  totalPages: number;
  selectedHistoryId: string | null;
  isLoading: boolean;
  historyError: string;
  statusFilter: HistoryStatusFilter;
}>();

defineEmits<{
  (e: 'select', item: TranscriptItem): void;
  (e: 'filter-change', filter: HistoryStatusFilter): void;
  (e: 'page-change', page: number): void;
  (e: 'refresh'): void;
}>();
</script>

