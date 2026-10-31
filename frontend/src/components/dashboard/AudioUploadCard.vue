<template>
  <div class="space-y-6">
    <!-- Hero Banner -->
    <div class="text-left space-y-1.5">
      <h2 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
        Transkripsi & Rangkuman <span class="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Audio AI</span>
      </h2>
      <p class="text-slate-400 text-xs sm:text-sm">
        Unggah berkas audio rapat atau perkuliahan Anda. Sistem AI akan mentranskripsikan percakapan secara presisi dan menyusun rangkuman intisari secara otomatis.
      </p>
    </div>

    <!-- Upload Card / Dropzone Area -->
    <div
      class="relative border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all duration-200"
      :class="[
        isDragging
          ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10'
          : 'border-slate-800 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900/60'
      ]"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="onDrop"
    >
      <!-- Hidden File Input -->
      <input
        ref="fileInputRef"
        type="file"
        accept=".mp3,.wav,.m4a,audio/mp3,audio/wav,audio/x-m4a,audio/mp4"
        class="hidden"
        @change="onFileInputChange"
      />

      <!-- Empty State (No File) -->
      <div v-if="!selectedFile" class="space-y-4">
        <div class="w-14 h-14 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
          <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <div>
          <button
            type="button"
            class="font-semibold text-indigo-400 hover:text-indigo-300 focus:outline-none focus:underline text-sm cursor-pointer"
            @click="triggerFileInput"
          >
            Pilih file audio
          </button>
          <span class="text-slate-400 text-sm"> atau seret ke area ini</span>
          <p class="text-xs text-slate-500 mt-1">Mendukung format .MP3, .WAV, dan .M4A (Maksimal 50MB)</p>
        </div>
      </div>

      <!-- File Selected State -->
      <div v-else class="space-y-4">
        <div class="inline-flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 max-w-full">
          <div class="w-10 h-10 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
          <div class="text-left truncate">
            <p class="text-sm font-medium text-slate-200 truncate">{{ selectedFile.name }}</p>
            <p class="text-xs text-slate-400">{{ formatFileSize(selectedFile.size) }} • {{ getFileExtension(selectedFile.name) }}</p>
          </div>
          <button
            type="button"
            class="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors ml-2 cursor-pointer"
            title="Hapus file"
            :disabled="isLoading"
            @click="onClearFile"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div>
          <button
            type="button"
            class="text-xs text-indigo-400 hover:text-indigo-300 underline focus:outline-none cursor-pointer"
            :disabled="isLoading"
            @click="triggerFileInput"
          >
            Pilih file lain
          </button>
        </div>
      </div>
    </div>

    <!-- Action Button -->
    <div class="flex justify-start">
      <button
        type="button"
        class="w-full sm:w-auto min-w-[220px] px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg cursor-pointer"
        :class="[
          !selectedFile || isLoading
            ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/60 shadow-none'
            : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-600/25 hover:shadow-indigo-600/40 hover:scale-[1.02] active:scale-[0.98]'
        ]"
        :disabled="!selectedFile || isLoading"
        @click="$emit('process-audio')"
      >
        <!-- Loading Spinner -->
        <svg
          v-if="isLoading"
          class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <span>{{ isLoading ? loadingMessage : 'Proses Transkripsi' }}</span>
      </button>
    </div>

    <!-- Loading Progress Bar & Status Details -->
    <div v-if="isLoading" class="p-4 rounded-xl bg-slate-900/80 border border-indigo-500/30 space-y-2">
      <div class="flex items-center justify-between text-xs text-slate-300">
        <span class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-indigo-400 animate-ping"></span>
          {{ loadingMessage }}
        </span>
        <span class="text-slate-400 font-mono">{{ loadingTimer }}s</span>
      </div>
      <div class="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
        <div class="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 rounded-full animate-pulse w-full"></div>
      </div>
      <p class="text-[11px] text-slate-400 text-center">
        Sistem sedang menganalisis berkas audio, mentranskripsikan percakapan, dan menyusun rangkuman intisari.
      </p>
    </div>

    <!-- Error Alert Card -->
    <div v-if="errorMessage" class="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3">
      <div class="text-rose-400 shrink-0 mt-0.5">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div class="flex-1 text-sm text-rose-200">
        <p class="font-semibold text-rose-300">Gagal Memproses Audio</p>
        <p class="mt-0.5 text-xs text-rose-300/80">{{ errorMessage }}</p>
      </div>
      <button
        type="button"
        class="text-rose-400 hover:text-rose-300 p-1 cursor-pointer"
        @click="$emit('clear-error')"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { formatFileSize, getFileExtension } from '../../utils';

defineProps<{
  selectedFile: File | null;
  isLoading: boolean;
  loadingMessage: string;
  loadingTimer: number;
  errorMessage: string;
}>();

const emit = defineEmits<{
  (e: 'file-selected', file: File): void;
  (e: 'clear-file'): void;
  (e: 'process-audio'): void;
  (e: 'clear-error'): void;
}>();

const fileInputRef = ref<HTMLInputElement | null>(null);
const isDragging = ref<boolean>(false);

function triggerFileInput() {
  if (fileInputRef.value) {
    fileInputRef.value.click();
  }
}

function onFileInputChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    emit('file-selected', file);
  }
}

function onDrop(event: DragEvent) {
  isDragging.value = false;
  const file = event.dataTransfer?.files?.[0];
  if (file) {
    emit('file-selected', file);
  }
}

function onClearFile() {
  if (fileInputRef.value) {
    fileInputRef.value.value = '';
  }
  emit('clear-file');
}
</script>

