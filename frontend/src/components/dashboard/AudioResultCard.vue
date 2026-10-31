<template>
  <div
    v-if="rawText || summaryText"
    id="results-area"
    class="space-y-4 pt-6 border-t border-slate-800"
  >
    <!-- Results Header & Badges -->
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h3 class="text-lg font-bold text-white flex items-center gap-2">
          <span>Hasil Transkripsi & Rangkuman</span>
          <span class="text-xs font-normal px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Selesai
          </span>
        </h3>
        <p class="text-xs text-slate-400 mt-0.5">
          Teks transkripsi lengkap dan intisari rangkuman audio
        </p>
      </div>
      <div class="flex items-center gap-2 text-xs">
        <span v-if="durationSeconds" class="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
          ⏱️ Kuota Terpakai: <strong class="text-white">{{ formatDuration(durationSeconds) }}</strong>
        </span>
        <span v-if="userBalance !== undefined" class="px-2.5 py-1 rounded-lg bg-indigo-950/60 text-indigo-300 border border-indigo-500/30">
          🔋 Sisa Kuota: <strong class="text-white font-mono">{{ formatDuration(userBalance) }}</strong>
        </span>
      </div>
    </div>

    <!-- Side-by-Side 2 Columns -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Left Column: Raw Transcription -->
      <div class="flex flex-col rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden shadow-xl">
        <div class="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
            <h4 class="text-sm font-semibold text-slate-200">Teks Transkripsi</h4>
            <span class="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Lengkap
            </span>
          </div>
          <button
            type="button"
            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors cursor-pointer"
            @click="copyText(rawText, 'raw')"
          >
            <svg v-if="copiedRaw" class="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <svg v-else class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span>{{ copiedRaw ? 'Tersalin!' : 'Salin Teks' }}</span>
          </button>
        </div>
        <!-- Scrollable Text Area -->
        <div class="p-4 flex-1">
          <div class="h-96 overflow-y-auto pr-2 text-sm leading-relaxed text-slate-300 font-mono whitespace-pre-wrap select-text">
            {{ rawText || 'Tidak ada teks transkripsi.' }}
          </div>
        </div>
        <div class="px-4 py-2 bg-slate-900/40 border-t border-slate-800/60 text-[11px] text-slate-500 flex justify-between">
          <span>{{ (rawText || '').length }} karakter</span>
          <span>{{ countWords(rawText || '') }} kata</span>
        </div>
      </div>

      <!-- Right Column: Structured Summary -->
      <div class="flex flex-col rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden shadow-xl">
        <div class="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-purple-400"></span>
            <h4 class="text-sm font-semibold text-slate-200">Rangkuman Intisari</h4>
            <span class="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
              Ringkas
            </span>
          </div>
          <button
            type="button"
            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors cursor-pointer"
            @click="copyText(summaryText, 'summary')"
          >
            <svg v-if="copiedSummary" class="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <svg v-else class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span>{{ copiedSummary ? 'Tersalin!' : 'Salin Rangkuman' }}</span>
          </button>
        </div>
        <!-- Scrollable Summary Area -->
        <div class="p-4 flex-1">
          <div class="h-96 overflow-y-auto pr-2 text-sm leading-relaxed text-slate-200 select-text">
            <div
              v-if="summaryText"
              class="summary-markdown"
              v-html="renderedSummary"
            ></div>
            <div v-else class="text-slate-500 italic">
              Belum ada rangkuman.
            </div>
          </div>
        </div>
        <div class="px-4 py-2 bg-slate-900/40 border-t border-slate-800/60 text-[11px] text-slate-500 flex justify-between">
          <span>{{ (summaryText || '').length }} karakter</span>
          <span>{{ countWords(summaryText || '') }} kata</span>
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

const renderedSummary = computed(() => {
  return sanitizeAndRenderMarkdown(props.summaryText);
});

const copiedRaw = ref(false);
const copiedSummary = ref(false);

async function copyText(text: string | null | undefined, type: 'raw' | 'summary') {
  const isSummary = type === 'summary';
  const success = await copyToClipboard(text, isSummary);

  if (success) {
    if (type === 'raw') {
      copiedRaw.value = true;
      setTimeout(() => (copiedRaw.value = false), 2000);
    } else {
      copiedSummary.value = true;
      setTimeout(() => (copiedSummary.value = false), 2000);
    }
  } else {
    alert('Gagal menyalin teks ke papan klip secara otomatis. Silakan salin teks secara manual.');
  }
}
</script>

<style scoped>
:deep(.summary-markdown) {
  color: #e2e8f0;
}

:deep(.summary-markdown p) {
  margin-bottom: 0.85rem;
  line-height: 1.65;
}

:deep(.summary-markdown strong),
:deep(.summary-markdown b) {
  font-weight: 700;
  color: #c7d2fe;
}

:deep(.summary-markdown h1),
:deep(.summary-markdown h2),
:deep(.summary-markdown h3),
:deep(.summary-markdown h4) {
  font-weight: 700;
  color: #ffffff;
  margin-top: 1.1rem;
  margin-bottom: 0.4rem;
  letter-spacing: -0.01em;
}

:deep(.summary-markdown h1) { font-size: 1.15rem; }
:deep(.summary-markdown h2) { font-size: 1.05rem; }
:deep(.summary-markdown h3) { font-size: 0.95rem; }

:deep(.summary-markdown ul) {
  list-style-type: disc;
  padding-left: 1.25rem;
  margin-bottom: 0.85rem;
}

:deep(.summary-markdown ol) {
  list-style-type: decimal;
  padding-left: 1.25rem;
  margin-bottom: 0.85rem;
}

:deep(.summary-markdown li) {
  margin-bottom: 0.35rem;
  line-height: 1.6;
}

:deep(.summary-markdown hr) {
  border-color: rgba(51, 65, 85, 0.6);
  margin: 1rem 0;
}

:deep(.summary-markdown blockquote) {
  border-left: 3px solid #818cf8;
  padding-left: 0.75rem;
  color: #94a3b8;
  font-style: italic;
  margin: 0.75rem 0;
}
</style>

