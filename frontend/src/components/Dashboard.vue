<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
    <!-- Header -->
    <header class="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" />
            </svg>
          </div>
          <div>
            <h1 class="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              SimpulKata
            </h1>
            <p class="text-xs text-slate-400">Transkripsi & Rangkuman AI</p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <!-- Tombol Beranda -->
          <button
            type="button"
            class="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            @click="$emit('navigate', 'home')"
          >
            <svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span>Beranda</span>
          </button>

          <!-- Info User & Sisa Saldo (Tugas 5) -->
          <div v-if="userData?.name" class="hidden sm:flex items-center gap-2">
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              {{ userData.name }}
            </span>
            <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-slate-800 text-slate-300 border border-slate-700" :title="'Sisa kuota: ' + (userData.balance || 0) + ' detik'">
              ⏱️ {{ formatDuration(userData.balance || 0) }} kuota
            </span>
          </div>

          <!-- Tombol Logout (Tugas 5) -->
          <button
            type="button"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-800/80 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-slate-700/80 hover:border-rose-500/30 transition-all cursor-pointer"
            title="Keluar dari akun"
            @click="handleLogoutClick"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Keluar</span>
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content Layout (Sidebar Riwayat + Workspace) -->
    <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        <!-- ========================================================= -->
        <!-- KOLOM KIRI: Panel Riwayat Transkripsi (UC-11 & SD-11)    -->
        <!-- ========================================================= -->
        <aside class="lg:col-span-4 space-y-4">
          <div class="rounded-2xl bg-slate-900/60 border border-slate-800 p-4 sm:p-5 shadow-xl space-y-4 backdrop-blur-sm sticky top-24">
            <!-- Header Panel Riwayat -->
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 class="font-bold text-sm sm:text-base text-white">Riwayat Transkripsi</h3>
                </div>
                <span class="ml-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-slate-800 text-slate-300 border border-slate-700">
                  {{ totalRecords }}
                </span>
              </div>

              <!-- Tombol Refresh Riwayat (SRS UC-11 E1) -->
              <button
                type="button"
                class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Refresh Riwayat"
                :disabled="isLoadingHistory"
                @click="fetchHistory(currentPage)"
              >
                <svg
                  class="w-4 h-4 transition-transform duration-300"
                  :class="{ 'animate-spin text-indigo-400': isLoadingHistory }"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>

            <!-- Filter Status (Semua, Selesai, Gagal) Sesuai SRS UC-11 Typical Course step 4 -->
            <div class="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs">
              <button
                type="button"
                class="flex-1 py-1.5 px-2 rounded-lg font-medium transition-all"
                :class="statusFilter === 'all' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'"
                @click="setStatusFilter('all')"
              >
                Semua
              </button>
              <button
                type="button"
                class="flex-1 py-1.5 px-2 rounded-lg font-medium transition-all"
                :class="statusFilter === 'completed' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'"
                @click="setStatusFilter('completed')"
              >
                Completed
              </button>
              <button
                type="button"
                class="flex-1 py-1.5 px-2 rounded-lg font-medium transition-all"
                :class="statusFilter === 'failed' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'"
                @click="setStatusFilter('failed')"
              >
                Failed
              </button>
            </div>

            <!-- Error State: Database Query Timeout / Error (SRS UC-11 Exceptional Flow E1) -->
            <div
              v-if="historyError"
              class="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-2"
            >
              <p class="font-medium">{{ historyError }}</p>
              <button
                type="button"
                class="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium text-[11px] transition-colors"
                @click="fetchHistory(currentPage)"
              >
                Coba Refresh
              </button>
            </div>

            <!-- Loading Skeleton -->
            <div v-else-if="isLoadingHistory && historyList.length === 0" class="space-y-2.5 py-2">
              <div v-for="n in 3" :key="n" class="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 animate-pulse space-y-2">
                <div class="h-4 bg-slate-700/50 rounded w-3/4"></div>
                <div class="h-3 bg-slate-800 rounded w-1/2"></div>
              </div>
            </div>

            <!-- Empty State Flow 1: Belum ada data di database (SD-11 Flow 7b / SRS UC-11 Alternative Flow A1) -->
            <div
              v-else-if="totalRecords === 0"
              class="text-center py-10 px-4 rounded-xl border border-dashed border-slate-800 bg-slate-950/40 space-y-3"
            >
              <div class="w-12 h-12 mx-auto rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div>
                <p class="text-xs sm:text-sm font-semibold text-slate-200">Belum ada transkripsi</p>
                <p class="text-[11px] text-slate-400 mt-1">Silakan unggah atau rekam audio untuk memulai.</p>
              </div>
            </div>

            <!-- Empty State Flow 2: Filter tidak cocok (SRS UC-11 Alternative Flow A3) -->
            <div
              v-else-if="historyList.length === 0"
              class="text-center py-8 px-4 rounded-xl border border-dashed border-slate-800 bg-slate-950/40 space-y-2"
            >
              <p class="text-xs font-semibold text-slate-300">Tidak ada data sesuai filter</p>
              <p class="text-[11px] text-slate-500">Coba ganti filter status di atas ke "Semua".</p>
              <button
                type="button"
                class="mt-2 text-xs text-indigo-400 hover:text-indigo-300 font-medium underline"
                @click="setStatusFilter('all')"
              >
                Reset Filter
              </button>
            </div>

            <!-- Daftar Riwayat Transkripsi (SD-11 Normal Flow 7a & SRS UC-11 Post Conditions) -->
            <div v-else class="space-y-2 max-h-[520px] overflow-y-auto pr-1">
              <button
                v-for="item in historyList"
                :key="item.id"
                type="button"
                class="w-full text-left p-3.5 rounded-xl border transition-all duration-200 group relative block"
                :class="[
                  selectedHistoryId === item.id
                    ? 'border-indigo-500 bg-indigo-500/10 shadow-md shadow-indigo-500/10 ring-1 ring-indigo-500/50'
                    : 'border-slate-800/80 hover:border-slate-700 bg-slate-950/60 hover:bg-slate-900/60'
                ]"
                @click="selectHistoryItem(item)"
              >
                <!-- Indikator Aktif -->
                <div
                  v-if="selectedHistoryId === item.id"
                  class="absolute -left-1 top-3.5 bottom-3.5 w-1 rounded-r-full bg-indigo-500"
                ></div>

                <div class="flex items-start justify-between gap-2">
                  <!-- Nama File Audio -->
                  <div class="flex items-center gap-2 truncate pr-1">
                    <svg class="w-4 h-4 shrink-0 text-slate-400 group-hover:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                    <span class="text-xs font-semibold text-slate-200 truncate group-hover:text-white" :title="item.original_file_name">
                      {{ item.original_file_name }}
                    </span>
                  </div>

                  <!-- Badge Status (Completed / Failed / Processing) -->
                  <span
                    class="shrink-0 text-[10px] uppercase font-mono px-2 py-0.5 rounded-full border font-semibold"
                    :class="getStatusBadgeClass(item.status)"
                  >
                    {{ formatStatusLabel(item.status) }}
                  </span>
                </div>

                <!-- Metadata Item: Tanggal/Timestamp, Durasi, Word Count -->
                <div class="mt-2.5 flex items-center justify-between text-[11px] text-slate-400">
                  <span>{{ formatDate(item.created_at) }}</span>
                  <div class="flex items-center gap-2 text-[10px]">
                    <span v-if="item.duration_seconds > 0" class="text-slate-300 font-mono">⏱️ {{ formatDuration(item.duration_seconds) }}</span>
                    <span v-if="item.word_count > 0" class="text-indigo-400 font-medium">📝 {{ item.word_count }} kata</span>
                  </div>
                </div>
              </button>
            </div>

            <!-- Pagination Bar (SRS UC-11 Post Conditions & Alternative Flow A2) -->
            <div
              v-if="totalPages > 1"
              class="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs"
            >
              <button
                type="button"
                class="px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                :disabled="currentPage <= 1 || isLoadingHistory"
                @click="fetchHistory(currentPage - 1)"
              >
                &larr; Prev
              </button>
              <span class="text-[11px] text-slate-400 font-medium">
                Hal {{ currentPage }} dari {{ totalPages }}
              </span>
              <button
                type="button"
                class="px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                :disabled="currentPage >= totalPages || isLoadingHistory"
                @click="fetchHistory(currentPage + 1)"
              >
                Next &rarr;
              </button>
            </div>
          </div>
        </aside>

        <!-- ========================================================= -->
        <!-- KOLOM KANAN: Workspace (Upload & Side-by-Side Result)     -->
        <!-- ========================================================= -->
        <section class="lg:col-span-8 space-y-8">
          <!-- Hero Banner -->
          <div class="text-left space-y-1.5">
            <h2 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Transkripsi & Rangkuman <span class="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Audio AI</span>
            </h2>
            <p class="text-slate-400 text-xs sm:text-sm">
              Unggah berkas audio rapat atau perkuliahan Anda. Sistem AI akan mentranskripsikan percakapan secara presisi dan menyusun rangkuman intisari secara otomatis.
            </p>
          </div>

          <!-- Upload Card -->
          <div
            class="relative border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all duration-200"
            :class="[
              isDragging
                ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10'
                : 'border-slate-800 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900/60'
            ]"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleDrop"
          >
            <!-- Hidden File Input -->
            <input
              ref="fileInputRef"
              type="file"
              accept=".mp3,.wav,.m4a,audio/mp3,audio/wav,audio/x-m4a,audio/mp4"
              class="hidden"
              @change="handleFileChange"
            />

            <!-- Empty State (No File) -->
            <div v-if="!selectedFile" class="space-y-4">
              <div class="w-14 h-14 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
                <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div>
                <button
                  type="button"
                  class="font-semibold text-indigo-400 hover:text-indigo-300 focus:outline-none focus:underline text-sm"
                  @click="triggerFileInput"
                >
                  Pilih file audio
                </button>
                <span class="text-slate-400 text-sm"> atau seret ke area ini</span>
                <p class="text-xs text-slate-500 mt-1">Mendukung format .MP3, .WAV, dan .M4A (Maksimal 50MB)</p>
              </div>
            </div>

            <!-- File Selected State -->
            <div v-else class="space-y-4">
              <div class="inline-flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 max-w-full">
                <div class="w-10 h-10 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                </div>
                <div class="text-left truncate">
                  <p class="text-sm font-medium text-slate-200 truncate">{{ selectedFile.name }}</p>
                  <p class="text-xs text-slate-400">{{ formatFileSize(selectedFile.size) }} • {{ getFileExtension(selectedFile.name) }}</p>
                </div>
                <button
                  type="button"
                  class="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors ml-2"
                  title="Hapus file"
                  :disabled="isLoading"
                  @click="clearFile"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div>
                <button
                  type="button"
                  class="text-xs text-indigo-400 hover:text-indigo-300 underline focus:outline-none"
                  :disabled="isLoading"
                  @click="triggerFileInput"
                >
                  Pilih file lain
                </button>
              </div>
            </div>
          </div>

          <!-- Action Button -->
          <div class="flex justify-start">
            <button
              type="button"
              class="w-full sm:w-auto min-w-[220px] px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg"
              :class="[
                !selectedFile || isLoading
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/60 shadow-none'
                  : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-600/25 hover:shadow-indigo-600/40 hover:scale-[1.02] active:scale-[0.98]'
              ]"
              :disabled="!selectedFile || isLoading"
              @click="processAudio"
            >
              <!-- Loading Spinner -->
              <svg
                v-if="isLoading"
                class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>{{ isLoading ? loadingMessage : 'Proses Transkripsi' }}</span>
            </button>
          </div>

          <!-- Loading Progress Bar & Status Details -->
          <div v-if="isLoading" class="p-4 rounded-xl bg-slate-900/80 border border-indigo-500/30 space-y-2">
            <div class="flex items-center justify-between text-xs text-slate-300">
              <span class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-indigo-400 animate-ping"></span>
                {{ loadingMessage }}
              </span>
              <span class="text-slate-400 font-mono">{{ loadingTimer }}s</span>
            </div>
            <div class="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div class="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 rounded-full animate-pulse w-full"></div>
            </div>
            <p class="text-[11px] text-slate-400 text-center">
              Sistem sedang menganalisis berkas audio, mentranskripsikan percakapan, dan menyusun rangkuman intisari.
            </p>
          </div>

          <!-- Error Alert Card -->
          <div v-if="errorMessage" class="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3">
            <div class="text-rose-400 shrink-0 mt-0.5">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="flex-1 text-sm text-rose-200">
              <p class="font-semibold text-rose-300">Gagal Memproses Audio</p>
              <p class="mt-0.5 text-xs text-rose-300/80">{{ errorMessage }}</p>
            </div>
            <button
              type="button"
              class="text-rose-400 hover:text-rose-300 p-1"
              @click="errorMessage = ''"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- ========================================================= -->
          <!-- RESULTS SECTION: Side-by-Side (Raw & Summary)             -->
          <!-- ========================================================= -->
          <div
            v-if="rawText || summaryText"
            id="results-area"
            ref="resultsSectionRef"
            class="space-y-4 pt-6 border-t border-slate-800"
          >
            <!-- Results Header & Badges -->
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 class="text-lg font-bold text-white flex items-center gap-2">
                  <span>Hasil Transkripsi & Rangkuman</span>
                  <span class="text-xs font-normal px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Selesai
                  </span>
                </h3>
                <p class="text-xs text-slate-400 mt-0.5">
                  Teks transkripsi lengkap dan intisari rangkuman audio
                </p>
              </div>
              <div class="flex items-center gap-2 text-xs">
                <span v-if="meta.durationSeconds" class="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
                  ⏱️ Kuota Terpakai: <strong class="text-white">{{ formatDuration(meta.durationSeconds) }}</strong>
                </span>
                <span v-if="userData?.balance !== undefined" class="px-2.5 py-1 rounded-lg bg-indigo-950/60 text-indigo-300 border border-indigo-500/30">
                  🔋 Sisa Kuota: <strong class="text-white font-mono">{{ formatDuration(userData.balance) }}</strong>
                </span>
              </div>
            </div>

            <!-- Side-by-Side 2 Columns -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <!-- Left Column: Raw Transcription -->
              <div class="flex flex-col rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden shadow-xl">
                <div class="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
                    <h4 class="text-sm font-semibold text-slate-200">Teks Transkripsi</h4>
                    <span class="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      Lengkap
                    </span>
                  </div>
                  <button
                    type="button"
                    class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
                    @click="copyText(rawText, 'raw')"
                  >
                    <svg v-if="copiedRaw" class="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <svg v-else class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>{{ copiedRaw ? 'Tersalin!' : 'Salin Teks' }}</span>
                  </button>
                </div>
                <!-- Scrollable Text Area -->
                <div class="p-4 flex-1">
                  <div class="h-96 overflow-y-auto pr-2 text-sm leading-relaxed text-slate-300 font-mono whitespace-pre-wrap select-text">
                    {{ rawText || 'Tidak ada teks transkripsi.' }}
                  </div>
                </div>
                <div class="px-4 py-2 bg-slate-900/40 border-t border-slate-800/60 text-[11px] text-slate-500 flex justify-between">
                  <span>{{ rawText.length }} karakter</span>
                  <span>{{ countWords(rawText) }} kata</span>
                </div>
              </div>

              <!-- Right Column: Structured Summary -->
              <div class="flex flex-col rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden shadow-xl">
                <div class="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="w-2.5 h-2.5 rounded-full bg-purple-400"></span>
                    <h4 class="text-sm font-semibold text-slate-200">Rangkuman Intisari</h4>
                    <span class="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      Ringkas
                    </span>
                  </div>
                  <button
                    type="button"
                    class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
                    @click="copyText(summaryText, 'summary')"
                  >
                    <svg v-if="copiedSummary" class="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <svg v-else class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>{{ copiedSummary ? 'Tersalin!' : 'Salin Rangkuman' }}</span>
                  </button>
                </div>
                <!-- Scrollable Summary Area -->
                <div class="p-4 flex-1">
                  <div class="h-96 overflow-y-auto pr-2 text-sm leading-relaxed text-slate-200 whitespace-pre-wrap select-text space-y-2">
                    {{ summaryText || 'Belum ada rangkuman.' }}
                  </div>
                </div>
                <div class="px-4 py-2 bg-slate-900/40 border-t border-slate-800/60 text-[11px] text-slate-500 flex justify-between">
                  <span>{{ summaryText.length }} karakter</span>
                  <span>{{ countWords(summaryText) }} kata</span>
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>
    </main>

    <!-- Footer -->
    <footer class="border-t border-slate-900 py-6 text-center text-xs text-slate-500 mt-auto">
      <p>&copy; 2026 SimpulKata. Platform Transkripsi & Rangkuman AI.</p>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import axios from 'axios';

