import { ref } from 'vue';
import { audioModel } from '../models/audioModel';

/**
 * controllers/historyController.js - Controller Riwayat Transkripsi (MVC)
 *
 * Mengelola:
 * - Pagination riwayat
 * - Filter status (all, completed, failed, processing)
 * - Pemilihan item riwayat untuk ditampilkan di panel utama
 */
export function useHistoryController() {
  const historyList = ref([]);
  const totalRecords = ref(0);
  const currentPage = ref(1);
  const totalPages = ref(1);
  const selectedHistoryId = ref('');
  const isLoadingHistory = ref(false);
  const historyError = ref('');
  const statusFilter = ref('all');

  function setStatusFilter(filter) {
    statusFilter.value = filter;
    currentPage.value = 1;
    return fetchHistory(1);
  }

  async function fetchHistory(page = 1, onAutoSelect = null) {
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
        historyList.value = response.data || [];
        totalRecords.value = response.totalRecords ?? historyList.value.length;
        currentPage.value = response.page ?? page;
        totalPages.value = response.totalPages ?? 1;

        if (onAutoSelect && historyList.value.length > 0) {
          onAutoSelect(historyList.value);
        }
      } else {
        throw new Error(response?.message || 'Gagal memuat riwayat');
      }
    } catch (err) {
      console.error('[HistoryController] Gagal mengambil riwayat transkripsi:', err);
      historyError.value = 'Gagal memuat riwayat. Coba refresh halaman.';
    } finally {
      isLoadingHistory.value = false;
    }
  }

  function selectHistoryItem(item, shouldScroll = true, onSelectCallback = null) {
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
  };
}

export default useHistoryController;
