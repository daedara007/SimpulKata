/**
 * controllers/useProfileController.ts - Composable Controller untuk Pengaturan Profil & Kata Sandi
 */

import { ref, computed } from 'vue';
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
  const activeTab = ref<'profile' | 'password'>('profile');

  // State Form Profil
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

  // State Form Ubah Kata Sandi
  const pwdCurrent = ref<string>('');
  const pwdNew = ref<string>('');
  const pwdConfirm = ref<string>('');
  const showPwdCurrent = ref<boolean>(false);
  const showPwdNew = ref<boolean>(false);
  const showPwdConfirm = ref<boolean>(false);
  const pwdIsLoading = ref<boolean>(false);
  const pwdErrorMessage = ref<string>('');
  const pwdSuccessMessage = ref<string>('');

  // Checklist Validasi Sandi Baru
  const pwdHasMinLength = computed(() => pwdNew.value.length >= 8);
  const pwdHasLetter = computed(() => /[A-Za-z]/.test(pwdNew.value));
  const pwdHasDigit = computed(() => /\d/.test(pwdNew.value));
  const pwdIsMatched = computed(() => pwdNew.value.length > 0 && pwdNew.value === pwdConfirm.value);
  const pwdIsNotSame = computed(() => pwdNew.value.length > 0 && pwdNew.value !== pwdCurrent.value);
  const isPwdFormValid = computed(() => (
    pwdCurrent.value.trim().length > 0 &&
    pwdHasMinLength.value &&
    pwdHasLetter.value &&
    pwdHasDigit.value &&
    pwdIsMatched.value &&
    pwdIsNotSame.value
  ));

  function resetPasswordForm() {
    pwdCurrent.value = '';
    pwdNew.value = '';
    pwdConfirm.value = '';
    showPwdCurrent.value = false;
    showPwdNew.value = false;
    showPwdConfirm.value = false;
    pwdErrorMessage.value = '';
    pwdSuccessMessage.value = '';
    pwdIsLoading.value = false;
  }

  /**
   * Membuka modal profil dan mengisi form dengan data pengguna saat ini
   */
  function openModal(user: User | null, defaultTab: 'profile' | 'password' = 'profile') {
    if (!user) return;
    activeTab.value = defaultTab;
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
    resetPasswordForm();
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
    resetPasswordForm();
  }

  /**
   * Memilih avatar preset atau menghapus avatar kustom
   */
  function selectAvatar(url: string | null) {
    avatarUrl.value = url;
  }

  /**
   * Menyimpan perubahan profil
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
   * Mengubah Kata Sandi Pengguna
   */
  async function handleChangePassword(onSuccessLogout?: () => void) {
    pwdErrorMessage.value = '';
    pwdSuccessMessage.value = '';

    // Validasi Sisi Klien
    if (!pwdCurrent.value) {
      pwdErrorMessage.value = 'Password saat ini wajib diisi.';
      return;
    }

    if (!pwdNew.value || pwdNew.value.length < 8) {
      pwdErrorMessage.value = 'Password baru minimal 8 karakter.';
      return;
    }

    if (!pwdHasLetter.value || !pwdHasDigit.value) {
      pwdErrorMessage.value = 'Password baru harus mengandung kombinasi huruf dan angka.';
      return;
    }

    if (pwdNew.value !== pwdConfirm.value) {
      pwdErrorMessage.value = 'Konfirmasi password baru tidak cocok.';
      return;
    }

    if (pwdNew.value === pwdCurrent.value) {
      pwdErrorMessage.value = 'Password baru tidak boleh sama dengan password saat ini.';
      return;
    }

    pwdIsLoading.value = true;

    try {
      const response = await userModel.changePassword({
        currentPassword: pwdCurrent.value,
        newPassword: pwdNew.value,
        confirmPassword: pwdConfirm.value,
      });

      pwdSuccessMessage.value = response.message || 'Kata sandi berhasil diubah! Mengalihkan ke halaman login...';
      resetPasswordForm();

      // Sesi aktif di server telah dicabut, hapus sesi lokal & logout
      authModel.clearSession();

      setTimeout(() => {
        closeModal();
        if (onSuccessLogout) {
          onSuccessLogout();
        } else {
          window.location.hash = '#auth';
        }
      }, 1600);
    } catch (err: any) {
      console.error('[useProfileController] Gagal mengubah kata sandi:', err);
      const backendMsg = err.response?.data?.message;
      pwdErrorMessage.value = backendMsg || err.message || 'Gagal mengubah kata sandi. Silakan coba lagi.';
    } finally {
      pwdIsLoading.value = false;
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
    activeTab,
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
    // Password state & methods
    pwdCurrent,
    pwdNew,
    pwdConfirm,
    showPwdCurrent,
    showPwdNew,
    showPwdConfirm,
    pwdIsLoading,
    pwdErrorMessage,
    pwdSuccessMessage,
    pwdHasMinLength,
    pwdHasLetter,
    pwdHasDigit,
    pwdIsMatched,
    pwdIsNotSame,
    isPwdFormValid,
    resetPasswordForm,
    handleChangePassword,
    // Methods
    openModal,
    closeModal,
    selectAvatar,
    handleSaveProfile,
    handleVerifyEmailOtp,
    cancelEmailChange,
  };
}
