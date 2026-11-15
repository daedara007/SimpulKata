<template>
  <div class="space-y-6 sm:space-y-8 animate-fadeIn pb-12">
    <!-- Header Halaman -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-800/80">
      <div>
        <h2 class="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
          <span class="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </span>
          <span>Riwayat Tagihan & Pembelian Kuota</span>
        </h2>
        <p class="text-xs sm:text-sm text-slate-400 mt-1">
          Pantau riwayat top up kuota audio transkripsi dan status pembayaran akun Anda.
        </p>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center gap-2.5 shrink-0">
        <!-- Segarkan -->
        <button
          type="button"
          class="p-2.5 rounded-xl text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors cursor-pointer"
          :class="isLoading ? 'animate-spin text-indigo-400' : ''"
          title="Segarkan Riwayat Pesanan"
          :disabled="isLoading"
          @click="fetchOrders(currentPage)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>

        <!-- Tambah Saldo / Top Up -->
        <button
          type="button"
          class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 border border-indigo-500/30 transition-all cursor-pointer shadow-lg shadow-indigo-600/25 group"
          @click="isTopUpOpen = true"
        >
          <span class="group-hover:scale-110 transition-transform">⚡</span>
          <span>Top Up Kuota</span>
        </button>
      </div>
    </div>

    <!-- Alert / Banner Notifikasi -->
    <div
      v-if="errorMessage"
      class="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center justify-between"
    >
      <div class="flex items-center gap-2">
        <svg class="w-4 h-4 shrink-0 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

    <!-- Ringkasan Statistik Singkat -->
    <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
      <div class="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
        <p class="text-[11px] font-medium text-slate-400">Total Transaksi</p>
        <p class="text-xl sm:text-2xl font-black text-white mt-1">{{ totalOrders }}</p>
      </div>

      <div class="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
        <p class="text-[11px] font-medium text-slate-400">Transaksi Selesai</p>
        <p class="text-xl sm:text-2xl font-black text-emerald-400 mt-1">{{ completedOrdersCount }}</p>
      </div>

      <div class="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm col-span-2 sm:col-span-1">
        <p class="text-[11px] font-medium text-slate-400">Sisa Kuota Saat Ini</p>
        <p class="text-xl sm:text-2xl font-black font-mono text-indigo-300 mt-1">
          ⏱️ {{ formatDuration(currentUserBalance) }}
        </p>
      </div>
    </div>

    <!-- Konten Utama: Daftar Riwayat Transaksi -->
    <div class="rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl shadow-xl overflow-hidden">
      <!-- Loading Skeleton -->
      <div v-if="isLoading" class="p-8 space-y-4">
        <div v-for="i in 3" :key="i" class="h-14 bg-slate-800/50 rounded-2xl animate-pulse"></div>
      </div>

      <!-- State Kosong: Belum Ada Transaksi (SRS UC-18 Alur A1) -->
      <div
        v-else-if="orders.length === 0"
        class="p-12 text-center space-y-4"
      >
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-slate-800/80 border border-slate-700/80 text-slate-400 mb-2">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h3 class="text-base sm:text-lg font-bold text-white">Anda belum pernah melakukan pembelian kuota</h3>
        <p class="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
          Setiap pembelian kuota audio untuk kebutuhan transkripsi rapat dan wawancara akan tercatat secara otomatis di sini.
        </p>
        <div class="pt-2">
          <button
            type="button"
            class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/30 transition-all cursor-pointer shadow-lg shadow-indigo-600/30"
            @click="isTopUpOpen = true"
          >
            <span>⚡ Top Up Kuota Sekarang</span>
          </button>
        </div>
      </div>

      <!-- Tabel Riwayat Transaksi -->
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-slate-800/80 bg-slate-950/40 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <th class="py-4 px-4 sm:px-6">Nomor Pesanan</th>
              <th class="py-4 px-4">Paket Kuota</th>
              <th class="py-4 px-4">Nominal</th>
              <th class="py-4 px-4">Status</th>
              <th class="py-4 px-4">Waktu Transaksi</th>
              <th class="py-4 px-4 sm:px-6 text-right">Aksi</th>
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

              <!-- Paket & Menit -->
              <td class="py-4 px-4 whitespace-nowrap">
                <div class="font-semibold text-white">{{ order.package_name }}</div>
                <div class="text-[11px] text-indigo-400 font-mono mt-0.5">
                  +{{ order.package_minutes }} menit audio
                </div>
              </td>

              <!-- Nominal Rupiah -->
              <td class="py-4 px-4 font-mono font-semibold text-slate-200 whitespace-nowrap">
                {{ formatRupiah(order.amount) }}
              </td>

              <!-- Status Badge -->
              <td class="py-4 px-4 whitespace-nowrap">
                <span
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border"
                  :class="statusBadgeClass(order.status)"
                >
                  <span class="w-1.5 h-1.5 rounded-full" :class="statusDotClass(order.status)"></span>
                  {{ formatStatusText(order.status) }}
                </span>
              </td>

              <!-- Tanggal Transaksi -->
              <td class="py-4 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                {{ formatDateTime(order.created_at) }}
              </td>

              <!-- Aksi Interaktif -->
              <td class="py-4 px-4 sm:px-6 text-right whitespace-nowrap">
                <!-- Jika status pending, sediakan opsi bayar ulang dan cek status -->
                <div v-if="order.status === 'pending'" class="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all cursor-pointer"
                    title="Lanjutkan Pembayaran via Midtrans"
                    @click="resumePayment(order)"
                  >
                    <span>Bayar</span>
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all cursor-pointer"
                    title="Cek Status Pembayaran ke Gateway"
                    :disabled="isSyncing === order.order_number"
                    @click="checkStatus(order)"
                  >
                    <svg v-if="isSyncing === order.order_number" class="w-3.5 h-3.5 animate-spin text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    <span>{{ isSyncing === order.order_number ? 'Mengecek...' : 'Cek Status' }}</span>
                  </button>
                </div>
                <span v-else class="text-[11px] text-slate-500 italic">
                  {{ order.status === 'completed' ? 'Terverifikasi' : 'Tidak aktif' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Footer Paginasi -->
      <div
        v-if="totalPages > 1"
        class="p-4 sm:p-5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400"
      >
        <div>
          Menampilkan halaman <span class="font-bold text-white">{{ currentPage }}</span> dari <span class="font-bold text-white">{{ totalPages }}</span> (Total {{ totalOrders }} pesanan)
        </div>
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            :disabled="currentPage <= 1 || isLoading"
            @click="fetchOrders(currentPage - 1)"
          >
            Sebelumnya
          </button>
          <button
            type="button"
            class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            :disabled="currentPage >= totalPages || isLoading"
            @click="fetchOrders(currentPage + 1)"
          >
            Selanjutnya
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Top Up Kuota Terintegrasi -->
    <TopUpModal
      :is-open="isTopUpOpen"
      @close="isTopUpOpen = false"
      @success="handlePaymentSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { paymentModel, type OrderRow } from '../models/paymentModel';
import { authModel } from '../models/authModel';
import TopUpModal from '../components/dashboard/TopUpModal.vue';
import { formatDuration } from '../utils';

const orders = ref<OrderRow[]>([]);
const totalOrders = ref(0);
const currentPage = ref(1);
const totalPages = ref(1);
const isLoading = ref(false);
const errorMessage = ref('');
const isTopUpOpen = ref(false);

const currentUserBalance = ref(0);

// Hitung transaksi berstatus completed di halaman saat ini / riwayat
const completedOrdersCount = computed(() => {
  return orders.value.filter((o) => o.status === 'completed').length;
});

// Format Rupiah
function formatRupiah(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(num || 0);
}

// Format Tanggal Waktu
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

// Status badge styling
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
      return 'Menunggu Pembayaran';
    case 'failed':
      return 'Gagal';
    case 'cancelled':
      return 'Dibatalkan';
    default:
      return status;
  }
}

