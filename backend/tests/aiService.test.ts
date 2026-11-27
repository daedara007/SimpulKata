import { describe, it, expect } from 'vitest';
import { cleanWhisperTranscript, removeRepetitiveLoops } from '../src/services/aiService';

describe('White-Box: aiService.cleanWhisperTranscript & removeRepetitiveLoops', () => {
  it('WB-AI-01: mengembalikan string kosong jika input kosong', () => {
    expect(cleanWhisperTranscript('')).toBe('');
  });

  it('WB-AI-02: menghapus halusinasi outro YouTube/internet umum', () => {
    const raw = 'Pembahasan materi selesai. Terima kasih telah menonton! Jangan lupa like dan subscribe.';
    expect(cleanWhisperTranscript(raw)).toBe('Pembahasan materi selesai.');
  });

  it('WB-AI-03: memangkas pengulangan kata pendek >= 4 kali berturut-turut', () => {
    const raw = 'Jadi di di di di di dalam rapat kita sepakat.';
    expect(cleanWhisperTranscript(raw)).toBe('Jadi di dalam rapat kita sepakat.');
  });

  it('WB-AI-04: memangkas pengulangan frasa berulang >= 3 kali berturut-turut', () => {
    const raw = 'Sudah. Sudah. Sudah. Sudah. Baik kita lanjutkan.';
    expect(cleanWhisperTranscript(raw)).toBe('Sudah. Baik kita lanjutkan.');
  });

  it('WB-AI-05: mempertahankan teks normal yang memiliki pengulangan wajar (< 3 kali)', () => {
    const raw = 'Rapat evaluasi berjalan lancar dan kondusif.';
    expect(cleanWhisperTranscript(raw)).toBe(raw);
  });

  it('WB-AI-06: removeRepetitiveLoops mengembalikan teks asli jika panjang < 100 atau <= 2 paragraf', () => {
    expect(removeRepetitiveLoops('Singkat.')).toBe('Singkat.');
    const twoParas = 'Paragraf satu cukup panjang untuk melewati batas seratus karakter agar masuk pengecekan.\n\nParagraf dua berbeda.';
    expect(removeRepetitiveLoops(twoParas)).toBe(twoParas);
  });

  it('WB-AI-07: removeRepetitiveLoops memutus loop paragraf yang berulang', () => {
    const repeated = 'Poin pembahasan utama mengenai arsitektur sistem sangat penting sekali.';
    const text = `${repeated}\n\nParagraf transisi kedua yang cukup panjang.\n\n${repeated}\n\nParagraf keempat setelah loop.`;
    const result = removeRepetitiveLoops(text);
    expect(result).toContain(repeated);
    expect(result).not.toContain('Paragraf keempat setelah loop.');
  });
});
