'use strict';

/**
 * aiService.js - Layanan AI menggunakan Hugging Face Inference API
 *
 * Menggantikan modul OpenAI dengan Hugging Face:
 * - STT (Speech-to-Text): openai/whisper-large-v3 via Hugging Face
 * - LLM (Summarization): mistralai/Mistral-7B-Instruct-v0.3 via Hugging Face
 * - Ekstraksi durasi audio lokal: music-metadata
 *
 * Referensi: SRS UC-07, UC-09, UC-10; SDD Bab 6
 */

const fs = require('fs');
const path = require('path');
const mm = require('music-metadata');
const { HfInference } = require('@huggingface/inference');

// Inisialisasi client Hugging Face dengan token dari environment variable
const getHfClient = () => {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey || apiKey.startsWith('hf_sementara')) {
    console.warn('[aiService] PERINGATAN: HUGGINGFACE_API_KEY belum diisi atau masih placeholder di .env');
  }
  return new HfInference(apiKey);
};

const hf = getHfClient();

// Helper untuk sleep/delay saat retry cold-start
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const { execFile } = require('child_process');
const util = require('util');
const execFileAsync = util.promisify(execFile);

/**
 * Mengonversi file audio ke format MP3 (64kbps mono 16kHz)
 * Format ini sangat hemat ukuran (10x-15x lebih kecil dari WAV), mencegah error
 * HTTP 413 Payload Too Large dari router Hugging Face, dan didukung penuh oleh Whisper fal-ai.
 */
async function convertAudioToMp3(inputPath) {
  const outputPath = `${inputPath}.converted.mp3`;
  try {
    await execFileAsync('ffmpeg', [
      '-y',
      '-i', inputPath,
      '-c:a', 'libmp3lame',
      '-b:a', '64k',
      '-ar', '16000',
      '-ac', '1',
      outputPath,
    ]);
    return outputPath;
  } catch (err) {
    if (fs.existsSync(outputPath)) {
      try {
        await fs.promises.unlink(outputPath);
      } catch (_) {}
    }
    console.error('[aiService] Gagal mengonversi audio ke .mp3 menggunakan ffmpeg:', err.message);
    const detailMsg = err.message && err.message.includes('moov atom not found')
      ? 'File audio .m4a tidak lengkap atau kosong (moov atom not found). Silakan pilih atau unggah ulang file audio.'
      : `Gagal memproses file audio: ${err.message}`;
    const customErr = new Error(detailMsg);
    customErr.code = 'AI_SERVICE_ERROR';
    throw customErr;
  }
}

/**
 * Mengekstrak durasi file audio secara lokal menggunakan music-metadata.
 * Dilengkapi fallback ffprobe jika header rusak atau format VBR tanpa header Xing.
 * Sangat cepat tanpa memanggil API AI eksternal.
 *
 * @param {string} filePath - Path ke file audio fisik di server
 * @returns {Promise<number>} - Durasi audio dalam detik (pembulatan ke atas)
 */
async function getAudioDuration(filePath) {
  if (!fs.existsSync(filePath)) {
    const err = new Error(`File audio tidak ditemukan di: ${filePath}`);
    err.code = 'FILE_NOT_FOUND';
    throw err;
  }

  try {
    const metadata = await mm.parseFile(filePath);
    if (metadata.format && metadata.format.duration && metadata.format.duration > 0) {
      return Math.ceil(metadata.format.duration);
    }
  } catch (metaErr) {
    console.warn('[aiService] Gagal membaca metadata durasi audio via music-metadata:', metaErr.message);
  }

  // Fallback: gunakan ffprobe untuk format/header rusak atau VBR tanpa Xing header (CR-02)
  try {
    const { stdout } = await execFileAsync('ffprobe', [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      filePath,
    ]);
    const parsed = parseFloat(stdout.trim());
    if (!isNaN(parsed) && parsed > 0) {
      console.log(`[aiService] Durasi audio berhasil dideteksi via ffprobe: ${parsed}s (dibulatkan: ${Math.ceil(parsed)}s)`);
      return Math.ceil(parsed);
    }
  } catch (probeErr) {
    console.warn('[aiService] ffprobe juga gagal membaca durasi audio:', probeErr.message);
  }

  return 0;
}

/**
 * Mentranskripsikan file audio fisik menjadi teks menggunakan Whisper di Hugging Face.
 *
 * @param {string} filePath - Path absolut atau relatif ke file audio fisik di server
 * @param {number|null} knownDuration - Durasi audio yang sudah diketahui sebelumnya (opsional)
 * @returns {Promise<{ text: string, duration_seconds: number }>}
 */
