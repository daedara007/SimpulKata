/**
 * aiService.ts - Layanan AI menggunakan Hugging Face Inference API
 *
 * Menggantikan modul OpenAI dengan Hugging Face:
 * - STT (Speech-to-Text): openai/whisper-large-v3 via Hugging Face
 * - LLM (Summarization): meta-llama/Llama-3.1-8B-Instruct via Hugging Face
 * - Ekstraksi durasi audio lokal: music-metadata & ffprobe fallback
 *
 * Referensi: SRS UC-07, UC-09, UC-10; SDD Bab 6
 */

import fs from 'fs';
import path from 'path';
import mm from 'music-metadata';
import { HfInference } from '@huggingface/inference';
import { execFile } from 'child_process';
import util from 'util';

const execFileAsync = util.promisify(execFile);

// Inisialisasi client Hugging Face dengan token dari environment variable
const getHfClient = (): HfInference => {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey || apiKey.startsWith('hf_sementara')) {
    console.warn('[aiService] PERINGATAN: HUGGINGFACE_API_KEY belum diisi atau masih placeholder di .env');
  }
  return new HfInference(apiKey);
};

const hf = getHfClient();

// Helper untuk sleep/delay saat retry cold-start
const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Mengonversi file audio ke format MP3 (64kbps mono 16kHz)
 * Format ini sangat hemat ukuran (10x-15x lebih kecil dari WAV), mencegah error
 * HTTP 413 Payload Too Large dari router Hugging Face, dan didukung penuh oleh Whisper fal-ai.
 */
export async function convertAudioToMp3(inputPath: string): Promise<string> {
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
  } catch (err: any) {
    if (fs.existsSync(outputPath)) {
      try {
        await fs.promises.unlink(outputPath);
      } catch (_) {}
    }
    console.error('[aiService] Gagal mengonversi audio ke .mp3 menggunakan ffmpeg:', err.message);
    const detailMsg = err.message && err.message.includes('moov atom not found')
      ? 'File audio .m4a tidak lengkap atau kosong (moov atom not found). Silakan pilih atau unggah ulang file audio.'
      : `Gagal memproses file audio: ${err.message}`;
    const customErr: any = new Error(detailMsg);
    customErr.code = 'AI_SERVICE_ERROR';
    throw customErr;
  }
}

/**
 * Mengekstrak durasi file audio secara lokal menggunakan music-metadata.
 * Dilengkapi fallback ffprobe jika header rusak atau format VBR tanpa header Xing.
 * Sangat cepat tanpa memanggil API AI eksternal.
 *
 * @param filePath Path ke file audio fisik di server
 * @returns Durasi audio dalam detik (pembulatan ke atas)
 */
export async function getAudioDuration(filePath: string): Promise<number> {
  if (!fs.existsSync(filePath)) {
    const err: any = new Error(`File audio tidak ditemukan di: ${filePath}`);
    err.code = 'FILE_NOT_FOUND';
    throw err;
  }

  try {
    const metadata = await mm.parseFile(filePath);
    if (metadata.format && metadata.format.duration && metadata.format.duration > 0) {
      return Math.ceil(metadata.format.duration);
    }
  } catch (metaErr: any) {
    console.warn('[aiService] Gagal membaca metadata durasi audio via music-metadata:', metaErr.message);
  }

  // Fallback 1: gunakan ffprobe untuk format/header rusak atau VBR tanpa Xing header (CR-02)
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
  } catch (probeErr: any) {
    console.warn('[aiService] ffprobe gagal membaca durasi format header:', probeErr.message);
  }

  // Fallback 2: gunakan ffmpeg packet scan untuk rekaman WebM/Opus (MediaRecorder) tanpa header durasi container
  try {
    const { stderr, stdout } = await execFileAsync('ffmpeg', [
      '-i', filePath,
      '-vn',
      '-c:a', 'copy',
      '-f', 'null',
      '-',
    ]).catch((err) => ({
      stderr: err.stderr || '',
      stdout: err.stdout || '',
    }));

    const output = (stderr || '') + (stdout || '');
    const matches = [...output.matchAll(/time=([0-9:.]+)/g)];
    if (matches.length > 0) {
      const timeStr = matches[matches.length - 1][1];
      const parts = timeStr.split(':').map(Number);
      let seconds = 0;
      if (parts.length === 3) {
        seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
      } else if (parts.length === 2) {
        seconds = parts[0] * 60 + parts[1];
      } else if (parts.length === 1) {
        seconds = parts[0];
      }
      if (seconds > 0) {
        console.log(`[aiService] Durasi audio rekaman WebM berhasil dideteksi via ffmpeg scan: ${seconds}s (dibulatkan: ${Math.ceil(seconds)}s)`);
        return Math.ceil(seconds);
      }
    }
  } catch (ffmpegErr: any) {
    console.warn('[aiService] ffmpeg packet scan juga gagal membaca durasi audio:', ffmpegErr.message);
  }

  return 0;
}

