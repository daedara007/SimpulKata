<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
    <!-- Navbar Utama Workspace -->
    <DashboardNavbar
      :user-data="currentUser"
      :history-count="totalHistoryCount"
      @open-profile="openProfileModal"
      @open-topup="openTopUpModal"
      @logout="handleLogout"
    />

    <!-- Sub-Navbar Navigasi Khusus Tablet & Layar Menengah-Kecil (< 1024px) -->
    <div class="lg:hidden border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-3 sm:px-4 py-2 sticky top-16 z-40">
      <div class="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950/80 border border-slate-800/80 shadow-inner overflow-x-auto no-scrollbar">
        <RouterLink
          to="/dashboard"
          class="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex-1 text-center cursor-pointer"
          :class="isTranscribeActive
            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/25'
            : 'text-slate-400 hover:text-white'"
        >
          <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" />
          </svg>
          <span>Transkripsi</span>
        </RouterLink>

        <RouterLink
          to="/history"
          class="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex-1 text-center cursor-pointer"
          :class="isHistoryActive
            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/25'
            : 'text-slate-400 hover:text-white'"
        >
          <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Riwayat</span>
        </RouterLink>

        <RouterLink
          to="/transactions"
          class="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex-1 text-center cursor-pointer"
          :class="isTransactionsActive
            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/25'
            : 'text-slate-400 hover:text-white'"
        >
          <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          <span>Tagihan</span>
        </RouterLink>

        <RouterLink
          v-if="currentUser?.role === 'admin'"
          to="/admin/users"
          class="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex-1 text-center cursor-pointer"
          :class="isAdminActive
            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/25'
            : 'text-amber-400/90 hover:text-amber-300'"
        >
          <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <span>Admin</span>
        </RouterLink>
      </div>
    </div>

    <!-- Main Content Area with Router View -->
    <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- Footer -->
    <footer class="border-t border-slate-900 py-6 text-center text-xs text-slate-500 mt-auto">
      <div class="flex flex-wrap items-center justify-center gap-2">
        <span>&copy; 2026 SimpulKata</span>
        <span>&bull;</span>
        <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          v0.5.0-alpha
        </span>
        <span class="hidden sm:inline">&bull;</span>
        <span class="hidden sm:inline">Platform Transkripsi & Rangkuman AI</span>
      </div>
    </footer>

    <!-- Modal Pengaturan Profil & Keamanan Kata Sandi -->
    <ProfileModal
      :is-open="isProfileModalOpen"
      :user-data="currentUser"
      @close="closeProfileModal"
      @user-updated="onUserUpdated"
      @logout="handleLogout"
    />

    <!-- Modal Top Up Kuota (SRS UC-13 & UC-14) -->
    <TopUpModal
      :is-open="isTopUpModalOpen"
      @close="closeTopUpModal"
      @success="onTopUpSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import DashboardNavbar from '../components/dashboard/DashboardNavbar.vue';
import ProfileModal from '../components/dashboard/ProfileModal.vue';
import TopUpModal from '../components/dashboard/TopUpModal.vue';
import authModel from '../models/authModel';
import useCurrentUser from '../composables/useCurrentUser';
import type { User } from '../types';

const router = useRouter();
const route = useRoute();
const { currentUser, totalHistoryCount, refreshUser, setUser } = useCurrentUser();

const isProfileModalOpen = ref<boolean>(false);
const isTopUpModalOpen = ref<boolean>(false);

const isTranscribeActive = computed(() => {
  return route.path === '/dashboard' || route.path === '/transcribe' || route.path.startsWith('/app/dashboard');
});

const isHistoryActive = computed(() => {
  return route.path === '/history' || route.path.startsWith('/app/history');
});

const isTransactionsActive = computed(() => {
  return route.path === '/transactions' || route.path.startsWith('/app/transactions') || route.path === '/orders';
});

const isAdminActive = computed(() => {
  return route.path.startsWith('/admin');
});

function openProfileModal() {
  isProfileModalOpen.value = true;
}

function closeProfileModal() {
  isProfileModalOpen.value = false;
}

function openTopUpModal() {
  isTopUpModalOpen.value = true;
}

function closeTopUpModal() {
  isTopUpModalOpen.value = false;
}

async function onTopUpSuccess(_newBalance?: number) {
  await refreshUser();
}

function onUserUpdated(updatedUser: User) {
  setUser(updatedUser);
}

function handleLogout() {
  const refreshToken = authModel.getStoredRefreshToken();
  if (refreshToken) {
    authModel.logout(refreshToken).catch(() => {});
  }
  authModel.clearSession();
  setUser(null);
  router.push('/login');
}

onMounted(async () => {
  await refreshUser();
});
</script>

