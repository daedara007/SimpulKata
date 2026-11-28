<template>
  <section id="paket" class="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto border-t border-slate-800/80">
    <div class="text-center max-w-2xl mx-auto space-y-3 mb-12">
      <h2 class="text-xs sm:text-sm uppercase tracking-widest font-bold text-indigo-400">Pilihan Kuota</h2>
      <h3 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
        Paket Kuota Fleksibel Sesuai Kebutuhan Anda
      </h3>
      <p class="text-slate-400 text-xs sm:text-sm">
        Mulai secara gratis dengan kuota 30 menit saat pendaftaran akun, atau isi ulang kuota kapan saja dengan berbagai paket fleksibel via Midtrans.
      </p>
    </div>

    <!-- Grid 4 Kartu: 1 col (mobile), 2 col (tablet/laptop kecil), 4 col (desktop) dengan jarak vertikal & horizontal tegas -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 sm:gap-x-8 lg:gap-x-5 gap-y-12 sm:gap-y-16 items-stretch">
      <!-- Card 1: Starter Free -->
      <div class="p-5 sm:p-6 rounded-2xl bg-slate-900/60 border border-emerald-500/30 flex flex-col justify-between relative shadow-lg hover:border-emerald-500/50 transition-all max-w-sm w-full mx-auto">
        <div class="space-y-3.5">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              Tersedia Sekarang
            </span>
            <span class="text-[10px] font-mono text-emerald-400/80">Bonus Akun</span>
          </div>
          <div>
            <h4 class="text-lg font-bold text-white">Starter Free</h4>
            <div class="text-2xl font-extrabold text-white mt-1">
              Rp 0 <span class="text-xs font-normal text-slate-400">/ kuota awal</span>
            </div>
          </div>
          <p class="text-xs text-slate-400 leading-relaxed min-h-[32px]">
            Langsung coba seluruh fitur transkripsi dan rangkuman tanpa biaya sepeser pun.
          </p>
          <ul class="space-y-2 text-xs text-slate-300 pt-3 border-t border-slate-800">
            <li class="flex items-center gap-2">
              <span class="text-emerald-400 font-bold">✓</span> <strong>30 Menit</strong> Kuota Awal Otomatis
            </li>
            <li class="flex items-center gap-2">
              <span class="text-emerald-400 font-bold">✓</span> Transkrip Lengkap & Rangkuman AI
            </li>
            <li class="flex items-center gap-2">
              <span class="text-emerald-400 font-bold">✓</span> Format Audio hingga 200MB
            </li>
            <li class="flex items-center gap-2">
              <span class="text-emerald-400 font-bold">✓</span> Riwayat Pemrosesan Akun
            </li>
          </ul>
        </div>
        <button
          type="button"
          class="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/20 transition-all cursor-pointer mt-5"
          @click="handlePrimaryCTA"
        >
          {{ isAuthenticated ? 'Buka Dashboard' : 'Daftar Gratis Sekarang' }}
        </button>
      </div>

      <!-- Card 2: Paket Starter (200m) -->
      <div class="p-5 sm:p-6 rounded-2xl bg-slate-900/60 border border-indigo-500/30 flex flex-col justify-between relative shadow-lg hover:border-indigo-500/50 transition-all max-w-sm w-full mx-auto">
        <div class="space-y-3.5">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
              Starter
            </span>
            <span class="text-[10px] font-mono text-slate-400">3.3 Jam</span>
          </div>
          <div>
            <h4 class="text-lg font-bold text-white">Paket Starter</h4>
            <div class="text-2xl font-extrabold text-white mt-1">
              Rp 50.000 <span class="text-xs font-normal text-slate-400">/ paket</span>
            </div>
          </div>
          <p class="text-xs text-slate-400 leading-relaxed min-h-[32px]">
            Cocok untuk wawancara singkat, tugas kuliah, dan rekaman audio hingga 3.3 jam.
          </p>
          <ul class="space-y-2 text-xs text-slate-300 pt-3 border-t border-slate-800">
            <li class="flex items-center gap-2">
              <span class="text-indigo-400 font-bold">✓</span> <strong>200 Menit</strong> Saldo Kuota
            </li>
            <li class="flex items-center gap-2">
              <span class="text-indigo-400 font-bold">✓</span> Transkrip Lengkap & Rangkuman AI
            </li>
            <li class="flex items-center gap-2">
              <span class="text-indigo-400 font-bold">✓</span> Format Audio hingga 200MB
            </li>
            <li class="flex items-center gap-2">
              <span class="text-indigo-400 font-bold">✓</span> Masa Berlaku Selamanya
            </li>
          </ul>
        </div>
        <button
          type="button"
          class="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition-all cursor-pointer mt-5"
          @click="handleSelectPackage('starter_200')"
        >
          {{ isAuthenticated ? 'Pilih Paket Starter' : 'Beli Paket Starter' }}
        </button>
      </div>

      <!-- Card 3: Edukasi Pro (450m) - Highlighted -->
      <div class="p-5 sm:p-6 rounded-2xl bg-slate-900/80 border-2 border-indigo-500 ring-1 ring-indigo-500/30 flex flex-col justify-between relative shadow-xl shadow-indigo-500/10 hover:border-indigo-400 transition-all max-w-sm w-full mx-auto">
        <div class="space-y-3.5">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
              Pelajar & Kuliah
            </span>
            <span class="text-[10px] font-mono text-amber-400/80">7.5 Jam</span>
          </div>
          <div>
            <h4 class="text-lg font-bold text-white">Edukasi Pro</h4>
            <div class="text-2xl font-extrabold text-white mt-1">
              Rp 100.000 <span class="text-xs font-normal text-slate-400">/ paket</span>
            </div>
          </div>
          <p class="text-xs text-slate-300 leading-relaxed min-h-[32px]">
            Pilihan terbaik untuk materi kuliah semesteran, wawancara skripsi, dan seminar ilmiah.
          </p>
          <ul class="space-y-2 text-xs text-slate-200 pt-3 border-t border-slate-800">
            <li class="flex items-center gap-2">
              <span class="text-amber-400 font-bold">✓</span> <strong>450 Menit</strong> Saldo Kuota
            </li>
            <li class="flex items-center gap-2">
              <span class="text-amber-400 font-bold">✓</span> Transkrip Lengkap & Rangkuman AI
            </li>
            <li class="flex items-center gap-2">
              <span class="text-amber-400 font-bold">✓</span> Format Audio hingga 200MB
            </li>
            <li class="flex items-center gap-2">
              <span class="text-amber-400 font-bold">✓</span> Masa Berlaku Selamanya
            </li>
          </ul>
        </div>
        <button
          type="button"
          class="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer mt-5"
          @click="handleSelectPackage('pro_450')"
        >
          {{ isAuthenticated ? 'Pilih Edukasi Pro' : 'Beli Edukasi Pro' }}
        </button>
      </div>

      <!-- Card 4: Enterprise (1200m) -->
      <div class="p-5 sm:p-6 rounded-2xl bg-slate-900/60 border border-purple-500/30 flex flex-col justify-between relative shadow-lg hover:border-purple-500/50 transition-all max-w-sm w-full mx-auto">
        <div class="space-y-3.5">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
              Tim & Bisnis
            </span>
            <span class="text-[10px] font-mono text-purple-400/80">20 Jam</span>
          </div>
          <div>
            <h4 class="text-lg font-bold text-white">Enterprise</h4>
            <div class="text-2xl font-extrabold text-white mt-1">
              Rp 250.000 <span class="text-xs font-normal text-slate-400">/ paket</span>
            </div>
          </div>
          <p class="text-xs text-slate-400 leading-relaxed min-h-[32px]">
            Pilihan hemat untuk kebutuhan transkripsi rekaman berdurasi panjang hingga 20 jam.
          </p>
          <ul class="space-y-2 text-xs text-slate-300 pt-3 border-t border-slate-800">
            <li class="flex items-center gap-2">
              <span class="text-purple-400 font-bold">✓</span> <strong>1.200 Menit</strong> Saldo Kuota
            </li>
            <li class="flex items-center gap-2">
              <span class="text-purple-400 font-bold">✓</span> Transkrip Lengkap & Rangkuman AI
            </li>
            <li class="flex items-center gap-2">
              <span class="text-purple-400 font-bold">✓</span> Format Audio hingga 200MB
            </li>
            <li class="flex items-center gap-2">
              <span class="text-purple-400 font-bold">✓</span> Masa Berlaku Selamanya
            </li>
          </ul>
        </div>
        <button
          type="button"
          class="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 border border-purple-400/40 shadow-lg shadow-purple-600/30 transition-all cursor-pointer mt-5"
          @click="handleSelectPackage('enterprise_1200')"
        >
          {{ isAuthenticated ? 'Pilih Enterprise' : 'Beli Enterprise' }}
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const props = defineProps<{
  isAuthenticated: boolean;
}>();

const emit = defineEmits<{
  (e: 'navigate', view: string, tab?: string): void;
}>();

function handlePrimaryCTA() {
  if (props.isAuthenticated) {
    emit('navigate', 'dashboard');
  } else {
    emit('navigate', 'auth', 'register');
  }
}

function handleSelectPackage(_packageId: string) {
  if (props.isAuthenticated) {
    emit('navigate', 'dashboard', 'topup');
  } else {
    emit('navigate', 'auth', 'register');
  }
}
</script>
