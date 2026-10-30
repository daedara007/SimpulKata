/**
 * controllers/useProfileController.ts - Composable Controller untuk Pengaturan Profil (UC-04 & SD-04)
 */

import { ref } from 'vue';
import userModel from '../models/userModel';
import authModel from '../models/authModel';
import type { User } from '../types';

export const AVATAR_PRESETS = [
  { id: 'bot-1', label: 'SimpulBot', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=SimpulBot' },
  { id: 'bot-2', label: 'CyberEcho', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=CyberEcho' },
  { id: 'bot-3', label: 'DataPulse', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=DataPulse' },
  { id: 'bot-4', label: 'AuraSpark', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=AuraSpark' },
  { id: 'bot-5', label: 'EchoMaster', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=EchoMaster' },
  { id: 'bot-6', label: 'TechNova', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=TechNova' },
];

export function useProfileController(emit?: (...args: any[]) => any) {
  const isModalOpen = ref<boolean>(false);
  const name = ref<string>('');
  const email = ref<string>('');
  const originalEmail = ref<string>('');
  const avatarUrl = ref<string | null>(null);
  const currentPassword = ref<string>('');
  const showPassword = ref<boolean>(false);

  const isLoading = ref<boolean>(false);
  const errorMessage = ref<string>('');
  const successMessage = ref<string>('');

  // State Verifikasi Pergantian Email
  const emailChangePending = ref<boolean>(false);
  const newPendingEmail = ref<string>('');
  const otpCode = ref<string>('');
  const isVerifyingOtp = ref<boolean>(false);
  const otpErrorMessage = ref<string>('');
  const otpSuccessMessage = ref<string>('');

  /**
   * Membuka modal profil dan mengisi form dengan data pengguna saat ini (SD-04 Langkah 1-6)
   */
  function openModal(user: User | null) {
    if (!user) return;
    name.value = user.name || '';
    email.value = user.email || '';
    originalEmail.value = user.email || '';
    avatarUrl.value = user.avatar_url || null;
    currentPassword.value = '';
    showPassword.value = false;
    errorMessage.value = '';
    successMessage.value = '';
    emailChangePending.value = false;
    newPendingEmail.value = '';
    otpCode.value = '';
    otpErrorMessage.value = '';
    otpSuccessMessage.value = '';
    isModalOpen.value = true;
  }

  /**
   * Menutup modal pengaturan profil
   */
  function closeModal() {
    isModalOpen.value = false;
    currentPassword.value = '';
    errorMessage.value = '';
    successMessage.value = '';
  }

  /**
   * Memilih avatar preset atau menghapus avatar kustom
   */
  function selectAvatar(url: string | null) {
    avatarUrl.value = url;
  }

  /**
   * Menyimpan perubahan profil (SD-04 Langkah 8-21)
   */
  async function handleSaveProfile(onUserUpdated?: (updatedUser: User) => void) {
    errorMessage.value = '';
    successMessage.value = '';

    // Validasi Sisi Klien
    if (!name.value || name.value.trim().length < 2) {
      errorMessage.value = 'Nama lengkap wajib diisi minimal 2 karakter.';
      return;
    }

    if (!currentPassword.value) {
      errorMessage.value = 'Masukkan password saat ini untuk mengonfirmasi perubahan.';
      return;
    }

    const cleanName = name.value.trim();
    const cleanEmail = email.value.trim().toLowerCase();
    const isEmailChanged = cleanEmail !== originalEmail.value.toLowerCase();

    isLoading.value = true;

    try {
      const response = await userModel.updateProfile({
        name: cleanName,
        avatarUrl: avatarUrl.value,
        email: cleanEmail,
        currentPassword: currentPassword.value,
      });

      const updatedUser = response.data?.user;
      if (updatedUser) {
        // Perbarui data user di localStorage
        authModel.setSession({
          token: authModel.getStoredToken(),
          refreshToken: authModel.getStoredRefreshToken() || undefined,
          user: updatedUser,
        });

        if (onUserUpdated) {
          onUserUpdated(updatedUser);
        }

        if (emit) {
          emit('user-updated', updatedUser);
        }
      }

      currentPassword.value = '';

      if (response.data?.emailChangePending) {
        emailChangePending.value = true;
        newPendingEmail.value = response.data.newEmail || cleanEmail;
        otpCode.value = '';
        otpErrorMessage.value = '';
        otpSuccessMessage.value = 'Kode OTP verifikasi telah dikirimkan ke email baru Anda!';
      } else {
        successMessage.value = response.message || 'Profil berhasil diperbarui!';
        setTimeout(() => {
          if (isModalOpen.value && !emailChangePending.value) {
            closeModal();
          }
        }, 1500);
      }
    } catch (err: any) {
      console.error('[useProfileController] Gagal menyimpan profil:', err);
      const backendMsg = err.response?.data?.message;
      errorMessage.value = backendMsg || err.message || 'Gagal memperbarui profil. Silakan coba lagi.';
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Memverifikasi kode OTP untuk meresmikan pergantian email
   */
  async function handleVerifyEmailOtp(onUserUpdated?: (updatedUser: User) => void) {
    otpErrorMessage.value = '';
    otpSuccessMessage.value = '';

    if (!otpCode.value || otpCode.value.trim().length !== 6) {
      otpErrorMessage.value = 'Kode OTP harus berupa 6 digit angka.';
      return;
    }

    isVerifyingOtp.value = true;

    try {
      const response = await userModel.verifyEmailChange({
        otpCode: otpCode.value.trim(),
        newEmail: newPendingEmail.value,
      });

      const updatedUser = response.data?.user;
      if (updatedUser) {
        originalEmail.value = updatedUser.email;
        email.value = updatedUser.email;

        // Perbarui data user di localStorage
        authModel.setSession({
          token: authModel.getStoredToken(),
          refreshToken: authModel.getStoredRefreshToken() || undefined,
          user: updatedUser,
        });

        if (onUserUpdated) {
          onUserUpdated(updatedUser);
        }

        if (emit) {
          emit('user-updated', updatedUser);
        }
      }

      otpSuccessMessage.value = 'Alamat email berhasil diperbarui!';
      setTimeout(() => {
        emailChangePending.value = false;
        closeModal();
      }, 1500);
    } catch (err: any) {
      console.error('[useProfileController] Gagal verifikasi OTP email:', err);
      const backendMsg = err.response?.data?.message;
      otpErrorMessage.value = backendMsg || err.message || 'Kode OTP tidak valid atau sudah kadaluarsa.';
    } finally {
      isVerifyingOtp.value = false;
    }
  }

  /**
   * Membatalkan proses pergantian email
   */
  function cancelEmailChange() {
    email.value = originalEmail.value;
    emailChangePending.value = false;
    newPendingEmail.value = '';
    otpCode.value = '';
    otpErrorMessage.value = '';
    otpSuccessMessage.value = '';
  }

  return {
    isModalOpen,
    name,
    email,
    originalEmail,
    avatarUrl,
    currentPassword,
    showPassword,
    isLoading,
    errorMessage,
    successMessage,
    emailChangePending,
    newPendingEmail,
    otpCode,
    isVerifyingOtp,
    otpErrorMessage,
    otpSuccessMessage,
    openModal,
    closeModal,
    selectAvatar,
    handleSaveProfile,
    handleVerifyEmailOtp,
    cancelEmailChange,
  };
}
