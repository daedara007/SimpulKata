import { ref } from 'vue';
import { audioModel } from '../models/audioModel';
import type { TranscriptItem } from '../types';

/**
 * controllers/historyController.ts - Controller Riwayat Transkripsi (MVC)
 *
 * Mengelola:
 * - Pagination riwayat
 * - Filter status (all, completed, failed, processing)
 * - Pemilihan item riwayat untuk ditampilkan di panel utama
 */
export type HistoryStatusFilter = 'all' | 'completed' | 'failed';

export function useHistoryController() {
  const historyList = ref<TranscriptItem[]>([]);
  const totalRecords = ref<number>(0);
  const currentPage = ref<number>(1);
  const totalPages = ref<number>(1);
  const selectedHistoryId = ref<string>('');
  const isLoadingHistory = ref<boolean>(false);
  const historyError = ref<string>('');
  const statusFilter = ref<HistoryStatusFilter>('all');

  function setStatusFilter(filter: HistoryStatusFilter) {
    statusFilter.value = filter;
    currentPage.value = 1;
    return fetchHistory(1);
  }

  async function fetchHistory(page = 1, onAutoSelect: ((items: TranscriptItem[]) => void) | null = null) {
    isLoadingHistory.value = true;
    historyError.value = '';
    currentPage.value = page;

    try {
      const response = await audioModel.getHistory({
        page,
        limit: 20,
        status: statusFilter.value,
      });

      if (response?.status === 'success') {
        const rawData: any = response.data;
        if (Array.isArray(rawData)) {
          historyList.value = rawData;
        } else if (rawData?.items && Array.isArray(rawData.items)) {
          historyList.value = rawData.items;
        } else {
          historyList.value = [];
        }

        totalRecords.value = (response as any).totalRecords ?? rawData?.pagination?.total ?? historyList.value.length;
        currentPage.value = (response as any).page ?? rawData?.pagination?.page ?? page;
        totalPages.value = (response as any).totalPages ?? rawData?.pagination?.totalPages ?? 1;

        if (onAutoSelect && historyList.value.length > 0) {
          onAutoSelect(historyList.value);
        }
      } else {
        throw new Error((response as any)?.message || 'Gagal memuat riwayat');
      }
    } catch (err) {
      console.error('[HistoryController] Gagal mengambil riwayat transkripsi:', err);
      historyError.value = 'Gagal memuat riwayat. Coba refresh halaman.';
    } finally {
      isLoadingHistory.value = false;
    }
  }

  function selectHistoryItem(
    item: TranscriptItem | null,
    shouldScroll = true,
    onSelectCallback: ((item: TranscriptItem) => void) | null = null
  ) {
    if (!item) return;
    selectedHistoryId.value = item.id;

    if (onSelectCallback) {
      onSelectCallback(item);
    }

    if (shouldScroll) {
      setTimeout(() => {
        const el = document.getElementById('results-area');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }

  /**
   * Menghapus item riwayat transkripsi (SRS UC-12, Sequence SD-12)
   */
  async function deleteHistoryItem(id: string): Promise<boolean> {
    try {
      const response = await audioModel.deleteHistory(id);
      if (response?.status === 'success') {
        if (selectedHistoryId.value === id) {
          selectedHistoryId.value = '';
        }
        // Jika item di halaman saat ini hanya 1 dan halaman > 1, mundur ke halaman sebelumnya
        const newPage = historyList.value.length === 1 && currentPage.value > 1
          ? currentPage.value - 1
          : currentPage.value;
        await fetchHistory(newPage);
        return true;
      }
      return false;
    } catch (err: any) {
      console.error('[HistoryController] Gagal menghapus riwayat transkripsi:', err);
      throw err;
    }
  }

  return {
    historyList,
    totalRecords,
    currentPage,
    totalPages,
    selectedHistoryId,
    isLoadingHistory,
    historyError,
    statusFilter,
    setStatusFilter,
    fetchHistory,
    selectHistoryItem,
    deleteHistoryItem,
  };
}

export default useHistoryController;

