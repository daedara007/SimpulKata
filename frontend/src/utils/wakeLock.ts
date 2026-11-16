/**
 * utils/wakeLock.ts - Screen Wake Lock & Page Exit Guard Utility
 *
 * Menjaga layar perangkat HP/Desktop tetap menyala (mencegah sleep / auto-lock)
 * selama perekaman audio atau pengunggahan berkas besar berlangsung,
 * serta mencegah pengguna tidak sengaja menutup / meninggalkan halaman tab.
 */

class WakeLockManager {
  private sentinel: any = null;
  private isRequested = false;
  private isVisibilityListenerRegistered = false;

  constructor() {
    this.initVisibilityListener();
  }

  private initVisibilityListener() {
    if (typeof document !== 'undefined' && !this.isVisibilityListenerRegistered) {
      document.addEventListener('visibilitychange', () => {
        if (this.isRequested && document.visibilityState === 'visible') {
          this.acquire();
        }
      });
      this.isVisibilityListenerRegistered = true;
    }
  }

  /**
   * Mengaktifkan Screen Wake Lock agar layar HP tidak mati otomatis
   */
  public async acquire(): Promise<boolean> {
    this.isRequested = true;
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) {
      return false;
    }

    try {
      if (!this.sentinel || this.sentinel.released) {
        this.sentinel = await (navigator as any).wakeLock.request('screen');
        this.sentinel.addEventListener('release', () => {
          this.sentinel = null;
        });
      }
      return true;
    } catch (err) {
      console.warn('[WakeLock] Tidak dapat mengaktifkan Screen Wake Lock:', err);
      return false;
    }
  }

  /**
   * Melepaskan Screen Wake Lock saat tugas selesai
   */
  public async release(): Promise<void> {
    this.isRequested = false;
    if (this.sentinel) {
      try {
        await this.sentinel.release();
      } catch (_) {
        // Abaikan error saat pelepasan
      }
      this.sentinel = null;
    }
  }

  /**
   * Status apakah Wake Lock didukung oleh peramban ini
   */
  public isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'wakeLock' in navigator;
  }
}

export const wakeLockManager = new WakeLockManager();

// ---------------------------------------------------------------------------
// Pencegah Navigasi / Penutupan Tab Tak Sengaja (beforeunload Guard)
// ---------------------------------------------------------------------------
let activeGuards = 0;

function beforeUnloadHandler(event: BeforeUnloadEvent) {
  event.preventDefault();
  event.returnValue = '';
  return '';
}

/**
 * Mengaktifkan proteksi konfirmasi sebelum pengguna menutup tab atau me-refresh halaman
 */
export function enablePageExitGuard(): void {
  if (activeGuards === 0 && typeof window !== 'undefined') {
    window.addEventListener('beforeunload', beforeUnloadHandler);
  }
  activeGuards++;
}

/**
 * Menonaktifkan proteksi konfirmasi penutupan halaman
 */
export function disablePageExitGuard(): void {
  activeGuards = Math.max(0, activeGuards - 1);
  if (activeGuards === 0 && typeof window !== 'undefined') {
    window.removeEventListener('beforeunload', beforeUnloadHandler);
  }
}
