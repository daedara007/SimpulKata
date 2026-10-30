import apiClient from '../services/apiClient';

/**
 * models/authModel.js - Model Data & Klien API Autentikasi Pengguna
 *
 * Mengimplementasikan pemanggilan API:
 * - POST /api/auth/login
 * - POST /api/auth/register
 * - GET  /api/auth/me
 * - POST /api/auth/refresh
 * - POST /api/auth/logout
 * Serta helper persistensi sesi di localStorage (referensi/erd.puml)
 */

export const authModel = {
  /**
   * Mengirim kredensial login ke server
   * @param {Object} credentials { email, password }
   * @returns {Promise<Object>}
   */
  async login({ email, password }) {
    const response = await apiClient.post('/api/auth/login', { email, password });
    return response.data;
  },

  /**
   * Mendaftarkan akun baru
   * @param {Object} payload { name, email, password }
   * @returns {Promise<Object>}
   */
  async register({ name, email, password }) {
    const response = await apiClient.post('/api/auth/register', { name, email, password });
    return response.data;
  },

  /**
   * Memverifikasi kode OTP 6-digit (SRS UC-01 & SD-01)
   * @param {Object} payload { userId, email, otpCode }
   * @returns {Promise<Object>}
   */
  async verifyOtp({ userId, email, otpCode }) {
    const response = await apiClient.post('/api/auth/verify-otp', { userId, email, otpCode });
    return response.data;
  },

  /**
   * Mengirim ulang kode OTP baru
   * @param {Object} payload { userId, email }
   * @returns {Promise<Object>}
   */
  async resendOtp({ userId, email }) {
    const response = await apiClient.post('/api/auth/resend-otp', { userId, email });
    return response.data;
  },

  /**
   * Meminta kode OTP pemulihan kata sandi (SRS UC-03 & SD-03)
   * @param {string} email
   * @returns {Promise<Object>}
   */
  async forgotPassword(email) {
    const response = await apiClient.post('/api/auth/forgot-password', { email });
    return response.data;
  },

  /**
   * Mengirim OTP dan kata sandi baru untuk pemulihan kata sandi (SRS UC-03 & SD-03)
   * @param {Object} payload { email, otpCode, newPassword }
   * @returns {Promise<Object>}
   */
  async resetPassword({ email, otpCode, newPassword }) {
    const response = await apiClient.post('/api/auth/reset-password', { email, otpCode, newPassword });
    return response.data;
  },

  /**
   * Mengambil data profil dan saldo kuota pengguna terkini
   * @returns {Promise<Object>}
   */
  async getProfile() {
    const response = await apiClient.get('/api/auth/me');
    return response.data;
  },

  /**
   * Melakukan rotasi sesi secara manual
   * @param {string} refreshToken
   * @returns {Promise<Object>}
   */
  async refreshSession(refreshToken) {
    const response = await apiClient.post('/api/auth/refresh', { refreshToken });
    return response.data;
  },

  /**
   * Mencabut sesi aktif di server
   * @param {string} refreshToken
   * @returns {Promise<Object>}
   */
  async logout(refreshToken) {
    const response = await apiClient.post('/api/auth/logout', { refreshToken });
    return response.data;
  },

  // =========================================================
  // HELPER STORAGE SESI
  // =========================================================

  getStoredToken() {
    return localStorage.getItem('simpulkata_token') || '';
  },

  getStoredRefreshToken() {
    return localStorage.getItem('simpulkata_refresh_token') || '';
  },

  getStoredUser() {
    try {
      const user = localStorage.getItem('simpulkata_user');
      return user ? JSON.parse(user) : null;
    } catch (_) {
      return null;
    }
  },

  setSession({ token, refreshToken, user }) {
    if (token) localStorage.setItem('simpulkata_token', token);
    if (refreshToken) localStorage.setItem('simpulkata_refresh_token', refreshToken);
    if (user) localStorage.setItem('simpulkata_user', JSON.stringify(user));
  },

  clearSession() {
    localStorage.removeItem('simpulkata_token');
    localStorage.removeItem('simpulkata_refresh_token');
    localStorage.removeItem('simpulkata_user');
  },
};

export default authModel;