/**
 * Mentranskripsikan file audio fisik menjadi teks menggunakan Whisper di Hugging Face.
 */
/**
 * Mentranskripsikan satu file audio/segmen tunggal (< 25MB) via Hugging Face Whisper
 */
async function transcribeSingleAudio(
  audioFilePath: string,
  model: string,
  segmentLabel = ''
): Promise<string> {
  const audioBuffer = await fs.promises.readFile(audioFilePath);
  const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });

  let lastError: any;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`[aiService] Mengirim audio ${segmentLabel} (${(audioBlob.size / 1024).toFixed(1)} KB) ke HF Whisper (${model}) - Percobaan ${attempt}...`);
      const whisperLang = process.env.WHISPER_LANGUAGE || undefined;
      const result = await hf.automaticSpeechRecognition({
        model,
        data: audioBlob,
        parameters: {
          generate_kwargs: {
            task: 'transcribe',
            ...(whisperLang ? { language: whisperLang } : {}),
            condition_on_previous_text: false,
            compression_ratio_threshold: 2.4,
            logprob_threshold: -1.0,
            no_speech_threshold: 0.6,
            repetition_penalty: 1.2,
          },
        },
      });

      const raw = (result && typeof result.text === 'string') ? result.text.trim() : '';
      const text = cleanWhisperTranscript(raw);
      return text;
    } catch (err: any) {
      lastError = err;
      const errMsg = err.message || '';
      const is503 = err.status === 503 || errMsg.toLowerCase().includes('loading');
      const is429 = err.status === 429 || errMsg.toLowerCase().includes('rate limit');

      if ((is503 || is429) && attempt < 3) {
        const waitTime = is503 ? 15000 : 3000;
        console.warn(`[aiService] Retry ${segmentLabel} (${is503 ? 'Cold Start' : 'Rate Limit'}). Tunggu ${waitTime}ms...`);
        await sleep(waitTime);
        continue;
      }
      if (attempt < 3) {
        console.warn(`[aiService] Error pada ${segmentLabel} (${errMsg}). Mencoba lagi dalam 2 detik...`);
        await sleep(2000);
        continue;
      }
      break;
    }
  }

  throw lastError;
}

/**
 * Mentranskripsikan file audio fisik menjadi teks menggunakan Whisper di Hugging Face.
 * Didukung dengan segmentasi audio pintar (10 menit per slice) agar kebal dari batas payload HTTP 413
 * dari provider inference (fal-ai / Hugging Face router) untuk rekaman berdurasi panjang (hingga beberapa jam).
 */
