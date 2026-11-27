<template>
  <Teleport to="body">
    <div
      v-if="isOpen && displayUser"
      class="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150"
      @click.self="handleClose"
    >
    <div
      class="relative w-full max-w-3xl max-h-[92vh] rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col"
    >
      <!-- Header Profil Pengguna -->
      <div class="p-4 sm:p-6 border-b border-slate-800/80 bg-slate-950/60 shrink-0">
        <div class="flex items-start justify-between gap-4">
          <div class="flex items-center gap-3.5 min-w-0">
            <div
              class="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl overflow-hidden bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-black text-base shrink-0 border border-indigo-400/30 shadow-lg shadow-indigo-500/20"
            >
              <img
                v-if="displayUser.avatar_url"
                :src="displayUser.avatar_url"
                :alt="displayUser.name"
                class="w-full h-full object-cover"
              />
              <span v-else>{{ displayUser.name ? displayUser.name.charAt(0).toUpperCase() : 'U' }}</span>
            </div>

            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <h3 class="text-base sm:text-lg font-black text-white truncate">
                  {{ displayUser.name }}
                </h3>
                <span
                  class="px-2 py-0.5 rounded font-mono font-bold text-[10px] uppercase border"
                  :class="displayUser.role === 'admin'
                    ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                    : 'bg-slate-800 text-slate-400 border-slate-700'"
                >
                  {{ displayUser.role }}
                </span>
                <span
                  class="px-2 py-0.5 rounded-full font-mono font-bold text-[10px] uppercase border"
                  :class="getStatusBadgeClass(displayUser.status)"
                >
                  {{ displayUser.status }}
                </span>
              </div>
              <p class="text-xs text-slate-400 font-mono truncate mt-0.5">{{ displayUser.email }}</p>
            </div>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <button
              v-if="displayUser.role !== 'admin' && displayUser.status === 'ACTIVE' && !confirmSuspend"
              type="button"
              class="px-3 py-1.5 rounded-xl text-[11px] font-bold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-colors cursor-pointer disabled:opacity-40"
              :disabled="isUpdatingStatus || isSubmittingQuota"
              @click="confirmSuspend = true"
            >
              Tangguhkan Akun
            </button>
            <button
              v-else-if="displayUser.role !== 'admin' && displayUser.status === 'SUSPENDED'"
              type="button"
              class="px-3 py-1.5 rounded-xl text-[11px] font-bold text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 transition-colors cursor-pointer disabled:opacity-40"
              :disabled="isUpdatingStatus || isSubmittingQuota"
              @click="handleUpdateStatus('ACTIVE')"
            >
              {{ isUpdatingStatus ? 'Memproses...' : 'Aktifkan Kembali' }}
            </button>
            <button
              type="button"
              class="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors shrink-0 cursor-pointer disabled:opacity-40"
              :disabled="isSubmittingQuota || isUpdatingStatus"
              @click="handleClose"
            >
              ✕
            </button>
          </div>
        </div>

        <!-- Bar Konfirmasi Penangguhan Akun -->
        <div
          v-if="confirmSuspend && displayUser.status === 'ACTIVE'"
          class="mt-5 mb-1 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-rose-950/40 via-rose-900/20 to-rose-950/40 border border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-lg shadow-rose-950/25 transition-all"
        >
          <div class="flex items-center gap-2.5 min-w-0">
            <span class="w-2 h-2 rounded-full bg-rose-500 shrink-0 animate-pulse"></span>
            <p class="text-rose-200 text-xs leading-relaxed">
              Tangguhkan akun <strong class="text-white font-semibold">{{ displayUser.name }}</strong>? Sesi login aktifnya akan langsung dicabut.
            </p>
          </div>
          <div class="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <button
              type="button"
              class="px-3.5 py-1.5 rounded-xl text-[11px] font-semibold text-slate-300 hover:text-white bg-slate-800/90 hover:bg-slate-700 border border-slate-700/60 transition-colors cursor-pointer"
              :disabled="isUpdatingStatus"
              @click="confirmSuspend = false"
            >
              Batal
            </button>
            <button
              type="button"
              class="px-3.5 py-1.5 rounded-xl text-[11px] font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-md shadow-rose-600/30 transition-all cursor-pointer disabled:opacity-40"
              :disabled="isUpdatingStatus"
              @click="handleUpdateStatus('SUSPENDED')"
            >
              {{ isUpdatingStatus ? 'Menangguhkan...' : 'Ya, Tangguhkan' }}
            </button>
          </div>
        </div>

        <!-- Ringkasan Saldo & Sub-Tab Navigasi -->
        <div class="mt-4 pt-4 border-t border-slate-800/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-slate-900/90 border border-slate-800 w-fit">
            <span class="text-[11px] font-semibold text-slate-400">Sisa Kuota:</span>
            <span class="font-mono font-black text-sm" :class="getQuotaTextClass(displayUser.balance)">
              ⏱️ {{ formatDuration(displayUser.balance || 0) }}
            </span>
            <span class="text-[11px] font-mono text-slate-500">
              ({{ (displayUser.balance || 0).toLocaleString('id-ID') }}s)
            </span>
          </div>

          <!-- Sub-Tab Modal -->
          <div class="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 w-fit">
            <button
              type="button"
              class="px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              :class="activeTab === 'mutations'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/70'"
              @click="switchTab('mutations')"
            >
              <span>Riwayat Mutasi</span>
            </button>
            <button
              type="button"
              class="px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              :class="activeTab === 'topup'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/70'"
              @click="switchTab('topup')"
            >
              <span>+ Tambah Kuota</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Alert Sukses / Error -->
      <div v-if="successMessage || errorMessage" class="px-4 sm:px-6 pt-4 shrink-0 space-y-2">
        <div
          v-if="successMessage"
          class="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between gap-3"
        >
          <span>{{ successMessage }}</span>
          <button type="button" class="text-emerald-400 hover:text-white cursor-pointer" @click="successMessage = null">✕</button>
        </div>
        <div
          v-if="errorMessage"
          class="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-3"
        >
          <span>{{ errorMessage }}</span>
          <button type="button" class="text-rose-400 hover:text-white cursor-pointer" @click="errorMessage = null">✕</button>
        </div>
      </div>

      <!-- Konten Body (Scrollable) -->
      <div class="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
        <!-- TAB 1: RIWAYAT MUTASI KUOTA (PRIVACY-MASKED) -->
        <template v-if="activeTab === 'mutations'">
          <!-- Info Privasi + Filter -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div class="flex items-center gap-1 p-1 rounded-xl bg-slate-950 border border-slate-800 w-fit">
              <button
                v-for="opt in mutationFilterOptions"
                :key="opt.value"
                type="button"
                class="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                :class="mutationFilter === opt.value
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'"
                @click="changeMutationFilter(opt.value)"
              >
                {{ opt.label }}
              </button>
            </div>

            <button
              type="button"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition-colors w-fit cursor-pointer"
              @click="switchTab('topup')"
            >
              <span>+ Tambah Kuota Manual</span>
            </button>
          </div>

          <!-- Loading Skeleton -->
          <div v-if="isMutationsLoading" class="space-y-2.5 py-4">
            <div v-for="i in 4" :key="i" class="h-12 rounded-xl bg-slate-800/50 animate-pulse"></div>
          </div>

          <!-- State Kosong -->
          <div v-else-if="mutations.length === 0" class="py-12 text-center space-y-2 rounded-2xl bg-slate-950/40 border border-slate-800/60">
            <p class="text-sm font-bold text-white">Belum ada riwayat mutasi kuota</p>
            <p class="text-xs text-slate-500 max-w-sm mx-auto">
              Belum ada aktivitas penambahan maupun pemakaian kuota pada filter ini.
            </p>
          </div>

          <!-- Tabel Mutasi -->
          <div v-else class="rounded-2xl border border-slate-800 bg-slate-950/50 overflow-hidden">
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse text-xs">
                <thead>
                  <tr class="bg-slate-950/80 border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <th class="py-3 px-3.5">Waktu</th>
                    <th class="py-3 px-3">Jenis</th>
                    <th class="py-3 px-3">Keterangan</th>
                    <th class="py-3 px-3">Perubahan</th>
                    <th class="py-3 px-3.5 text-right">Saldo Sesudah</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60">
                  <tr v-for="mut in mutations" :key="mut.id" class="hover:bg-slate-800/30 transition-colors">
                    <td class="py-3 px-3.5 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                      {{ formatDateTime(mut.created_at) }}
                    </td>
                    <td class="py-3 px-3 whitespace-nowrap">
                      <span
                        v-if="mut.type === 'CREDIT'"
                        class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                      >
                        + Masuk
                      </span>
                      <span
                        v-else
                        class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30"
                      >
                        - Keluar
                      </span>
                    </td>
                    <td class="py-3 px-3">
                      <div class="font-medium text-slate-200">{{ mut.description }}</div>
                      <div class="text-[10px] text-slate-500 font-mono mt-0.5 flex items-center gap-1.5">
                        <span class="px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-semibold">
                          {{ formatReferenceLabel(mut.reference_type) }}
                        </span>
                        <span v-if="mut.reference_id">Ref: {{ mut.reference_id }}</span>
                      </div>
                    </td>
                    <td class="py-3 px-3 whitespace-nowrap font-mono font-bold">
                      <span v-if="mut.type === 'CREDIT'" class="text-emerald-400">
                        +{{ formatDuration(mut.amount_seconds) }}
                      </span>
                      <span v-else class="text-rose-400">
                        -{{ formatDuration(mut.amount_seconds) }}
                      </span>
                    </td>
                    <td class="py-3 px-3.5 text-right whitespace-nowrap font-mono font-semibold text-slate-300">
                      {{ formatDuration(mut.balance_after) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Paginasi Mutasi -->
            <div
              v-if="totalMutationPages > 1"
              class="flex items-center justify-between px-4 py-3 border-t border-slate-800/80 text-[11px] text-slate-400 bg-slate-950/70"
            >
              <span>Halaman <strong class="text-white">{{ mutationPage }}</strong> dari <strong class="text-white">{{ totalMutationPages }}</strong> ({{ totalMutations }} data)</span>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  :disabled="mutationPage <= 1 || isMutationsLoading"
                  @click="fetchMutations(mutationPage - 1)"
                >
                  &larr; Sebelumnya
                </button>
                <button
                  type="button"
                  class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  :disabled="mutationPage >= totalMutationPages || isMutationsLoading"
                  @click="fetchMutations(mutationPage + 1)"
                >
                  Selanjutnya &rarr;
                </button>
              </div>
            </div>
          </div>
        </template>

        <!-- TAB 2: FORM TAMBAH KUOTA MANUAL -->
        <template v-else>
          <div
            v-if="displayUser.status === 'PENDING'"
            class="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-1"
          >
            <p class="font-bold">Akun Belum Terverifikasi OTP (PENDING)</p>
            <p class="text-amber-200/80">
              Penambahan kuota manual hanya dapat dilakukan setelah pengguna menyelesaikan verifikasi OTP dan akun berstatus ACTIVE.
            </p>
          </div>

          <form class="space-y-5" @submit.prevent="handleSubmitAddQuota">
            <!-- Preset Cepat -->
            <div class="space-y-2">
              <label class="block text-xs font-bold text-slate-300">Pilih Cepat Durasi (Menit)</label>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <button
                  v-for="preset in quotaPresets"
                  :key="preset"
                  type="button"
                  class="py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer"
                  :class="quotaMinutes === preset
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-lg shadow-emerald-500/10'
                    : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'"
                  @click="quotaMinutes = preset"
                >
                  +{{ preset }} Menit
                </button>
              </div>
            </div>

            <!-- Input Manual Menit -->
            <div class="space-y-1.5">
              <label for="admin-add-quota-minutes" class="block text-xs font-bold text-slate-300">
                Jumlah Tambahan Kuota (Menit)
              </label>
              <div class="relative">
                <input
                  id="admin-add-quota-minutes"
                  v-model.number="quotaMinutes"
                  type="number"
                  min="1"
                  max="10000"
                  step="1"
                  required
                  placeholder="Masukkan jumlah menit (misal: 60)"
                  class="w-full px-3.5 py-2.5 pr-20 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono font-bold text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <span class="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                  Menit
                </span>
              </div>
              <p class="text-[11px] text-slate-500">
                Rentang yang diizinkan: 1 sampai 10.000 menit per transaksi penambahan.
              </p>
            </div>

            <!-- Input Catatan / Alasan -->
            <div class="space-y-1.5">
              <label for="admin-add-quota-note" class="block text-xs font-bold text-slate-300">
                Catatan / Alasan Penambahan <span class="text-slate-500 font-normal">(Opsional)</span>
              </label>
              <input
                id="admin-add-quota-note"
                v-model="quotaNote"
                type="text"
                maxlength="180"
                placeholder="Contoh: Kompensasi kendala teknis, kuota uji coba, dll."
                class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <!-- Pratinjau Perubahan Saldo -->
            <div class="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <p class="text-slate-500 text-[11px]">Saldo Saat Ini</p>
                <p class="font-mono font-bold text-slate-200 mt-0.5">
                  {{ formatDuration(displayUser.balance || 0) }}
                </p>
              </div>
              <div>
                <p class="text-slate-500 text-[11px]">Penambahan</p>
                <p class="font-mono font-bold text-emerald-400 mt-0.5">
                  +{{ validMinutesPreview > 0 ? formatDuration(validMinutesPreview * 60) : '0 mnt' }}
                </p>
              </div>
              <div>
                <p class="text-slate-500 text-[11px]">Estimasi Saldo Baru</p>
                <p class="font-mono font-black text-white mt-0.5">
                  {{ formatDuration((displayUser.balance || 0) + (validMinutesPreview * 60)) }}
                </p>
              </div>
            </div>

            <!-- Footer Aksi Form -->
            <div class="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                class="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                :disabled="isSubmittingQuota"
                @click="switchTab('mutations')"
              >
                Lihat Mutasi
              </button>
              <button
                type="submit"
                class="px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/25 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                :disabled="isSubmittingQuota || displayUser.status === 'PENDING' || validMinutesPreview < 1"
              >
                <svg v-if="isSubmittingQuota" class="w-4 h-4 animate-spin text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                <span>
                  {{ isSubmittingQuota ? 'Menambahkan...' : `Tambahkan +${validMinutesPreview} Menit` }}
                </span>
              </button>
            </div>
          </form>
        </template>
      </div>
    </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import adminModel, { type AdminUserItem } from '../../models/adminModel';
import type { QuotaMutation } from '../../models/paymentModel';
import { useCurrentUser } from '../../composables/useCurrentUser';
import { formatDuration } from '../../utils';

const props = defineProps<{
  isOpen: boolean;
  user: AdminUserItem | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'quota-updated', updatedUser: AdminUserItem): void;
  (e: 'status-updated', updatedUser: AdminUserItem): void;
}>();

const { currentUser, refreshUser } = useCurrentUser();

const activeTab = ref<'mutations' | 'topup'>('mutations');
const localUser = ref<AdminUserItem | null>(null);
const displayUser = computed(() => localUser.value || props.user);

// State Mutasi
const mutations = ref<QuotaMutation[]>([]);
const totalMutations = ref(0);
const mutationPage = ref(1);
const totalMutationPages = ref(1);
const isMutationsLoading = ref(false);
const mutationFilter = ref<'ALL' | 'CREDIT' | 'DEBIT'>('ALL');

const mutationFilterOptions: Array<{ label: string; value: 'ALL' | 'CREDIT' | 'DEBIT' }> = [
  { label: 'Semua', value: 'ALL' },
  { label: 'Kuota Masuk (+)', value: 'CREDIT' },
  { label: 'Kuota Keluar (-)', value: 'DEBIT' },
];

// State Form Tambah Kuota
const quotaPresets = [15, 30, 60, 200];
const quotaMinutes = ref<number>(30);
const quotaNote = ref<string>('');
const isSubmittingQuota = ref(false);
const isUpdatingStatus = ref(false);
const confirmSuspend = ref(false);

const errorMessage = ref<string | null>(null);
const successMessage = ref<string | null>(null);

const validMinutesPreview = computed(() => {
  const n = Number(quotaMinutes.value);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 1) return 0;
  return Math.min(10000, n);
});

