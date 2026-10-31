<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
    <!-- Navbar Atas -->
    <DashboardNavbar
      :user-data="userData"
      @navigate="$emit('navigate', $event)"
      @open-profile="openProfileModal"
      @logout="handleLogoutClick"
    />

    <!-- Main Content Layout (Sidebar Riwayat + Workspace) -->
    <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <!-- Kolom Kiri: Panel Riwayat Transkripsi -->
        <HistoryPanel
          :history-list="historyList"
          :total-records="totalRecords"
          :current-page="currentPage"
          :total-pages="totalPages"
          :selected-history-id="selectedHistoryId"
          :is-loading="isLoadingHistory"
          :history-error="historyError"
          :status-filter="statusFilter"
          @select="selectHistoryItem"
          @filter-change="setStatusFilter"
          @page-change="fetchHistory"
          @refresh="fetchHistory(currentPage)"
        />

        <!-- Kolom Kanan: Workspace (Upload & Side-by-Side Result) -->
        <section class="lg:col-span-8 space-y-8">
          <!-- Area Upload Audio & Progress -->
          <AudioUploadCard
            :selected-file="selectedFile"
            :is-loading="isLoading"
            :loading-message="loadingMessage"
            :loading-timer="loadingTimer"
            :error-message="errorMessage"
            @file-selected="validateAndSetFile"
            @clear-file="clearFile"
            @process-audio="processAudio"
            @clear-error="errorMessage = ''"
          />

          <!-- Area Hasil Transkripsi & Rangkuman Markdown -->
          <AudioResultCard
            :raw-text="rawText"
            :summary-text="summaryText"
            :duration-seconds="meta.durationSeconds"
            :user-balance="userData?.balance"
          />
        </section>
      </div>
    </main>

    <!-- Footer -->
    <footer class="border-t border-slate-900 py-6 text-center text-xs text-slate-500 mt-auto">
      <p>&copy; 2026 SimpulKata. Platform Transkripsi & Rangkuman AI.</p>
    </footer>

    <!-- Modal Pengaturan Profil & Keamanan Kata Sandi -->
    <ProfileModal
      :is-open="isProfileModalOpen"
      :user-data="userData"
      @close="closeProfileModal"
      @user-updated="onUserUpdated"
      @logout="handleLogoutClick"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { authModel } from '../models/authModel';
import { useAudioController } from '../controllers/audioController';
import { useHistoryController } from '../controllers/historyController';
import type { User, TranscriptItem } from '../types';

// Subkomponen Modular Dashboard
import DashboardNavbar from './dashboard/DashboardNavbar.vue';
import HistoryPanel from './dashboard/HistoryPanel.vue';
import AudioUploadCard from './dashboard/AudioUploadCard.vue';
import AudioResultCard from './dashboard/AudioResultCard.vue';
import ProfileModal from './dashboard/ProfileModal.vue';

// =========================================================
// PROPS & EMITS
// =========================================================
interface Props {
  currentUser?: User | null;
}

const props = withDefaults(defineProps<Props>(), {
  currentUser: null,
});

const emit = defineEmits<{
  (e: 'logout'): void;
  (e: 'navigate', view: string, tab?: string): void;
  (e: 'user-updated', user: User): void;
}>();

const userData = ref<User | null>(props.currentUser || null);
const isProfileModalOpen = ref<boolean>(false);

function openProfileModal() {
  isProfileModalOpen.value = true;
}

function closeProfileModal() {
  isProfileModalOpen.value = false;
}

function onUserUpdated(updatedUser: User) {
  userData.value = updatedUser;
  emit('user-updated', updatedUser);
}

watch(
  () => props.currentUser,
  (newVal) => {
    if (newVal) {
      userData.value = newVal;
    }
  },
  { deep: true }
);

async function fetchUserProfile() {
  try {
    const res = await authModel.getProfile();
    if (res?.status === 'success' && res.data) {
      userData.value = res.data;
      authModel.setSession({ token: authModel.getStoredToken(), user: res.data });
    }
  } catch (err) {
    console.error('[Dashboard] Gagal memuat profil pengguna:', err);
  }
}

function handleLogoutClick() {
  emit('logout');
}

// =========================================================
// CONTROLLERS
// =========================================================
const {
  selectedFile,
  isLoading,
  loadingMessage,
  loadingTimer,
  transcriptId,
  rawText,
  summaryText,
  meta,
  errorMessage,
  validateAndSetFile,
  clearFile,
  processAudio: executeProcessAudio,
} = useAudioController();

const {
  historyList,
  totalRecords,
  currentPage,
  totalPages,
  selectedHistoryId,
  isLoadingHistory,
  historyError,
  statusFilter,
  setStatusFilter,
  fetchHistory,
  selectHistoryItem: triggerSelectHistoryItem,
} = useHistoryController();

// Handler pemilihan item dari riwayat ke panel utama
function selectHistoryItem(item: TranscriptItem, shouldScroll = true) {
  triggerSelectHistoryItem(item, shouldScroll, (selected) => {
    transcriptId.value = selected.id;
    rawText.value = selected.raw_text || '';
    summaryText.value = selected.summary_text || '';
    meta.value = {
      durationSeconds: selected.duration_seconds || 0,
      tokensUsed: selected.tokens_used || 0,
    };
  });
}

// Wrapper pemrosesan audio yang mengorkestrasi polling, riwayat, dan profil
async function processAudio() {
  await executeProcessAudio({
    onProgressUpdate: async (activeTranscriptId?: string) => {
      if (activeTranscriptId) selectedHistoryId.value = activeTranscriptId;
      await fetchHistory(1);
      await fetchUserProfile();
    },
    onCompleted: async () => {
      selectedHistoryId.value = transcriptId.value;
      await fetchHistory(1);
      await fetchUserProfile();
    },
  });
}

// =========================================================
// LIFECYCLE HOOK
// =========================================================
onMounted(async () => {
  await fetchUserProfile();
  await fetchHistory(1, (list) => {
    // Jika belum ada hasil aktif dan ada riwayat selesai, pilih otomatis yang paling atas
    if (!transcriptId.value && list.length > 0) {
      const firstCompleted = list.find((item) => item.status === 'completed') || list[0];
      if (firstCompleted && firstCompleted.status === 'completed') {
        selectHistoryItem(firstCompleted, false);
      }
    }
  });
});
</script>
