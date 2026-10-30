import axios from 'axios';

/**
 * services/apiClient.js - Klien HTTP Terpusat Axios
 *
 * Mengonfigurasi:
 * - baseURL: Menggunakan relative path / proxy Vite (Rule 1)
 * - Request Interceptor: Otomatis menyertakan Bearer Token JWT dari localStorage
 * - Response Interceptor: Otomatis memicu Refresh Token Rotation (RTR) saat menerima 401
 */

// Konfigurasi baseURL Axios (mendukung relative path / proxy atau custom domain via ENV)
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  headers: {
    'Accept': 'application/json',
  },
});

// =========================================================
// REQUEST INTERCEPTOR: Sematkan Bearer Token jika ada
// =========================================================
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('simpulkata_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// =========================================================
// RESPONSE INTERCEPTOR: Refresh Token Rotation (RTR) saat 401
// =========================================================
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

apiClient.interceptors.response.use(
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
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        console.log('[Axios] Access token 15m kedaluwarsa. Memperbarui sesi via /api/auth/refresh...');
        const refreshResponse = await apiClient.post('/api/auth/refresh', { refreshToken });

        if (refreshResponse.data?.status === 'success' && refreshResponse.data?.token) {
          const newToken = refreshResponse.data.token;
          const newRefreshToken = refreshResponse.data.refreshToken;

          localStorage.setItem('simpulkata_token', newToken);
          if (newRefreshToken) {
            localStorage.setItem('simpulkata_refresh_token', newRefreshToken);
          }

          apiClient.defaults.headers.common.Authorization = `Bearer ${newToken}`;
          originalRequest.headers.Authorization = `Bearer ${newToken}`;

          processQueue(null, newToken);
          return apiClient(originalRequest);
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

export default apiClient;

