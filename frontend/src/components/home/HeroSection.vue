<template>
  <section id="top" class="pt-16 sm:pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center relative">
    <div class="space-y-6 max-w-4xl mx-auto">
      <!-- Floating Pill Announcement -->
      <div class="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium backdrop-blur-md shadow-sm">
        <span class="flex h-2 w-2 rounded-full bg-indigo-400 animate-ping"></span>
        <span>Platform Transkripsi & Rangkuman AI Cerdas</span>
        <span class="text-slate-500">&bull;</span>
        <span class="text-emerald-400 font-semibold">Gratis 30 Menit Kuota</span>
      </div>

      <!-- Main Headline -->
      <h1 class="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.12]">
        Ubah Rekaman Suara Jadi <br class="hidden sm:inline" />
        <span class="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
          Transkrip & Rangkuman Cerdas
        </span>
      </h1>

      <!-- Subtitle -->
      <p class="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
        Dengarkan lebih sedikit, pahami lebih banyak. SimpulKata mentranskripsikan audio rapat, seminar, dan perkuliahan Anda serta menyusun intisari poin aksi secara otomatis dalam hitungan menit.
      </p>

      <!-- CTA Buttons -->
      <div class="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
        <button
          type="button"
          class="w-full sm:w-auto py-3.5 px-8 rounded-2xl font-bold text-sm sm:text-base text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-xl shadow-indigo-600/35 hover:shadow-indigo-600/50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 cursor-pointer"
          @click="handlePrimaryCTA"
        >
          <span>Coba Gratis Sekarang</span>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
        <a
          href="#cara-kerja"
          class="w-full sm:w-auto py-3.5 px-6 rounded-2xl font-semibold text-sm sm:text-base text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-center gap-2"
        >
          <svg class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Lihat Cara Kerja</span>
        </a>
      </div>

      <!-- Micro Social Proof Badges -->
      <div class="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
        <div class="flex items-center gap-2">
          <svg class="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
          <span>Tanpa Kartu Kredit</span>
        </div>
        <div class="flex items-center gap-2">
          <svg class="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
          <span>Format .MP3, .WAV, .M4A</span>
        </div>
        <div class="flex items-center gap-2">
          <svg class="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
          <span>Proses Cepat & Terenkripsi</span>
        </div>
      </div>
    </div>

    <!-- ========================================================= -->
    <!-- INTERACTIVE PRODUCT SHOWCASE (MOCKUP)                     -->
    <!-- ========================================================= -->
    <div id="preview" class="mt-14 max-w-5xl mx-auto rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl p-4 sm:p-6 backdrop-blur-xl text-left relative overflow-hidden group">
      <!-- Window Controls Bar -->
      <div class="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-5">
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded-full bg-rose-500/80"></div>
          <div class="w-3 h-3 rounded-full bg-amber-500/80"></div>
          <div class="w-3 h-3 rounded-full bg-emerald-500/80"></div>
          <span class="ml-2 text-xs font-mono text-slate-400">Rapat_Evaluasi_Produk_Q3.m4a (14m 20s)</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Selesai Diproses
          </span>
        </div>
      </div>

      <!-- Simulated Audio Waveform Bar -->
      <div class="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-center gap-4 mb-6">
        <div class="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-indigo-600/30">
          <svg class="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
          </svg>
        </div>
        <!-- Waveform Simulation -->
        <div class="flex-1 flex items-center gap-1 h-8 overflow-hidden">
          <span
            v-for="h in [40, 60, 30, 85, 95, 70, 45, 90, 60, 30, 75, 100, 80, 50, 65, 85, 40, 70, 90, 50, 30, 80, 95, 60, 40, 75, 55, 90, 45, 30, 85, 65, 75, 40]"
            :key="h"
            class="w-1.5 rounded-full bg-indigo-500/60"
            :style="{ height: `${h}%` }"
          ></span>
        </div>
        <div class="text-xs font-mono text-slate-400 shrink-0">14:20</div>
      </div>

      <!-- Interactive Tabs for Demo Preview -->
      <div class="flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
        <button
          type="button"
          class="px-4 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer"
          :class="previewTab === 'summary' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'"
          @click="previewTab = 'summary'"
        >
          ✨ Rangkuman Intisari AI
        </button>
        <button
          type="button"
          class="px-4 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer"
          :class="previewTab === 'transcript' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'"
          @click="previewTab = 'transcript'"
        >
          📝 Teks Transkripsi Lengkap
        </button>
      </div>

      <!-- Preview Tab Content -->
      <div class="rounded-2xl bg-slate-950/60 border border-slate-800/80 p-5 font-sans min-h-[220px]">
        <!-- Summary View -->
        <div v-if="previewTab === 'summary'" class="space-y-4 text-xs sm:text-sm text-slate-300">
          <div>
            <h4 class="font-bold text-white text-sm mb-1.5 flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-indigo-400"></span>
              Topik Utama
            </h4>
            <p class="text-slate-400 leading-relaxed">
              Evaluasi progres implementasi sistem SimpulKata, keandalan konversi berkas rekaman suara, serta transparansi alur pemotongan saldo kuota pengguna.
            </p>
          </div>
          <div>
            <h4 class="font-bold text-white text-sm mb-1.5 flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-purple-400"></span>
              Poin-Poin Penting
            </h4>
            <ul class="list-disc list-inside space-y-1.5 text-slate-400 pl-1">
              <li>Akurasi transkripsi kosa kata Bahasa Indonesia telah berjalan optimal dan konsisten.</li>
              <li>Validasi durasi dilakukan secara lokal sejak awal agar kuota tidak terpotong jika berkas bermasalah.</li>
              <li>Setiap pengguna baru langsung mendapatkan saldo awal 30 menit pemrosesan secara otomatis.</li>
            </ul>
          </div>
          <div>
            <h4 class="font-bold text-white text-sm mb-1.5 flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
              Tindak Lanjut & Rencana Aksi
            </h4>
            <p class="text-slate-400 leading-relaxed">
              Mengintegrasikan halaman beranda publik dan mempersiapkan modul pembayaran kuota untuk fase berikutnya.
            </p>
          </div>
        </div>

        <!-- Raw Transcript View -->
        <div v-else class="space-y-3 font-sans text-xs sm:text-sm text-slate-300 leading-relaxed">
          <p>
            Halo selamat pagi rekan-rekan semua. Pada pertemuan evaluasi hari ini kita akan meninjau progres implementasi sistem SimpulKata, khususnya alur pengunggahan berkas rekaman suara dan pembuatan rangkuman otomatis. Sejauh ini hasil konversi berkas audio berjalan sangat lancar dengan pengenalan kosa kata bahasa Indonesia yang akurat.
          </p>
          <p>
            Untuk sistem kuota, validasi durasi audio kini diperiksa langsung sejak awal sebelum proses transkripsi dimulai sehingga penggunaan saldo pemrosesan menjadi lebih adil dan transparan bagi pengguna. Selain itu, tampilan antarmuka riwayat dan halaman beranda publik telah dirapikan agar pengguna baru dapat langsung mencoba fitur utama dengan kuota awal yang tersedia.
          </p>
          <p>
            Langkah selanjutnya adalah memastikan seluruh alur riwayat tersimpan rapi dan mempersiapkan opsi paket kuota untuk pengembangan ke depannya. Terima kasih atas kerja keras seluruh tim.
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  isAuthenticated: boolean;
}>();

const emit = defineEmits<{
  (e: 'navigate', view: string, tab?: string): void;
}>();

const previewTab = ref<'summary' | 'transcript'>('summary');

function handlePrimaryCTA() {
  if (props.isAuthenticated) {
    emit('navigate', 'dashboard');
  } else {
    emit('navigate', 'auth', 'register');
  }
}
</script>

