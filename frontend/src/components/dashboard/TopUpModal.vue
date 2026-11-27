<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md p-3 sm:p-6 flex min-h-full items-center justify-center"
    @click.self="handleClose"
  >
    <div
      class="relative w-full max-w-2xl max-h-[92vh] sm:max-h-[90vh] flex flex-col bg-slate-900/95 border border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200 my-auto"
    >
      <!-- STATE 1: Pemilihan Paket Kuota & Checkout -->
      <template v-if="viewState === 'select' || viewState === 'checkout_ready'">
        <!-- Header Modal (Pinned di atas) -->
        <div class="p-4 sm:p-6 pb-3 sm:pb-4 border-b border-slate-800/80 shrink-0 relative bg-slate-900/40">
          <!-- Tombol Tutup Silang di Kanan Atas -->
          <button
            type="button"
            class="absolute top-3.5 right-3.5 sm:top-5 sm:right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Tutup Modal"
            @click="handleClose"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div class="inline-flex items-center gap-2 px-3 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-1.5">
            <span>⚡ Top Up Kuota Audio</span>
          </div>
          <h3 class="text-lg sm:text-2xl font-black text-white tracking-tight">
            Pilih Paket Kuota Tambahan
          </h3>
          <p class="text-xs sm:text-sm text-slate-400 mt-0.5 max-w-lg">
            Tambah saldo pemrosesan transkripsi & rangkuman AI. Kuota berlaku selamanya dan otomatis masuk ke akun Anda.
          </p>
        </div>

        <!-- Body Modal (Scrollable di layar kecil/ponsel) -->
        <div class="overflow-y-auto p-4 sm:p-6 flex-1 space-y-4 overscroll-contain">
          <!-- Alert Pesan Galat jika ada -->
          <div
            v-if="errorMessage"
            class="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between"
          >
            <div class="flex items-center gap-2">
              <svg class="w-4 h-4 text-rose-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{{ errorMessage }}</span>
            </div>
            <button type="button" class="text-rose-400 hover:text-white" @click="errorMessage = null">✕</button>
          </div>

          <!-- Kartu Pilihan Paket (Responsif Desktop & Mobile) -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div
              v-for="pkg in packages"
              :key="pkg.id"
              class="relative p-3.5 sm:p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between select-none group"
              :class="[
                selectedPackageId === pkg.id
                  ? 'bg-indigo-600/10 border-indigo-500 shadow-lg shadow-indigo-600/20 ring-1 ring-indigo-500'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
              ]"
              @click="selectedPackageId = pkg.id"
            >
              <!-- Badge Paket & Radio -->
              <div class="flex items-center justify-between gap-1 mb-2 sm:mb-3">
                <span
                  v-if="pkg.badge"
                  class="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                  :class="pkg.id === 'pro_450' ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' : 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'"
                >
                  {{ pkg.badge }}
                </span>
                <span v-else class="text-[10px] text-slate-500 font-mono">SimpulKata</span>

                <!-- Radio Indicator Icon -->
                <div
                  class="w-4 h-4 rounded-full border flex items-center justify-center transition-colors shrink-0"
                  :class="selectedPackageId === pkg.id ? 'border-indigo-500 bg-indigo-600' : 'border-slate-700'"
                >
                  <div v-if="selectedPackageId === pkg.id" class="w-1.5 h-1.5 rounded-full bg-white"></div>
                </div>
              </div>

              <!-- Header Info: Nama, Durasi & Harga -->
              <div class="flex sm:flex-col justify-between items-start sm:items-stretch gap-2 mb-2 sm:mb-3">
                <div class="space-y-0.5 sm:space-y-1">
                  <h4 class="text-sm font-bold text-white group-hover:text-indigo-200 transition-colors">
                    {{ pkg.name }}
                  </h4>
                  <p class="text-xs text-indigo-400 font-mono font-semibold">
                    ⚡ {{ pkg.minutes }} Menit
                    <span class="text-slate-500 text-[10px]">({{ (pkg.minutes * 60).toLocaleString('id-ID') }}s)</span>
                  </p>
                </div>

                <!-- Harga Paket (Rupiah) -->
                <div class="sm:pt-2 sm:border-t sm:border-slate-800/80 text-right sm:text-left">
                  <div class="text-base sm:text-lg font-black text-white">
                    Rp {{ pkg.amount.toLocaleString('id-ID') }}
                  </div>
                </div>
              </div>

              <!-- Deskripsi Ringkas -->
              <p class="text-[10px] sm:text-[11px] text-slate-400 line-clamp-2 mb-2">
                {{ pkg.description }}
              </p>

              <!-- Fitur Ringkas -->
              <ul class="space-y-1 text-[10px] sm:text-[11px] text-slate-400">
                <li v-for="(feat, fIdx) in pkg.features.slice(0, 2)" :key="fIdx" class="flex items-center gap-1.5">
                  <span class="text-emerald-400 text-xs shrink-0">✓</span>
                  <span class="truncate">{{ feat }}</span>
                </li>
              </ul>
            </div>
          </div>

          <!-- Kotak Simulasi Pembayaran Sandbox (Muncul jika sesi checkout aktif & mode mock) -->
          <div
            v-if="viewState === 'checkout_ready' && activeCheckout?.isMock"
            class="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3"
          >
            <div class="flex items-start gap-2.5">
              <span class="text-lg">🧪</span>
              <div>
                <h5 class="text-xs font-bold text-amber-300">Simulator Midtrans Sandbox Aktif</h5>
                <p class="text-[11px] text-amber-200/80 leading-relaxed mt-0.5">
                  Kredensial Midtrans Server Key belum diatur di <code class="font-mono bg-slate-950 px-1 py-0.5 rounded text-amber-300">.env</code>. Anda dapat menyelesaikan transaksi secara instan menggunakan tombol simulasi berikut:
                </p>
              </div>
            </div>
            <div class="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                class="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                :disabled="isLoading"
                @click="handleSimulatePay"
              >
                <svg v-if="isLoading" class="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                <span>✅ Bayar Sekarang (Simulasi Sukses)</span>
              </button>
              <button
                type="button"
                class="px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 transition-colors cursor-pointer"
                @click="viewState = 'select'"
              >
                Ganti Paket
              </button>
            </div>
          </div>
        </div>

        <!-- Footer Modal & Tombol Aksi (Pinned di bawah) -->
        <div class="p-4 sm:p-6 pt-3 sm:pt-4 border-t border-slate-800/80 bg-slate-950/70 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div class="flex items-center gap-2 text-[11px] sm:text-xs text-slate-400 w-full sm:w-auto">
            <svg class="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>Pembayaran aman via <strong>Midtrans Sandbox</strong></span>
          </div>

          <div class="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              class="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              @click="handleClose"
            >
              Batal
            </button>
            <button
              type="button"
              class="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="isLoading || !selectedPackage"
              @click="handleCheckout"
            >
              <svg v-if="isLoading" class="w-4 h-4 animate-spin text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
              <span>{{ isLoading ? 'Menghubungkan Midtrans...' : `Beli Kuota (Rp ${selectedPackage ? selectedPackage.amount.toLocaleString('id-ID') : '0'})` }}</span>
            </button>
          </div>
        </div>
      </template>

      <!-- STATE 2: Pembayaran Sukses (Celebratory Screen) -->
      <div v-else-if="viewState === 'success'" class="p-6 sm:p-8 text-center space-y-5 animate-in fade-in zoom-in-95 duration-200 overflow-y-auto">
        <div class="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto text-2xl shadow-lg shadow-emerald-500/20">
          ✓
        </div>
        <div>
          <h4 class="text-xl sm:text-2xl font-black text-white tracking-tight">Pembayaran Berhasil!</h4>
          <p class="text-xs sm:text-sm text-slate-400 mt-1 max-w-md mx-auto">
            Saldo kuota Anda telah berhasil diperbarui dan siap digunakan untuk mentranskripsikan audio.
          </p>
        </div>

        <!-- Info Tambahan Kuota -->
        <div class="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 max-w-sm mx-auto space-y-2">
          <div class="flex items-center justify-between text-xs text-slate-400">
            <span>Nomor Pesanan:</span>
            <span class="font-mono text-white font-bold">{{ successResult?.orderNumber }}</span>
          </div>
          <div class="flex items-center justify-between text-xs text-slate-400">
            <span>Kuota Ditambahkan:</span>
            <span class="text-emerald-400 font-bold">+{{ successResult?.addedMinutes }} Menit ({{ (successResult?.addedMinutes || 0) * 60 }}s)</span>
          </div>
          <div class="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
            <span>Sisa Kuota Terkini:</span>
            <span class="text-white font-mono font-black text-sm">⚡ {{ formatDuration(successResult?.newBalance || 0) }}</span>
          </div>
        </div>

        <button
          type="button"
          class="px-8 py-3 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
          @click="handleSuccessClose"
        >
          Selesai & Buka Studio Transkripsi
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import paymentModel, { OrderPackage, CheckoutResult, SimulatePayResult } from '../../models/paymentModel';
import useCurrentUser from '../../composables/useCurrentUser';
import { formatDuration } from '../../utils';

