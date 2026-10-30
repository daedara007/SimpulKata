<template>
  <div class="min-h-screen bg-slate-950 font-sans antialiased text-slate-100 selection:bg-indigo-500 selection:text-white">
    <transition name="fade" mode="out-in">
      <!-- Landing Page / Homepage (SaaS Style) -->
      <Home
        v-if="currentView === 'home'"
        :key="'home'"
        :is-authenticated="Boolean(token)"
        @navigate="handleNavigate"
      />

      <!-- Workspace / Dashboard Transkripsi -->
      <Dashboard
        v-else-if="currentView === 'dashboard' && token"
        :key="'dashboard'"
        :current-user="currentUser"
        @logout="handleLogout"
        @navigate="handleNavigate"
      />

      <!-- Halaman Autentikasi (Login & Register) -->
      <Auth
        v-else
        :key="'auth'"
        :initial-tab="authInitialTab"
        @login-success="handleLoginSuccess"
        @back-to-home="handleNavigate('home')"
      />
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { authModel } from './models/authModel';
import type { User, SessionData } from './types';
import type { AuthTab } from './controllers/authController';
import Home from './components/Home.vue';
import Dashboard from './components/Dashboard.vue';
import Auth from './components/Auth.vue';

type ViewMode = 'home' | 'auth' | 'dashboard';

const token = ref<string>(authModel.getStoredToken());
const currentUser = ref<User | null>(authModel.getStoredUser());
const currentView = ref<ViewMode>('home');
const authInitialTab = ref<AuthTab>('login');

// Inisialisasi tampilan awal berdasarkan URL hash atau status login
const homeAnchors = ['#faq', '#fitur', '#cara-kerja', '#paket-kuota', '#pratinjau', '#home'];

function initViewFromHash(event?: HashChangeEvent) {
  const hash = window.location.hash.toLowerCase();
  const isInitial = !event; // dipanggil saat onMounted jika event tidak ada

  if (hash === '#dashboard') {
    if (token.value) {
      currentView.value = 'dashboard';
    } else {
      authInitialTab.value = 'login';
      currentView.value = 'auth';
      window.location.hash = '#login';
    }
  } else if (hash === '#register') {
    authInitialTab.value = 'register';
    currentView.value = 'auth';
  } else if (hash === '#login' || hash === '#auth') {
    authInitialTab.value = 'login';
    currentView.value = 'auth';
  } else if (homeAnchors.some((anchor) => hash.startsWith(anchor))) {
    // Anchor links di halaman beranda (CR-11, TC-HOME-006): tetap di home
    currentView.value = 'home';
  } else if (!hash || hash === '#') {
    // Akses root tanpa hash:
    // Jika inisialisasi awal dan sudah login -> arahkan ke dashboard (TC-HOME-005)
    // Jika tidak, tetap di landing page (home)
    if (isInitial && token.value) {
      currentView.value = 'dashboard';
    } else if (!token.value) {
      currentView.value = 'home';
    }
  } else {
    // Hash tidak dikenal: jika bukan dari dashboard, pertahankan posisi saat ini
    if (currentView.value !== 'home' && token.value) {
      currentView.value = 'dashboard';
    } else {
      currentView.value = 'home';
    }
  }
}

function handleNavigate(targetView: string, tab: string = 'login') {
  if (targetView === 'auth') {
    authInitialTab.value = (tab as AuthTab) || 'login';
    currentView.value = 'auth';
    window.location.hash = `#${tab}`;
  } else if (targetView === 'dashboard') {
    if (token.value) {
      currentView.value = 'dashboard';
      window.location.hash = '#dashboard';
    } else {
      authInitialTab.value = 'login';
      currentView.value = 'auth';
      window.location.hash = '#login';
    }
  } else {
    currentView.value = 'home';
    window.location.hash = '';
  }
}

function handleLoginSuccess({ token: newToken, user: newUser }: SessionData) {
  token.value = newToken;
  currentUser.value = newUser;
  currentView.value = 'dashboard';
  window.location.hash = '#dashboard';
}

function handleLogout() {
  const refreshToken = authModel.getStoredRefreshToken();
  if (refreshToken) {
    try {
      authModel.logout(refreshToken).catch(() => {});
    } catch (e) {
      console.warn('[Logout] Gagal memanggil endpoint logout:', e);
    }
  }
  token.value = '';
  currentUser.value = null;
  authModel.clearSession();
  currentView.value = 'home';
  window.location.hash = '';
}

// Debounce flag untuk mencegah alert ganda sesi berakhir (CR-13, TC-SES-004)
let isSessionExpiredAlertShowing = false;

function handleSessionExpired() {
  if (isSessionExpiredAlertShowing) return;
  isSessionExpiredAlertShowing = true;
  handleLogout();
  alert('Sesi Anda telah berakhir atau tidak valid. Silakan masuk kembali.');
  setTimeout(() => {
    isSessionExpiredAlertShowing = false;
  }, 2000);
}

onMounted(() => {
  initViewFromHash();
  window.addEventListener('hashchange', initViewFromHash);
  window.addEventListener('simpulkata:session-expired', handleSessionExpired);
  window.addEventListener('simpulkata:logout', handleLogout);
});

onUnmounted(() => {
  window.removeEventListener('hashchange', initViewFromHash);
  window.removeEventListener('simpulkata:session-expired', handleSessionExpired);
  window.removeEventListener('simpulkata:logout', handleLogout);
});
</script>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

html {
  scroll-behavior: smooth;
}
</style>
