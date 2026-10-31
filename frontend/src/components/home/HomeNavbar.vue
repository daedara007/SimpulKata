<template>
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
</template>

<script setup lang="ts">
defineProps<{
  isAuthenticated: boolean;
}>();

defineEmits<{
  (e: 'navigate', view: string, tab?: string): void;
}>();
</script>

