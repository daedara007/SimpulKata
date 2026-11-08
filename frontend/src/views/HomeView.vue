<template>
  <Home
    :is-authenticated="Boolean(token)"
    @navigate="handleNavigate"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import Home from '../components/Home.vue';
import authModel from '../models/authModel';

const router = useRouter();
const token = computed(() => authModel.getStoredToken());

function handleNavigate(view: string, tab?: string) {
  if (view === 'auth') {
    if (tab === 'register') {
      router.push('/register');
    } else {
      router.push('/login');
    }
  } else if (view === 'dashboard') {
    router.push('/dashboard');
  } else {
    router.push('/');
  }
}
</script>