const { refreshUser, notifyTransactionsUpdated } = useCurrentUser();

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'success', newBalance: number): void;
}>();

type ViewState = 'select' | 'checkout_ready' | 'success';

const viewState = ref<ViewState>('select');
const packages = ref<OrderPackage[]>([]);
const selectedPackageId = ref<string>('pro_450'); // Default: Edukasi Pro (Rekomendasi)
const isLoading = ref<boolean>(false);
const errorMessage = ref<string | null>(null);

const activeCheckout = ref<CheckoutResult | null>(null);
const successResult = ref<SimulatePayResult | null>(null);

const selectedPackage = computed(() => {
  return packages.value.find((p) => p.id === selectedPackageId.value) || null;
});

async function loadPackages() {
  try {
    const pkgs = await paymentModel.getPackages();
    packages.value = pkgs;
  } catch (err: any) {
    console.error('[TopUpModal] Gagal memuat daftar paket:', err);
    errorMessage.value = 'Gagal memuat katalog paket kuota.';
  }
}

async function handleCheckout() {
  if (!selectedPackage.value) return;

  isLoading.value = true;
  errorMessage.value = null;

  try {
    const result = await paymentModel.checkout(selectedPackage.value.id);
    activeCheckout.value = result;

    if (result.isMock) {
      viewState.value = 'checkout_ready';
      return;
    }

    const scriptLoaded = await paymentModel.loadSnapScript(result.clientKey);
    if (!scriptLoaded || !window.snap) {
      if (result.redirectUrl) {
        window.location.href = result.redirectUrl;
        return;
      }
      throw new Error('Gagal memuat sistem pembayaran Midtrans Snap.');
    }

    window.snap.pay(result.snapToken, {
      onSuccess: async () => {
        isLoading.value = true;
        try {
          const detailResult = await paymentModel.getOrderDetail(result.order.order_number);
          const freshUser = await refreshUser();
          const freshBalance = freshUser?.balance ?? detailResult.newBalance ?? 0;

          successResult.value = {
            success: true,
            orderNumber: detailResult.order.order_number,
            addedMinutes: detailResult.order.package_minutes,
            newBalance: freshBalance,
          };
          viewState.value = 'success';
          notifyTransactionsUpdated();
          emit('success', freshBalance);
        } catch {
          handleSuccessClose();
        } finally {
          isLoading.value = false;
        }
      },
      onPending: () => {
        notifyTransactionsUpdated();
        handleClose();
      },
      onError: (err: any) => {
        notifyTransactionsUpdated();
        errorMessage.value = err?.status_message || 'Pembayaran gagal diproses oleh gateway.';
      },
      onClose: () => {
        // Pengguna menutup popup Snap — segarkan daftar order agar status terbaru langsung muncul
        notifyTransactionsUpdated();
      },
    });
  } catch (err: any) {
    errorMessage.value = err.response?.data?.message || err.message || 'Gagal memulai transaksi pembayaran.';
  } finally {
    isLoading.value = false;
  }
}

