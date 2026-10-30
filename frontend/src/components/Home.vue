<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white relative overflow-x-hidden">
    <!-- Ambient Background Glows -->
    <div class="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-indigo-600/20 via-purple-600/10 to-transparent blur-3xl pointer-events-none -z-10"></div>
    <div class="absolute top-[600px] -left-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -z-10"></div>
    <div class="absolute top-[1200px] -right-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none -z-10"></div>

    <!-- ========================================================= -->
    <!-- NAVIGATION BAR                                            -->
    <!-- ========================================================= -->
    <header class="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/70 border-b border-slate-800/80 transition-all">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <!-- Brand Logo -->
        <a href="#top" class="flex items-center gap-3 group">
          <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform duration-200">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" />
            </svg>
          </div>
          <div>
            <span class="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              Simpul<span class="text-indigo-400">Kata</span>
            </span>
            <span class="block text-[10px] text-slate-400 font-medium tracking-wider uppercase">AI Audio Intelligence</span>
          </div>
        </a>

        <!-- Desktop Navigation Links -->
        <nav class="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <a href="#fitur" class="hover:text-white transition-colors">Fitur Unggulan</a>
          <a href="#cara-kerja" class="hover:text-white transition-colors">Cara Kerja</a>
          <a href="#preview" class="hover:text-white transition-colors">Pratinjau Hasil</a>
          <a href="#paket" class="hover:text-white transition-colors">Paket Kuota</a>
          <a href="#faq" class="hover:text-white transition-colors">FAQ</a>
        </nav>

        <!-- CTA Buttons -->
        <div class="flex items-center gap-3">
          <template v-if="isAuthenticated">
            <button
              type="button"
              class="py-2.5 px-5 rounded-xl font-semibold text-xs sm:text-sm text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 cursor-pointer"
              @click="$emit('navigate', 'dashboard')"
            >
              <span>Buka Dashboard</span>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </template>
          <template v-else>
            <button
              type="button"
              class="py-2 px-3.5 rounded-xl text-xs sm:text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-all cursor-pointer"
              @click="$emit('navigate', 'auth', 'login')"
            >
              Masuk
            </button>
            <button
              type="button"
              class="py-2.5 px-4 sm:px-5 rounded-xl font-semibold text-xs sm:text-sm text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1.5 cursor-pointer"
              @click="$emit('navigate', 'auth', 'register')"
            >
              <span>Mulai Gratis</span>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </template>
        </div>
      </div>
    </header>

    <!-- ========================================================= -->
    <!-- HERO SECTION                                              -->
    <!-- ========================================================= -->
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
          <!-- Waveform SVG Animation Simulation -->
          <div class="flex-1 flex items-center gap-1 h-8 overflow-hidden">
            <span v-for="h in [40, 60, 30, 85, 95, 70, 45, 90, 60, 30, 75, 100, 80, 50, 65, 85, 40, 70, 90, 50, 30, 80, 95, 60, 40, 75, 55, 90, 45, 30, 85, 65, 75, 40]" :key="h" class="w-1.5 rounded-full bg-indigo-500/60" :style="{ height: `${h}%` }"></span>
          </div>
          <div class="text-xs font-mono text-slate-400 shrink-0">14:20</div>
        </div>

        <!-- Interactive Tabs for Demo Preview -->
        <div class="flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
          <button
            type="button"
            class="px-4 py-1.5 rounded-xl text-xs font-semibold transition-all"
            :class="previewTab === 'summary' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'"
            @click="previewTab = 'summary'"
          >
            ✨ Rangkuman Intisari AI
          </button>
          <button
            type="button"
            class="px-4 py-1.5 rounded-xl text-xs font-semibold transition-all"
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

          <!-- Raw Transcript View (Whisper Continuous Transcript without speaker diarization) -->
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

    <!-- ========================================================= -->
    <!-- METRICS / STATS STRIP                                     -->
    <!-- ========================================================= -->
    <section class="py-12 border-y border-slate-800/80 bg-slate-900/40">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        <div class="space-y-1">
          <p class="text-3xl sm:text-4xl font-extrabold text-white">80%</p>
          <p class="text-xs sm:text-sm text-slate-400">Waktu Lebih Hemat</p>
        </div>
        <div class="space-y-1">
          <p class="text-3xl sm:text-4xl font-extrabold text-indigo-400">30 Menit</p>
          <p class="text-xs sm:text-sm text-slate-400">Kuota Gratis Akun Baru</p>
        </div>
        <div class="space-y-1">
          <p class="text-3xl sm:text-4xl font-extrabold text-purple-400">3 Format</p>
          <p class="text-xs sm:text-sm text-slate-400">Audio (.mp3, .wav, .m4a)</p>
        </div>
        <div class="space-y-1">
          <p class="text-3xl sm:text-4xl font-extrabold text-emerald-400">100%</p>
          <p class="text-xs sm:text-sm text-slate-400">Privasi Akun Terisolasi</p>
        </div>
      </div>
    </section>

    <!-- ========================================================= -->
    <!-- FITUR UNGGULAN (FEATURES GRID)                            -->
    <!-- ========================================================= -->
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

    <!-- ========================================================= -->
    <!-- CARA KERJA (HOW IT WORKS)                                 -->
    <!-- ========================================================= -->
    <section id="cara-kerja" class="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-800/80">
      <div class="text-center max-w-3xl mx-auto space-y-4 mb-20">
        <h2 class="text-xs sm:text-sm uppercase tracking-widest font-bold text-indigo-400">Alur Sederhana</h2>
        <h3 class="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Hanya Butuh 3 Langkah Cepat
        </h3>
        <p class="text-slate-400 text-sm sm:text-base">
          Mulai dari berkas mentah hingga menjadi ringkasan yang siap dibagikan ke seluruh tim.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-10 relative">
        <!-- Step 1 -->
        <div class="text-center space-y-4">
          <div class="w-16 h-16 mx-auto rounded-3xl bg-indigo-600/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-extrabold text-xl shadow-lg">
            1
          </div>
          <h4 class="text-xl font-bold text-white">Unggah Berkas Audio</h4>
          <p class="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-xs mx-auto">
            Tarik dan letakkan rekaman rapat atau kuliah dalam format .mp3, .wav, atau .m4a ke dashboard.
          </p>
        </div>

        <!-- Step 2 -->
        <div class="text-center space-y-4">
          <div class="w-16 h-16 mx-auto rounded-3xl bg-purple-600/10 border border-purple-500/30 flex items-center justify-center text-purple-400 font-extrabold text-xl shadow-lg">
            2
          </div>
          <h4 class="text-xl font-bold text-white">Kecerdasan AI Memproses</h4>
          <p class="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-xs mx-auto">
            Sistem mentranskripsikan ucapan dan merangkum intisari poin penting secara otomatis di server.
          </p>
        </div>

        <!-- Step 3 -->
        <div class="text-center space-y-4">
          <div class="w-16 h-16 mx-auto rounded-3xl bg-pink-600/10 border border-pink-500/30 flex items-center justify-center text-pink-400 font-extrabold text-xl shadow-lg">
            3
          </div>
          <h4 class="text-xl font-bold text-white">Dapatkan Hasil & Bagikan</h4>
          <p class="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-xs mx-auto">
            Baca transkrip lengkap, pelajari rangkuman ringkasnya, dan salin dalam satu klik untuk dokumentasi.
          </p>
        </div>
      </div>
    </section>

    <!-- ========================================================= -->
    <!-- PAKET KUOTA (PRICING PREVIEW)                             -->
    <!-- ========================================================= -->
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
            Daftar Gratis Sekarang
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

    <!-- ========================================================= -->
    <!-- FAQ (FREQUENTLY ASKED QUESTIONS)                          -->
    <!-- ========================================================= -->
    <section id="faq" class="py-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto border-t border-slate-800/80">
      <div class="text-center space-y-4 mb-16">
        <h2 class="text-xs sm:text-sm uppercase tracking-widest font-bold text-indigo-400">Pertanyaan Umum</h2>
        <h3 class="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Hal yang Sering Ditanyakan
        </h3>
      </div>

      <div class="space-y-4">
        <div v-for="(faq, idx) in faqs" :key="idx" class="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden">
          <button
            type="button"
            class="w-full p-5 text-left font-semibold text-sm sm:text-base text-slate-200 flex items-center justify-between hover:text-white transition-colors"
            @click="faq.open = !faq.open"
          >
            <span>{{ faq.q }}</span>
            <svg class="w-5 h-5 shrink-0 text-slate-500 transition-transform duration-200" :class="{ 'rotate-180 text-indigo-400': faq.open }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div v-if="faq.open" class="px-5 pb-5 text-xs sm:text-sm text-slate-400 leading-relaxed border-t border-slate-800/60 pt-3">
            {{ faq.a }}
          </div>
        </div>
      </div>
    </section>

    <!-- ========================================================= -->
    <!-- BOTTOM CALL TO ACTION BANNER                              -->
    <!-- ========================================================= -->
    <section class="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div class="rounded-3xl bg-gradient-to-r from-indigo-900/60 via-purple-900/50 to-slate-900/80 border border-indigo-500/30 p-8 sm:p-14 text-center space-y-6 relative overflow-hidden backdrop-blur-xl shadow-2xl">
        <div class="max-w-2xl mx-auto space-y-4">
          <h3 class="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Siap Menghemat Waktu Dokumentasi Anda?
          </h3>
          <p class="text-sm sm:text-base text-slate-300">
            Daftarkan diri Anda sekarang dan dapatkan kuota transkripsi gratis 30 menit langsung di akun Anda.
          </p>
        </div>

        <button
          type="button"
          class="py-3.5 px-8 rounded-2xl font-bold text-sm sm:text-base text-white bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-600/40 hover:scale-[1.02] active:scale-[0.98] transition-all inline-flex items-center gap-2 cursor-pointer"
          @click="handlePrimaryCTA"
        >
          <span>Daftar Akun Gratis Sekarang</span>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </div>
    </section>

    <!-- ========================================================= -->
    <!-- FOOTER                                                    -->
    <!-- ========================================================= -->
    <footer class="border-t border-slate-900 py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div class="flex items-center gap-2">
        <div class="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" />
          </svg>
        </div>
        <span class="font-semibold text-slate-300">SimpulKata</span>
        <span>&bull;</span>
        <span>Platform Transkripsi & Rangkuman AI</span>
      </div>
      <div>
        <p>&copy; 2026 SimpulKata. Hak Cipta Dilindungi.</p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';

interface Props {
  isAuthenticated?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isAuthenticated: false,
});

const emit = defineEmits<{
  (e: 'navigate', view: string, tab?: string): void;
}>();

const previewTab = ref<'summary' | 'transcript'>('summary');

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

function handlePrimaryCTA() {
  if (props.isAuthenticated) {
    emit('navigate', 'dashboard');
  } else {
    emit('navigate', 'auth', 'register');
  }
}
</script>
