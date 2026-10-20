import { createApp } from 'vue';
import './style.css';
import App from './App.vue';
import axios from 'axios';

// Konfigurasi baseURL Axios (mendukung relative path / proxy atau custom domain via ENV)
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL || '';

// =========================================================
// AXIOS GLOBAL INTERCEPTOR (SRS UC-01 & UC-02)
// =========================================================

// 1. Request Interceptor: Otomatis sematkan Bearer Token jika ada di localStorage
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('simpulkata_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 2. Response Interceptor: Tangani 401 Unauthorized secara terpusat
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // Abaikan jika error 401 berasal dari attempt login itu sendiri
    const isLoginRequest = error.config?.url?.includes('/api/auth/login');
    if (error.response && error.response.status === 401 && !isLoginRequest) {
      console.warn('[Axios] Sesi tidak valid / kedaluwarsa (401). Mengarahkan ke halaman login.');
      localStorage.removeItem('simpulkata_token');
      localStorage.removeItem('simpulkata_user');
      window.dispatchEvent(new Event('simpulkata:session-expired'));
    }
    return Promise.reject(error);
  }
);

createApp(App).mount('#app');
