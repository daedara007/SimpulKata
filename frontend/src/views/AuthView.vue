<template>
  <Auth
    :initial-tab="initialTab"
    @login-success="handleLoginSuccess"
    @back-to-home="handleBackToHome"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import Auth from '../components/Auth.vue';
import type { SessionData } from '../types';
import type { AuthTab } from '../controllers/authController';
import useCurrentUser from '../composables/useCurrentUser';

const props = withDefaults(defineProps<{
  initialTab?: AuthTab;
}>(), {
  initialTab: 'login',
});

const router = useRouter();
const route = useRoute();
const { setUser } = useCurrentUser();

const computedInitialTab = computed<AuthTab>(() => {
  if (route.path === '/register') return 'register';
  return props.initialTab || 'login';
});

function handleLoginSuccess({ user }: SessionData) {
  setUser(user);
  const redirectTarget = (route.query.redirect as string) || '/dashboard';
  router.push(redirectTarget);
}

function handleBackToHome() {
  router.push('/');
}
</script>

