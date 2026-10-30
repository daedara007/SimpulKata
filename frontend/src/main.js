import { createApp } from 'vue';
import './style.css';
import App from './App.vue';
import axios from 'axios';

// Konfigurasi baseURL Axios (mendukung relative path / proxy atau custom domain via ENV)
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL || '';

// =========================================================
// AXIOS GLOBAL INTERCEPTOR (SRS UC-01 & UC-02, referensi/erd.puml)
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

// 2. Response Interceptor: Otomatis Refresh Token saat menerima 401 Unauthorized
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Abaikan jika error berasal dari login, register, atau refresh endpoint itu sendiri
    const isAuthRoute =
      originalRequest?.url?.includes('/api/auth/login') ||
      originalRequest?.url?.includes('/api/auth/register') ||
      originalRequest?.url?.includes('/api/auth/refresh');

    if (error.response?.status === 401 && !isAuthRoute) {
      const refreshToken = localStorage.getItem('simpulkata_refresh_token');

      // Jika tidak memiliki refresh token di localStorage, keluarkan sesi
      if (!refreshToken) {
        localStorage.removeItem('simpulkata_token');
        localStorage.removeItem('simpulkata_refresh_token');
        localStorage.removeItem('simpulkata_user');
        window.dispatchEvent(new Event('simpulkata:session-expired'));
        return Promise.reject(error);
      }

      // Jika request ini sudah pernah dicoba ulang setelah refresh tapi masih gagal 401
      if (originalRequest._retry) {
        localStorage.removeItem('simpulkata_token');
        localStorage.removeItem('simpulkata_refresh_token');
        localStorage.removeItem('simpulkata_user');
        window.dispatchEvent(new Event('simpulkata:session-expired'));
        return Promise.reject(error);
      }

      // Jika proses refresh token sedang berlangsung oleh request lain, antrekan request ini
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axios(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        console.log('[Axios] Access token 15m kedaluwarsa. Memperbarui sesi via /api/auth/refresh...');
        const refreshResponse = await axios.post('/api/auth/refresh', { refreshToken });

        if (refreshResponse.data?.status === 'success' && refreshResponse.data?.token) {
          const newToken = refreshResponse.data.token;
          const newRefreshToken = refreshResponse.data.refreshToken;

          localStorage.setItem('simpulkata_token', newToken);
          if (newRefreshToken) {
            localStorage.setItem('simpulkata_refresh_token', newRefreshToken);
          }

          axios.defaults.headers.common.Authorization = `Bearer ${newToken}`;
          originalRequest.headers.Authorization = `Bearer ${newToken}`;

          processQueue(null, newToken);
          return axios(originalRequest);
        } else {
          throw new Error('Gagal memperbarui sesi.');
        }
      } catch (refreshErr) {
        console.warn('[Axios] Sesi kedaluwarsa sepenuhnya. Mengarahkan ke halaman login.');
        processQueue(refreshErr, null);
        localStorage.removeItem('simpulkata_token');
        localStorage.removeItem('simpulkata_refresh_token');
        localStorage.removeItem('simpulkata_user');
        window.dispatchEvent(new Event('simpulkata:session-expired'));
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

createApp(App).mount('#app');
