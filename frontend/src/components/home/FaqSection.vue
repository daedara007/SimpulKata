<template>
  <section id="faq" class="py-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto border-t border-slate-800/80">
    <div class="text-center space-y-4 mb-16">
      <h2 class="text-xs sm:text-sm uppercase tracking-widest font-bold text-indigo-400">Pertanyaan Umum</h2>
      <h3 class="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
        Hal yang Sering Ditanyakan
      </h3>
    </div>

    <div class="space-y-4">
      <div
        v-for="(faq, idx) in faqs"
        :key="idx"
        class="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden"
      >
        <button
          type="button"
          class="w-full p-5 text-left font-semibold text-sm sm:text-base text-slate-200 flex items-center justify-between hover:text-white transition-colors cursor-pointer"
          @click="faq.open = !faq.open"
        >
          <span>{{ faq.q }}</span>
          <svg
            class="w-5 h-5 shrink-0 text-slate-500 transition-transform duration-200"
            :class="{ 'rotate-180 text-indigo-400': faq.open }"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <div
          v-if="faq.open"
          class="px-5 pb-5 text-xs sm:text-sm text-slate-400 leading-relaxed border-t border-slate-800/60 pt-3"
        >
          {{ faq.a }}
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { reactive } from 'vue';

interface FaqItem {
  q: string;
  a: string;
  open: boolean;
}

const faqs = reactive<FaqItem[]>([
  {
    q: 'Format berkas audio apa saja yang didukung?',
    a: 'SimpulKata mendukung format .mp3, .wav, dan .m4a dengan ukuran berkas hingga 50MB per berkas rekaman.',
    open: true,
  },
  {
    q: 'Bagaimana cara kerja saldo kuota transkripsi?',
    a: 'Saldo kuota Anda dihitung berdasarkan durasi aktual rekaman audio dalam hitungan detik. Durasi diperiksa di awal sebelum pemrosesan agar saldo Anda tidak terpotong jika berkas bermasalah.',
    open: false,
  },
  {
    q: 'Berapa lama proses transkripsi dan rangkuman berlangsung?',
    a: 'Rata-rata proses membutuhkan waktu sekitar 10 hingga 30 detik untuk audio berdurasi menengah, tergantung panjang rekaman yang diunggah.',
    open: false,
  },
  {
    q: 'Apakah data rekaman dan transkripsi saya aman?',
    a: 'Sangat aman. Setiap akun memiliki isolasi data masing-masing sehingga transkrip dan rangkuman hanya dapat diakses oleh Anda setelah berhasil login.',
    open: false,
  },
  {
    q: 'Apakah paket kuota tambahan sudah dapat dibeli sekarang?',
    a: 'Saat ini paket kuota berbayar masih berstatus Segera Hadir dalam tahap integrasi payment gateway. Anda dapat langsung memanfaatkan kuota gratis 30 menit yang diberikan secara otomatis saat mendaftarkan akun baru.',
    open: false,
  },
]);
</script>

