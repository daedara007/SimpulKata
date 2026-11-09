<template>
  <div class="space-y-6">
    <!-- Header Dasbor Manajemen Pengguna -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
          <span class="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </span>
          <span>Daftar Pengguna Platform</span>
        </h2>
        <p class="text-xs text-slate-400 mt-1">
          Pantau seluruh pengguna terdaftar, status verifikasi akun, dan sisa saldo kuota audio (SRS UC-16).
        </p>
      </div>

      <!-- Action Buttons: Segarkan & Export CSV -->
      <div class="flex items-center gap-2.5">
        <!-- Tombol Segarkan Manual -->
        <button
          type="button"
          class="p-2 rounded-xl text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors cursor-pointer"
          :class="isLoading ? 'animate-spin text-indigo-400' : ''"
          title="Segarkan Data Pengguna"
          :disabled="isLoading"
          @click="fetchUsers(currentPage)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>

        <!-- Tombol Unduh CSV (SD-16 Langkah 8-12) -->
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

    <!-- Sub-Navigasi Dasbor Admin (Antara Log Sistem & Daftar Pengguna) -->
    <div class="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 w-fit select-none">
      <RouterLink
        to="/admin/logs"
        class="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all text-slate-400 hover:text-white hover:bg-slate-800/60"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span>Log Sistem (UC-15)</span>
      </RouterLink>

      <RouterLink
        to="/admin/users"
        class="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-600/30"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <span>Daftar Pengguna (UC-16)</span>
      </RouterLink>
    </div>

    <!-- Ringkasan Statistik Kartu Pengguna -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
      <!-- Total Pengguna -->
      <div class="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-md backdrop-blur-sm">
        <p class="text-[11px] font-medium text-slate-400">Total Pengguna</p>
        <p class="text-xl sm:text-2xl font-black text-white mt-1">{{ stats.total.toLocaleString('id-ID') }}</p>
      </div>

      <!-- Akun Aktif -->
      <div class="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-md backdrop-blur-sm">
        <p class="text-[11px] font-medium text-emerald-400">Akun Aktif (ACTIVE)</p>
        <p class="text-xl sm:text-2xl font-black text-emerald-300 mt-1">{{ stats.active.toLocaleString('id-ID') }}</p>
      </div>

      <!-- Menunggu Verifikasi OTP -->
      <div class="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-md backdrop-blur-sm">
        <p class="text-[11px] font-medium text-amber-400">Menunggu OTP (PENDING)</p>
        <p class="text-xl sm:text-2xl font-black text-amber-300 mt-1">{{ stats.pending.toLocaleString('id-ID') }}</p>
      </div>

      <!-- Akun Ditangguhkan -->
      <div class="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-md backdrop-blur-sm">
        <p class="text-[11px] font-medium text-rose-400">Ditangguhkan (SUSPENDED)</p>
        <p class="text-xl sm:text-2xl font-black text-rose-300 mt-1">{{ stats.suspended.toLocaleString('id-ID') }}</p>
      </div>
    </div>

    <!-- Alert Pesan Galat jika ada -->
    <div
      v-if="errorMessage"
      class="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between"
    >
      <div class="flex items-center gap-2">
        <svg class="w-4 h-4 text-rose-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span>{{ errorMessage }}</span>
      </div>
      <button type="button" class="text-rose-400 hover:text-white" @click="errorMessage = null">✕</button>
    </div>

    <!-- Toolbar Filter & Pencarian Pengguna -->
    <div class="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md space-y-3">
      <div class="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <!-- Filter Status Tabs (Semua / ACTIVE / PENDING / SUSPENDED) -->
        <div class="flex items-center gap-1 p-1 rounded-xl bg-slate-950/80 border border-slate-800/80 w-fit">
          <button
            v-for="st in statusOptions"
            :key="st.value"
            type="button"
            class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer"
            :class="[
              selectedStatus === st.value
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            ]"
            @click="setStatusFilter(st.value)"
          >
            {{ st.label }}
          </button>
        </div>

        <!-- Input Pencarian Nama / Email -->
        <div class="relative w-full sm:w-72">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Cari nama atau email pengguna..."
            class="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            @keyup.enter="fetchUsers(1)"
          />
          <svg class="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>
    </div>

    <!-- Tabel Data Pengguna -->
    <div class="rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl overflow-hidden backdrop-blur-md">
      <!-- Loading State -->
      <div v-if="isLoading && users.length === 0" class="py-20 text-center space-y-3">
        <div class="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p class="text-xs text-slate-400">Memuat data pengguna dari basis data...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="users.length === 0" class="py-20 text-center space-y-2">
        <div class="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400 mx-auto">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <p class="text-sm font-bold text-white">Tidak Ada Pengguna Ditemukan</p>
        <p class="text-xs text-slate-500">Tidak ada akun yang sesuai dengan kriteria filter atau pencarian Anda.</p>
      </div>

      <!-- Tabel Responsif -->
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              <th class="py-3 px-4">Pengguna</th>
              <th class="py-3 px-3">Email</th>
              <th class="py-3 px-3">Peran</th>
              <th class="py-3 px-3">Sisa Kuota</th>
              <th class="py-3 px-3">Status</th>
              <th class="py-3 px-4">Terdaftar</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60 font-sans">
            <tr
              v-for="user in users"
              :key="user.id"
              class="hover:bg-slate-800/40 transition-colors"
            >
              <!-- Avatar & Nama -->
              <td class="py-3 px-4">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs shrink-0 border border-indigo-400/30">
                    <img
                      v-if="user.avatar_url"
                      :src="user.avatar_url"
                      :alt="user.name"
                      class="w-full h-full object-cover"
                    />
                    <span v-else>{{ user.name ? user.name.charAt(0).toUpperCase() : 'U' }}</span>
                  </div>
                  <div class="truncate">
                    <p class="font-bold text-white text-xs truncate">{{ user.name }}</p>
                    <p class="text-[10px] text-slate-500 font-mono">ID: {{ user.id.slice(0, 8) }}...</p>
                  </div>
                </div>
              </td>

              <!-- Email -->
              <td class="py-3 px-3 text-slate-300 font-mono text-[11px] whitespace-nowrap">
                {{ user.email }}
              </td>

              <!-- Peran (Role) -->
              <td class="py-3 px-3 whitespace-nowrap">
                <span
                  class="px-2 py-0.5 rounded font-mono font-bold text-[10px] uppercase border"
                  :class="user.role === 'admin'
                    ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                    : 'bg-slate-800 text-slate-400 border-slate-700'"
                >
                  {{ user.role }}
                </span>
              </td>

              <!-- Saldo Kuota -->
              <td class="py-3 px-3 whitespace-nowrap">
                <div class="flex items-center gap-1.5 font-mono text-[11px]" :class="getQuotaTextClass(user.balance)">
                  <span>🔋 {{ formatDuration(user.balance || 0) }}</span>
                  <span class="text-slate-500 text-[10px]">({{ (user.balance || 0).toLocaleString('id-ID') }}s)</span>
                </div>
              </td>

              <!-- Status Badge -->
              <td class="py-3 px-3 whitespace-nowrap">
                <span
                  class="px-2.5 py-1 rounded-full font-mono font-bold text-[10px] uppercase border"
                  :class="getStatusBadgeClass(user.status)"
                >
                  {{ user.status }}
                </span>
              </td>

              <!-- Tanggal Bergabung -->
              <td class="py-3 px-4 text-slate-400 font-mono whitespace-nowrap text-[11px]">
                {{ formatDateTime(user.created_at) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Paginasi Halaman Bawah -->
      <div v-if="totalPages > 1" class="flex items-center justify-between p-4 border-t border-slate-800 text-xs bg-slate-950/60">
        <div class="text-slate-400">
          Menampilkan halaman <strong class="text-white">{{ currentPage }}</strong> dari <strong class="text-white">{{ totalPages }}</strong> (Total {{ totalUsers }} pengguna)
        </div>
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            :disabled="currentPage <= 1 || isLoading"
            @click="fetchUsers(currentPage - 1)"
          >
            &larr; Sebelumnya
          </button>
          <button
            type="button"
            class="px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            :disabled="currentPage >= totalPages || isLoading"
            @click="fetchUsers(currentPage + 1)"
          >
            Selanjutnya &rarr;
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import adminModel, { AdminUserItem, AdminUserStats } from '../models/adminModel';
import { formatDuration } from '../utils';

const users = ref<AdminUserItem[]>([]);
const stats = ref<AdminUserStats>({
  total: 0,
  active: 0,
  pending: 0,
  suspended: 0,
  totalBalanceSeconds: 0,
});

const isLoading = ref<boolean>(false);
const isExporting = ref<boolean>(false);
const errorMessage = ref<string | null>(null);

const currentPage = ref<number>(1);
const totalPages = ref<number>(1);
const totalUsers = ref<number>(0);
const pageSize = ref<number>(50);

const selectedStatus = ref<string>('ALL');
const searchQuery = ref<string>('');

const statusOptions = [
  { label: 'Semua Status', value: 'ALL' },
  { label: 'Aktif (ACTIVE)', value: 'ACTIVE' },
  { label: 'Pending (PENDING)', value: 'PENDING' },
  { label: 'Ditangguhkan', value: 'SUSPENDED' },
];

function setStatusFilter(status: string) {
  selectedStatus.value = status;
  fetchUsers(1);
}

async function fetchUsers(page = 1) {
  isLoading.value = true;
  errorMessage.value = null;
  try {
    const data = await adminModel.getUsers({
      status: selectedStatus.value,
      search: searchQuery.value,
      page,
      limit: pageSize.value,
    });

    users.value = data.users || [];
    currentPage.value = data.page || 1;
    totalPages.value = data.totalPages || 1;
    totalUsers.value = data.total || 0;
    if (data.stats) {
      stats.value = data.stats;
    }
  } catch (err: any) {
    console.error('[AdminUsersView] Gagal mengambil daftar pengguna:', err);
    errorMessage.value = 'Gagal memuat data pengguna. Silakan periksa koneksi atau coba lagi.';
  } finally {
    isLoading.value = false;
  }
}

async function handleExportCsv() {
  isExporting.value = true;
  errorMessage.value = null;
  try {
    await adminModel.downloadUsersCsv({
      status: selectedStatus.value,
      search: searchQuery.value,
    });
  } catch (err: any) {
    console.error('[AdminUsersView] Gagal ekspor CSV pengguna:', err);
    errorMessage.value = 'Gagal mengunduh berkas CSV data pengguna. Silakan coba sesaat lagi.';
  } finally {
    isExporting.value = false;
  }
}

function getStatusBadgeClass(status: string): string {
  switch (status?.toUpperCase()) {
    case 'ACTIVE':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    case 'PENDING':
      return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    case 'SUSPENDED':
    default:
      return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
  }
}

function getQuotaTextClass(balance: number): string {
  if (balance > 600) return 'text-emerald-400';
  if (balance >= 300) return 'text-amber-400';
  return 'text-rose-400';
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
    }).format(d);
  } catch {
    return dateStr;
  }
}

onMounted(() => {
  fetchUsers(1);
});
</script>
