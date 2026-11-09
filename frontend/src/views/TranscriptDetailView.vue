<template>
  <div class="max-w-5xl mx-auto space-y-6">
    <!-- Top Back Navigation -->
    <div class="flex items-center justify-between pb-2">
      <RouterLink
        to="/history"
        class="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-400 hover:text-white transition-colors group cursor-pointer"
      >
        <svg class="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span>Kembali ke Riwayat Transkripsi</span>
      </RouterLink>

      <div class="flex items-center gap-2">
        <RouterLink
          to="/dashboard"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-all cursor-pointer"
        >
          <svg class="w-3.5 h-3.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          <span class="hidden sm:inline">Transkripsi Baru</span>
        </RouterLink>
      </div>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="isLoading" class="p-8 rounded-3xl bg-slate-900/50 border border-slate-800 animate-pulse space-y-5">
      <div class="h-6 bg-slate-800 rounded w-1/3"></div>
      <div class="h-4 bg-slate-800/60 rounded w-1/4"></div>
      <div class="h-64 bg-slate-800/40 rounded-2xl"></div>
    </div>

    <!-- Error State -->
    <div
      v-else-if="errorMessage"
      class="p-6 rounded-3xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-center space-y-4"
    >
      <div class="w-12 h-12 mx-auto rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div>
        <h3 class="text-base font-bold text-white">Data Transkrip Tidak Ditemukan</h3>
        <p class="text-xs text-rose-300/80 mt-1">{{ errorMessage }}</p>
      </div>
      <div>
        <RouterLink
          to="/history"
          class="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 transition-colors"
        >
          Kembali ke Daftar Riwayat
        </RouterLink>
      </div>
    </div>

    <!-- Main Detail View -->
    <div v-else-if="transcriptItem" class="space-y-6">
      <!-- Title & Metadata Card Header -->
      <div class="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 shadow-xl backdrop-blur-md space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-start gap-3.5 truncate">
            <div class="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <div class="truncate">
              <h2 class="text-lg sm:text-xl font-black text-white truncate" :title="transcriptItem.original_file_name">
                {{ transcriptItem.original_file_name }}
              </h2>
              <div class="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1">
                <span>{{ formatDateTime(transcriptItem.created_at) }}</span>
                <span>&bull;</span>
                <span class="font-mono">⏱️ {{ formatDuration(transcriptItem.duration_seconds || 0) }}</span>
                <template v-if="transcriptItem.tokens_used">
                  <span>&bull;</span>
                  <span>⚡ {{ transcriptItem.tokens_used }} token</span>
                </template>
              </div>
            </div>
          </div>

          <!-- Status & Action Buttons -->
          <div class="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
            <span
              class="text-xs uppercase font-mono px-3 py-1 rounded-full border font-bold"
              :class="getStatusBadgeClass(transcriptItem.status)"
            >
              {{ formatStatusLabel(transcriptItem.status) }}
            </span>

            <button
              type="button"
              class="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-slate-800 transition-colors cursor-pointer"
              title="Hapus riwayat ini"
              @click="confirmDelete"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Tabbed Document Preview Component -->
      <AudioResultCard
        :raw-text="transcriptItem.raw_text || ''"
        :summary-text="transcriptItem.summary_text || ''"
        :duration-seconds="transcriptItem.duration_seconds"
      />
    </div>

    <!-- Modal Konfirmasi Hapus Transkrip -->
    <div
      v-if="showDeleteModal"
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
            Apakah Anda yakin ingin menghapus arsip <strong class="text-slate-200">{{ transcriptItem?.original_file_name }}</strong>? Data transkrip dan rangkuman yang dihapus tidak dapat dipulihkan kembali.
          </p>
        </div>

        <div class="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            class="py-2.5 px-4 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
            :disabled="isDeleting"
            @click="showDeleteModal = false"
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
import { ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AudioResultCard from '../components/dashboard/AudioResultCard.vue';
import audioModel from '../models/audioModel';
import { formatDuration } from '../utils';
import type { TranscriptItem } from '../types';

const route = useRoute();
const router = useRouter();

const transcriptItem = ref<TranscriptItem | null>(null);
const isLoading = ref<boolean>(true);
const errorMessage = ref<string>('');
const showDeleteModal = ref<boolean>(false);
const isDeleting = ref<boolean>(false);

async function loadTranscriptDetail() {
  const id = route.params.id as string;
  if (!id) {
    errorMessage.value = 'ID transkrip tidak valid.';
    isLoading.value = false;
    return;
  }

  isLoading.value = true;
  errorMessage.value = '';

  try {
    const res = await audioModel.getTranscriptStatus(id);
    if (res?.data) {
      transcriptItem.value = res.data;
    } else {
      errorMessage.value = 'Data transkrip tidak ditemukan.';
    }
  } catch (err: any) {
    console.error('[TranscriptDetailView] Gagal memuat data transkrip:', err);
    errorMessage.value = err?.response?.data?.message || 'Gagal memuat transkrip dari server.';
  } finally {
    isLoading.value = false;
  }
}

function confirmDelete() {
  showDeleteModal.value = true;
}

async function executeDelete() {
  if (!transcriptItem.value) return;
  isDeleting.value = true;

  try {
    await audioModel.deleteHistory(transcriptItem.value.id);
    showDeleteModal.value = false;
    // Berpindah kembali ke halaman riwayat
    router.push('/history');
  } catch (err: any) {
    alert(err?.response?.data?.message || 'Gagal menghapus rekaman riwayat.');
  } finally {
    isDeleting.value = false;
  }
}

function formatDateTime(dateStr: string | Date | undefined): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
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

watch(
  () => route.params.id,
  () => {
    loadTranscriptDetail();
  }
);

onMounted(() => {
  loadTranscriptDetail();
});
</script>