// =========================================================
// PROPS & EMITS (Tugas 5)
// =========================================================
const props = defineProps({
  currentUser: {
    type: Object,
    default: () => null,
  },
});

const emit = defineEmits(['logout', 'navigate']);

const userData = ref(props.currentUser || {});

watch(() => props.currentUser, (newVal) => {
  if (newVal) {
    userData.value = newVal;
  }
}, { deep: true });

async function fetchUserProfile() {
  try {
    const res = await axios.get('http://localhost:3000/api/auth/me');
    if (res.data?.status === 'success') {
      userData.value = res.data.data;
      localStorage.setItem('simpulkata_user', JSON.stringify(res.data.data));
    }
  } catch (err) {
    console.error('Gagal memuat profil pengguna:', err);
  }
}

function handleLogoutClick() {
  emit('logout');
}

// =========================================================
// STATE
// =========================================================
const fileInputRef = ref(null);
const resultsSectionRef = ref(null);
const selectedFile = ref(null);
const isDragging = ref(false);
const isLoading = ref(false);
const loadingMessage = ref('Memproses audio...');
const loadingTimer = ref(0);
let timerInterval = null;

// State Hasil Aktif
const transcriptId = ref('');
const rawText = ref('');
const summaryText = ref('');
const meta = ref({
  durationSeconds: 0,
  tokensUsed: 0,
});
const errorMessage = ref('');

