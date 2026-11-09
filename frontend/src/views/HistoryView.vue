<template>
  <div class="max-w-6xl mx-auto space-y-6">
    <!-- Header Halaman Riwayat -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
      <div>
        <h2 class="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
          <span class="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-sm">
            📜
          </span>
          Riwayat & Arsip Transkripsi
        </h2>
        <p class="text-xs sm:text-sm text-slate-400 mt-1">
          Kelola arsip rekaman suara, lihat rangkuman intisari rapat, atau tinjau transkripsi lampau Anda.
        </p>
      </div>

      <!-- Aksi Header: Transkripsi Baru & Refresh -->
      <div class="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-800 transition-all cursor-pointer"
          :disabled="isLoadingHistory"
          title="Refresh Riwayat"
          @click="fetchHistory(currentPage)"
        >
          <svg
            class="w-4 h-4 transition-transform duration-300"
            :class="{ 'animate-spin text-indigo-400': isLoadingHistory }"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span class="hidden sm:inline">Refresh</span>
        </button>

        <RouterLink
          to="/dashboard"
          class="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-md shadow-indigo-600/25 transition-all cursor-pointer"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          <span>Transkripsi Baru</span>
        </RouterLink>
      </div>
    </div>

    <!-- Toolbar: Filter Status & Pencarian -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-sm backdrop-blur-sm">
      <!-- Filter Segmented Tabs -->
      <div class="flex items-center gap-1 p-1 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
        <button
          type="button"
          class="px-3.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5"
          :class="statusFilter === 'all' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'"
          @click="setStatusFilter('all')"
        >
          <span>Semua</span>
          <span class="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-black/20 text-white">
            {{ totalRecords }}
          </span>
        </button>
        <button
          type="button"
          class="px-3.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer"
          :class="statusFilter === 'completed' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'"
          @click="setStatusFilter('completed')"
        >
          Selesai
        </button>
        <button
          type="button"
          class="px-3.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer"
          :class="statusFilter === 'failed' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'"
          @click="setStatusFilter('failed')"
        >
          Gagal
        </button>
      </div>

      <!-- Kotak Pencarian Nama Berkas -->
      <div class="relative flex-1 sm:max-w-xs">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Cari nama berkas audio..."
          class="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40"
        />
      </div>
    </div>

    <!-- Error State -->
    <div
      v-if="historyError"
      class="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-3"
    >
      <div class="flex items-center gap-2">
        <svg class="w-4 h-4 text-rose-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{{ historyError }}</span>
      </div>
      <button
        type="button"
        class="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs transition-colors cursor-pointer"
        @click="fetchHistory(currentPage)"
      >
        Coba Lagi
      </button>
    </div>

    <!-- Loading Skeleton -->
    <div v-else-if="isLoadingHistory && historyList.length === 0" class="space-y-3">
      <div v-for="n in 4" :key="n" class="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 animate-pulse space-y-3">
        <div class="flex justify-between items-center">
          <div class="h-4 bg-slate-700/50 rounded w-1/3"></div>
          <div class="h-4 bg-slate-800 rounded w-20"></div>
        </div>
        <div class="h-3 bg-slate-800 rounded w-full"></div>
        <div class="h-3 bg-slate-800 rounded w-2/3"></div>
      </div>
    </div>

    <!-- Empty State: Belum Ada Riwayat Sama Sekali -->
    <div
      v-else-if="totalRecords === 0 || historyList.length === 0"
      class="text-center py-16 px-6 rounded-3xl border border-dashed border-slate-800 bg-slate-900/30 space-y-4"
    >
      <div class="w-16 h-16 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      </div>
      <div class="max-w-md mx-auto space-y-1.5">
        <h3 class="text-base font-bold text-white">Belum Ada Transkripsi</h3>
        <p class="text-xs text-slate-400 leading-relaxed">
          Unggah rekaman rapat, kuliah, atau wawancara pertama Anda di Studio Transkripsi untuk menghasilkan rangkuman otomatis.
        </p>
      </div>
      <div>
        <RouterLink
          to="/dashboard"
          class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          <span>Mulai Transkripsi Audio Sekarang</span>
        </RouterLink>
      </div>
    </div>

    <!-- Empty State: Filter atau Pencarian Tidak Cocok -->
    <div
      v-else-if="filteredHistoryList.length === 0"
      class="text-center py-12 px-6 rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 space-y-3"
    >
      <p class="text-sm font-semibold text-slate-300">Tidak ada berkas yang cocok dengan pencarian</p>
      <p class="text-xs text-slate-500">Coba periksa kata kunci pencarian atau ganti filter status ke "Semua".</p>
      <button
        type="button"
        class="text-xs text-indigo-400 hover:text-indigo-300 underline font-medium cursor-pointer"
        @click="searchQuery = ''; setStatusFilter('all');"
      >
        Reset Pencarian & Filter
      </button>
    </div>

    <!-- Daftar Kartu Riwayat Lengkap -->
    <div v-else class="space-y-3.5">
      <div
        v-for="item in filteredHistoryList"
        :key="item.id"
        class="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/90 hover:border-slate-700 shadow-lg backdrop-blur-sm transition-all duration-200 space-y-3.5 group"
      >
        <!-- Baris Atas: Nama Berkas, Status, & Aksi Cepat -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="flex items-center gap-3 truncate">
            <div class="w-10 h-10 rounded-xl bg-slate-800/90 border border-slate-700/80 flex items-center justify-center text-slate-400 group-hover:text-indigo-400 group-hover:border-indigo-500/40 transition-colors shrink-0">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <div class="truncate">
              <h4
                class="text-sm font-bold text-white truncate transition-colors"
                :class="item.status === 'completed' ? 'cursor-pointer hover:text-cyan-300' : ''"
                :title="item.original_file_name"
                @click="item.status === 'completed' && openDetail(item.id)"
              >
                {{ item.original_file_name }}
              </h4>
              <p class="text-[11px] text-slate-400 mt-0.5">
                {{ formatDateTime(item.created_at) }}
              </p>
            </div>
          </div>

          <!-- Status Badge & Tombol Aksi -->
          <div class="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <span
              class="text-[10px] uppercase font-mono px-2.5 py-1 rounded-full border font-bold"
              :class="getStatusBadgeClass(item.status)"
            >
              {{ formatStatusLabel(item.status) }}
            </span>

            <!-- Tombol Lihat Dokumen Detail Halaman Baru -->
            <button
              v-if="item.status === 'completed'"
              type="button"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-cyan-300 hover:text-white bg-cyan-500/10 hover:bg-cyan-600 border border-cyan-500/30 transition-all cursor-pointer shadow-sm shadow-cyan-950/20"
              title="Buka dokumen rangkuman & transkrip lengkap di halaman baru"
              @click="openDetail(item.id)"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span>Lihat Detail</span>
            </button>

            <!-- Tombol Salin Rangkuman Cepat -->
            <button
              v-if="item.summary_text"
              type="button"
              class="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 transition-colors cursor-pointer"
              title="Salin Rangkuman"
              @click="copyText(item.summary_text, item.id)"
            >
              <svg v-if="copiedId !== item.id" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              <span v-else class="text-[10px] font-bold text-emerald-400">Tersalin!</span>
            </button>

            <!-- Tombol Hapus -->
            <button
              type="button"
              class="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-colors cursor-pointer"
              title="Hapus riwayat transkripsi ini"
              @click="confirmDelete(item)"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Baris Tengah: Cuplikan Rangkuman Teks -->
        <div v-if="item.summary_text" class="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300 leading-relaxed font-sans line-clamp-2">
          {{ cleanSnippet(item.summary_text) }}
        </div>
        <div v-else-if="item.raw_text && item.status !== 'completed'" class="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-400 italic line-clamp-2">
          {{ item.raw_text }}
        </div>

        <!-- Baris Bawah: Statistik (Durasi, Jumlah Kata, Token LLM) -->
        <div class="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800/60 text-[11px] text-slate-400">
          <span class="flex items-center gap-1 font-mono">
            ⏱️ Durasi: {{ formatDuration(item.duration_seconds || 0) }}
          </span>
          <span>&bull;</span>
          <span class="flex items-center gap-1">
            📄 {{ countWords(item.raw_text) }} kata
          </span>
          <template v-if="item.tokens_used">
            <span>&bull;</span>
            <span class="flex items-center gap-1 text-slate-500">
              ⚡ {{ item.tokens_used }} token AI
            </span>
          </template>
        </div>
      </div>
    </div>

    <!-- Paginasi Halaman Bawah -->
    <div v-if="totalPages > 1" class="flex items-center justify-between pt-4 border-t border-slate-800 text-xs">
      <div class="text-slate-400">
        Menampilkan halaman <span class="font-bold text-white">{{ currentPage }}</span> dari <span class="font-bold text-white">{{ totalPages }}</span>
      </div>
      <div class="flex items-center gap-1.5">
        <button
          type="button"
          class="px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          :disabled="currentPage <= 1 || isLoadingHistory"
          @click="fetchHistory(currentPage - 1)"
        >
          &larr; Sebelumnya
        </button>
        <button
          type="button"
          class="px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          :disabled="currentPage >= totalPages || isLoadingHistory"
          @click="fetchHistory(currentPage + 1)"
        >
          Selanjutnya &rarr;
        </button>
      </div>
    </div>

    <!-- Modal Konfirmasi Hapus Transkrip (SRS UC-12, Sequence SD-12) -->
    <div
      v-if="itemToDelete"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div class="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
        <div class="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>

        <div class="text-center space-y-2">
          <h3 class="text-base font-bold text-white">Hapus Riwayat Transkripsi?</h3>
          <p class="text-xs text-slate-400 leading-relaxed">
            Apakah Anda yakin ingin menghapus arsip <strong class="text-slate-200">{{ itemToDelete.original_file_name }}</strong>? Data transkrip dan rangkuman yang dihapus tidak dapat dipulihkan kembali.
          </p>
        </div>

        <div v-if="deleteErrorMessage" class="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
          {{ deleteErrorMessage }}
        </div>

        <div class="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            class="py-2.5 px-4 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
            :disabled="isDeleting"
            @click="cancelDelete"
          >
            Batal
          </button>
          <button
            type="button"
            class="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-lg shadow-rose-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
            :disabled="isDeleting"
            @click="executeDelete"
          >
            <svg v-if="isDeleting" class="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>{{ isDeleting ? 'Menghapus...' : 'Ya, Hapus' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useHistoryController } from '../controllers/historyController';
