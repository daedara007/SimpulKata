<template>
  <div class="min-h-screen bg-slate-950 font-sans antialiased text-slate-100 selection:bg-indigo-500 selection:text-white">
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import authModel from './models/authModel';
import useCurrentUser from './composables/useCurrentUser';

const router = useRouter();
const { setUser } = useCurrentUser();

let isSessionExpiredAlertShowing = false;

function handleSessionExpired() {
  if (isSessionExpiredAlertShowing) return;
  isSessionExpiredAlertShowing = true;
  authModel.clearSession();
  setUser(null);
  alert('Sesi Anda telah berakhir atau tidak valid. Silakan masuk kembali.');
  router.push('/login');
  setTimeout(() => {
    isSessionExpiredAlertShowing = false;
  }, 2000);
}

function handleGlobalLogout() {
  authModel.clearSession();
  setUser(null);
  router.push('/login');
}

onMounted(() => {
  window.addEventListener('simpulkata:session-expired', handleSessionExpired);
  window.addEventListener('simpulkata:logout', handleGlobalLogout);
});

onUnmounted(() => {
  window.removeEventListener('simpulkata:session-expired', handleSessionExpired);
  window.removeEventListener('simpulkata:logout', handleGlobalLogout);
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