// State Riwayat (UC-11 & SD-11)
const historyList = ref([]);
const totalRecords = ref(0);
const currentPage = ref(1);
const totalPages = ref(1);
const selectedHistoryId = ref('');
const isLoadingHistory = ref(false);
const historyError = ref('');
const statusFilter = ref('all');

const copiedRaw = ref(false);
const copiedSummary = ref(false);

const ALLOWED_EXTENSIONS = ['.mp3', '.wav', '.m4a'];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// =========================================================
// LIFECYCLE HOOK
// =========================================================
onMounted(() => {
  fetchUserProfile();
  fetchHistory(1);
});

// =========================================================
// METHODS: Riwayat Transkripsi (UC-11 & SD-11)
// =========================================================

/**
 * Mengubah filter status dan memuat ulang data dari halaman 1 (SD-11 langkah 1: klikMenuRiwayatTranskripsi)
 */
function setStatusFilter(filter) {
  statusFilter.value = filter;
  currentPage.value = 1;
  fetchHistory(1);
}

/**
 * Mengambil riwayat transkripsi dari backend GET /api/history (SD-11 langkah 2 & SRS UC-11)
 * @param {number} page
 */
async function fetchHistory(page = 1) {
  isLoadingHistory.value = true;
  historyError.value = '';
  currentPage.value = page;

  try {
    const params = {
      page: page,
      limit: 20,
    };
    if (statusFilter.value !== 'all') {
      params.status = statusFilter.value;
    }

    const response = await axios.get('http://localhost:3000/api/history', { params });
    if (response.data?.status === 'success') {
      historyList.value = response.data.data || [];
      totalRecords.value = response.data.totalRecords ?? historyList.value.length;
      currentPage.value = response.data.page ?? page;
      totalPages.value = response.data.totalPages ?? 1;

      // Jika belum ada hasil yang aktif dan ada riwayat selesai, pilih otomatis yang paling atas
      if (!transcriptId.value && historyList.value.length > 0) {
        const firstCompleted = historyList.value.find((item) => item.status === 'completed') || historyList.value[0];
        if (firstCompleted && firstCompleted.status === 'completed') {
          selectHistoryItem(firstCompleted, false);
        }
      }
    } else {
      throw new Error(response.data?.message || 'Gagal memuat riwayat');
    }
  } catch (err) {
    console.error('Gagal mengambil riwayat transkripsi:', err);
    historyError.value = 'Gagal memuat riwayat. Coba refresh halaman.';
  } finally {
    isLoadingHistory.value = false;
  }
}

