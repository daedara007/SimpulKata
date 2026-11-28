<template>
  <section id="paket" class="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-800/80">
    <div class="text-center max-w-3xl mx-auto space-y-4 mb-16">
      <h2 class="text-xs sm:text-sm uppercase tracking-widest font-bold text-indigo-400">Pilihan Kuota</h2>
      <h3 class="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
        Paket Kuota Fleksibel Sesuai Kebutuhan Anda
      </h3>
      <p class="text-slate-400 text-sm sm:text-base">
        Mulai secara gratis dengan kuota 30 menit saat pendaftaran akun, atau isi ulang kuota kapan saja dengan berbagai paket fleksibel via Midtrans.
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto items-stretch">
      <!-- Card 1: Starter Free -->
      <div class="p-6 rounded-3xl bg-slate-900/60 border border-emerald-500/30 space-y-6 flex flex-col justify-between relative shadow-lg hover:border-emerald-500/50 transition-all">
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              Tersedia Sekarang
            </span>
            <span class="text-[11px] font-mono text-emerald-400/80">Bonus Akun</span>
          </div>
          <h4 class="text-xl font-bold text-white">Starter Free</h4>
          <div class="text-3xl font-extrabold text-white">
            Rp 0 <span class="text-xs font-normal text-slate-400">/ kuota awal</span>
          </div>
          <p class="text-xs text-slate-400 leading-relaxed min-h-[36px]">
            Langsung coba seluruh fitur transkripsi dan rangkuman tanpa biaya sepeser pun.
          </p>
          <ul class="space-y-2.5 text-xs text-slate-300 pt-3 border-t border-slate-800">
            <li class="flex items-center gap-2">
              <span class="text-emerald-400">✓</span> <strong>30 Menit</strong> Kuota Awal Otomatis
            </li>
            <li class="flex items-center gap-2">
              <span class="text-emerald-400">✓</span> Transkrip Lengkap & Rangkuman AI
            </li>
            <li class="flex items-center gap-2">
              <span class="text-emerald-400">✓</span> Format Audio hingga 200MB
            </li>
            <li class="flex items-center gap-2">
              <span class="text-emerald-400">✓</span> Riwayat Pemrosesan Akun
            </li>
          </ul>
        </div>
        <button
          type="button"
          class="w-full py-3 px-4 rounded-xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/20 transition-all cursor-pointer mt-4"
          @click="handlePrimaryCTA"
        >
          {{ isAuthenticated ? 'Buka Dashboard' : 'Daftar Gratis Sekarang' }}
        </button>
      </div>

      <!-- Card 2: Paket Starter (200m) -->
      <div class="p-6 rounded-3xl bg-slate-900/60 border border-indigo-500/30 space-y-6 flex flex-col justify-between relative shadow-lg hover:border-indigo-500/50 transition-all">
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
              Starter
            </span>
            <span class="text-[11px] font-mono text-slate-400">3.3 Jam</span>
          </div>
          <h4 class="text-xl font-bold text-white">Paket Starter</h4>
          <div class="text-3xl font-extrabold text-white">
            Rp 50.000 <span class="text-xs font-normal text-slate-400">/ paket</span>
          </div>
          <p class="text-xs text-slate-400 leading-relaxed min-h-[36px]">
            Cocok untuk wawancara singkat, tugas kuliah, dan rekaman audio hingga 3.3 jam.
          </p>
          <ul class="space-y-2.5 text-xs text-slate-300 pt-3 border-t border-slate-800">
            <li class="flex items-center gap-2">
              <span class="text-indigo-400">✓</span> <strong>200 Menit</strong> Saldo Kuota
            </li>
            <li class="flex items-center gap-2">
              <span class="text-indigo-400">✓</span> Transkrip Lengkap & Rangkuman AI
            </li>
            <li class="flex items-center gap-2">
              <span class="text-indigo-400">✓</span> Format Audio hingga 200MB
            </li>
            <li class="flex items-center gap-2">
              <span class="text-indigo-400">✓</span> Masa Berlaku Selamanya
            </li>
          </ul>
        </div>
        <button
          type="button"
          class="w-full py-3 px-4 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition-all cursor-pointer mt-4"
          @click="handleSelectPackage('starter_200')"
        >
          {{ isAuthenticated ? 'Pilih Paket Starter' : 'Beli Paket Starter' }}
        </button>
      </div>

      <!-- Card 3: Edukasi Pro (450m) - Highlighted -->
      <div class="p-6 rounded-3xl bg-slate-900/80 border-2 border-indigo-500 ring-2 ring-indigo-500/20 space-y-6 flex flex-col justify-between relative shadow-2xl shadow-indigo-500/10 hover:border-indigo-400 transition-all">
        <!-- Floating Tag Paling Populer -->
        <div class="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span class="text-[11px] font-bold px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 uppercase tracking-wider shadow-md">
            ⭐ Paling Populer
          </span>
        </div>

        <div class="space-y-4 pt-1">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
              Pelajar & Kuliah
            </span>
            <span class="text-[11px] font-mono text-amber-400/80">7.5 Jam</span>
          </div>
          <h4 class="text-xl font-bold text-white">Edukasi Pro</h4>
          <div class="text-3xl font-extrabold text-white">
            Rp 100.000 <span class="text-xs font-normal text-slate-400">/ paket</span>
          </div>
          <p class="text-xs text-slate-300 leading-relaxed min-h-[36px]">
            Pilihan terbaik untuk materi kuliah semesteran, wawancara skripsi, dan seminar ilmiah.
          </p>
          <ul class="space-y-2.5 text-xs text-slate-200 pt-3 border-t border-slate-800">
            <li class="flex items-center gap-2">
              <span class="text-amber-400">✓</span> <strong>450 Menit</strong> Saldo Kuota
            </li>
            <li class="flex items-center gap-2">
              <span class="text-amber-400">✓</span> Transkrip Lengkap & Rangkuman AI
            </li>
            <li class="flex items-center gap-2">
              <span class="text-amber-400">✓</span> Format Audio hingga 200MB
            </li>
            <li class="flex items-center gap-2">
              <span class="text-amber-400">✓</span> Masa Berlaku Selamanya
            </li>
          </ul>
        </div>
        <button
          type="button"
          class="w-full py-3 px-4 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer mt-4"
          @click="handleSelectPackage('pro_450')"
        >
          {{ isAuthenticated ? 'Pilih Edukasi Pro' : 'Beli Edukasi Pro' }}
        </button>
      </div>

      <!-- Card 4: Enterprise (1200m) -->
      <div class="p-6 rounded-3xl bg-slate-900/60 border border-purple-500/30 space-y-6 flex flex-col justify-between relative shadow-lg hover:border-purple-500/50 transition-all">
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold px-3 py-1 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
              Tim & Bisnis
            </span>
            <span class="text-[11px] font-mono text-purple-400/80">20 Jam</span>
          </div>
          <h4 class="text-xl font-bold text-white">Enterprise</h4>
          <div class="text-3xl font-extrabold text-white">
            Rp 250.000 <span class="text-xs font-normal text-slate-400">/ paket</span>
          </div>
          <p class="text-xs text-slate-400 leading-relaxed min-h-[36px]">
            Pilihan hemat untuk kebutuhan transkripsi rekaman berdurasi panjang hingga 20 jam.
          </p>
          <ul class="space-y-2.5 text-xs text-slate-300 pt-3 border-t border-slate-800">
            <li class="flex items-center gap-2">
              <span class="text-purple-400">✓</span> <strong>1.200 Menit</strong> Saldo Kuota
            </li>
            <li class="flex items-center gap-2">
              <span class="text-purple-400">✓</span> Transkrip Lengkap & Rangkuman AI
            </li>
            <li class="flex items-center gap-2">
              <span class="text-purple-400">✓</span> Format Audio hingga 200MB
            </li>
            <li class="flex items-center gap-2">
              <span class="text-purple-400">✓</span> Masa Berlaku Selamanya
            </li>
          </ul>
        </div>
        <button
          type="button"
          class="w-full py-3 px-4 rounded-xl font-bold text-xs text-white bg-purple-600 hover:bg-purple-500 shadow-md shadow-purple-600/20 transition-all cursor-pointer mt-4"
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