async function fetchMutations(page = 1) {
  const target = displayUser.value;
  if (!target) return;

  isMutationsLoading.value = true;
  errorMessage.value = null;

  try {
    const data = await adminModel.getUserQuotaMutations(target.id, {
      page,
      limit: 15,
      type: mutationFilter.value,
    });
    localUser.value = data.user;
    mutations.value = data.mutations || [];
    totalMutations.value = data.total || 0;
    mutationPage.value = data.page || 1;
    totalMutationPages.value = data.totalPages || 1;
  } catch (err: any) {
    errorMessage.value = err.response?.data?.message || 'Gagal memuat riwayat mutasi kuota pengguna.';
  } finally {
    isMutationsLoading.value = false;
  }
}

function changeMutationFilter(type: 'ALL' | 'CREDIT' | 'DEBIT') {
  mutationFilter.value = type;
  fetchMutations(1);
}

function switchTab(tab: 'mutations' | 'topup') {
  activeTab.value = tab;
  errorMessage.value = null;
}

async function handleSubmitAddQuota() {
  const target = displayUser.value;
  if (!target || target.status === 'PENDING') return;

  const minutes = Number(quotaMinutes.value);
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > 10000) {
    errorMessage.value = 'Jumlah kuota harus bilangan bulat antara 1 hingga 10.000 menit.';
    return;
  }

  isSubmittingQuota.value = true;
  errorMessage.value = null;
  successMessage.value = null;

  try {
    const res = await adminModel.addUserQuota(target.id, {
      minutes,
      note: quotaNote.value.trim() || undefined,
    });

    localUser.value = res.user;
    successMessage.value = res.message;
    quotaNote.value = '';
    emit('quota-updated', res.user);

    // Jika admin menambah kuota ke akunnya sendiri, sinkronkan juga saldo di Navbar
    if (currentUser.value?.id === res.user.id) {
      await refreshUser();
    }

    activeTab.value = 'mutations';
    mutationFilter.value = 'ALL';
    await fetchMutations(1);
  } catch (err: any) {
    errorMessage.value = err.response?.data?.message || 'Gagal menambahkan kuota pengguna.';
  } finally {
    isSubmittingQuota.value = false;
  }
}