async function transcribeAudio(filePath, knownDuration = null) {
  if (!fs.existsSync(filePath)) {
    const err = new Error(`File audio tidak ditemukan di: ${filePath}`);
    err.code = 'FILE_NOT_FOUND';
    throw err;
  }

  // Gunakan durasi yang sudah dihitung sebelumnya atau ekstrak jika belum ada
  let duration_seconds = knownDuration;
  if (duration_seconds === null || duration_seconds === undefined) {
    duration_seconds = await getAudioDuration(filePath);
  }

  // Step 2: Konversi ke MP3 jika diperlukan (.m4a atau .wav agar ukuran kecil & tidak kena limit 413)
  let audioToProcess = filePath;
  let convertedFile = null;
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.m4a' || ext === '.wav') {
    console.log(`[aiService] Format ${ext} terdeteksi, mengonversi ke MP3 optimal untuk Whisper fal-ai...`);
    convertedFile = await convertAudioToMp3(filePath);
    audioToProcess = convertedFile;
  }

  const audioBuffer = fs.readFileSync(audioToProcess);
  const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });

  // Hapus file konversi sementara
  if (convertedFile && fs.existsSync(convertedFile)) {
    try {
      await fs.promises.unlink(convertedFile);
    } catch (_) {}
  }

  const model = process.env.HF_WHISPER_MODEL || 'openai/whisper-large-v3';

  // Step 3: Kirim ke Hugging Face Inference API dengan retry jika cold-start (503)
  let lastError;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      console.log(`[aiService] Mengirim audio ke HF Whisper (${model}) - Percobaan ${attempt}...`);
      const result = await hf.automaticSpeechRecognition({
        model,
        data: audioBlob,
      });

      if (!result || typeof result.text !== 'string') {
        const err = new Error('Hugging Face Whisper tidak mengembalikan teks transkripsi');
        err.code = 'EMPTY_TRANSCRIPT';
        throw err;
      }

      const text = result.text.trim();
      console.log(`[aiService] Transkripsi selesai (${text.length} karakter, durasi ${duration_seconds}s)`);
      return { text, duration_seconds };
    } catch (err) {
      lastError = err;
      const is503 = err.status === 503 || (err.message && err.message.toLowerCase().includes('loading'));
      if (is503 && attempt === 1) {
        console.warn('[aiService] Model Whisper sedang loading (cold start). Menunggu 15 detik sebelum retry...');
        await sleep(15000);
        continue;
      }
      break;
    }
  }

  const error = new Error(`Gagal transkripsi audio via Hugging Face: ${lastError.message}`);
  error.code = 'AI_SERVICE_ERROR';
  error.originalError = lastError;
  throw error;
}

/**
 * Membuat rangkuman terstruktur dari teks transkripsi menggunakan Mistral-7B-Instruct-v0.3.
 * Menggunakan format instruksi baku Mistral: <s>[INST] instruction\n\ntext [/INST]
 *
 * @param {string} text - Teks transkripsi mentah
 * @returns {Promise<{ summary: string, tokens_used: number }>}
 */
async function summarizeText(text) {
  if (!text || !text.trim()) {
    const err = new Error('Teks untuk rangkuman tidak boleh kosong');
    err.code = 'EMPTY_TEXT';
    throw err;
  }

  // Validasi batasan panjang konteks (Mistral limit ~32k token, aman di 50.000 karakter)
  if (text.length > 50000) {
    const err = new Error('Transkripsi terlalu panjang untuk dirangkum (maksimal 50.000 karakter)');
    err.code = 'TEXT_TOO_LONG';
    throw err;
  }

  const systemInstruction =
    'Anda adalah asisten cerdas pembuat notula dan rangkuman profesional. ' +
    'Tugas Anda: Buat rangkuman terstruktur langsung dari transkripsi rapat/kuliah berikut. ' +
    'PENTING: Jangan sertakan kalimat pembuka atau pengantar seperti "Berikut adalah rangkuman...", langsung mulai dari inti/poin utama. ' +
    'Gunakan bahasa Indonesia yang baik dan poin-poin yang jelas.';

  const prompt = `<s>[INST] ${systemInstruction}\n\n${text.trim()} [/INST]`;
  const model = process.env.HF_SUMMARY_MODEL || 'meta-llama/Llama-3.1-8B-Instruct';

  let lastError;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      console.log(`[aiService] Mengirim teks ke HF LLM (${model}) - Percobaan ${attempt}...`);
      let summaryText = '';

      // Prioritas 1: Gunakan chatCompletion (standar conversational HF router)
      try {
        const chatRes = await hf.chatCompletion({
          model,
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: text.trim() },
          ],
          max_tokens: 1024,
          temperature: 0.4,
        });
        summaryText = (chatRes.choices[0]?.message?.content || '').trim();
      } catch (chatErr) {
        console.warn('[aiService] chatCompletion fallback ke textGeneration dengan format [INST]:', chatErr.message);
        // Prioritas 2: Fallback ke textGeneration dengan format prompt [INST]
        const genRes = await hf.textGeneration({
          model,
          inputs: prompt,
          parameters: {
            max_new_tokens: 1024,
            temperature: 0.4,
            repetition_penalty: 1.1,
            return_full_text: false,
          },
        });
        summaryText = (genRes && genRes.generated_text ? genRes.generated_text : '').trim();
      }

      // Bersihkan kalimat pengantar jika masih dihasilkan model
      summaryText = summaryText
        .replace(/^(Berikut (ini )?adalah (hasil )?rangkuman.*?:?\s*\n+)+/i, '')
        .replace(/^(Tentu,? berikut.*?:?\s*\n+)+/i, '')
        .replace(/^(Rangkuman (dari )?transkripsi.*?:?\s*\n+)+/i, '')
        .trim();

      // Estimasi token kasar: ~4 karakter per token
      const tokens_used = Math.ceil((prompt.length + summaryText.length) / 4);

      console.log(`[aiService] Rangkuman selesai (${summaryText.length} karakter, est. tokens: ${tokens_used})`);
      return { summary: summaryText, tokens_used };
    } catch (err) {
      lastError = err;
      const is503 = err.status === 503 || (err.message && err.message.toLowerCase().includes('loading'));
      if (is503 && attempt === 1) {
        console.warn('[aiService] Model Mistral sedang loading (cold start). Menunggu 15 detik sebelum retry...');
        await sleep(15000);
        continue;
      }
      break;
    }
  }

  const error = new Error(`Gagal membuat rangkuman via Hugging Face: ${lastError.message}`);
  error.code = 'AI_SERVICE_ERROR';
  error.originalError = lastError;
  throw error;
}

module.exports = {
  getAudioDuration,
  transcribeAudio,
  summarizeText,
};
