<template>
  <div class="space-y-6 sm:space-y-8 animate-fadeIn pb-12">
    <!-- Header Halaman & Action Buttons -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-800/80">
      <div>
        <h2 class="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
          <span class="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
          <span>Laporan Transaksi Global</span>
        </h2>
        <p class="text-xs sm:text-sm text-slate-400 mt-1">
          Pantau seluruh arus transaksi pembayaran kuota masuk dari payment gateway secara global.
        </p>
      </div>

      <!-- Action Buttons: Segarkan & Export CSV (SD-17 Langkah 8-12) -->
      <div class="flex items-center gap-2.5">
        <!-- Tombol Segarkan Manual -->
        <button
          type="button"
          class="p-2 rounded-xl text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors cursor-pointer"
          :class="isLoading ? 'animate-spin text-indigo-400' : ''"
          title="Segarkan Data Transaksi"
          :disabled="isLoading"
          @click="fetchTransactions(currentPage)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>

        <!-- Tombol Unduh CSV -->
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

    <!-- Sub-Navigasi Dasbor Admin (3 Tab Panel Admin) -->
    <div class="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 w-fit select-none">
      <RouterLink
        to="/admin/logs"
        class="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all text-slate-400 hover:text-white hover:bg-slate-800/60"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span>Log Sistem</span>
      </RouterLink>

      <RouterLink
        to="/admin/users"
        class="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all text-slate-400 hover:text-white hover:bg-slate-800/60"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <span>Daftar Pengguna</span>
      </RouterLink>

      <RouterLink
        to="/admin/transactions"
        class="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-600/30"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
        <span>Transaksi Global</span>
      </RouterLink>
    </div>

    <!-- Alert Notifikasi Galat -->
    <div
      v-if="errorMessage"
      class="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between"
    >
      <div class="flex items-center gap-2">
        <svg class="w-4 h-4 text-rose-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{{ errorMessage }}</span>
      </div>
      <button
        type="button"
        class="text-rose-400 hover:text-rose-200 text-sm ml-2"
        @click="errorMessage = ''"
      >
        &times;
      </button>
    </div>

    <!-- 4 Kartu Metrik Finansial (SD-17 Langkah 9 / Total Revenue Widget) -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
      <!-- Total Pendapatan Selesai -->
      <div class="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-md backdrop-blur-sm relative overflow-hidden">
        <div class="absolute -right-3 -bottom-3 w-16 h-16 rounded-full bg-emerald-500/10 blur-xl pointer-events-none"></div>
        <p class="text-[11px] font-medium text-slate-400">Total Pendapatan Sukses</p>
        <p class="text-xl sm:text-2xl font-black text-emerald-400 mt-1 font-mono">
          {{ formatRupiah(stats.totalRevenue) }}
        </p>
      </div>

      <!-- Transaksi Berhasil -->
      <div class="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-md backdrop-blur-sm">
        <p class="text-[11px] font-medium text-slate-400">Transaksi Selesai</p>
        <p class="text-xl sm:text-2xl font-black text-white mt-1">{{ stats.completedCount.toLocaleString('id-ID') }}</p>
      </div>

      <!-- Menunggu Pembayaran -->
      <div class="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-md backdrop-blur-sm">
        <p class="text-[11px] font-medium text-slate-400">Menunggu Pembayaran</p>
        <p class="text-xl sm:text-2xl font-black text-amber-400 mt-1">{{ stats.pendingCount.toLocaleString('id-ID') }}</p>
      </div>

      <!-- Dibatalkan / Gagal -->
      <div class="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-md backdrop-blur-sm">
        <p class="text-[11px] font-medium text-slate-400">Dibatalkan / Gagal</p>
        <p class="text-xl sm:text-2xl font-black text-rose-400 mt-1">{{ stats.failedCount.toLocaleString('id-ID') }}</p>
      </div>
    </div>

    <!-- Filter & Pencarian Bar -->
    <div class="p-4 sm:p-5 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl shadow-xl space-y-4">
      <div class="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 items-center">
        <!-- Pencarian Teks -->
        <div class="sm:col-span-5 relative">
          <svg class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Cari nomor pesanan, nama, atau email..."
            class="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            @keyup.enter="handleSearch"
          />
        </div>

        <!-- Filter Status -->
        <div class="sm:col-span-3">
          <select
            v-model="selectedStatus"
            class="w-full px-3 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
            @change="handleFilterChange"
          >
            <option value="ALL">Semua Status</option>
            <option value="completed">Selesai (Completed)</option>
            <option value="pending">Menunggu (Pending)</option>
            <option value="failed">Gagal / Dibatalkan</option>
          </select>
        </div>

        <!-- Filter Rentang Tanggal: Dari -->
        <div class="sm:col-span-2">
          <input
            v-model="startDate"
            type="date"
            class="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
            title="Tanggal Mulai"
            @change="handleFilterChange"
          />
        </div>

        <!-- Filter Rentang Tanggal: Sampai -->
        <div class="sm:col-span-2 flex items-center gap-2">
          <input
            v-model="endDate"
            type="date"
            class="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
            title="Tanggal Akhir"
            @change="handleFilterChange"
          />
          <!-- Reset Filter -->
          <button
            v-if="hasActiveFilter"
            type="button"
            class="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer shrink-0"
            title="Reset Filter"
            @click="resetFilter"
          >
            &times;
          </button>
        </div>
      </div>
    </div>

    <!-- Tabel Data Transaksi Global -->
    <div class="rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl shadow-xl overflow-hidden">
      <!-- Loading Skeleton -->
      <div v-if="isLoading" class="p-8 space-y-4">
        <div v-for="i in 5" :key="i" class="h-12 bg-slate-800/50 rounded-2xl animate-pulse"></div>
      </div>

      <!-- State Kosong / Tidak Ada Data -->
      <div
        v-else-if="orders.length === 0"
        class="p-12 text-center space-y-3"
      >
        <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-slate-400">
          <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 class="text-base font-bold text-white">Tidak Ada Transaksi Ditemukan</h3>
        <p class="text-xs text-slate-400 max-w-sm mx-auto">
          Tidak ada data transaksi yang sesuai dengan kriteria filter atau pencarian Anda.
        </p>
      </div>

      <!-- Tabel Transaksi -->
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-slate-800/80 bg-slate-950/40 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <th class="py-4 px-4 sm:px-6">Nomor Pesanan</th>
              <th class="py-4 px-4">Pengguna</th>
              <th class="py-4 px-4">Paket Kuota</th>
              <th class="py-4 px-4">Nominal</th>
              <th class="py-4 px-4">Metode</th>
              <th class="py-4 px-4">Status</th>
              <th class="py-4 px-4 sm:px-6">Waktu Transaksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60 text-xs">
            <tr
              v-for="order in orders"
              :key="order.id"
              class="hover:bg-slate-800/30 transition-colors"
            >
              <!-- Nomor Order -->
              <td class="py-4 px-4 sm:px-6 font-mono font-medium text-slate-200 whitespace-nowrap">
                {{ order.order_number }}
              </td>

              <!-- Pengguna -->
              <td class="py-4 px-4 whitespace-nowrap">
                <div class="font-semibold text-white">{{ order.user_name || 'Tanpa Nama' }}</div>
                <div class="text-[11px] text-slate-400 font-mono">{{ order.user_email }}</div>
              </td>

              <!-- Paket -->
              <td class="py-4 px-4 whitespace-nowrap">
                <div class="font-medium text-white">{{ order.package_name }}</div>
                <div class="text-[11px] text-indigo-400 font-mono">+{{ order.package_minutes }} menit</div>
              </td>

              <!-- Nominal -->
              <td class="py-4 px-4 font-mono font-bold text-slate-200 whitespace-nowrap">
                {{ formatRupiah(order.amount) }}
              </td>

              <!-- Metode -->
              <td class="py-4 px-4 whitespace-nowrap">
                <span class="px-2 py-0.5 rounded-lg text-[10px] font-mono uppercase bg-slate-800 text-slate-300 border border-slate-700">
                  {{ order.payment_type || 'snap' }}
                </span>
              </td>

              <!-- Status -->
              <td class="py-4 px-4 whitespace-nowrap">
                <span
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border"
                  :class="statusBadgeClass(order.status)"
                >
                  <span class="w-1.5 h-1.5 rounded-full" :class="statusDotClass(order.status)"></span>
                  {{ formatStatusText(order.status) }}
                </span>
              </td>

              <!-- Waktu -->
              <td class="py-4 px-4 sm:px-6 text-slate-400 text-[11px] whitespace-nowrap">
                {{ formatDateTime(order.created_at) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Footer Paginasi -->
      <div
        v-if="totalPages > 1"
        class="p-4 sm:p-5 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400"
      >
        <div>
          Menampilkan <span class="font-bold text-white">{{ orders.length }}</span> dari <span class="font-bold text-white">{{ totalOrders }}</span> transaksi (Halaman {{ currentPage }} dari {{ totalPages }})
        </div>
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            :disabled="currentPage <= 1 || isLoading"
            @click="fetchTransactions(currentPage - 1)"
          >
            Sebelumnya
          </button>
          <button
            type="button"
            class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            :disabled="currentPage >= totalPages || isLoading"
            @click="fetchTransactions(currentPage + 1)"
          >
            Selanjutnya
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import {
  adminModel,
  type AdminTransactionItem,
  type AdminTransactionStats,
} from '../models/adminModel';

const orders = ref<AdminTransactionItem[]>([]);
const totalOrders = ref(0);
const currentPage = ref(1);
const totalPages = ref(1);
const isLoading = ref(false);
const isExporting = ref(false);
const errorMessage = ref('');

const selectedStatus = ref('ALL');
const searchQuery = ref('');
const startDate = ref('');
const endDate = ref('');

const stats = ref<AdminTransactionStats>({
  totalRevenue: 0,
  completedCount: 0,
  pendingCount: 0,
  failedCount: 0,
  totalOrders: 0,
});

const hasActiveFilter = computed(() => {
  return selectedStatus.value !== 'ALL' || searchQuery.value.trim() !== '' || startDate.value !== '' || endDate.value !== '';
});

function formatRupiah(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(num || 0);
}

function formatDateTime(dateStr: string): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'completed':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    case 'pending':
      return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    case 'failed':
    case 'cancelled':
      return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    default:
      return 'bg-slate-800 text-slate-400 border-slate-700';
  }
}

