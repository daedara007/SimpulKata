<template>
  <section id="fitur" class="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
    <div class="text-center max-w-3xl mx-auto space-y-4 mb-16">
      <h2 class="text-xs sm:text-sm uppercase tracking-widest font-bold text-indigo-400">Fitur Unggulan</h2>
      <h3 class="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
        Dirancang untuk Memaksimalkan Efisiensi Kerja & Studi Anda
      </h3>
      <p class="text-slate-400 text-sm sm:text-base">
        Semua alat yang Anda butuhkan untuk mendokumentasikan rekaman percakapan rapat, kuliah, dan wawancara tanpa perlu mencatat manual.
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      <!-- Feature 1 -->
      <div class="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900/90 transition-all duration-300 space-y-3 group">
        <div class="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" />
          </svg>
        </div>
        <h4 class="text-lg font-bold text-white">Transkripsi Presisi Tinggi</h4>
        <p class="text-xs sm:text-sm text-slate-400 leading-relaxed">
          Mengenali percakapan audio secara presisi, mendukung istilah teknis, percakapan campuran, dan file hingga 50MB.
        </p>
      </div>

      <!-- Feature 2 -->
      <div class="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-purple-500/50 hover:bg-slate-900/90 transition-all duration-300 space-y-3 group">
        <div class="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h4 class="text-lg font-bold text-white">Rangkuman Intisari AI</h4>
        <p class="text-xs sm:text-sm text-slate-400 leading-relaxed">
          Menyaring inti percakapan penting, poin-poin keputusan, dan rencana aksi ke dalam format poin-poin yang mudah dibaca.
        </p>
      </div>

      <!-- Feature 3 -->
      <div class="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-pink-500/50 hover:bg-slate-900/90 transition-all duration-300 space-y-3 group">
        <div class="w-12 h-12 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 group-hover:scale-110 transition-transform">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h4 class="text-lg font-bold text-white">Kalkulasi Kuota Adil</h4>
        <p class="text-xs sm:text-sm text-slate-400 leading-relaxed">
          Durasi audio dihitung secara adil per detik rekaman. Kuota tidak akan terpotong jika terjadi kendala pada berkas.
        </p>
      </div>

      <!-- Feature 4 -->
      <div class="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-900/90 transition-all duration-300 space-y-3 group">
        <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
        </div>
        <h4 class="text-lg font-bold text-white">Riwayat Terarsip Aman</h4>
        <p class="text-xs sm:text-sm text-slate-400 leading-relaxed">
          Daftar transkrip tersimpan rapi dengan fitur pencarian dan paginasi, siap dibuka kembali kapan saja tanpa hilang.
        </p>
      </div>

      <!-- Feature 5 -->
      <div class="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-900/90 transition-all duration-300 space-y-3 group">
        <div class="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <h4 class="text-lg font-bold text-white">Salin & Bagikan Instan</h4>
        <p class="text-xs sm:text-sm text-slate-400 leading-relaxed">
          Fitur tombol salin satu-klik memudahkan Anda membagikan notula rapat ke WhatsApp, email, Notion, atau Google Docs.
        </p>
      </div>

      <!-- Feature 6 -->
      <div class="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-900/90 transition-all duration-300 space-y-3 group">
        <div class="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h4 class="text-lg font-bold text-white">Privasi Terjaga</h4>
        <p class="text-xs sm:text-sm text-slate-400 leading-relaxed">
          Kata sandi dienkripsi dengan standar industri, dan rekaman audio Anda diisolasi khusus untuk akun milik Anda sendiri.
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// Stateless features section
</script>

