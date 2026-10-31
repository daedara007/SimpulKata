<template>
  <div>
    <!-- Bottom Call To Action Banner -->
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
          <span>{{ isAuthenticated ? 'Buka Dashboard Sekarang' : 'Daftar Akun Gratis Sekarang' }}</span>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </div>
    </section>

    <!-- Footer Bar -->
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