async function handleSimulatePay() {
  if (!activeCheckout.value) return;

  isLoading.value = true;
  errorMessage.value = null;

  try {
    const result = await paymentModel.simulatePay(activeCheckout.value.order.order_number);
    const freshUser = await refreshUser();
    const freshBalance = freshUser?.balance ?? result.newBalance;

    successResult.value = {
      ...result,
      newBalance: freshBalance,
    };
    viewState.value = 'success';
    notifyTransactionsUpdated();
    emit('success', freshBalance);
  } catch (err: any) {
    errorMessage.value = err.response?.data?.message || 'Gagal memproses simulasi pembayaran.';
  } finally {
    isLoading.value = false;
  }
}

function handleClose() {
  viewState.value = 'select';
  errorMessage.value = null;
  activeCheckout.value = null;
  emit('close');
}

function handleSuccessClose() {
  const finalBalance = successResult.value?.newBalance;
  handleClose();
  if (typeof finalBalance === 'number') {
    emit('success', finalBalance);
  }
}

watch(
  () => props.isOpen,
  (newVal) => {
    if (newVal) {
      viewState.value = 'select';
      errorMessage.value = null;
      activeCheckout.value = null;
      if (packages.value.length === 0) {
        loadPackages();
      }
    }
  }
);

onMounted(() => {
  if (props.isOpen) {
    loadPackages();
  }
});
</script>
