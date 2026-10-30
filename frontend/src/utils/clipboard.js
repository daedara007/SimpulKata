/**
 * utils/clipboard.js - Helper Salin Teks ke Clipboard dengan Fallback (CR-14, TC-COPY-003)
 */

export async function copyToClipboard(text, isSummary = false) {
  if (!text) return false;

  let textToCopy = text;
  if (isSummary) {
    textToCopy = text
      .replace(/^(Berikut (ini )?adalah (hasil )?rangkuman.*?:?\s*\n+)+/i, '')
      .replace(/^(Tentu,? berikut.*?:?\s*\n+)+/i, '')
      .replace(/^(Rangkuman (dari )?transkripsi.*?:?\s*\n+)+/i, '')
      .replace(/^(Ringkasan (dari )?transkripsi.*?:?\s*\n+)+/i, '')
      .trim();
  }

  // 1. Coba Modern Clipboard API (tersedia di HTTPS / localhost)
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(textToCopy);
      return true;
    } catch (_) {
      // Fallback ke textarea jika Clipboard API gagal
    }
  }

  // 2. Fallback untuk HTTP IP-LAN atau non-secure context (CR-14, TC-COPY-003)
  try {
    const textArea = document.createElement('textarea');
    textArea.value = textToCopy;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.warn('[Clipboard] Fallback execCommand gagal:', err);
    return false;
  }
}
