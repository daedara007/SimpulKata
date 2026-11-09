<template>
  <div
    v-if="rawText || summaryText"
    id="results-area"
    class="space-y-4 pt-6 border-t border-slate-800"
  >
    <!-- Header & Status Info -->
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h3 class="text-lg font-bold text-white flex items-center gap-2">
          <span>Hasil Pemrosesan AI</span>
          <span class="text-xs font-normal px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Selesai
          </span>
        </h3>
        <p class="text-xs text-slate-400 mt-0.5">
          Tinjau rangkuman intisari rapat atau periksa transkripsi tuturan lengkap.
        </p>
      </div>

      <!-- Informasi Saldo Kuota -->
      <div class="flex items-center gap-2 text-xs">
        <span v-if="durationSeconds" class="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
          ⏱️ Durasi: <strong class="text-white">{{ formatDuration(durationSeconds) }}</strong>
        </span>
        <span
          v-if="userBalance !== undefined"
          class="px-2.5 py-1 rounded-lg border font-medium"
          :class="[
            userBalance > 600
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
              : userBalance >= 300
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                : 'bg-rose-500/10 text-rose-300 border-rose-500/30 animate-pulse'
          ]"
        >
          🔋 Sisa Kuota: <strong class="text-white font-mono">{{ formatDuration(userBalance) }}</strong>
        </span>
      </div>
    </div>

    <!-- Main Container Card (Layout Mirip Fathom) -->
    <div class="rounded-2xl bg-slate-900/80 border border-slate-800 shadow-2xl overflow-hidden backdrop-blur-md">
      <!-- 1. Top Tabs Navigation Bar (RANGKUMAN / TRANSKRIP LENGKAP) -->
      <div class="px-5 sm:px-6 py-3.5 border-b border-slate-800 bg-slate-950/70 select-none">
        <div class="inline-flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-inner">
          <button
            type="button"
            class="flex items-center gap-2 px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer"
            :class="[
              activeTab === 'summary'
                ? 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            ]"
            @click="activeTab = 'summary'"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Rangkuman</span>
          </button>

          <button
            type="button"
            class="flex items-center gap-2 px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer"
            :class="[
              activeTab === 'transcript'
                ? 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            ]"
            @click="activeTab = 'transcript'"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" />
            </svg>
            <span>Transkrip Lengkap</span>
          </button>
        </div>
      </div>

      <!-- 2. Sub-Toolbar: Metadata & Tombol Aksi Cepat -->
      <div class="flex flex-wrap items-center justify-between gap-3 px-6 py-3 bg-slate-900/90 border-b border-slate-800/80 text-xs">
        <!-- Metadata Pills -->
        <div class="flex items-center gap-2 text-slate-400">
          <span class="px-2.5 py-1 rounded-lg bg-slate-800/90 border border-slate-700/80 text-slate-300 font-medium">
            {{ activeTab === 'summary' ? 'Format: Terstruktur Markdown' : 'Format: Teks Percakapan Alami' }}
          </span>
          <span class="text-slate-500 hidden sm:inline">&bull;</span>
          <span class="font-mono text-slate-400 hidden sm:inline">
            {{ countWords(activeTab === 'summary' ? summaryText : rawText) }} kata
          </span>
          <span class="text-slate-500 hidden sm:inline">&bull;</span>
          <span class="text-slate-400 hidden sm:inline">
            {{ (activeTab === 'summary' ? summaryText : rawText).length.toLocaleString('id-ID') }} karakter
          </span>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center gap-2.5">
          <!-- Tombol Unduh TXT -->
          <button
            type="button"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors cursor-pointer"
            :title="activeTab === 'summary' ? 'Unduh Rangkuman (.txt)' : 'Unduh Transkrip (.txt)'"
            @click="downloadActiveContent"
          >
            <svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span class="hidden sm:inline">Unduh TXT</span>
          </button>

          <!-- Tombol Salin Utama -->
          <button
            type="button"
            class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-cyan-300 hover:text-white bg-cyan-500/10 hover:bg-cyan-600 border border-cyan-500/30 transition-all cursor-pointer shadow-sm shadow-cyan-950/30"
            @click="handleCopyActiveTab"
          >
            <svg v-if="copiedActive" class="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <svg v-else class="w-3.5 h-3.5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span>{{ copiedActive ? 'Tersalin!' : activeTab === 'summary' ? 'Salin Rangkuman' : 'Salin Transkrip' }}</span>
          </button>
        </div>
      </div>

      <!-- 3. Document Content Area -->
      <div class="p-6 sm:p-8 min-h-[420px] max-h-[680px] overflow-y-auto select-text">
        <!-- TAB 1: RANGKUMAN (SUMMARY) -->
        <div v-if="activeTab === 'summary'">
          <div
            v-if="summaryText"
            class="summary-markdown prose prose-invert max-w-none text-slate-200 text-sm sm:text-base leading-relaxed"
            v-html="renderedSummary"
          ></div>
          <div v-else class="text-center py-16 text-slate-500 italic">
            Belum ada rangkuman yang dihasilkan untuk rekaman ini.
          </div>
        </div>

        <!-- TAB 2: TRANSKRIP LENGKAP (TRANSCRIPT) -->
        <div v-else class="space-y-4">
          <div v-if="rawText" class="text-sm sm:text-base leading-relaxed text-slate-300 font-sans whitespace-pre-wrap">
            {{ rawText }}
          </div>
          <div v-else class="text-center py-16 text-slate-500 italic">
            Belum ada teks transkripsi yang terdeteksi.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  formatDuration,
  countWords,
  copyToClipboard,
  sanitizeAndRenderMarkdown,
} from '../../utils';