export async function transcribeAudio(
  filePath: string,
  knownDuration: number | null = null
): Promise<{ text: string; duration_seconds: number }> {
  if (!fs.existsSync(filePath)) {
    const err: any = new Error(`File audio tidak ditemukan di: ${filePath}`);
    err.code = 'FILE_NOT_FOUND';
    throw err;
  }

  // Gunakan durasi yang sudah dihitung sebelumnya atau ekstrak jika belum ada
  const duration_seconds: number = knownDuration ?? (await getAudioDuration(filePath));
  const fileSize = fs.existsSync(filePath) ? fs.statSync(filePath).size : 0;
  const ext = path.extname(filePath).toLowerCase();
  const model = process.env.HF_WHISPER_MODEL || 'openai/whisper-large-v3';

  console.log(`[aiService] Memulai transkripsi: ${filePath} (Durasi: ${duration_seconds}s, Ukuran: ${(fileSize / (1024 * 1024)).toFixed(1)}MB)`);

  const SEGMENT_DURATION_SECONDS = 600; // 10 menit (maks ~4.8MB per segmen di 64kbps mono)

  // 1. JIKA AUDIO PANJANG (> 10 menit) ATAU BERKAS SANGAT BESAR (> 25MB):
  // Segmentasikan ke beberapa potongan 10 menit via ffmpeg agar kebal HTTP 413 dari provider AI
  if (duration_seconds > SEGMENT_DURATION_SECONDS || fileSize > 25 * 1024 * 1024) {
    const segmentDir = `${filePath}_segments_${Date.now()}`;
    await fs.promises.mkdir(segmentDir, { recursive: true });

    try {
      console.log(`[aiService] Audio panjang terdeteksi (${duration_seconds}s). Memotong audio ke segmen 10 menit MP3 64kbps mono...`);

      // 1 pass ffmpeg: decode input format (m4a, mp3, wav, webm, ogg) -> slice into 10-minute 64k mono mp3 files
      await execFileAsync('ffmpeg', [
        '-y',
        '-i', filePath,
        '-f', 'segment',
        '-segment_time', String(SEGMENT_DURATION_SECONDS),
        '-c:a', 'libmp3lame',
        '-b:a', '64k',
        '-ar', '16000',
        '-ac', '1',
        path.join(segmentDir, 'seg_%03d.mp3'),
      ]);

      const files = (await fs.promises.readdir(segmentDir))
        .filter((f) => f.startsWith('seg_') && f.endsWith('.mp3'))
        .sort();

      if (files.length === 0) {
        throw new Error('Gagal memotong audio menjadi segmen pemrosesan.');
      }

      console.log(`[aiService] Audio berhasil dipecah menjadi ${files.length} segmen (maks ~4.8MB per segmen).`);

      const transcribedParts: string[] = [];
      let failureCount = 0;

      for (let i = 0; i < files.length; i++) {
        const segFileName = files[i];
        const segPath = path.join(segmentDir, segFileName);
        const segLabel = `[Segmen ${i + 1}/${files.length}]`;

        try {
          const segText = await transcribeSingleAudio(segPath, model, segLabel);
          if (segText) {
            transcribedParts.push(segText);
            console.log(`[aiService] ${segLabel} selesai: "${segText.substring(0, 60)}..."`);
          } else {
            console.log(`[aiService] ${segLabel} hening / tanpa ucapan.`);
          }
        } catch (segErr: any) {
          failureCount++;
          console.warn(`[aiService] Peringatan: ${segLabel} gagal ditranskripsikan (${segErr.message}). Melanjutkan ke segmen berikutnya...`);
        } finally {
          // Hapus berkas fisik segmen segera setelah selesai diproses
          await fs.promises.unlink(segPath).catch(() => {});
        }

        // Delay singkat 600ms antar panggilan untuk menjaga kestabilan rate limit provider
        if (i < files.length - 1) {
          await sleep(600);
        }
      }

      // Jika seluruh segmen mengalami error kegagalan teknis
      if (failureCount === files.length && transcribedParts.length === 0) {
        const error: any = new Error('Seluruh segmen audio gagal ditranskripsikan oleh Hugging Face Whisper.');
        error.code = 'AI_SERVICE_ERROR';
        throw error;
      }

      const rawCombined = transcribedParts.join(' ').replace(/\s+/g, ' ').trim();
      const finalText = cleanWhisperTranscript(rawCombined);

      if (!finalText) {
        console.warn(`[aiService] Seluruh ${files.length} segmen audio tidak menghasilkan ucapan yang terdeteksi.`);
      } else {
        console.log(`[aiService] Transkripsi ${files.length} segmen selesai sukses (${finalText.length} karakter, durasi ${duration_seconds}s).`);
      }

      return { text: finalText, duration_seconds };
    } finally {
      // Pastikan direktori segmen dibersihkan secara menyeluruh
      if (fs.existsSync(segmentDir)) {
        await fs.promises.rm(segmentDir, { recursive: true, force: true }).catch(() => {});
      }
    }
  }

  // 2. JIKA AUDIO PENDEK (<= 10 menit):
  let audioToProcess = filePath;
  let convertedFile: string | null = null;

  if (ext !== '.mp3') {
    convertedFile = await convertAudioToMp3(filePath);
    audioToProcess = convertedFile;
  }

  try {
    const rawText = await transcribeSingleAudio(audioToProcess, model, '[Audio Utuh]');
    const text = cleanWhisperTranscript(rawText);
    console.log(`[aiService] Transkripsi selesai (${text.length} karakter, durasi ${duration_seconds}s)`);
    return { text, duration_seconds };
  } catch (err: any) {
    const error: any = new Error(`Gagal transkripsi audio via Hugging Face: ${err?.message || 'Unknown error'}`);
    error.code = 'AI_SERVICE_ERROR';
    error.originalError = err;
    throw error;
  } finally {
    if (convertedFile && fs.existsSync(convertedFile)) {
      await fs.promises.unlink(convertedFile).catch(() => {});
    }
  }
}