function statusDotClass(status: string): string {
  switch (status) {
    case 'completed':
      return 'bg-emerald-400';
    case 'pending':
      return 'bg-amber-400 animate-pulse';
    case 'failed':
    case 'cancelled':
      return 'bg-rose-400';
    default:
      return 'bg-slate-400';
  }
}

function formatStatusText(status: string): string {
  switch (status) {
    case 'completed':
      return 'Selesai';
    case 'pending':
      return 'Menunggu';
    case 'failed':
      return 'Gagal';
    case 'cancelled':
      return 'Dibatalkan';
    default:
      return status;
  }
}

async function fetchTransactions(page = 1) {
  isLoading.value = true;
  errorMessage.value = '';

  try {
    const data = await adminModel.getTransactions({
      status: selectedStatus.value,
      search: searchQuery.value.trim() || undefined,
      startDate: startDate.value || undefined,
      endDate: endDate.value || undefined,
      page,
      limit: 50,
    });

    orders.value = data.orders || [];
    totalOrders.value = data.total || 0;
    currentPage.value = data.page || 1;
    totalPages.value = data.totalPages || 1;
    if (data.stats) {
      stats.value = data.stats;
    }
  } catch (err: any) {
    errorMessage.value = err.response?.data?.message || 'Gagal memuat transaksi. Coba lagi.';
  } finally {
    isLoading.value = false;
  }
}

function handleSearch() {
  fetchTransactions(1);
}

function handleFilterChange() {
  fetchTransactions(1);
}

function resetFilter() {
  selectedStatus.value = 'ALL';
  searchQuery.value = '';
  startDate.value = '';
  endDate.value = '';
  fetchTransactions(1);
}

async function handleExportCsv() {
  isExporting.value = true;
  errorMessage.value = '';

  try {
    await adminModel.downloadTransactionsCsv({
      status: selectedStatus.value,
      search: searchQuery.value.trim() || undefined,
      startDate: startDate.value || undefined,
      endDate: endDate.value || undefined,
    });
  } catch {
    errorMessage.value = 'Export gagal. Silakan coba refresh halaman.';
  } finally {
    isExporting.value = false;
  }
}

onMounted(() => {
  fetchTransactions(1);
});
</script>