const props = defineProps<{
  rawText: string;
  summaryText: string;
  durationSeconds?: number;
  userBalance?: number;
}>();

// Tab Aktif: 'summary' (default) atau 'transcript'
const activeTab = ref<'summary' | 'transcript'>('summary');
const copiedActive = ref<boolean>(false);

const renderedSummary = computed(() => {
  return sanitizeAndRenderMarkdown(props.summaryText);
});

async function handleCopyActiveTab() {
  const isSummary = activeTab.value === 'summary';
  const textToCopy = isSummary ? props.summaryText : props.rawText;
  const success = await copyToClipboard(textToCopy, isSummary);

  if (success) {
    copiedActive.value = true;
    setTimeout(() => {
      copiedActive.value = false;
    }, 2000);
  } else {
    alert('Gagal menyalin teks ke papan klip secara otomatis. Silakan salin teks secara manual.');
  }
}

function downloadActiveContent() {
  const isSummary = activeTab.value === 'summary';
  const text = isSummary ? props.summaryText : props.rawText;
  if (!text) return;

  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const filename = isSummary ? `rangkuman-simpulkata-${Date.now()}.txt` : `transkrip-simpulkata-${Date.now()}.txt`;

  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
</script>

<style scoped>
:deep(.summary-markdown) {
  color: #e2e8f0;
}

:deep(.summary-markdown p) {
  margin-bottom: 1rem;
  line-height: 1.7;
}

:deep(.summary-markdown strong),
:deep(.summary-markdown b) {
  font-weight: 700;
  color: #ffffff;
}

:deep(.summary-markdown h1),
:deep(.summary-markdown h2),
:deep(.summary-markdown h3),
:deep(.summary-markdown h4) {
  font-weight: 700;
  color: #ffffff;
  margin-top: 1.4rem;
  margin-bottom: 0.5rem;
  letter-spacing: -0.01em;
}

:deep(.summary-markdown h1) { font-size: 1.25rem; }
:deep(.summary-markdown h2) { font-size: 1.15rem; }
:deep(.summary-markdown h3) { font-size: 1.05rem; }

:deep(.summary-markdown ul) {
  list-style-type: disc;
  padding-left: 1.5rem;
  margin-bottom: 1rem;
}

:deep(.summary-markdown ol) {
  list-style-type: decimal;
  padding-left: 1.5rem;
  margin-bottom: 1rem;
}

:deep(.summary-markdown li) {
  margin-bottom: 0.45rem;
  line-height: 1.65;
  color: #cbd5e1;
}

:deep(.summary-markdown hr) {
  border-color: rgba(51, 65, 85, 0.6);
  margin: 1.25rem 0;
}

:deep(.summary-markdown blockquote) {
  border-left: 3px solid #38bdf8;
  padding-left: 0.85rem;
  color: #94a3b8;
  font-style: italic;
  margin: 0.85rem 0;
}
</style>
