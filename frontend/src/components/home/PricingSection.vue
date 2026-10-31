<template>
  <section id="paket" class="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-800/80">
    <div class="text-center max-w-3xl mx-auto space-y-4 mb-16">
      <h2 class="text-xs sm:text-sm uppercase tracking-widest font-bold text-indigo-400">Pilihan Kuota</h2>
      <h3 class="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
        Paket Kuota Fleksibel Sesuai Kebutuhan Anda
      </h3>
      <p class="text-slate-400 text-sm sm:text-base">
        Mulai secara gratis dengan kuota 30 menit saat pendaftaran akun. Paket kuota berbayar tambahan akan segera hadir.
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
      <!-- Card 1: Free Starter (Active) -->
      <div class="p-8 rounded-3xl bg-slate-900/60 border border-emerald-500/30 space-y-6 flex flex-col justify-between relative shadow-lg">
        <div class="space-y-4">
          <span class="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            Tersedia Sekarang
          </span>
          <h4 class="text-2xl font-bold text-white">Starter Free</h4>
          <div class="text-3xl font-extrabold text-white">
            Rp 0 <span class="text-xs font-normal text-slate-400">/ kuota awal</span>
          </div>
          <p class="text-xs text-slate-400 leading-relaxed">
            Langsung coba seluruh fitur transkripsi dan rangkuman tanpa biaya sepeser pun.
          </p>
          <ul class="space-y-2.5 text-xs text-slate-300 pt-2 border-t border-slate-800">
            <li class="flex items-center gap-2">✓ <strong>30 Menit</strong> Kuota Awal Otomatis</li>
            <li class="flex items-center gap-2">✓ Transkrip Lengkap & Rangkuman AI</li>
            <li class="flex items-center gap-2">✓ Format .MP3, .WAV, .M4A (Hingga 50MB)</li>
            <li class="flex items-center gap-2">✓ Riwayat Pemrosesan Akun</li>
          </ul>
        </div>
        <button
          type="button"
          class="w-full py-3 px-4 rounded-xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          @click="handlePrimaryCTA"
        >
          {{ isAuthenticated ? 'Buka Dashboard' : 'Daftar Gratis Sekarang' }}
        </button>
      </div>

      <!-- Card 2: Edukasi Pro (Placeholder) -->
      <div class="p-8 rounded-3xl bg-slate-900/60 border border-indigo-500/30 space-y-6 flex flex-col justify-between relative">
        <div class="space-y-4">
          <div class="flex items-center gap-2">
            <span class="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
              Pelajar & Kuliah
            </span>
            <span class="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
              Segera Hadir
            </span>
          </div>
          <h4 class="text-2xl font-bold text-white">Edukasi Pro</h4>
          <div class="text-3xl font-extrabold text-slate-400 flex items-baseline gap-2">
            Rp --.--- <span class="text-xs font-normal text-slate-500">(Fase Berikutnya)</span>
          </div>
          <p class="text-xs text-slate-400 leading-relaxed">
            Dirancang untuk merangkum materi kuliah mingguan, wawancara skripsi, dan seminar ilmiah.
          </p>
          <ul class="space-y-2.5 text-xs text-slate-400 pt-2 border-t border-slate-800">
            <li class="flex items-center gap-2">⏳ <strong>300 Menit</strong> Saldo Pemrosesan</li>
            <li class="flex items-center gap-2">⏳ Rangkuman Berkas Otomatis</li>
            <li class="flex items-center gap-2">⏳ Penyimpanan Riwayat Tanpa Batas</li>
            <li class="flex items-center gap-2">⏳ Integrasi Pembayaran Otomatis</li>
          </ul>
        </div>
        <button
          type="button"
          disabled
          class="w-full py-3 px-4 rounded-xl font-semibold text-xs text-slate-500 bg-slate-800/80 border border-slate-700/60 cursor-not-allowed opacity-80"
        >
          Segera Hadir
        </button>
      </div>

      <!-- Card 3: Bisnis / Profesional (Placeholder) -->
      <div class="p-8 rounded-3xl bg-slate-900/60 border border-purple-500/30 space-y-6 flex flex-col justify-between relative">
        <div class="space-y-4">
          <div class="flex items-center gap-2">
            <span class="text-xs font-semibold px-3 py-1 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
              Tim & Bisnis
            </span>
            <span class="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
              Segera Hadir
            </span>
          </div>
          <h4 class="text-2xl font-bold text-white">Enterprise</h4>
          <div class="text-3xl font-extrabold text-slate-400 flex items-baseline gap-2">
            Rp --.--- <span class="text-xs font-normal text-slate-500">(Fase Berikutnya)</span>
          </div>
          <p class="text-xs text-slate-400 leading-relaxed">
            Untuk tim profesional, agensi, dan perusahaan yang memiliki jadwal rapat padat setiap harinya.
          </p>
          <ul class="space-y-2.5 text-xs text-slate-400 pt-2 border-t border-slate-800">
            <li class="flex items-center gap-2">⏳ <strong>1.200+ Menit</strong> Saldo Kuota</li>
            <li class="flex items-center gap-2">⏳ Notula Rapat & Rencana Aksi</li>
            <li class="flex items-center gap-2">⏳ Pemrosesan Prioritas Tinggi</li>
            <li class="flex items-center gap-2">⏳ Integrasi Pembayaran Otomatis</li>
          </ul>
        </div>
        <button
          type="button"
          disabled
          class="w-full py-3 px-4 rounded-xl font-semibold text-xs text-slate-500 bg-slate-800/80 border border-slate-700/60 cursor-not-allowed opacity-80"
        >
          Segera Hadir
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
</script>