/**
 * Memilih item dari daftar riwayat dan menampilkannya ke panel hasil utama
 */
function selectHistoryItem(item, shouldScroll = true) {
  if (!item) return;

  selectedHistoryId.value = item.id;
  transcriptId.value = item.id;
  rawText.value = item.raw_text || '';
  summaryText.value = item.summary_text || '';
  meta.value = {
    durationSeconds: item.duration_seconds || 0,
    tokensUsed: item.tokens_used || 0,
  };

  // Scroll halus ke area hasil jika di-trigger oleh klik pengguna
  if (shouldScroll) {
    setTimeout(() => {
      const el = document.getElementById('results-area');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }
}

// =========================================================
// METHODS: Upload & Pemrosesan Audio
// =========================================================
function triggerFileInput() {
  if (fileInputRef.value) {
    fileInputRef.value.click();
  }
}

function handleFileChange(event) {
  const file = event.target.files?.[0];
  if (file) {
    validateAndSetFile(file);
  }
}

function handleDrop(event) {
  isDragging.value = false;
  const file = event.dataTransfer.files?.[0];
  if (file) {
    validateAndSetFile(file);
  }
}

function validateAndSetFile(file) {
  errorMessage.value = '';
  const ext = getFileExtension(file.name).toLowerCase();

  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    alert(`Format file '${ext}' tidak didukung. Harap pilih file dengan format .mp3, .wav, atau .m4a.`);
    return;
  }

  if (file.size > MAX_FILE_SIZE) {
    alert('Ukuran file melebihi batas maksimal 50MB.');
    return;
  }

  if (file.size === 0) {
    alert('File yang dipilih kosong (0 bytes). Silakan pilih file audio yang valid.');
    return;
  }

  selectedFile.value = file;
}

function clearFile() {
  selectedFile.value = null;
  if (fileInputRef.value) {
    fileInputRef.value.value = '';
  }
}

async function processAudio() {
  if (!selectedFile.value) {
    alert('Silakan pilih file audio terlebih dahulu.');
    return;
  }

  isLoading.value = true;
  loadingMessage.value = 'Mengunggah file audio ke server...';
  errorMessage.value = '';
  loadingTimer.value = 0;

  timerInterval = setInterval(() => {
    loadingTimer.value++;
    if (loadingTimer.value === 3) {
      loadingMessage.value = 'Sistem sedang mentranskripsikan audio...';
    } else if (loadingTimer.value === 12) {
      loadingMessage.value = 'Sistem sedang menyusun rangkuman intisari...';
    }
  }, 1000);

  try {
    const formData = new FormData();
    formData.append('audio', selectedFile.value);

    const response = await axios.post('http://localhost:3000/api/process-audio', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.data?.status === 'success') {
      const data = response.data.data;
      transcriptId.value = data.transcript_id || '';
      rawText.value = data.raw_text || '';
      summaryText.value = data.summary_text || '';
      meta.value = {
        durationSeconds: data.duration_seconds || 0,
        tokensUsed: data.tokens_used || 0,
      };
      selectedHistoryId.value = data.transcript_id;

      // Auto-update riwayat dan sisa saldo setelah pemrosesan selesai!
      await fetchHistory(1);
      await fetchUserProfile();

      // Scroll halus ke area hasil
      setTimeout(() => {
        const el = document.getElementById('results-area');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 150);
    } else {
      throw new Error(response.data?.message || 'Gagal memproses audio');
    }
  } catch (err) {
    console.error('Error saat memproses audio:', err);

    let errorMsg = 'Terjadi kesalahan saat memproses audio.';
    if (err.response?.data?.message) {
      errorMsg = err.response.data.message;
      if (err.response.data.detail) {
        errorMsg += ` (${err.response.data.detail})`;
      }
    } else if (err.message) {
      errorMsg = err.message;
    }

    errorMessage.value = errorMsg;
    alert(`Error: ${errorMsg}`);
  } finally {
    isLoading.value = false;
    clearInterval(timerInterval);
  }
}

// =========================================================
// HELPER FORMATTING
// =========================================================
function getFileExtension(filename) {
  if (!filename) return '';
  const lastDot = filename.lastIndexOf('.');
  return lastDot !== -1 ? filename.slice(lastDot) : '';
}

function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return '0 dtk';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs} dtk`;
  if (secs === 0) return `${mins} mnt`;
  return `${mins}m ${secs}s`;
}

function formatDate(isoString) {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch (_) {
    return isoString;
  }
}

function formatStatusLabel(status) {
  switch (status) {
    case 'completed': return 'Selesai';
    case 'failed': return 'Gagal';
    case 'processing': return 'Memproses';
    default: return status || 'Pending';
  }
}

function getStatusBadgeClass(status) {
  switch (status) {
    case 'completed':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    case 'failed':
      return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    case 'processing':
      return 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse';
    default:
      return 'bg-slate-800 text-slate-400 border-slate-700';
  }
}

function countWords(str) {
  if (!str) return 0;
  return str.trim().split(/\s+/).filter(Boolean).length;
}

async function copyText(text, type) {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    if (type === 'raw') {
      copiedRaw.value = true;
      setTimeout(() => (copiedRaw.value = false), 2000);
    } else {
      copiedSummary.value = true;
      setTimeout(() => (copiedSummary.value = false), 2000);
    }
  } catch (err) {
    console.warn('Gagal menyalin teks ke clipboard:', err);
  }
}
</script>