/**
 * Membersihkan loop pengulangan kata/frasa berturut-turut dan halusinasi umum dari Whisper
 * yang kerap muncul akibat jeda hening (silence/hesitation/background noise) pada rekaman perkuliahan.
 */
export function cleanWhisperTranscript(text: string): string {
  if (!text) return '';

  let cleaned = text;

  // 1. Hapus halusinasi outro internet/YouTube umum yang dipicu jeda hening di akhir segmen
  const hallucinationPatterns = [
    /terima\s+kasih\s+telah\s+menonton[!.?]?/gi,
    /sampai\s+jumpa\s+di\s+video\s+selanjutnya[!.?]?/gi,
    /jangan\s+lupa\s+(?:like|subscribe|komen|comment)[^.!?\n]*[!.?]?/gi,
    /thanks\s+for\s+watching[!.?]?/gi,
    /see\s+you\s+in\s+the\s+next\s+video[!.?]?/gi,
    /subtitles?\s+by\s+the\s+amara\.org\s+community/gi,
  ];

  for (const pattern of hallucinationPatterns) {
    cleaned = cleaned.replace(pattern, '');
  }

  // 2. Bersihkan pengulangan suku kata / kata pendek yang berulang >= 4 kali (misal: "di di di di di", "Hai Hai Hai Hai")
  cleaned = cleaned.replace(/\b([a-zA-Z\u00C0-\u017F]+)\s+(?:\1\s+){3,}/gi, '$1 ');

  // 3. Bersihkan pengulangan frasa 1 s/d 6 kata yang berulang >= 3 kali berturut-turut (misal: "Sudah. Sudah. Sudah.", "Masyarakat dari situ. Masyarakat dari situ.")
  for (let phraseLen = 6; phraseLen >= 1; phraseLen--) {
    const regex = new RegExp(
      `((?:[\\w\\u00C0-\\u017F-]+[.,!?-]?\\s+){${phraseLen - 1}}[\\w\\u00C0-\\u017F-]+[.,!?-]?)(?:\\s+\\1){2,}`,
      'gi'
    );
    cleaned = cleaned.replace(regex, '$1');
  }

  return cleaned.replace(/\s{2,}/g, ' ').trim();
}

/**
 * Membersihkan perulangan siklus (repetition loop) yang dihasilkan LLM
 * Menghentikan teks seketika saat terdeteksi paragraf atau blok yang berulang.
 */