import useCurrentUser from '../composables/useCurrentUser';
import { formatDuration } from '../utils';
import type { TranscriptItem } from '../types';

const router = useRouter();
const { setHistoryCount } = useCurrentUser();

const {
  historyList,
  totalRecords,
  currentPage,
  totalPages,
  isLoadingHistory,
  historyError,
  statusFilter,
  setStatusFilter,
  fetchHistory,
  deleteHistoryItem,
} = useHistoryController();

const searchQuery = ref<string>('');
const copiedId = ref<string>('');
const itemToDelete = ref<TranscriptItem | null>(null);
const isDeleting = ref<boolean>(false);
const deleteErrorMessage = ref<string>('');

// Filter daftar riwayat berdasarkan kata kunci nama berkas
const filteredHistoryList = computed(() => {
  if (!searchQuery.value.trim()) {
    return historyList.value;
  }
  const q = searchQuery.value.toLowerCase().trim();
  return historyList.value.filter((item) =>
    item.original_file_name.toLowerCase().includes(q)
  );
});

function openDetail(id: string) {
  router.push({ path: `/transcripts/${id}` });
}

async function copyText(text: string, id: string) {
  try {
    await navigator.clipboard.writeText(text);
    copiedId.value = id;
    setTimeout(() => {
      if (copiedId.value === id) copiedId.value = '';
    }, 2000);
  } catch (err) {
    console.warn('[HistoryView] Gagal menyalin teks ke clipboard:', err);
  }
}