function handleClose() {
  if (isSubmittingQuota.value || isUpdatingStatus.value) return;
  confirmSuspend.value = false;
  emit('close');
}

async function handleUpdateStatus(nextStatus: 'ACTIVE' | 'SUSPENDED') {
  const target = displayUser.value;
  if (!target) return;

  isUpdatingStatus.value = true;
  errorMessage.value = null;
  successMessage.value = null;

  try {
    const res = await adminModel.updateUserStatus(target.id, nextStatus);
    localUser.value = res.user;
    confirmSuspend.value = false;
    successMessage.value = res.message;
    emit('status-updated', res.user);
  } catch (err: any) {
    errorMessage.value = err.response?.data?.message || 'Gagal memperbarui status akun pengguna.';
  } finally {
    isUpdatingStatus.value = false;
  }
}

function formatReferenceLabel(refType: string): string {
  switch (refType) {
    case 'TOPUP':
      return 'TOP UP';
    case 'TRANSCRIPTION':
      return 'TRANSKRIPSI';
    case 'REGISTRATION':
      return 'REGISTRASI';
    case 'REFUND':
      return 'PENGEMBALIAN';
    case 'MANUAL_ADJUSTMENT':
      return 'PENAMBAHAN ADMIN';
    default:
      return refType;
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
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

watch(
  () => [props.isOpen, props.user?.id] as const,
  ([open, userId]) => {
    if (open && userId) {
      localUser.value = props.user;
      activeTab.value = 'mutations';
      mutationFilter.value = 'ALL';
      quotaMinutes.value = 30;
      quotaNote.value = '';
      confirmSuspend.value = false;
      errorMessage.value = null;
      successMessage.value = null;
      fetchMutations(1);
    }
  }
);
</script>
