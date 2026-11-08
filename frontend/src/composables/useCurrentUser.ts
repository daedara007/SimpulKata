import { ref } from 'vue';
import authModel from '../models/authModel';
import type { User } from '../types';

const currentUser = ref<User | null>(authModel.getStoredUser());
const totalHistoryCount = ref<number>(0);

export function useCurrentUser() {
  async function refreshUser(): Promise<User | null> {
    try {
      const res = await authModel.getProfile();
      if (res?.status === 'success' && res.data) {
        currentUser.value = res.data;
        authModel.setSession({ token: authModel.getStoredToken(), user: res.data });
        return res.data;
      }
    } catch (err) {
      console.warn('[useCurrentUser] Gagal merefresh profil pengguna:', err);
    }
    return currentUser.value;
  }

  function setUser(u: User | null) {
    currentUser.value = u;
    if (u) {
      authModel.setSession({ token: authModel.getStoredToken(), user: u });
    }
  }

  function setHistoryCount(count: number) {
    totalHistoryCount.value = count;
  }

  return {
    currentUser,
    totalHistoryCount,
    refreshUser,
    setUser,
    setHistoryCount,
  };
}

export default useCurrentUser;