// Memuat riwayat pesanan (SRS UC-18 / SD-18)
async function fetchOrders(page = 1) {
  isLoading.value = true;
  errorMessage.value = '';

  try {
    const data = await paymentModel.getMyOrders(page, 20);
    orders.value = data.orders || [];
    totalOrders.value = data.total || 0;
    currentPage.value = data.page || 1;
    totalPages.value = data.totalPages || 1;
  } catch (err: any) {
    errorMessage.value = err.response?.data?.message || 'Gagal memuat riwayat transaksi, silakan coba lagi.';
  } finally {
    isLoading.value = false;
  }
}

// Lanjutkan pembayaran untuk order pending
async function resumePayment(order: OrderRow) {
  if (order.snap_token) {
    await paymentModel.loadSnapScript();
    if (window.snap) {
      window.snap.pay(order.snap_token, {
        onSuccess: async () => {
          await fetchOrders(currentPage.value);
          await refreshUserBalance();
        },
        onPending: async () => {
          await fetchOrders(currentPage.value);
        },
        onError: () => {
          errorMessage.value = 'Pembayaran gagal atau dibatalkan.';
        },
      });
      return;
    }
  }

  // Fallback: Jika ada payment URL atau simulasi
  if (order.payment_url) {
    window.open(order.payment_url, '_blank');
  } else {
    // Jalankan simulator
    try {
      await paymentModel.simulatePay(order.order_number);
      await fetchOrders(currentPage.value);
      await refreshUserBalance();
    } catch {
      errorMessage.value = 'Tidak dapat memproses pembayaran pesanan ini.';
    }
  }
}

const isSyncing = ref<string | null>(null);

async function checkStatus(order: OrderRow) {
  isSyncing.value = order.order_number;
  try {
    const res = await paymentModel.syncOrder(order.order_number);
    await fetchOrders(currentPage.value);
    await refreshUserBalance();
    if (res.synced) {
      errorMessage.value = '';
    }
  } catch (err: any) {
    errorMessage.value = err.response?.data?.message || 'Gagal mengecek status pembayaran ke gateway.';
  } finally {
    isSyncing.value = null;
  }
}

async function refreshUserBalance() {
  try {
    const user = await authModel.getProfile();
    if (user && typeof user.balance === 'number') {
      currentUserBalance.value = user.balance;
      return;
    }
  } catch {
    // fallback ke stored user
  }
  const user = authModel.getStoredUser();
  if (user) {
    currentUserBalance.value = user.balance || 0;
  }
}

function handlePaymentSuccess(newBalance?: number) {
  if (typeof newBalance === 'number' && newBalance > 0) {
    currentUserBalance.value = newBalance;
  }
  fetchOrders(1);
  refreshUserBalance();
}

onMounted(() => {
  refreshUserBalance();
  fetchOrders(1);
});
</script>
