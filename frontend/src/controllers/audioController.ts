import { ref } from 'vue';
import { audioModel } from '../models/audioModel';
import { getFileExtension } from '../utils/formatters';
import type { TranscriptItem } from '../types';

const ALLOWED_EXTENSIONS = ['.mp3', '.wav', '.m4a'];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export interface AudioMeta {
  durationSeconds: number;
  tokensUsed: number;
}

export interface AudioProcessCallbacks {
  onProgressUpdate?: (transcriptId?: string) => Promise<void> | void;
  onCompleted?: (data: any) => Promise<void> | void;
}

/**
 * controllers/audioController.ts - Controller Pemrosesan Audio (MVC)
 *
 * Mengelola:
 * - Validasi dan upload berkas audio
 * - Polling asinkron status transkripsi
 * - State transkrip aktif, hasil raw_text, dan summary_text
 * - Error handling & loading timers
 */
export function useAudioController() {
  const fileInputRef = ref<HTMLInputElement | null>(null);
  const selectedFile = ref<File | null>(null);
  const isDragging = ref<boolean>(false);
  const isLoading = ref<boolean>(false);
  const loadingMessage = ref<string>('Memproses audio...');
  const loadingTimer = ref<number>(0);
  let timerInterval: ReturnType<typeof setInterval> | null = null;

  // State Hasil Aktif
  const transcriptId = ref<string>('');
  const rawText = ref<string>('');
  const summaryText = ref<string>('');
  const meta = ref<AudioMeta>({
    durationSeconds: 0,
    tokensUsed: 0,
  });
  const errorMessage = ref<string>('');

  function triggerFileInput() {
    if (fileInputRef.value) {
      fileInputRef.value.click();
    }
  }

  function handleFileChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  }

  function handleDrop(event: DragEvent) {
    isDragging.value = false;
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  }

  function validateAndSetFile(file: File): boolean {
    errorMessage.value = '';
    const ext = getFileExtension(file.name).toLowerCase();

    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      alert(`Format file '${ext}' tidak didukung. Harap pilih file dengan format .mp3, .wav, atau .m4a.`);
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      alert('Ukuran file melebihi batas maksimal 50MB.');
      return false;
    }

    if (file.size === 0) {
      alert('File yang dipilih kosong (0 bytes). Silakan pilih file audio yang valid.');
      return false;
    }

    selectedFile.value = file;
    return true;
  }

  function clearFile() {
    selectedFile.value = null;
    if (fileInputRef.value) {
      fileInputRef.value.value = '';
    }
  }

  function displayResults(data: any, callback?: ((data: any) => void) | null) {
    transcriptId.value = data.transcript_id || data.id || '';
    rawText.value = data.raw_text || '';
    summaryText.value = data.summary_text || '';
    meta.value = {
      durationSeconds: data.duration_seconds || 0,
      tokensUsed: data.tokens_used || 0,
    };

    if (callback) {
      callback(data);
    }

    // Scroll halus ke area hasil
    setTimeout(() => {
      const el = document.getElementById('results-area');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 150);
  }

  async function pollTranscript(activeId: string, { onProgressUpdate, onCompleted }: AudioProcessCallbacks = {}): Promise<void> {
    const pollIntervalMs = 2500;
    const maxAttempts = 240; // 240 * 2.5s = 600 detik (10 menit)
    let attempts = 0;

    return new Promise((resolve, reject) => {
      const poller = setInterval(async () => {
        attempts++;
        try {
          const res = await audioModel.getTranscriptStatus(activeId);
          const item = res?.data;

          if (item?.status === 'completed') {
            clearInterval(poller);
            displayResults(
              {
                transcript_id: item.id,
                raw_text: item.raw_text,
                summary_text: item.summary_text,
                duration_seconds: item.duration_seconds,
                tokens_used: item.tokens_used,
              },
              onCompleted
            );
            resolve();
          } else if (item?.status === 'failed') {
            clearInterval(poller);
            if (onProgressUpdate) await onProgressUpdate();
            const failMsg = item.summary_text || item.raw_text || 'Pemrosesan audio gagal.';
            errorMessage.value = failMsg;
            alert(`Pemrosesan Gagal: ${failMsg}`);
            resolve();
          } else if (attempts >= maxAttempts) {
            clearInterval(poller);
            if (onProgressUpdate) await onProgressUpdate();
            alert('Pemrosesan audio membutuhkan waktu lebih lama di latar belakang. Silakan pantau statusnya pada menu Riwayat.');
            resolve();
          }
        } catch (pollErr) {
          console.warn('[Polling] Kendala jaringan saat memantau status transkrip:', pollErr);
          if (attempts >= maxAttempts) {
            clearInterval(poller);
            reject(pollErr);
          }
        }
      }, pollIntervalMs);
    });
  }

  async function processAudio({ onProgressUpdate, onCompleted }: AudioProcessCallbacks = {}) {
    if (!selectedFile.value) {
      alert('Silakan pilih file audio terlebih dahulu.');
      return;
    }

    isLoading.value = true;
    loadingMessage.value = 'Mengunggah file audio ke server...';
    errorMessage.value = '';
    loadingTimer.value = 0;

    timerInterval = setInterval(() => {
      loadingTimer.value++;
      if (loadingTimer.value === 3) {
        loadingMessage.value = 'Sistem sedang mentranskripsikan audio...';
      } else if (loadingTimer.value === 12) {
        loadingMessage.value = 'Sistem sedang menyusun rangkuman intisari...';
      }
    }, 1000);

    try {
      const response = await audioModel.uploadAudio(selectedFile.value);

      if (response.status === 202 || response.data?.status === 'processing') {
        const activeTranscriptId = (response.data as any)?.data?.transcript_id || (response.data as any)?.transcript_id;
        transcriptId.value = activeTranscriptId;

        // Segera beri tahu UI untuk memperbarui daftar riwayat & profil
        if (onProgressUpdate) {
          await onProgressUpdate(activeTranscriptId);
        }

        // Lakukan polling status transkrip secara asinkron (CR-06)
        await pollTranscript(activeTranscriptId, { onProgressUpdate, onCompleted });
      } else if (response.data?.status === 'success') {
        displayResults(response.data.data, onCompleted);
      } else {
        throw new Error(response.data?.message || 'Gagal memproses audio');
      }
    } catch (err: any) {
      console.error('[AudioController] Error saat memproses audio:', err);

      let errorMsg = 'Terjadi kesalahan saat memproses audio.';
      if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
        if (err.response.data.detail) {
          errorMsg += ` (${err.response.data.detail})`;
        }
      } else if (err.message) {
        errorMsg = err.message;
      }

      errorMessage.value = errorMsg;
      alert(`Error: ${errorMsg}`);
    } finally {
      isLoading.value = false;
      if (timerInterval) clearInterval(timerInterval);
    }
  }

  return {
    fileInputRef,
    selectedFile,
    isDragging,
    isLoading,
    loadingMessage,
    loadingTimer,
    transcriptId,
    rawText,
    summaryText,
    meta,
    errorMessage,
    triggerFileInput,
    handleFileChange,
    handleDrop,
    validateAndSetFile,
    clearFile,
    displayResults,
    pollTranscript,
    processAudio,
  };
}

export default useAudioController;

