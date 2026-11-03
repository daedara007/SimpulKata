<template>
  <div class="space-y-6">
    <!-- Hero Banner -->
    <div class="text-left space-y-1.5">
      <h2 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
        Transkripsi & Rangkuman <span class="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Audio AI</span>
      </h2>
      <p class="text-slate-400 text-xs sm:text-sm">
        Unggah berkas audio atau rekam langsung percakapan rapat dan perkuliahan Anda. Sistem AI akan mentranskripsikan percakapan secara presisi dan menyusun rangkuman intisari secara otomatis.
      </p>
    </div>

    <!-- Tab Pemilihan Mode Input (SRS UC-07 vs UC-08) -->
    <div class="flex items-center gap-2 p-1 rounded-xl bg-slate-900/80 border border-slate-800 w-fit">
      <button
        type="button"
        class="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer"
        :class="inputMode === 'upload' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-slate-200'"
        :disabled="isRecording || isLoading"
        @click="setInputMode('upload')"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <span>Unggah Berkas</span>
      </button>

      <button
        type="button"
        class="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer"
        :class="inputMode === 'record' ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30' : 'text-slate-400 hover:text-slate-200'"
        :disabled="isLoading"
        @click="setInputMode('record')"
      >
        <svg class="w-3.5 h-3.5" :class="{ 'animate-pulse text-white': isRecording }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" />
        </svg>
        <span>Rekam Langsung</span>
        <span v-if="isRecording" class="w-2 h-2 rounded-full bg-white animate-ping"></span>
      </button>
    </div>

    <!-- AREA 1: UPLOAD BERKAS AUDIO (SRS UC-07) -->
    <div
      v-if="inputMode === 'upload'"
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
      <!-- Hidden File Input (Gunakan ekstensi eksplisit tanpa wildcard audio/* agar browser mobile Android tidak crash/refresh) -->
      <input
        ref="fileInputRef"
        type="file"
        accept=".mp3,.wav,.m4a,.webm,.ogg"
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
          <p class="text-xs text-slate-500 mt-1">Mendukung format .MP3, .WAV, .M4A, .WEBM, dan .OGG (Maksimal 200MB)</p>
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

    <!-- AREA 2: REKAM AUDIO LANGSUNG VIA WEB (SRS UC-08 & Sequence SD-08) -->
    <div
      v-else
      class="relative border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all duration-200"
      :class="[
        isRecording
          ? 'border-rose-500 bg-rose-500/10 shadow-lg shadow-rose-500/20'
          : selectedFile && !isRecording
            ? 'border-emerald-500/60 bg-emerald-500/5'
            : 'border-slate-800 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900/60'
      ]"
    >
      <!-- State 1: Belum Merekam (Idle) -->
      <div v-if="!isRecording && !selectedFile" class="space-y-4">
        <div class="w-16 h-16 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shadow-md">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" />
          </svg>
        </div>
        <div class="space-y-1">
          <h3 class="text-sm sm:text-base font-bold text-white">Rekam Percakapan Langsung</h3>
          <p class="text-xs text-slate-400 max-w-sm mx-auto">
            Gunakan mikrofon perangkat Anda untuk merekam diskusi, presentasi, atau kuliah secara real-time.
          </p>
        </div>
        <div class="space-y-2">
          <button
            type="button"
            class="px-5 py-2.5 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 shadow-lg shadow-rose-600/30 hover:scale-105 active:scale-95 transition-all inline-flex items-center gap-2 cursor-pointer"
            :disabled="isLoading"
            @click="startRecording"
          >
            <span class="w-2.5 h-2.5 rounded-full bg-white animate-pulse"></span>
            <span>Mulai Merekam</span>
          </button>
          <p class="text-[11px] text-slate-500">
            Peramban akan meminta izin akses mikrofon secara otomatis saat tombol diklik.
          </p>
        </div>
      </div>

      <!-- State 2: Sedang Merekam (Active Recording) -->
      <div v-else-if="isRecording" class="space-y-5 py-2">
        <div class="relative w-20 h-20 mx-auto flex items-center justify-center">
          <span class="absolute inset-0 rounded-full bg-rose-500/20 animate-ping"></span>
          <span class="absolute inset-2 rounded-full bg-rose-500/30 animate-pulse"></span>
          <div class="relative w-14 h-14 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg shadow-rose-600/50">
            <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" />
            </svg>
          </div>
        </div>

        <div class="space-y-1">
          <p class="text-xs font-semibold uppercase tracking-wider text-rose-400 flex items-center justify-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-rose-400 animate-ping"></span>
            Merekam Suara Langsung
          </p>
          <div class="text-3xl sm:text-4xl font-mono font-bold text-white tracking-widest">
            {{ formatRecordingTimer(recordingTimer) }}
          </div>
          <p class="text-[11px] text-slate-400">
            Bicaralah dengan jelas ke arah mikrofon. Klik tombol di bawah setelah selesai.
          </p>
        </div>

        <div>
          <button
            type="button"
            class="px-5 py-2.5 rounded-xl font-semibold text-xs text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 shadow-md inline-flex items-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95"
            @click="stopRecording"
          >
            <span class="w-3 h-3 rounded-sm bg-rose-500"></span>
            <span>Hentikan Rekaman</span>
          </button>
        </div>
      </div>

      <!-- State 3: Rekaman Selesai & Pratinjau Pemutar Audio (Ready to Process) -->
      <div v-else class="space-y-4">
        <div class="inline-flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800/80 border border-emerald-500/30 max-w-full">
          <div class="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div class="text-left truncate">
            <p class="text-sm font-medium text-slate-200 truncate">{{ selectedFile?.name }}</p>
            <p class="text-xs text-emerald-400 font-medium">
              Durasi: {{ formatRecordingTimer(recordingTimer) }} • {{ selectedFile ? formatFileSize(selectedFile.size) : '0 KB' }}
            </p>
          </div>
          <button
            type="button"
            class="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors ml-2 cursor-pointer"
            title="Hapus rekaman"
            :disabled="isLoading"
            @click="resetRecording"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Pratinjau Pemutar Audio Kustom (Custom Audio Player) -->
        <div v-if="audioPlaybackUrl" class="max-w-md mx-auto p-3.5 rounded-2xl bg-slate-900/90 border border-slate-700/70 shadow-lg space-y-2">
          <!-- Hidden Native Audio -->
          <audio
            ref="audioPlayerRef"
            :src="audioPlaybackUrl"
            class="hidden"
            @timeupdate="onPlaybackTimeUpdate"
            @ended="onPlaybackEnded"
            @play="isPlayingPreview = true"
            @pause="isPlayingPreview = false"
          />

          <!-- Controls Bar -->
          <div class="flex items-center gap-3">
            <!-- Play/Pause Button -->
            <button
              type="button"
              class="w-10 h-10 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white flex items-center justify-center shadow-md shadow-rose-600/30 transition-all hover:scale-105 active:scale-95 shrink-0 cursor-pointer"
              :title="isPlayingPreview ? 'Jeda' : 'Putar'"
              @click="togglePlayPreview"
            >
              <svg v-if="!isPlayingPreview" class="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              <svg v-else class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            </button>

            <!-- Custom Slider & Times -->
            <div class="flex-1 space-y-1">
              <input
                type="range"
                min="0"
                :max="recordedDurationSeconds || 1"
                step="0.1"
                :value="playbackCurrentTime"
                class="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500 focus:outline-none"
                @input="onSeekPreview"
              />
              <div class="flex justify-between items-center text-[11px] font-mono text-slate-400">
                <span>{{ formatRecordingTimer(Math.floor(playbackCurrentTime)) }}</span>
                <span class="text-slate-300 font-semibold">{{ formatRecordingTimer(recordedDurationSeconds) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <button
            type="button"
            class="text-xs text-rose-400 hover:text-rose-300 underline focus:outline-none cursor-pointer"
            :disabled="isLoading"
            @click="resetRecording"
          >
            Rekam ulang audio
          </button>
        </div>
      </div>

      <!-- Alert Error Rekaman Mikrofon -->
      <div v-if="recordingError" class="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
        {{ recordingError }}
      </div>
    </div>

    <!-- Action Button (Kirim ke Pipeline AI) -->
    <div class="flex justify-start">
      <button
        type="button"
        class="w-full sm:w-auto min-w-[220px] px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg cursor-pointer"
        :class="[
          !selectedFile || isLoading || isRecording
            ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/60 shadow-none'
            : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-600/25 hover:shadow-indigo-600/40 hover:scale-[1.02] active:scale-[0.98]'
        ]"
        :disabled="!selectedFile || isLoading || isRecording"
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
import { ref, onUnmounted } from 'vue';
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

// Mode Input: 'upload' (UC-07) atau 'record' (UC-08)
const inputMode = ref<'upload' | 'record'>('upload');

function setInputMode(mode: 'upload' | 'record') {
  if (isRecording.value) return;
  inputMode.value = mode;
  recordingError.value = '';
}

// -------------------------------------------------------------
// LOGIKA UNGGAH BERKAS (UC-07)
// -------------------------------------------------------------
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

// -------------------------------------------------------------
// LOGIKA PEREKAMAN AUDIO LANGSUNG WEB (SRS UC-08 & Sequence SD-08)
// -------------------------------------------------------------
const isRecording = ref<boolean>(false);
const recordingTimer = ref<number>(0);
const recordingError = ref<string>('');
const audioPlaybackUrl = ref<string | null>(null);

// State Pemutar Audio Pratinjau Kustom
const audioPlayerRef = ref<HTMLAudioElement | null>(null);
const isPlayingPreview = ref<boolean>(false);
const playbackCurrentTime = ref<number>(0);
const recordedDurationSeconds = ref<number>(0);

let mediaRecorder: MediaRecorder | null = null;
let mediaStream: MediaStream | null = null;
let audioChunks: Blob[] = [];
let timerInterval: number | null = null;
let recordingStartTime = 0;

function togglePlayPreview() {
  if (!audioPlayerRef.value) return;
  if (isPlayingPreview.value) {
    audioPlayerRef.value.pause();
  } else {
    audioPlayerRef.value.play();
  }
}

function onPlaybackTimeUpdate() {
  if (!audioPlayerRef.value) return;
  playbackCurrentTime.value = Math.min(audioPlayerRef.value.currentTime, recordedDurationSeconds.value);
}

function onPlaybackEnded() {
  isPlayingPreview.value = false;
  playbackCurrentTime.value = 0;
  if (audioPlayerRef.value) {
    audioPlayerRef.value.currentTime = 0;
  }
}

function onSeekPreview(event: Event) {
  const target = event.target as HTMLInputElement;
  const newTime = parseFloat(target.value);
  playbackCurrentTime.value = newTime;
  if (audioPlayerRef.value) {
    audioPlayerRef.value.currentTime = newTime;
  }
}

function formatRecordingTimer(seconds: number): string {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

async function getAudioStream(): Promise<MediaStream> {
  // 1. Modern MediaDevices API standard
  if (navigator?.mediaDevices?.getUserMedia) {
    return await navigator.mediaDevices.getUserMedia({ audio: true });
  }

  // 2. Legacy getUserMedia fallback
  const legacyGetUserMedia =
    (navigator as any).getUserMedia ||
    (navigator as any).webkitGetUserMedia ||
    (navigator as any).mozGetUserMedia ||
    (navigator as any).msGetUserMedia;

  if (legacyGetUserMedia) {
    return new Promise((resolve, reject) => {
      legacyGetUserMedia.call(navigator, { audio: true }, resolve, reject);
    });
  }

  // 3. Deteksi masalah Secure Context (HTTP vs HTTPS / localhost)
  if (typeof window !== 'undefined' && window.isSecureContext === false) {
    throw new Error(
      `Fitur mikrofon diblokir oleh browser karena diakses melalui HTTP (${window.location.hostname}). Silakan buka aplikasi via http://localhost:8080 (atau gunakan HTTPS) agar browser mengaktifkan izin mikrofon.`
    );
  }

  throw new Error('API perekaman audio (getUserMedia) tidak tersedia pada peramban Anda.');
}

async function startRecording() {
  recordingError.value = '';

  // 1. Validasi dukungan MediaRecorder
  if (typeof MediaRecorder === 'undefined') {
    recordingError.value =
      'Browser Anda tidak mendukung MediaRecorder. Silakan gunakan Google Chrome, Firefox, atau Edge versi terbaru.';
    return;
  }

  try {
    // 2. Minta izin akses mikrofon perangkat (SD-08 Langkah 2 & 3)
    mediaStream = await getAudioStream();

    // 3. Tentukan format audio yang didukung browser (utamakan audio/mp4 agar seekbar dan durasi native sempurna)
    const preferredTypes = [
      'audio/mp4',
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg',
    ];
    let mimeType = preferredTypes.find((type) => MediaRecorder.isTypeSupported(type)) || '';

    mediaRecorder = mimeType
      ? new MediaRecorder(mediaStream, { mimeType })
      : new MediaRecorder(mediaStream);

    audioChunks = [];

    // 4. Tangkap chunk audio berkala (SD-08 Langkah 5 & 6)
    mediaRecorder.ondataavailable = (event: BlobEvent) => {
      if (event.data && event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    // 5. Tangkap event onstop saat perekaman selesai (SD-08 Langkah 10 & 11)
    mediaRecorder.onstop = () => {
      const activeMimeType = mediaRecorder?.mimeType || 'audio/webm';
      const finalBlob = new Blob(audioChunks, { type: activeMimeType });
      const durationMs = Math.max(Date.now() - recordingStartTime, 1000);
      const totalSeconds = Math.max(Math.round(durationMs / 1000), 1);

      recordingTimer.value = totalSeconds;
      recordedDurationSeconds.value = totalSeconds;
      playbackCurrentTime.value = 0;
      isPlayingPreview.value = false;

      // Generate preview URL
      if (audioPlaybackUrl.value) {
        URL.revokeObjectURL(audioPlaybackUrl.value);
      }
      audioPlaybackUrl.value = URL.createObjectURL(finalBlob);

      // Buat objek File standar untuk diserahkan ke sistem
      const ext = activeMimeType.includes('mp4')
        ? '.m4a'
        : activeMimeType.includes('ogg')
          ? '.ogg'
          : '.webm';
      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, '-')
        .slice(0, 19);
      const audioFile = new File([finalBlob], `rekaman-${timestamp}${ext}`, {
        type: activeMimeType,
      });

      emit('file-selected', audioFile);

      // Matikan seluruh track audio perangkat (lepaskan hardware mic)
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
        mediaStream = null;
      }
    };

    // Mulai merekam dengan interval chunk 1000ms
    mediaRecorder.start(1000);
    isRecording.value = true;
    recordingTimer.value = 0;
    recordingStartTime = Date.now();

    // Timer berjalan per detik
    timerInterval = window.setInterval(() => {
      recordingTimer.value++;
      // Batas keamanan maksimal 60 menit (A3: SRS UC-08)
      if (recordingTimer.value >= 3600) {
        stopRecording();
      }
    }, 1000);
  } catch (err: any) {
    console.error('[AudioUploadCard] Gagal memulai perekaman audio:', err);
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      recordingError.value =
        'Izin akses mikrofon ditolak oleh browser. Mohon izinkan mikrofon di bilah alamat browser (ikon gembok / izin situs).';
    } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
      recordingError.value =
        'Perangkat mikrofon tidak ditemukan. Pastikan mikrofon terpasang pada komputer atau laptop Anda.';
    } else {
      recordingError.value = err.message || 'Gagal menginisiasi perekaman audio.';
    }
    isRecording.value = false;
  }
}

function stopRecording() {
  if (timerInterval !== null) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }

  isRecording.value = false;
}

function resetRecording() {
  stopRecording();
  if (audioPlayerRef.value) {
    audioPlayerRef.value.pause();
    audioPlayerRef.value.currentTime = 0;
  }
  isPlayingPreview.value = false;
  playbackCurrentTime.value = 0;
  recordedDurationSeconds.value = 0;
  if (audioPlaybackUrl.value) {
    URL.revokeObjectURL(audioPlaybackUrl.value);
    audioPlaybackUrl.value = null;
  }
  recordingTimer.value = 0;
  recordingError.value = '';
  emit('clear-file');
}

onUnmounted(() => {
  stopRecording();
  if (audioPlayerRef.value) {
    audioPlayerRef.value.pause();
  }
  if (audioPlaybackUrl.value) {
    URL.revokeObjectURL(audioPlaybackUrl.value);
  }
});
</script>