export function removeRepetitiveLoops(text: string): string {
  if (!text || text.length < 100) return text;

  // 1. Cek di tingkat blok/paragraf
  const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  if (paragraphs.length <= 2) return text;

  const seenBlocks = new Set<string>();
  const cleanParagraphs: string[] = [];

  for (const para of paragraphs) {
    const normalized = para
      .replace(/[#*_`~-]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();

    // Jika blok memiliki panjang lebih dari 15 karakter dan sudah pernah muncul, hentikan loop
    if (normalized.length > 15 && seenBlocks.has(normalized)) {
      console.warn(`[aiService] Terdeteksi loop pengulangan pada blok teks ("${para.substring(0, 40)}..."). Memotong loop.`);
      break;
    }

    seenBlocks.add(normalized);
    cleanParagraphs.push(para);
  }

  return cleanParagraphs.join('\n\n').trim();
}

/**
 * Membersihkan kalimat pengantar basa-basi & loop pengulangan pada output rangkuman LLM
 */
function cleanSummaryOutput(rawSummary: string): string {
  const withoutIntro = rawSummary
    .replace(/^(Berikut (ini )?adalah (notula (dan )?)?(hasil )?(rangkuman|ringkasan).*?:?\s*\n+)+/i, '')
    .replace(/^(Tentu,? berikut.*?:?\s*\n+)+/i, '')
    .replace(/^(Rangkuman (dari )?transkripsi.*?:?\s*\n+)+/i, '')
    .replace(/^(Ringkasan (dari )?transkripsi.*?:?\s*\n+)+/i, '')
    .trim();

  return removeRepetitiveLoops(withoutIntro);
}

/**
 * Memanggil Hugging Face Serverless Router untuk membuat rangkuman (Primary: google/gemma-4-31B-it)
 */
async function summarizeWithHuggingFace(
  systemInstruction: string,
  textToSummarize: string,
  model: string
): Promise<{ rawSummary: string; totalTokens?: number }> {
  const prompt = `<s>[INST] ${systemInstruction}\n\n${textToSummarize} [/INST]`;
  let lastError: any;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      console.log(`[aiService] Mengirim teks ke HF LLM (${model}) - Percobaan ${attempt}...`);
      let summaryText = '';
      let totalTokens: number | undefined;

      try {
        const chatRes = await hf.chatCompletion({
          model,
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: textToSummarize },
          ],
          max_tokens: 4096,
          temperature: 0.2,
        });
        summaryText = (chatRes.choices[0]?.message?.content || '').trim();
        totalTokens = chatRes.usage?.total_tokens;
      } catch (chatErr: any) {
        console.warn('[aiService] HF chatCompletion fallback ke textGeneration:', chatErr.message);
        const genRes = await hf.textGeneration({
          model,
          inputs: prompt,
          parameters: {
            max_new_tokens: 4096,
            temperature: 0.2,
            repetition_penalty: 1.2,
            return_full_text: false,
          },
        });
        summaryText = (genRes && genRes.generated_text ? genRes.generated_text : '').trim();
      }

      if (!summaryText) {
        throw new Error(`Model Hugging Face (${model}) mengembalikan rangkuman kosong.`);
      }

      return { rawSummary: summaryText, totalTokens };
    } catch (err: any) {
      lastError = err;
      const is503 = err.status === 503 || (err.message && err.message.toLowerCase().includes('loading'));
      if (is503 && attempt === 1) {
        console.warn('[aiService] Model HF sedang loading (cold start). Menunggu 15 detik sebelum retry...');
        await sleep(15000);
        continue;
      }
      break;
    }
  }

  throw lastError;
}

/**
 * Memanggil OpenRouter API sebagai Fallback Summarizer (Default: nvidia/nemotron-3-ultra-550b-a55b:free)
 */