function cleanSnippet(summary: string): string {
  return summary
    .replace(/^#+\s+/gm, '')
    .replace(/\*\*/g, '')
    .replace(/^[-*]\s+/gm, '')
    .replace(/\n+/g, ' ')
    .trim();
}

function countWords(text: string | null | undefined): string {
  if (!text) return '0';
  const count = text.trim().split(/\s+/).filter(Boolean).length;
  return count.toLocaleString('id-ID');
}

function formatDateTime(dateStr: string | Date | undefined): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatStatusLabel(status: string): string {
  switch (status) {
    case 'completed':
      return 'Selesai';
    case 'failed':
      return 'Gagal';
    case 'processing':
      return 'Diproses';
    default:
      return status;
  }
}

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'completed':
      return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
    case 'failed':
      return 'bg-rose-500/10 text-rose-300 border-rose-500/30';
    case 'processing':
      return 'bg-amber-500/10 text-amber-300 border-amber-500/30 animate-pulse';
    default:
      return 'bg-slate-800 text-slate-300 border-slate-700';
  }
}

function confirmDelete(item: TranscriptItem) {
  itemToDelete.value = item;
  deleteErrorMessage.value = '';
}

function cancelDelete() {
  itemToDelete.value = null;
  deleteErrorMessage.value = '';
  isDeleting.value = false;
}

async function executeDelete() {
  if (!itemToDelete.value) return;
  isDeleting.value = true;
  deleteErrorMessage.value = '';

  try {
    const success = await deleteHistoryItem(itemToDelete.value.id);
    if (success) {
      setHistoryCount(totalRecords.value);
      cancelDelete();
    } else {
      deleteErrorMessage.value = 'Gagal menghapus data riwayat transkripsi.';
    }
  } catch (err: any) {
    deleteErrorMessage.value =
      err?.response?.data?.message || err?.message || 'Terjadi kesalahan saat menghapus.';
  } finally {
    isDeleting.value = false;
  }
}

onMounted(async () => {
  await fetchHistory(1);
  setHistoryCount(totalRecords.value);
});
</script>

