/**
 * utils/formatters.js - Helper Format Teks, Ukuran, dan Waktu
 */

export function getFileExtension(filename) {
  if (!filename) return '';
  const lastDot = filename.lastIndexOf('.');
  return lastDot !== -1 ? filename.slice(lastDot) : '';
}

export function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

export function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return '0 dtk';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs} dtk`;
  if (secs === 0) return `${mins} mnt`;
  return `${mins}m ${secs}s`;
}

export function formatDate(isoString) {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch (_) {
    return isoString;
  }
}

export function formatStatusLabel(status) {
  switch (status) {
    case 'completed': return 'Selesai';
    case 'failed': return 'Gagal';
    case 'processing': return 'Memproses';
    default: return status || 'Pending';
  }
}

export function getStatusBadgeClass(status) {
  switch (status) {
    case 'completed':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    case 'failed':
      return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    case 'processing':
      return 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse';
    default:
      return 'bg-slate-800 text-slate-400 border-slate-700';
  }
}

export function countWords(str) {
  if (!str) return 0;
  return str.trim().split(/\s+/).filter(Boolean).length;
}