async function summarizeWithOpenRouter(
  systemInstruction: string,
  textToSummarize: string,
  model: string,
  apiKey: string
): Promise<{ rawSummary: string; totalTokens?: number }> {
  console.log(`[aiService] Mengirim teks ke OpenRouter Fallback LLM (${model})...`);
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.FRONTEND_URL || 'https://simpulkata.fragpoint.my.id',
      'X-Title': 'SimpulKata AI Summarizer',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: textToSummarize },
      ],
      temperature: 0.2,
      max_tokens: 8192,
      reasoning: { effort: 'low' },
    }),
    signal: AbortSignal.timeout(150000),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`OpenRouter HTTP ${response.status}: ${errText || response.statusText}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { total_tokens?: number };
  };

  const summaryText = (data.choices?.[0]?.message?.content || '').trim();
  if (!summaryText) {
    throw new Error(`OpenRouter (${model}) mengembalikan rangkuman kosong.`);
  }

  return { rawSummary: summaryText, totalTokens: data.usage?.total_tokens };
}

/**
 * Membuat rangkuman terstruktur dari teks transkripsi menggunakan LLM.
 * Primary: Hugging Face (google/gemma-4-31B-it)
 * Fallback: OpenRouter (nvidia/nemotron-3-ultra-550b-a55b:free)
 */
export async function summarizeText(
  text: string
): Promise<{ summary: string; tokens_used: number }> {
  if (!text || !text.trim()) {
    const err: any = new Error('Teks untuk rangkuman tidak boleh kosong');
    err.code = 'EMPTY_TEXT';
    throw err;
  }

  // Batasan konteks cerdas: jika teks transkripsi sangat panjang (>120.000 karakter),
  // ambil bagian utama untuk dirangkum agar tetap aman di seluruh provider LLM
  let textToSummarize = text.trim();
  if (textToSummarize.length > 120000) {
    console.log(`[aiService] Transkripsi sangat panjang (${textToSummarize.length} karakter). Memotong ke 120.000 karakter untuk rangkuman LLM.`);
    textToSummarize = textToSummarize.substring(0, 120000) + '\n\n[...Catatan: Transkripsi lengkap tersimpan, bagian akhir dipotong khusus untuk rangkuman inti...]';
  }

  const systemInstruction =
    'Anda adalah asisten AI cerdas pembuat notula dan rangkuman rapat/kuliah profesional.\n' +
    'Teks berasal dari transkripsi suara (Speech-to-Text) Bahasa Indonesia/Inggris dan mungkin mengandung kesalahan eja fonetik ' +
    "(misal 'deploat' = deploy, 'green code' = clean code, 'tersebiliti' = traceability). Tafsirkan istilah sesuai konteks pembicara tanpa mengarang.\n\n" +
    'TUGAS: Susun rangkuman terstruktur yang mendalam dan akurat HANYA berdasarkan fakta dalam transkrip:\n' +
    '### 📌 Topik Utama\n' +
    '(Jelaskan inti pembahasan secara padat dalam 1-2 paragraf)\n\n' +
    '### 💡 Poin-Poin Penting\n' +
    '(Kelompokkan pembahasan secara tematik menggunakan sub-judul bila topiknya beragam, sertakan poin kunci, perbandingan konsep, serta rincian argumen/ide yang benar-benar disebut pembicara)\n\n' +
    '### 🎯 Tindak Lanjut & Kesimpulan\n' +
    '(Simpulan akhir dan poin aksi/tenggat waktu yang disebut pembicara)\n\n' +
    'ATURAN KETAT:\n' +
    '1. DILARANG KERAS mengarang konsep, teknologi, saran pribadi AI, atau topik yang tidak dibahas di transkrip.\n' +
    '2. DILARANG KERAS mengulang kalimat, poin, atau judul secara berulang-ulang. Setelah bagian Tindak Lanjut & Kesimpulan selesai, SEGERA HENTIKAN penulisan.\n' +
    '3. Jangan sertakan kalimat basa-basi pengantar (misal: "Berikut adalah rangkuman..."), langsung mulai dari judul "### 📌 Topik Utama".';

  const hfModel = process.env.HF_SUMMARY_MODEL || 'google/gemma-4-31B-it';
  const openRouterKey = process.env.OPENROUTER_API_KEY?.trim();
  const openRouterModel = process.env.OPENROUTER_SUMMARY_MODEL || 'nvidia/nemotron-3-ultra-550b-a55b:free';

  let providerResult: { rawSummary: string; totalTokens?: number } | null = null;
  let primaryError: any = null;

  // Prioritas 1: Hugging Face LLM (Gemma 4 31B)
  try {
    providerResult = await summarizeWithHuggingFace(systemInstruction, textToSummarize, hfModel);
  } catch (hfErr: any) {
    primaryError = hfErr;
    console.warn(`[aiService] Primary HF Summarizer (${hfModel}) gagal: ${hfErr?.message || hfErr}`);
  }

  // Prioritas 2 (Fallback): OpenRouter LLM (Nemotron 3 Ultra Free)
  if (!providerResult && openRouterKey) {
    try {
      providerResult = await summarizeWithOpenRouter(systemInstruction, textToSummarize, openRouterModel, openRouterKey);
    } catch (orErr: any) {
      console.error(`[aiService] Fallback OpenRouter (${openRouterModel}) juga gagal: ${orErr?.message || orErr}`);
      const combinedError: any = new Error(
        `Gagal membuat rangkuman. Primary (${hfModel}): ${primaryError?.message || 'Error'} | Fallback (${openRouterModel}): ${orErr?.message || 'Error'}`
      );
      combinedError.code = 'AI_SERVICE_ERROR';
      combinedError.originalError = orErr;
      throw combinedError;
    }
  }

  if (!providerResult) {
    const error: any = new Error(`Gagal membuat rangkuman via Hugging Face: ${primaryError?.message || 'Unknown error'}`);
    error.code = 'AI_SERVICE_ERROR';
    error.originalError = primaryError;
    throw error;
  }

  const summaryText = cleanSummaryOutput(providerResult.rawSummary);
  // Estimasi token kasar (~4 karakter per token) jika provider tidak mengembalikan usage
  const estimatedTokens = Math.ceil((systemInstruction.length + textToSummarize.length + summaryText.length) / 4);
  const tokens_used = providerResult.totalTokens || estimatedTokens;

  console.log(`[aiService] Rangkuman selesai (${summaryText.length} karakter, tokens: ${tokens_used})`);
  return { summary: summaryText, tokens_used };
}

export default {
  getAudioDuration,
  transcribeAudio,
  summarizeText,
  convertAudioToMp3,
};

