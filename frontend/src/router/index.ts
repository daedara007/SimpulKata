import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { authModel } from '../models/authModel';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/HomeView.vue'),
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/AuthView.vue'),
    meta: { guestOnly: true },
    props: { initialTab: 'login' },
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('../views/AuthView.vue'),
    meta: { guestOnly: true },
    props: { initialTab: 'register' },
  },
  {
    path: '/app',
    component: () => import('../views/DashboardLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/dashboard',
      },
      {
        path: '/dashboard',
        name: 'dashboard',
        alias: '/transcribe',
        component: () => import('../views/TranscribeView.vue'),
      },
      {
        path: '/history',
        name: 'history',
        component: () => import('../views/HistoryView.vue'),
      },
      {
        path: '/transcripts/:id',
        name: 'transcript-detail',
        alias: '/history/:id',
        component: () => import('../views/TranscriptDetailView.vue'),
      },
    ],
  },
  // Backward compatibility: redirect anchor-like paths
  {
    path: '/auth',
    redirect: '/login',
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    }
    if (to.hash) {
      return { el: to.hash, behavior: 'smooth' };
    }
    return { top: 0, behavior: 'smooth' };
  },
});

// Navigation Guards: Proteksi rute privat dan tamu
router.beforeEach((to, _from, next) => {
  const token = authModel.getStoredToken();
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
  const guestOnly = to.matched.some((record) => record.meta.guestOnly);

  if (requiresAuth && !token) {
    return next({ name: 'login', query: { redirect: to.fullPath } });
  }

  if (guestOnly && token) {
    return next({ name: 'dashboard' });
  }

  next();
});

export default router;
