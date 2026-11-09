<template>
  <div class="space-y-6">
    <!-- Header Dasbor Log Sistem -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
          <span class="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </span>
          <span>Log Aktivitas Sistem</span>
        </h2>
        <p class="text-xs text-slate-400 mt-1">
          Pantau riwayat operasi, audit error AI, dan aktivitas autentikasi platform secara waktu nyata.
        </p>
      </div>

      <!-- Action Buttons: Auto-refresh & Export CSV -->
      <div class="flex items-center gap-2.5">
        <!-- Toggle Auto-Refresh 30s (SRS UC-15 Step 7) -->
        <button
          type="button"
          class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer"
          :class="[
            isAutoRefreshEnabled
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20 shadow-sm shadow-emerald-950/20'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
          ]"
          :title="isAutoRefreshEnabled ? 'Auto-refresh aktif (tiap 30 detik)' : 'Aktifkan auto-refresh tiap 30 detik'"
          @click="toggleAutoRefresh"
        >
          <span
            class="w-2 h-2 rounded-full"
            :class="isAutoRefreshEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'"
          ></span>
          <span>Auto-Refresh 30s</span>
        </button>

        <!-- Tombol Segarkan Manual -->
        <button
          type="button"
          class="p-2 rounded-xl text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors cursor-pointer"
          :class="isLoading ? 'animate-spin text-indigo-400' : ''"
          title="Segarkan Log Sekarang"
          :disabled="isLoading"
          @click="fetchLogs(currentPage)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>

        <!-- Tombol Unduh CSV (SD-15 Langkah 8-12) -->
        <button
          type="button"
          class="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/30 transition-all cursor-pointer shadow-lg shadow-indigo-600/20 disabled:opacity-50"
          :disabled="isExporting"
          @click="handleExportCsv"
        >
          <svg v-if="!isExporting" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <svg v-else class="w-4 h-4 animate-spin text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
          <span>{{ isExporting ? 'Mengekspor...' : 'Ekspor CSV' }}</span>
        </button>
      </div>
    </div>

    <!-- Ringkasan Statistik Kartu (Stats Widgets) -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
      <!-- Total Logs -->
      <div class="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-md backdrop-blur-sm">
        <p class="text-[11px] font-medium text-slate-400">Total Aktivitas</p>
        <p class="text-xl sm:text-2xl font-black text-white mt-1">{{ stats.total.toLocaleString('id-ID') }}</p>
      </div>

      <!-- Total Errors -->
      <div class="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-md backdrop-blur-sm">
        <p class="text-[11px] font-medium text-rose-400">Galat (ERROR)</p>
        <p class="text-xl sm:text-2xl font-black text-rose-300 mt-1">{{ stats.errors.toLocaleString('id-ID') }}</p>
      </div>

      <!-- Total Warnings -->
      <div class="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-md backdrop-blur-sm">
        <p class="text-[11px] font-medium text-amber-400">Peringatan (WARN)</p>
        <p class="text-xl sm:text-2xl font-black text-amber-300 mt-1">{{ stats.warnings.toLocaleString('id-ID') }}</p>
      </div>

      <!-- Total Info -->
      <div class="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-md backdrop-blur-sm">
        <p class="text-[11px] font-medium text-sky-400">Informasi (INFO)</p>
        <p class="text-xl sm:text-2xl font-black text-sky-300 mt-1">{{ stats.info.toLocaleString('id-ID') }}</p>
      </div>
    </div>

    <!-- Toolbar Filter & Pencarian Log -->
    <div class="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md space-y-3">
      <div class="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <!-- Filter Level Tabs (All / ERROR / WARN / INFO) -->
        <div class="flex items-center gap-1 p-1 rounded-xl bg-slate-950/80 border border-slate-800/80 w-fit">
          <button
            v-for="lvl in levelOptions"
            :key="lvl.value"
            type="button"
            class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer"
            :class="[
              selectedLevel === lvl.value
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            ]"
            @click="setLevelFilter(lvl.value)"
          >
            {{ lvl.label }}
          </button>
        </div>

        <!-- Filter Sumber (Source Dropdown) -->
        <div class="flex items-center gap-2">
          <select
            v-model="selectedSource"
            class="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
            @change="fetchLogs(1)"
          >
            <option value="ALL">Semua Sumber</option>
            <option value="AUTH">AUTH (Autentikasi)</option>
            <option value="AI_SERVICE">AI_SERVICE (Whisper / Llama)</option>
            <option value="AUDIO_UPLOAD">AUDIO_UPLOAD (Unggahan)</option>
            <option value="SYSTEM">SYSTEM (Server Fastify)</option>
            <option value="USER">USER (Aktivitas Pengguna)</option>
            <option value="DATABASE">DATABASE (PostgreSQL)</option>
          </select>

          <!-- Input Pencarian Pesan / Kata Kunci -->
          <div class="relative w-full sm:w-64">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Cari pesan log..."
              class="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              @keyup.enter="fetchLogs(1)"
            />
            <svg class="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Tabel Data Log Sistem -->
    <div class="rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl overflow-hidden backdrop-blur-md">
      <!-- Loading State -->
      <div v-if="isLoading && logs.length === 0" class="py-20 text-center space-y-3">
        <div class="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p class="text-xs text-slate-400">Memuat log sistem dari basis data...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="logs.length === 0" class="py-20 text-center space-y-2">
        <div class="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400 mx-auto">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p class="text-sm font-bold text-white">Tidak Ada Log Ditemukan</p>
        <p class="text-xs text-slate-500">Tidak ada entri log yang cocok dengan kriteria filter saat ini.</p>
      </div>

      <!-- Tabel Responsif -->
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              <th class="py-3 px-4 w-44">Waktu</th>
              <th class="py-3 px-3 w-24">Level</th>
              <th class="py-3 px-3 w-36">Sumber</th>
              <th class="py-3 px-4">Pesan Log</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60 font-sans">
            <tr
              v-for="item in logs"
              :key="item.id"
              class="hover:bg-slate-800/40 transition-colors"
            >
              <!-- Waktu -->
              <td class="py-3 px-4 text-slate-400 font-mono whitespace-nowrap text-[11px]">
                {{ formatDateTime(item.created_at) }}
              </td>

              <!-- Badge Level -->
              <td class="py-3 px-3 whitespace-nowrap">
                <span
                  class="px-2 py-0.5 rounded-md font-mono font-bold text-[10px] uppercase border"
                  :class="getLevelBadgeClass(item.level)"
                >
                  {{ item.level }}
                </span>
              </td>

              <!-- Sumber -->
              <td class="py-3 px-3 whitespace-nowrap font-mono text-slate-300 text-[11px]">
                <span class="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/80">
                  {{ item.source }}
                </span>
              </td>

              <!-- Pesan Log -->
              <td class="py-3 px-4 text-slate-200 leading-relaxed font-mono text-[11px] break-words">
                {{ item.message }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Paginasi Halaman Bawah -->
      <div v-if="totalPages > 1" class="flex items-center justify-between p-4 border-t border-slate-800 text-xs bg-slate-950/60">
        <div class="text-slate-400">
          Menampilkan halaman <strong class="text-white">{{ currentPage }}</strong> dari <strong class="text-white">{{ totalPages }}</strong> (Total {{ totalLogs }} entri)
        </div>
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            :disabled="currentPage <= 1 || isLoading"
            @click="fetchLogs(currentPage - 1)"
          >
            &larr; Sebelumnya
          </button>
          <button
            type="button"
            class="px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            :disabled="currentPage >= totalPages || isLoading"
            @click="fetchLogs(currentPage + 1)"
          >
            Selanjutnya &rarr;
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import adminModel, { SystemLog, LogStats } from '../models/adminModel';

const logs = ref<SystemLog[]>([]);
const stats = ref<LogStats>({
  total: 0,
  errors: 0,
  warnings: 0,
  info: 0,
});

const isLoading = ref<boolean>(false);
const isExporting = ref<boolean>(false);
const isAutoRefreshEnabled = ref<boolean>(true);
let autoRefreshTimer: ReturnType<typeof setInterval> | null = null;

const currentPage = ref<number>(1);
const totalPages = ref<number>(1);
const totalLogs = ref<number>(0);
const pageSize = ref<number>(50);

const selectedLevel = ref<string>('ALL');
const selectedSource = ref<string>('ALL');
const searchQuery = ref<string>('');

const levelOptions = [
  { label: 'Semua', value: 'ALL' },
  { label: 'ERROR', value: 'ERROR' },
  { label: 'WARN', value: 'WARN' },
  { label: 'INFO', value: 'INFO' },
];

function setLevelFilter(level: string) {
  selectedLevel.value = level;
  fetchLogs(1);
}

async function fetchLogs(page = 1) {
  isLoading.value = true;
  try {
    const data = await adminModel.getLogs({
      level: selectedLevel.value,
      source: selectedSource.value,
      search: searchQuery.value,
      page,
      limit: pageSize.value,
    });

    logs.value = data.logs || [];
    currentPage.value = data.page || 1;
    totalPages.value = data.totalPages || 1;
    totalLogs.value = data.total || 0;
    if (data.stats) {
      stats.value = data.stats;
    }
  } catch (err: any) {
    console.error('[AdminLogsView] Gagal mengambil log:', err);
  } finally {
    isLoading.value = false;
  }
}

async function handleExportCsv() {
  isExporting.value = true;
  try {
    await adminModel.downloadLogsCsv({
      level: selectedLevel.value,
      source: selectedSource.value,
      search: searchQuery.value,
    });
  } catch (err: any) {
    console.error('[AdminLogsView] Gagal ekspor CSV:', err);
    alert('Gagal mengunduh berkas CSV log sistem.');
  } finally {
    isExporting.value = false;
  }
}

function toggleAutoRefresh() {
  isAutoRefreshEnabled.value = !isAutoRefreshEnabled.value;
  if (isAutoRefreshEnabled.value) {
    startAutoRefresh();
  } else {
    stopAutoRefresh();
  }
}

function startAutoRefresh() {
  stopAutoRefresh();
  // Polling tiap 30 detik sesuai SRS UC-15 Step 7
  autoRefreshTimer = setInterval(() => {
    fetchLogs(currentPage.value);
  }, 30000);
}

function stopAutoRefresh() {
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer);
    autoRefreshTimer = null;
  }
}

function getLevelBadgeClass(level: string): string {
  switch (level?.toUpperCase()) {
    case 'ERROR':
      return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    case 'WARN':
      return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    case 'INFO':
    default:
      return 'bg-sky-500/10 text-sky-400 border-sky-500/30';
  }
}

function formatDateTime(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(d);
  } catch {
    return dateStr;
  }
}

onMounted(() => {
  fetchLogs(1);
  if (isAutoRefreshEnabled.value) {
    startAutoRefresh();
  }
});

onUnmounted(() => {
  stopAutoRefresh();
});
</script>
