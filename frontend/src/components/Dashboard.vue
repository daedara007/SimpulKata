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

          <!-- Info Sisa Kuota Ringkas untuk Layar Ponsel (< 640px) (CR-16, TC-PROF-003) -->
          <div v-if="userData?.name" class="flex sm:hidden items-center gap-2">
            <button
              type="button"
              class="flex items-center gap-1.5 p-1 rounded-full bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition-all cursor-pointer"
              title="Pengaturan Profil (Ubah Nama & Avatar)"
              @click="openProfileModal"
            >
              <img
                v-if="userData.avatar_url"
                :src="userData.avatar_url"
                :alt="userData.name"
                class="w-6 h-6 rounded-full object-cover border border-indigo-400/40"
              />
              <span
                v-else
                class="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white text-[10px] font-bold flex items-center justify-center shadow-sm"
              >
                {{ userData.name.charAt(0).toUpperCase() }}
              </span>
            </button>
            <span
              class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-slate-800 text-slate-300 border border-slate-700"
              :title="'Sisa kuota: ' + (userData.balance || 0) + ' detik'"
            >
              ⏱️ {{ formatDuration(userData.balance || 0) }}
            </span>
          </div>

          <!-- Info User & Sisa Saldo untuk Layar Desktop (>= 640px) -->
          <div v-if="userData?.name" class="hidden sm:flex items-center gap-2">
            <button
              type="button"
              class="inline-flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full text-xs font-medium bg-slate-800/80 hover:bg-indigo-500/10 text-slate-200 hover:text-white border border-slate-700 hover:border-indigo-500/40 transition-all cursor-pointer group"
              title="Pengaturan Profil (Ubah Nama & Avatar)"
              @click="openProfileModal"
            >
              <img
                v-if="userData.avatar_url"
                :src="userData.avatar_url"
                :alt="userData.name"
                class="w-6 h-6 rounded-full object-cover border border-indigo-400/40 group-hover:scale-105 transition-transform"
              />
              <span
                v-else
                class="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white text-[11px] font-bold flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform"
              >
                {{ userData.name.charAt(0).toUpperCase() }}
              </span>
              <span class="max-w-[130px] truncate font-medium">{{ userData.name }}</span>
              <svg class="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
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

            <!-- Empty State Flow 2: Filter aktif tapi tidak cocok (CR-12, TC-HIST-008) -->
            <div
              v-else-if="statusFilter !== 'all' && (historyList.length === 0 || totalRecords === 0)"
              class="text-center py-8 px-4 rounded-xl border border-dashed border-slate-800 bg-slate-950/40 space-y-2"
            >
              <p class="text-xs font-semibold text-slate-300">Tidak ada data sesuai filter</p>
              <p class="text-[11px] text-slate-500">Coba ganti filter status di atas ke "Semua".</p>
              <button
                type="button"
                class="mt-2 text-xs text-indigo-400 hover:text-indigo-300 font-medium underline cursor-pointer"
                @click="setStatusFilter('all')"
              >
                Reset Filter
              </button>
            </div>

            <!-- Empty State Flow 1: Belum ada data di database (SD-11 Flow 7b / SRS UC-11 Alternative Flow A1) -->
            <div
              v-else-if="totalRecords === 0 || historyList.length === 0"
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
                    <span v-if="Boolean(item.word_count && item.word_count > 0)" class="text-indigo-400 font-medium">📝 {{ item.word_count }} kata</span>
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
                  <div class="h-96 overflow-y-auto pr-2 text-sm leading-relaxed text-slate-200 select-text">
                    <div
                      v-if="summaryText"
                      class="summary-markdown"
                      v-html="renderedSummary"
                    ></div>
                    <div v-else class="text-slate-500 italic">
                      Belum ada rangkuman.
                    </div>
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

    <!-- ========================================================= -->
    <!-- MODAL PENGATURAN PROFIL & KEAMANAN (UC-04 & UC-05)       -->
    <!-- ========================================================= -->
    <div
      v-if="isProfileModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
      @click.self="closeProfileModal"
    >
      <div class="relative w-full max-w-lg bg-slate-900/95 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-7 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
        <!-- Header Modal & Tab Navigasi -->
        <div class="pb-4 border-b border-slate-800">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <svg v-if="profileActiveTab === 'profile'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h3 class="text-lg font-bold text-white tracking-tight">Pengaturan Akun</h3>
                <p class="text-xs text-slate-400">Kelola identitas profil dan keamanan kata sandi Anda</p>
              </div>
            </div>
            <button
              type="button"
              class="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Tutup"
              @click="closeProfileModal"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Tab Navigasi (UC-04 & UC-05) -->
          <div class="flex gap-2 p-1 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <button
              type="button"
              class="flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
              :class="profileActiveTab === 'profile' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'"
              @click="profileActiveTab = 'profile'"
            >
              <span>👤</span> Profil Saya
            </button>
            <button
              type="button"
              class="flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
              :class="profileActiveTab === 'password' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'"
              @click="profileActiveTab = 'password'"
            >
              <span>🔒</span> Ubah Sandi
            </button>
          </div>
        </div>

        <!-- ========================================== -->
        <!-- TAB 1: PENGATURAN PROFIL (UC-04 & SD-04)   -->
        <!-- ========================================== -->
        <div v-if="profileActiveTab === 'profile'">
          <!-- Notifikasi Error & Sukses Profil -->
          <div v-if="profileErrorMessage" class="mt-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
            <svg class="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{{ profileErrorMessage }}</span>
          </div>

          <div v-if="profileSuccessMessage" class="mt-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5">
            <svg class="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>{{ profileSuccessMessage }}</span>
          </div>

          <!-- FORM UTAMA PROFIL -->
          <form v-if="!emailChangePending" class="mt-5 space-y-5" @submit.prevent="handleSaveProfile(onUserUpdated)">
            <!-- Pemilihan Avatar -->
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-2.5">Foto / Avatar Profil</label>
              <div class="flex items-center gap-4">
                <!-- Pratinjau Avatar Terpilih -->
                <div class="relative">
                  <img
                    v-if="profileAvatarUrl"
                    :src="profileAvatarUrl"
                    alt="Avatar"
                    class="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-500 shadow-lg shadow-indigo-500/20 bg-slate-800"
                  />
                  <div
                    v-else
                    class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white text-2xl font-bold flex items-center justify-center shadow-lg border-2 border-indigo-500/50"
                  >
                    {{ (profileName || userData?.name || 'U').charAt(0).toUpperCase() }}
                  </div>
                </div>

                <!-- Pilihan Preset Avatar -->
                <div class="flex-1">
                  <p class="text-[11px] text-slate-400 mb-2">Pilih avatar preset AI atau gunakan inisial nama:</p>
                  <div class="flex flex-wrap gap-2">
                    <!-- Pilihan Inisial -->
                    <button
                      type="button"
                      class="w-9 h-9 rounded-xl border flex items-center justify-center text-xs font-bold transition-all cursor-pointer"
                      :class="!profileAvatarUrl ? 'border-indigo-400 bg-indigo-500/20 text-white ring-2 ring-indigo-500/40' : 'border-slate-800 bg-slate-800/80 text-slate-400 hover:text-white hover:border-slate-700'"
                      title="Gunakan Inisial Nama"
                      @click="selectAvatar(null)"
                    >
                      {{ (profileName || userData?.name || 'U').charAt(0).toUpperCase() }}
                    </button>

                    <!-- 6 Preset Avatar Bot/AI -->
                    <button
                      v-for="preset in AVATAR_PRESETS"
                      :key="preset.id"
                      type="button"
                      class="w-9 h-9 rounded-xl border p-0.5 transition-all cursor-pointer overflow-hidden"
                      :class="profileAvatarUrl === preset.url ? 'border-indigo-400 bg-indigo-500/20 ring-2 ring-indigo-500/40 scale-105' : 'border-slate-800 bg-slate-800/80 hover:border-slate-700 opacity-70 hover:opacity-100'"
                      :title="preset.label"
                      @click="selectAvatar(preset.url)"
                    >
                      <img :src="preset.url" :alt="preset.label" class="w-full h-full object-cover rounded-lg" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Input Nama Lengkap -->
            <div>
              <div class="flex justify-between items-center mb-1.5">
                <label for="profile-name" class="block text-xs font-semibold text-slate-300">Nama Lengkap</label>
                <span class="text-[11px] text-slate-500">{{ profileName.length }}/100</span>
              </div>
              <input
                id="profile-name"
                v-model="profileName"
                type="text"
                maxlength="100"
                required
                placeholder="Masukkan nama lengkap Anda"
                class="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
            </div>

            <!-- Input Email -->
            <div>
              <div class="flex justify-between items-center mb-1.5">
                <label for="profile-email" class="block text-xs font-semibold text-slate-300">Alamat Email</label>
                <span v-if="profileEmail.toLowerCase() !== profileOriginalEmail.toLowerCase()" class="text-[11px] text-amber-400 font-medium">
                  ⚠️ Memerlukan verifikasi OTP
                </span>
              </div>
              <input
                id="profile-email"
                v-model="profileEmail"
                type="email"
                required
                placeholder="nama@email.com"
                class="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
              <p class="text-[11px] text-slate-500 mt-1">
                Jika email diubah, kami akan mengirimkan kode verifikasi OTP 6-digit ke email baru.
              </p>
            </div>

            <!-- Input Password Saat Ini (Verifikasi Keamanan SD-04 Langkah 12) -->
            <div>
              <label for="profile-current-password" class="block text-xs font-semibold text-slate-300 mb-1.5">
                Konfirmasi Password Saat Ini <span class="text-rose-400">*</span>
              </label>
              <div class="relative">
                <input
                  id="profile-current-password"
                  v-model="profileCurrentPassword"
                  :type="profileShowPassword ? 'text' : 'password'"
                  required
                  placeholder="Masukkan kata sandi akun Anda"
                  class="w-full pl-3.5 pr-10 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
                <button
                  type="button"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                  @click="profileShowPassword = !profileShowPassword"
                >
                  <svg v-if="profileShowPassword" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                  </svg>
                  <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
              </div>
              <p class="text-[11px] text-slate-500 mt-1">
                Dibutuhkan untuk memastikan otorisasi perubahan profil pemilik akun.
              </p>
            </div>

            <!-- Tombol Aksi Modal Profil -->
            <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                class="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                :disabled="isSavingProfile"
                @click="closeProfileModal"
              >
                Batal
              </button>
              <button
                type="submit"
                class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="isSavingProfile || !profileName || !profileCurrentPassword"
              >
                <svg v-if="isSavingProfile" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>{{ isSavingProfile ? 'Menyimpan...' : 'Simpan Perubahan' }}</span>
              </button>
            </div>
          </form>

          <!-- DIALOG VERIFIKASI OTP PERGANTIAN EMAIL (SD-04 Langkah 16-17) -->
          <div v-else class="mt-5 space-y-4">
            <div class="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-slate-300 text-xs space-y-1.5">
              <p class="font-semibold text-amber-300 flex items-center gap-1.5">
                <span>📩</span> Verifikasi Alamat Email Baru
              </p>
              <p>
                Kami telah mengirimkan 6-digit kode OTP ke <strong>{{ newPendingEmail }}</strong>. Masukkan kode tersebut untuk meresmikan alamat email baru Anda:
              </p>
            </div>

            <div v-if="emailOtpErrorMessage" class="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {{ emailOtpErrorMessage }}
            </div>
            <div v-if="emailOtpSuccessMessage" class="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
              {{ emailOtpSuccessMessage }}
            </div>

            <div>
              <label for="email-otp-code" class="block text-xs font-semibold text-slate-300 mb-1.5">Kode OTP (6 Digit)</label>
              <input
                id="email-otp-code"
                v-model="emailOtpCode"
                type="text"
                maxlength="6"
                placeholder="Contoh: 123456"
                class="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-center text-lg font-mono tracking-widest text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div class="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                type="button"
                class="text-xs text-slate-400 hover:text-slate-200 transition-colors"
                @click="cancelEmailChange"
              >
                ← Batal Ganti Email
              </button>
              <button
                type="button"
                class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50"
                :disabled="isVerifyingEmailOtp || emailOtpCode.length !== 6"
                @click="handleVerifyEmailOtp(onUserUpdated)"
              >
                <svg v-if="isVerifyingEmailOtp" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>{{ isVerifyingEmailOtp ? 'Memverifikasi...' : 'Verifikasi & Perbarui' }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- ============================================== -->
        <!-- TAB 2: FORM UBAH KATA SANDI (UC-05 & SD-05)    -->
        <!-- ============================================== -->
        <div v-else-if="profileActiveTab === 'password'" class="mt-4 space-y-4">
          <!-- Notifikasi Error & Sukses Kata Sandi -->
          <div v-if="pwdErrorMessage" class="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
            <svg class="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{{ pwdErrorMessage }}</span>
          </div>

          <div v-if="pwdSuccessMessage" class="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5">
            <svg class="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>{{ pwdSuccessMessage }}</span>
          </div>

          <form class="space-y-4" @submit.prevent="handleChangePassword(() => handleLogoutClick())">
            <!-- Password Saat Ini -->
            <div>
              <label for="pwd-current" class="block text-xs font-semibold text-slate-300 mb-1.5">
                Password Saat Ini <span class="text-rose-400">*</span>
              </label>
              <div class="relative">
                <input
                  id="pwd-current"
                  v-model="pwdCurrent"
                  :type="showPwdCurrent ? 'text' : 'password'"
                  required
                  placeholder="Masukkan password akun Anda saat ini"
                  class="w-full pl-3.5 pr-10 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
                <button
                  type="button"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                  @click="showPwdCurrent = !showPwdCurrent"
                >
                  <svg v-if="showPwdCurrent" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                  </svg>
                  <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
              </div>
            </div>

            <!-- Password Baru -->
            <div>
              <label for="pwd-new" class="block text-xs font-semibold text-slate-300 mb-1.5">
                Password Baru <span class="text-rose-400">*</span>
              </label>
              <div class="relative">
                <input
                  id="pwd-new"
                  v-model="pwdNew"
                  :type="showPwdNew ? 'text' : 'password'"
                  required
                  placeholder="Minimal 8 karakter kombinasi huruf & angka"
                  class="w-full pl-3.5 pr-10 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
                <button
                  type="button"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                  @click="showPwdNew = !showPwdNew"
                >
                  <svg v-if="showPwdNew" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                  </svg>
                  <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
              </div>
            </div>

            <!-- Konfirmasi Password Baru -->
            <div>
              <label for="pwd-confirm" class="block text-xs font-semibold text-slate-300 mb-1.5">
                Konfirmasi Password Baru <span class="text-rose-400">*</span>
              </label>
              <div class="relative">
                <input
                  id="pwd-confirm"
                  v-model="pwdConfirm"
                  :type="showPwdConfirm ? 'text' : 'password'"
                  required
                  placeholder="Ulangi password baru Anda"
                  class="w-full pl-3.5 pr-10 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
                <button
                  type="button"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                  @click="showPwdConfirm = !showPwdConfirm"
                >
                  <svg v-if="showPwdConfirm" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                  </svg>
                  <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
              </div>
            </div>

            <!-- Syarat & Ketentuan Keamanan Password (SRS UC-05) -->
            <div class="p-3 bg-slate-950/50 rounded-xl border border-slate-800/80 space-y-1.5 text-[11px]">
              <p class="font-medium text-slate-400">Ketentuan kata sandi:</p>
              <div class="grid grid-cols-2 gap-1.5">
                <div class="flex items-center gap-1.5" :class="pwdHasMinLength ? 'text-emerald-400' : 'text-slate-500'">
                  <span>{{ pwdHasMinLength ? '✓' : '•' }}</span> Minimal 8 karakter
                </div>
                <div class="flex items-center gap-1.5" :class="(pwdHasLetter && pwdHasDigit) ? 'text-emerald-400' : 'text-slate-500'">
                  <span>{{ (pwdHasLetter && pwdHasDigit) ? '✓' : '•' }}</span> Huruf & angka
                </div>
                <div class="flex items-center gap-1.5" :class="pwdIsMatched ? 'text-emerald-400' : 'text-slate-500'">
                  <span>{{ pwdIsMatched ? '✓' : '•' }}</span> Konfirmasi cocok
                </div>
                <div class="flex items-center gap-1.5" :class="pwdIsNotSame ? 'text-emerald-400' : 'text-slate-500'">
                  <span>{{ pwdIsNotSame ? '✓' : '•' }}</span> Berbeda dari sandi lama
                </div>
              </div>
              <p class="text-[10px] text-slate-500 pt-1 border-t border-slate-800/50">
                🔒 Mengubah kata sandi akan otomatis mencabut seluruh sesi login Anda di perangkat lain (SD-05).
              </p>
            </div>

            <!-- Tombol Aksi Form Ubah Sandi -->
            <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                class="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                :disabled="pwdIsLoading"
                @click="closeProfileModal"
              >
                Batal
              </button>
              <button
                type="submit"
                class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="pwdIsLoading || !isPwdFormValid"
              >
                <svg v-if="pwdIsLoading" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>{{ pwdIsLoading ? 'Memproses...' : 'Ubah Kata Sandi' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { authModel } from '../models/authModel';
import { useAudioController } from '../controllers/audioController';
import { useHistoryController } from '../controllers/historyController';
import { useProfileController, AVATAR_PRESETS } from '../controllers/useProfileController';
import type { User, TranscriptItem } from '../types';
import {
  getFileExtension,
  formatFileSize,
  formatDuration,
  formatDate,
  formatStatusLabel,
  getStatusBadgeClass,
  countWords,
  copyToClipboard,
  sanitizeAndRenderMarkdown,
} from '../utils';

// =========================================================
// PROPS & EMITS (Tugas 5)
// =========================================================
interface Props {
  currentUser?: User | null;
}

const props = withDefaults(defineProps<Props>(), {
  currentUser: null,
});

const emit = defineEmits<{
  (e: 'logout'): void;
  (e: 'navigate', view: string, tab?: string): void;
  (e: 'user-updated', user: User): void;
}>();

const userData = ref<User | null>(props.currentUser || null);

// =========================================================
// PROFILE CONTROLLER (UC-04 & SD-04, UC-05 & SD-05)
// =========================================================
const {
  isModalOpen: isProfileModalOpen,
  activeTab: profileActiveTab,
  name: profileName,
  email: profileEmail,
  originalEmail: profileOriginalEmail,
  avatarUrl: profileAvatarUrl,
  currentPassword: profileCurrentPassword,
  showPassword: profileShowPassword,
  isLoading: isSavingProfile,
  errorMessage: profileErrorMessage,
  successMessage: profileSuccessMessage,
  emailChangePending,
  newPendingEmail,
  otpCode: emailOtpCode,
  isVerifyingOtp: isVerifyingEmailOtp,
  otpErrorMessage: emailOtpErrorMessage,
  otpSuccessMessage: emailOtpSuccessMessage,
  // Password state & methods (UC-05)
  pwdCurrent,
  pwdNew,
  pwdConfirm,
  showPwdCurrent,
  showPwdNew,
  showPwdConfirm,
  pwdIsLoading,
  pwdErrorMessage,
  pwdSuccessMessage,
  pwdHasMinLength,
  pwdHasLetter,
  pwdHasDigit,
  pwdIsMatched,
  pwdIsNotSame,
  isPwdFormValid,
  handleChangePassword,
  openModal: openProfileModalController,
  closeModal: closeProfileModal,
  selectAvatar,
  handleSaveProfile,
  handleVerifyEmailOtp,
  cancelEmailChange,
} = useProfileController(emit);

function openProfileModal() {
  openProfileModalController(userData.value);
}

function onUserUpdated(updatedUser: User) {
  userData.value = updatedUser;
  emit('user-updated', updatedUser);
}

watch(
  () => props.currentUser,
  (newVal) => {
    if (newVal) {
      userData.value = newVal;
    }
  },
  { deep: true }
);

async function fetchUserProfile() {
  try {
    const res = await authModel.getProfile();
    if (res?.status === 'success' && res.data) {
      userData.value = res.data;
      authModel.setSession({ token: authModel.getStoredToken(), user: res.data });
    }
  } catch (err) {
    console.error('[Dashboard] Gagal memuat profil pengguna:', err);
  }
}

function handleLogoutClick() {
  emit('logout');
}

// =========================================================
// CONTROLLERS
// =========================================================
const {
  fileInputRef,
  selectedFile,
  isDragging,
  isLoading,
  loadingMessage,
  loadingTimer,
  transcriptId,
  rawText,
  summaryText,
  meta,
  errorMessage,
  triggerFileInput,
  handleFileChange,
  handleDrop,
  validateAndSetFile,
  clearFile,
  displayResults,
  processAudio: executeProcessAudio,
} = useAudioController();

const {
  historyList,
  totalRecords,
  currentPage,
  totalPages,
  selectedHistoryId,
  isLoadingHistory,
  historyError,
  statusFilter,
  setStatusFilter,
  fetchHistory,
  selectHistoryItem: triggerSelectHistoryItem,
} = useHistoryController();

// Markdown parser dengan sanitasi DOMPurify (Rule 4, CR-05)
const renderedSummary = computed(() => {
  return sanitizeAndRenderMarkdown(summaryText.value);
});

// Feedback status salin teks
const copiedRaw = ref(false);
const copiedSummary = ref(false);

async function copyText(text: string | null | undefined, type: 'raw' | 'summary') {
  const isSummary = type === 'summary';
  const success = await copyToClipboard(text, isSummary);

  if (success) {
    if (type === 'raw') {
      copiedRaw.value = true;
      setTimeout(() => (copiedRaw.value = false), 2000);
    } else {
      copiedSummary.value = true;
      setTimeout(() => (copiedSummary.value = false), 2000);
    }
  } else {
    alert('Gagal menyalin teks ke papan klip secara otomatis. Silakan salin teks secara manual.');
  }
}

// Handler pemilihan item dari riwayat ke panel utama
function selectHistoryItem(item: TranscriptItem, shouldScroll = true) {
  triggerSelectHistoryItem(item, shouldScroll, (selected) => {
    transcriptId.value = selected.id;
    rawText.value = selected.raw_text || '';
    summaryText.value = selected.summary_text || '';
    meta.value = {
      durationSeconds: selected.duration_seconds || 0,
      tokensUsed: selected.tokens_used || 0,
    };
  });
}

// Wrapper pemrosesan audio yang mengorkestrasi polling, riwayat, dan profil
async function processAudio() {
  await executeProcessAudio({
    onProgressUpdate: async (activeTranscriptId?: string) => {
      if (activeTranscriptId) selectedHistoryId.value = activeTranscriptId;
      await fetchHistory(1);
      await fetchUserProfile();
    },
    onCompleted: async () => {
      selectedHistoryId.value = transcriptId.value;
      await fetchHistory(1);
      await fetchUserProfile();
    },
  });
}

// =========================================================
// LIFECYCLE HOOK
// =========================================================
onMounted(async () => {
  await fetchUserProfile();
  await fetchHistory(1, (list) => {
    // Jika belum ada hasil aktif dan ada riwayat selesai, pilih otomatis yang paling atas
    if (!transcriptId.value && list.length > 0) {
      const firstCompleted = list.find((item) => item.status === 'completed') || list[0];
      if (firstCompleted && firstCompleted.status === 'completed') {
        selectHistoryItem(firstCompleted, false);
      }
    }
  });
});
</script>

<style scoped>
:deep(.summary-markdown) {
  color: #e2e8f0;
}

:deep(.summary-markdown p) {
  margin-bottom: 0.85rem;
  line-height: 1.65;
}

:deep(.summary-markdown strong),
:deep(.summary-markdown b) {
  font-weight: 700;
  color: #c7d2fe;
}

:deep(.summary-markdown h1),
:deep(.summary-markdown h2),
:deep(.summary-markdown h3),
:deep(.summary-markdown h4) {
  font-weight: 700;
  color: #ffffff;
  margin-top: 1.1rem;
  margin-bottom: 0.4rem;
  letter-spacing: -0.01em;
}

:deep(.summary-markdown h1) { font-size: 1.15rem; }
:deep(.summary-markdown h2) { font-size: 1.05rem; }
:deep(.summary-markdown h3) { font-size: 0.95rem; }

:deep(.summary-markdown ul) {
  list-style-type: disc;
  padding-left: 1.25rem;
  margin-bottom: 0.85rem;
}

:deep(.summary-markdown ol) {
  list-style-type: decimal;
  padding-left: 1.25rem;
  margin-bottom: 0.85rem;
}

:deep(.summary-markdown li) {
  margin-bottom: 0.35rem;
  line-height: 1.6;
}

:deep(.summary-markdown hr) {
  border-color: rgba(51, 65, 85, 0.6);
  margin: 1rem 0;
}

:deep(.summary-markdown blockquote) {
  border-left: 3px solid #818cf8;
  padding-left: 0.75rem;
  color: #94a3b8;
  font-style: italic;
  margin: 0.75rem 0;
}
</style>
