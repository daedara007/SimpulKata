<template>
  <div class="max-w-5xl mx-auto space-y-8">
    <!-- Header Halaman Studio Transkripsi -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
      <div>
        <h2 class="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
          <span class="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-sm">
            🎙️
          </span>
          Studio Transkripsi & Rangkuman AI
        </h2>
        <p class="text-xs sm:text-sm text-slate-400 mt-1">
          Unggah rekaman audio hingga 200MB atau rekam percakapan langsung melalui mikrofon peramban.
        </p>
      </div>

      <!-- Tombol Pintasan ke Riwayat -->
      <RouterLink
        to="/history"
        class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 transition-all cursor-pointer shrink-0 group self-start sm:self-auto"
      >
        <svg class="w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Lihat Riwayat Transkripsi</span>
        <svg class="w-3.5 h-3.5 text-slate-500 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </RouterLink>
    </div>

    <!-- Area 1: Unggah / Rekam Audio -->
    <AudioUploadCard
      :selected-file="selectedFile"
      :is-loading="isLoading"
      :loading-message="loadingMessage"
      :loading-timer="loadingTimer"
      :error-message="errorMessage"
      :upload-progress-percent="uploadProgressPercent"
      :upload-transferred-bytes="uploadTransferredBytes"
      :upload-total-bytes="uploadTotalBytes"
      :upload-phase="uploadPhase"
      :upload-chunk-current="uploadChunkCurrent"
      :upload-chunk-total="uploadChunkTotal"
      @file-selected="validateAndSetFile"
      @clear-file="clearFile"
      @process-audio="handleProcessAudio"
      @clear-error="errorMessage = ''"
    />

    <!-- Area 2: Hasil Transkripsi & Rangkuman Markdown -->
    <AudioResultCard
      :raw-text="rawText"
      :summary-text="summaryText"
      :duration-seconds="meta.durationSeconds"
      :user-balance="currentUser?.balance"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import AudioUploadCard from '../components/dashboard/AudioUploadCard.vue';
import AudioResultCard from '../components/dashboard/AudioResultCard.vue';
import { useAudioController } from '../controllers/audioController';
import useCurrentUser from '../composables/useCurrentUser';
import audioModel from '../models/audioModel';
import type { TranscriptItem } from '../types';

const route = useRoute();
const { currentUser, refreshUser } = useCurrentUser();

const {
  selectedFile,
  isLoading,
  loadingMessage,
  loadingTimer,
  uploadProgressPercent,
  uploadTransferredBytes,
  uploadTotalBytes,
  uploadPhase,
  uploadChunkCurrent,
  uploadChunkTotal,
  transcriptId,
  rawText,
  summaryText,
  meta,
  errorMessage,
  validateAndSetFile,
  clearFile,
  displayResults,
  processAudio: executeProcessAudio,
} = useAudioController();

async function handleProcessAudio() {
  await executeProcessAudio({
    onProgressUpdate: async () => {
      await refreshUser();
    },
    onCompleted: async () => {
      await refreshUser();
    },
  });
}

// Muat transkrip spesifik jika pengguna datang dari riwayat via query ?id=UUID
async function loadTranscriptFromQuery(id: string) {
  if (!id) return;
  try {
    const res = await audioModel.getTranscriptStatus(id);
    if (res?.data) {
      displayResults(res.data);
    }
  } catch (err) {
    console.warn('[TranscribeView] Gagal memuat transkrip dari query ID:', err);
  }
}

watch(
  () => route.query.id,
  (newId) => {
    if (typeof newId === 'string' && newId) {
      loadTranscriptFromQuery(newId);
    }
  }
);

onMounted(async () => {
  const queryId = route.query.id;
  if (typeof queryId === 'string' && queryId) {
    await loadTranscriptFromQuery(queryId);
  } else if (!transcriptId.value) {
    // Jika belum ada hasil yang aktif, muat transkrip selesai paling baru untuk ditampilkan sebagai contoh
    try {
      const historyRes = await audioModel.getHistory({ page: 1, limit: 1, status: 'completed' });
      const rawData: any = historyRes?.data;
      const items: TranscriptItem[] = Array.isArray(rawData) ? rawData : (rawData?.items || []);
      if (items.length > 0) {
        displayResults(items[0]);
      }
    } catch (_) {
      // Abaikan jika riwayat masih kosong
    }
  }
});
</script>
