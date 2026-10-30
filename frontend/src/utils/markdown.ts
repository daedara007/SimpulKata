import { marked } from 'marked';
import DOMPurify from 'dompurify';

/**
 * utils/markdown.ts - Helper Rendering Markdown dengan Sanitasi XSS DOMPurify (CR-05, Rule 4)
 */

marked.setOptions({
  breaks: true,
  gfm: true,
});

export function sanitizeAndRenderMarkdown(markdownText?: string | null): string {
  if (!markdownText) return '';

  // Bersihkan teks pembuka/pengantar percakapan yang biasa dikeluarkan LLM (Rule 4)
  const cleanText = markdownText
    .replace(/^(Berikut (ini )?adalah (hasil )?rangkuman.*?:?\s*\n+)+/i, '')
    .replace(/^(Tentu,? berikut.*?:?\s*\n+)+/i, '')
    .replace(/^(Rangkuman (dari )?transkripsi.*?:?\s*\n+)+/i, '')
    .replace(/^(Ringkasan (dari )?transkripsi.*?:?\s*\n+)+/i, '')
    .trim();

  try {
    const rawHtml = marked.parse(cleanText) as string;
    return DOMPurify.sanitize(rawHtml);
  } catch (e) {
    console.warn('[Markdown] Gagal mem-parse markdown:', e);
    return DOMPurify.sanitize(cleanText);
  }
}

