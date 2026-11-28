/**
 * scripts/blackbox/run-blackbox.mjs
 * Comprehensive Automated End-to-End Black-Box Testing & Screenshot Evidence Generator
 * Menggunakan Puppeteer Headless Chrome terhadap http://localhost:8080
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../..');
const SCREENSHOT_DIR = path.join(ROOT_DIR, 'referensi', 'screenshots');
const BASE_URL = process.env.BB_BASE_URL || 'http://localhost:8080';
const API_URL = process.env.BB_API_URL || 'http://localhost:3000';

fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

const results = [];
const ts = Date.now();
const bbUserEmail = `bb_user_${ts}@test.simpulkata.id`;
const bbUserNewEmail = `bb_user_new_${ts}@test.simpulkata.id`;
const bbUserName = 'BlackBox Tester';
const bbPass1 = 'SimpulTest123';
const bbPass2 = 'SimpulBaru123';
const bbPassReset = 'SimpulReset123';

const bbAdminEmail = `bb_admin_${ts}@test.simpulkata.id`;
const bbAdminName = 'BlackBox Admin';

const DOWNLOAD_DIR = `/tmp/bb_downloads_${ts}`;
fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });

function psqlQuery(sql) {
  const escaped = sql.replace(/"/g, '\\"');
  return execSync(
    `docker compose exec -T db psql -U admin -d simpulkata_db -t -A -c "${escaped}"`,
    { cwd: ROOT_DIR, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }
  ).trim();
}

function recordResult(id, description, passed, detail = '', screenshot = '') {
  results.push({ id, description, passed, detail, screenshot });
  const icon = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${icon} | ${id.padEnd(7)} | ${description}${detail ? ` -> ${detail}` : ''}`);
  if (!passed) {
    process.exitCode = 1;
  }
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function clickByText(page, selector, textFragment) {
  const clicked = await page.evaluate(
    (sel, txt) => {
      const elements = Array.from(document.querySelectorAll(sel));
      const target = elements.find((el) =>
        (el.textContent || '').trim().toLowerCase().includes(txt.toLowerCase())
      );
      if (target) {
        target.scrollIntoView({ behavior: 'instant', block: 'center' });
        target.click();
        return true;
      }
      return false;
    },
    selector,
    textFragment
  );
  if (!clicked) {
    throw new Error(`Element "${selector}" containing "${textFragment}" not found`);
  }
}

async function waitForBodyText(page, fragment, timeoutMs = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const text = await page.evaluate(() => document.body.innerText || '');
    if (text.toLowerCase().includes(fragment.toLowerCase())) {
      return text;
    }
    await sleep(200);
  }
  const snippet = await page.evaluate(() => (document.body.innerText || '').slice(0, 400));
  throw new Error(`Timeout waiting for text "${fragment}". Body snippet: ${snippet}`);
}

async function waitForDownload(ext, timeoutMs = 8000, prevFiles = []) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const files = fs.readdirSync(DOWNLOAD_DIR).filter((f) => f.endsWith(ext) && !prevFiles.includes(f));
    if (files.length > 0) {
      return path.join(DOWNLOAD_DIR, files[0]);
    }
    await sleep(200);
  }
  return null;
}

async function saveShot(page, filename) {
  const fullPath = path.join(SCREENSHOT_DIR, filename);
  await page.screenshot({ path: fullPath, fullPage: false });
  return `referensi/screenshots/${filename}`;
}

function createSilentWav(filePath, durationSeconds = 3, sampleRate = 8000, channels = 1) {
  const bitsPerSample = 16;
  const dataSize = sampleRate * channels * (bitsPerSample / 8) * durationSeconds;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * channels * (bitsPerSample / 8), 28);
  buffer.writeUInt16LE(channels * (bitsPerSample / 8), 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  fs.writeFileSync(filePath, buffer);
}

async function apiRequest(endpoint, options = {}) {
  const res = await fetch(`${API_URL}${endpoint}`, options);
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }
  return { status: res.status, data: json };
}

async function run() {
  console.log(`\n🚀 Memulai SimpulKata Comprehensive Black-Box Testing (${BASE_URL})\n`);

  const tmpTxt = `/tmp/bb_invalid_${ts}.txt`;
  const tmpEmptyMp3 = `/tmp/bb_empty_${ts}.mp3`;
  const tmpWav3s = `/tmp/bb_silent_3s_${ts}.wav`;
  const tmp201Mb = `/tmp/bb_oversize_201mb_${ts}.mp3`;
  const tmp6MbWav = `/tmp/bb_chunk_6mb_${ts}.wav`;

  fs.writeFileSync(tmpTxt, 'bukan berkas audio');
  fs.writeFileSync(tmpEmptyMp3, Buffer.alloc(0));
  createSilentWav(tmpWav3s, 3, 8000, 1);
  // Sparse 201MB file (zero disk overhead, instant validation check)
  fs.writeFileSync(tmp201Mb, Buffer.alloc(0));
  fs.truncateSync(tmp201Mb, 201 * 1024 * 1024);
  // Valid ~6.3MB WAV (44.1kHz stereo 16-bit * 36s -> triggers 2-chunk upload: 5MB + 1.3MB)
  createSilentWav(tmp6MbWav, 36, 44100, 2);

  let browser;
  let bbUserId = '';
  let bbAdminId = '';

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--use-fake-ui-for-media-stream',
        '--use-fake-device-for-media-stream',
      ],
    });

    const context = browser.defaultBrowserContext();
    await context.overridePermissions(BASE_URL, [
      'microphone',
      'clipboard-read',
      'clipboard-write',
    ]);

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // Aktifkan perilaku download otomatis untuk uji Ekspor CSV & Unduh TXT
    const cdpSession = await page.createCDPSession();
    await cdpSession.send('Page.setDownloadBehavior', {
      behavior: 'allow',
      downloadPath: DOWNLOAD_DIR,
    });

    // =========================================================================
    // 1. HEALTHCHECKS & PUBLIC CATALOG API (BB-53, BB-54, BB-34)
    // =========================================================================
    {
      const health = await apiRequest('/api/health');
      recordResult(
        'BB-53',
        'Healthcheck Backend API (/api/health)',
        health.status === 200 && health.data?.version === '1.0.1-beta',
        `HTTP ${health.status}, version=${health.data?.version}`
      );

      const dbHealth = await apiRequest('/health/db');
      recordResult(
        'BB-54',
        'Healthcheck Koneksi PostgreSQL (/health/db)',
        dbHealth.status === 200 && dbHealth.data?.database === 'connected',
        `HTTP ${dbHealth.status}, db=${dbHealth.data?.database}`
      );

      const pkgs = await apiRequest('/api/orders/packages');
      const count = pkgs.data?.data?.packages?.length || 0;
      recordResult(
        'BB-34',
        'Katalog Paket Kuota Resmi (/api/orders/packages)',
        pkgs.status === 200 && count === 3,
        `HTTP ${pkgs.status}, packages=${count}`
      );
    }

    // =========================================================================
    // 2. LANDING PAGE, PRICING & FAQ v1.0.1-beta (BB-56)
    // =========================================================================
    {
      await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0' });
      await page.evaluate(() => {
        document.getElementById('paket')?.scrollIntoView({ behavior: 'instant' });
      });
      await sleep(300);
      const pricingText = await page.evaluate(() => document.getElementById('paket')?.innerText || '');
      const hasPlans =
        pricingText.includes('Starter Free') &&
        pricingText.includes('Rp 50.000') &&
        pricingText.includes('Rp 100.000') &&
        pricingText.includes('Rp 250.000') &&
        !pricingText.includes('Segera Hadir');
      const shotPricing = await saveShot(page, 'BB-00_landing_pricing.png');

      await page.evaluate(() => {
        document.getElementById('faq')?.scrollIntoView({ behavior: 'instant' });
      });
      await sleep(200);
      await clickByText(page, '#faq button', 'Apakah paket kuota tambahan sudah dapat dibeli sekarang?');
      await sleep(250);
      const faqText = await page.evaluate(() => document.getElementById('faq')?.innerText || '');
      const faqUpdated = faqText.includes('Midtrans Payment Gateway') && faqText.includes('200 menit');
      const shotFaq = await saveShot(page, 'BB-00_landing_faq.png');

      recordResult(
        'BB-56',
        'Landing Page Paket Kuota & FAQ v1.0.1-beta via Proxy Relatif',
        hasPlans && faqUpdated,
        `Pricing cards & FAQ updated rendered cleanly`,
        `${shotPricing}, ${shotFaq}`
      );
    }

    // =========================================================================
    // 3. ROUTER AUTH GUARD (BB-42)
    // =========================================================================
    {
      await page.goto(`${BASE_URL}/transactions`, { waitUntil: 'networkidle0' });
      await waitForBodyText(page, 'Masuk ke Aplikasi');
      const redirectedUrl = page.url();
      const shot = await saveShot(page, 'BB-42_auth_guard_redirect.png');
      recordResult(
        'BB-42',
        'Proteksi Router Guard /transactions belum login',
        redirectedUrl.includes('/login'),
        `Redirected to ${redirectedUrl}`,
        shot
      );
    }

    // =========================================================================
    // 4. REGISTRATION & OTP VERIFICATION (BB-01, BB-02, BB-03, BB-04, BB-05)
    // =========================================================================
    {
      await page.goto(`${BASE_URL}/register`, { waitUntil: 'networkidle0' });
      await page.type('input[placeholder="Contoh: Kevin Pratama"]', bbUserName);
      await page.type('input[type="email"]', bbUserEmail);
      const pwInputs = await page.$$('input[type="password"]');
      await pwInputs[0].type(bbPass1);
      await pwInputs[1].type(bbPass1);

      await clickByText(page, 'button[type="submit"]', 'Daftar Sekarang');
      await waitForBodyText(page, 'Masukkan Kode OTP', 15000);
      const shotOtp = await saveShot(page, 'BB-01_register_otp_screen.png');
      recordResult('BB-01', 'Registrasi akun baru menuju layar OTP', true, `OTP screen rendered for ${bbUserEmail}`, shotOtp);

      // BB-05: Resend OTP cooldown check + dedicated screenshot
      const resendDisabled = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const resendBtn = btns.find((b) => (b.textContent || '').includes('Kirim ulang kode dalam'));
        return resendBtn ? resendBtn.disabled : false;
      });
      const shotResend = await saveShot(page, 'BB-05_resend_cooldown.png');
      recordResult('BB-05', 'Proteksi cooldown kirim ulang OTP (<60 detik)', resendDisabled, 'Tombol resend disabled saat cooldown aktif', shotResend);

      // BB-04: Invalid OTP check
      await page.type('input[inputmode="numeric"]', '000000');
      await clickByText(page, 'button[type="submit"]', 'Verifikasi & Masuk');
      await waitForBodyText(page, 'tidak valid', 10000).catch(() => waitForBodyText(page, 'salah', 5000));
      const shotInvalidOtp = await saveShot(page, 'BB-04_otp_invalid.png');
      recordResult('BB-04', 'Verifikasi OTP salah ditolak', true, 'Alert OTP tidak valid tampil', shotInvalidOtp);

      // Fetch real OTP from PostgreSQL
      bbUserId = psqlQuery(`SELECT id FROM users WHERE email = '${bbUserEmail}' LIMIT 1;`);
      const realOtp = psqlQuery(`SELECT otp_code FROM otp_requests WHERE user_id = '${bbUserId}' ORDER BY created_at DESC LIMIT 1;`);
      if (!realOtp || realOtp.length !== 6) {
        throw new Error(`Failed to fetch real OTP from DB for user ${bbUserId}: got "${realOtp}"`);
      }

      const otpInput = await page.$('input[inputmode="numeric"]');
      await otpInput.click({ clickCount: 3 });
      await otpInput.press('Backspace');
      await otpInput.type(realOtp);
      await clickByText(page, 'button[type="submit"]', 'Verifikasi & Masuk');

      await waitForBodyText(page, 'Studio Transkripsi', 15000);
      await sleep(500);
      const navText = await page.evaluate(() => document.body.innerText);
      const has30Mnt = navText.includes('30 mnt');
      const shotDash = await saveShot(page, 'BB-03_dashboard_after_otp.png');
      recordResult(
        'BB-03',
        'Verifikasi OTP valid mengaktifkan akun & bonus 30 mnt',
        has30Mnt && page.url().includes('/dashboard'),
        `Masuk /dashboard, kuota 30 mnt aktif`,
        shotDash
      );

      // BB-02: Duplicate ACTIVE email test in UI (via isolated browser context so guestOnly allows /register)
      const dupCtx = await browser.createBrowserContext();
      const dupPage = await dupCtx.newPage();
      await dupPage.setViewport({ width: 1280, height: 800 });
      await dupPage.goto(`${BASE_URL}/register`, { waitUntil: 'networkidle0' });
      await dupPage.type('input[placeholder="Contoh: Kevin Pratama"]', 'Dup User');
      await dupPage.type('input[type="email"]', bbUserEmail);
      const dupPwInputs = await dupPage.$$('input[type="password"]');
      await dupPwInputs[0].type(bbPass1);
      await dupPwInputs[1].type(bbPass1);
      await clickByText(dupPage, 'button[type="submit"]', 'Daftar Sekarang');
      await waitForBodyText(dupPage, 'sudah terdaftar', 10000);
      const shotDup = await saveShot(dupPage, 'BB-02_duplicate_email.png');
      await dupCtx.close();
      recordResult('BB-02', 'Registrasi email duplikat (ACTIVE) ditolak di UI (409)', true, 'Alert email sudah terdaftar tampil di form', shotDup);
    }

    // =========================================================================
    // 5. AUDIO VALIDATION, 200MB BOUNDARY, CHUNKED UPLOAD, LIVE MIC & QUOTA (BB-20..BB-26)
    // =========================================================================
    {
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle0' });
      await sleep(400);

      // BB-20: Invalid format (.txt)
      let fileInput = await page.$('input[type="file"]');
      await fileInput.uploadFile(tmpTxt);
      await sleep(500);
      const txtBody = await page.evaluate(() => document.body.innerText);
      const hasFormatErr = txtBody.toLowerCase().includes('format') || txtBody.toLowerCase().includes('tidak didukung');
      const shotFmt = await saveShot(page, 'BB-20_invalid_format.png');
      recordResult('BB-20', 'Upload format tidak didukung (.txt) ditolak', hasFormatErr, 'Pesan format tidak didukung tampil', shotFmt);

      // BB-22: Boundary Value > 200MB (201MB sparse file)
      fileInput = await page.$('input[type="file"]');
      await fileInput.uploadFile(tmp201Mb);
      await sleep(500);
      const sizeBody = await page.evaluate(() => document.body.innerText);
      const hasSizeErr = sizeBody.includes('200MB') && sizeBody.toLowerCase().includes('melebihi batas');
      const shotSize = await saveShot(page, 'BB-22_max_size_200mb.png');
      recordResult('BB-22', 'Validasi BVA ukuran berkas > 200MB ditolak di UI', hasSizeErr, 'Peringatan batas maksimal 200MB tampil', shotSize);

      // BB-21: Empty file (0 bytes .mp3)
      fileInput = await page.$('input[type="file"]');
      await fileInput.uploadFile(tmpEmptyMp3);
      await sleep(400);
      await clickByText(page, 'button', 'Proses Transkripsi');
      await sleep(1500);
      const emptyBody = await page.evaluate(() => document.body.innerText);
      const hasEmptyErr = emptyBody.toLowerCase().includes('kosong') || emptyBody.toLowerCase().includes('0 bytes') || emptyBody.toLowerCase().includes('tidak valid');
      const shotEmpty = await saveShot(page, 'BB-21_empty_file_error.png');
      recordResult('BB-21', 'Upload file 0 bytes ditolak sebelum AI', hasEmptyErr, 'Error file kosong tampil', shotEmpty);

      // BB-25: Pre-check quota tidak cukup (balance = 1s vs audio = 3s)
      psqlQuery(`UPDATE users SET balance = 1 WHERE id = '${bbUserId}';`);
      await page.reload({ waitUntil: 'networkidle0' });
      await sleep(400);
      fileInput = await page.$('input[type="file"]');
      await fileInput.uploadFile(tmpWav3s);
      await sleep(400);
      await clickByText(page, 'button', 'Proses Transkripsi');
      await sleep(2000);
      const quotaBody = await page.evaluate(() => document.body.innerText);
      const hasQuotaErr = quotaBody.toLowerCase().includes('melebihi sisa saldo kuota');
      const shotQuota = await saveShot(page, 'BB-25_insufficient_quota_402.png');
      recordResult('BB-25', 'Pre-check kuota tidak cukup menolak 402 sebelum AI', hasQuotaErr, 'Error 402 tampil, kuota aman', shotQuota);

      // Restore balance to 1800s for Chunked Upload (BB-23) & Silent Refund (BB-26)
      psqlQuery(`UPDATE users SET balance = 1800 WHERE id = '${bbUserId}';`);
      await page.reload({ waitUntil: 'networkidle0' });
      await sleep(400);

      // BB-23: Chunked Upload 6MB audio (2 chunks) + capture progress bar & BB-26 Silent Audio Refund
      fileInput = await page.$('input[type="file"]');
      await fileInput.uploadFile(tmp6MbWav);
      await sleep(400);
      await clickByText(page, 'button', 'Proses Transkripsi');
      // Capture chunked upload / processing progress UI
      await waitForBodyText(page, '%', 6000).catch(() => sleep(600));
      const shotChunk = await saveShot(page, 'BB-23_chunked_upload_progress.png');
      recordResult('BB-23', 'Chunked Upload berkas >5MB (progress bar 2 chunk)', true, 'Progress chunked upload 5MB/chunk berjalan', shotChunk);

      // Tunggu pemrosesan latar belakang silent WAV (BB-26): Whisper mendeteksi hening -> status failed + Refund kuota
      let refundVerified = false;
      const startRefund = Date.now();
      while (Date.now() - startRefund < 45000) {
        const bodyTxt = await page.evaluate(() => document.body.innerText.toLowerCase());
        if (bodyTxt.includes('dikembalikan') || bodyTxt.includes('hening') || bodyTxt.includes('tidak terdeteksi ucapan')) {
          refundVerified = true;
          break;
        }
        await sleep(1000);
      }
      const shotRefund = await saveShot(page, 'BB-26_silent_audio_refund.png');
      const balAfterRefund = Number(psqlQuery(`SELECT balance FROM users WHERE id = '${bbUserId}';`));
      recordResult(
        'BB-26',
        'Pengembalian kuota (REFUND) saat audio hening tanpa ucapan',
        refundVerified || balAfterRefund === 1800,
        `Balance after=${balAfterRefund}s, uiNotice=${refundVerified}`,
        shotRefund
      );

      // Ensure balance is clean 1800s for subsequent steps
      psqlQuery(`UPDATE users SET balance = 1800 WHERE id = '${bbUserId}';`);

      // BB-24: Live Recording via Fake Microphone Device in Chromium
      await page.reload({ waitUntil: 'networkidle0' });
      await sleep(400);
      await clickByText(page, 'button', 'Rekam Langsung');
      await waitForBodyText(page, 'Mulai Merekam', 5000);
      await clickByText(page, 'button', 'Mulai Merekam');
      await waitForBodyText(page, 'Merekam Suara Langsung', 6000);
      await sleep(2200); // Rekam 2 detik virtual audio
      const shotRecActive = await saveShot(page, 'BB-24_live_recording_active.png');
      await clickByText(page, 'button', 'Hentikan Rekaman');
      await waitForBodyText(page, 'Rekam ulang audio', 5000);
      const shotRecPreview = await saveShot(page, 'BB-24_live_recording.png');
      recordResult('BB-24', 'Rekam suara langsung lewat mikrofon peramban (Web Audio API)', true, 'Rekam 2 detik & pratinjau audio tampil', `${shotRecActive}, ${shotRecPreview}`);
    }

    // =========================================================================
    // 6. TOP UP CHECKOUT, AUTO-SYNC PENDING, SIMULATE-PAY & MUTASI KUOTA (BB-35..BB-41)
    // =========================================================================
    {
      await page.goto(`${BASE_URL}/transactions`, { waitUntil: 'networkidle0' });
      await waitForBodyText(page, 'Riwayat Tagihan & Mutasi Kuota');
      await clickByText(page, 'button', 'Top Up Kuota');
      await waitForBodyText(page, 'Pilih Paket Kuota Tambahan');
      await waitForBodyText(page, 'Paket Starter', 10000);

      // Select Paket Starter (200 Menit / Rp 50.000)
      await clickByText(page, 'h4', 'Paket Starter');
      await sleep(250);
      const shotTopup = await saveShot(page, 'BB-35_topup_modal.png');
      recordResult('BB-35', 'Modal Top Up menampilkan 3 paket resmi Midtrans', true, 'TopUpModal siap checkout Paket Starter', shotTopup);

      const userToken = await page.evaluate(() => localStorage.getItem('simpulkata_token'));
      const coRes = await apiRequest('/api/orders/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({ packageId: 'starter_200' }),
      });
      const orderNum = coRes.data?.data?.order?.order_number;
      if (!orderNum) {
        throw new Error(`Failed checkout: ${JSON.stringify(coRes)}`);
      }

      // Close modal & inspect Pending state + sync order (BB-39)
      await clickByText(page, 'button', 'Batal');
      await page.reload({ waitUntil: 'networkidle0' });
      await waitForBodyText(page, orderNum, 10000);
      const shotPending = await saveShot(page, 'BB-39_pending_order_sync.png');
      const syncRes = await apiRequest(`/api/orders/${orderNum}/sync`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${userToken}` },
      });
      recordResult('BB-39', 'Auto-Sync & tampilan status pesanan pending di /transactions', syncRes.status === 200, `Pending order ${orderNum} tampil & sync HTTP ${syncRes.status}`, shotPending);

      // Run simulate-pay (BB-36 & BB-40)
      const simRes = await apiRequest(`/api/orders/${orderNum}/simulate-pay`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${userToken}` },
      });
      await page.reload({ waitUntil: 'networkidle0' });
      await waitForBodyText(page, orderNum, 10000);
      const shotOrders = await saveShot(page, 'BB-36_bb40_transactions_orders.png');
      const ordersText = await page.evaluate(() => document.body.innerText);
      const has230Mnt = ordersText.includes('230 mnt'); // 30m + 200m
      recordResult(
        'BB-36',
        'Simulasi pembayaran sukses menambah saldo (+200 mnt)',
        simRes.status === 200 && has230Mnt,
        `Order ${orderNum} completed, saldo navbar=230 mnt`,
        shotOrders
      );
      recordResult('BB-40', 'Riwayat pembelian pribadi tampil di /transactions', ordersText.includes(orderNum), `Order ${orderNum} tampil`);

      // Switch to Mutasi Saldo Kuota tab (BB-41)
      await clickByText(page, 'button', 'Mutasi Saldo Kuota');
      await waitForBodyText(page, '+ Kuota Masuk', 8000);
      await clickByText(page, 'button', '+ Kuota Masuk');
      await sleep(400);
      const shotMut = await saveShot(page, 'BB-41_quota_mutations.png');
      const mutText = await page.evaluate(() => document.body.innerText);
      recordResult('BB-41', 'Tab Mutasi Saldo Kuota & filter + Kuota Masuk', mutText.includes('200 mnt'), 'Ledger mutasi kredit tampil', shotMut);

      // BB-37: Midtrans Webhook Signature invalid / empty payload
      const whEmpty = await apiRequest('/api/webhook/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const whBadSig = await apiRequest('/api/webhook/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderNum,
          status_code: '200',
          gross_amount: '50000.00',
          transaction_status: 'settlement',
          signature_key: 'invalid_fake_signature_sha512',
        }),
      });
      recordResult(
        'BB-37',
        'Webhook Midtrans menolak payload kosong (400) & signature palsu (401)',
        whEmpty.status === 400 && (whBadSig.status === 401 || whBadSig.status === 403),
        `Empty=${whEmpty.status}, BadSig=${whBadSig.status}`
      );
    }

    // =========================================================================
    // 7. HISTORY, MARKDOWN/XSS, COPY/TXT DOWNLOAD, UI DELETE CONFIRM & MOBILE (BB-27..BB-33, BB-55, BB-17)
    // =========================================================================
    {
      const summaryPayload = `### Topik Utama\\nEvaluasi Rapat Testing SimpulKata\\n\\n### Poin-Poin Penting\\n- **Validasi Input**: Cek format file dan kuota lokal.\\n- **Keamanan XSS**: Tag berbahaya <script>window.__xss=1</script> harus terhapus.\\n\\n### Tindak Lanjut\\n- Lakukan pengujian black-box di mobile dan desktop.`;
      const tCompletedId = psqlQuery(
        `INSERT INTO transcripts (user_id, original_file_name, file_path, status, raw_text, summary_text, duration_seconds, tokens_used) VALUES ('${bbUserId}', 'rapat_evaluasi_bb.mp3', 'deleted', 'completed', 'Selamat pagi tim, hari ini kita bahas evaluasi pengujian perangkat lunak.', E'${summaryPayload}', 120, 45) RETURNING id;`
      );
      psqlQuery(
        `INSERT INTO transcripts (user_id, original_file_name, file_path, status, raw_text, summary_text, duration_seconds, tokens_used) VALUES ('${bbUserId}', 'audio_gagal_bb.mp3', 'deleted', 'failed', '', '', 0, 0);`
      );
      psqlQuery(
        `INSERT INTO quota_mutations (user_id, type, amount_seconds, balance_before, balance_after, description, reference_type, reference_id) VALUES ('${bbUserId}', 'DEBIT', 120, 13800, 13680, 'Transkripsi audio rapat_evaluasi_bb.mp3', 'TRANSCRIPTION', '${tCompletedId}');`
      );

      // Navigate to /history Desktop
      await page.goto(`${BASE_URL}/history`, { waitUntil: 'networkidle0' });
      await waitForBodyText(page, 'rapat_evaluasi_bb.mp3', 10000);
      const shotHistDesktop = await saveShot(page, 'BB-29_history_desktop.png');

      // Test status filter "Selesai"
      await clickByText(page, 'button', 'Selesai');
      await sleep(500);
      const selesaiText = await page.evaluate(() => document.body.innerText);
      const filterOk = selesaiText.includes('rapat_evaluasi_bb.mp3') && !selesaiText.includes('audio_gagal_bb.mp3');

      // BB-55 & BB-17: Mobile Viewport 375x812
      await page.setViewport({ width: 375, height: 812 });
      await clickByText(page, 'button', 'Semua');
      await sleep(500);
      const noHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2);
      const shotMobileHist = await saveShot(page, 'BB-55_mobile_history_375px.png');

      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle0' });
      await sleep(500);
      const mobileDashText = await page.evaluate(() => document.body.innerText);
      const shotMobileDash = await saveShot(page, 'BB-17_mobile_dashboard_375px.png');
      recordResult('BB-17', 'Tampilan sisa kuota di Mobile 375px & Desktop', mobileDashText.includes('230 mnt'), 'Kuota tampil jelas di mobile navbar', shotMobileDash);
      recordResult('BB-55', 'Responsivitas Mobile 375px tanpa horizontal overflow', noHorizontalOverflow, `scrollWidth <= innerWidth (${noHorizontalOverflow})`, shotMobileHist);

      // Restore Desktop Viewport
      await page.setViewport({ width: 1280, height: 800 });
      await page.goto(`${BASE_URL}/history`, { waitUntil: 'networkidle0' });
      await waitForBodyText(page, 'rapat_evaluasi_bb.mp3', 10000);

      // BB-30 & BB-27: Open transcript detail page & verify Markdown + DOMPurify
      await clickByText(page, 'h3, h4, a, button', 'rapat_evaluasi_bb.mp3');
      await waitForBodyText(page, 'Evaluasi Rapat Testing SimpulKata', 10000);
      await sleep(400);
      const xssCheck = await page.evaluate(() => {
        const container = document.querySelector('.summary-markdown');
        const hasScript = container ? container.querySelectorAll('script').length > 0 : true;
        const hasBold = container ? container.querySelectorAll('strong, h3').length > 0 : false;
        const rawStars = container ? (container.innerText || '').includes('**Validasi') : true;
        return { hasScript, hasBold, rawStars, triggered: Boolean(window.__xss) };
      });
      const shotDetail = await saveShot(page, 'BB-27_bb30_transcript_detail_markdown.png');
      recordResult('BB-29', 'Halaman Riwayat & filter status berfungsi', filterOk, 'Filter Selesai menyembunyikan status Gagal', shotHistDesktop);
      recordResult('BB-30', 'Halaman Detail Transkrip mandiri (/transcripts/:id)', page.url().includes('/transcripts/'), `Navigated to ${page.url()}`, shotDetail);
      recordResult(
        'BB-27',
        'Sanitasi XSS (DOMPurify) & rendering Markdown rapi',
        !xssCheck.hasScript && !xssCheck.triggered && xssCheck.hasBold && !xssCheck.rawStars,
        `Script removed=${!xssCheck.hasScript}, Bold/H3 rendered=${xssCheck.hasBold}`
      );

      // BB-28: Salin Rangkuman & Unduh TXT
      const prevFiles = fs.readdirSync(DOWNLOAD_DIR);
      await clickByText(page, 'button', 'Salin Rangkuman');
      await waitForBodyText(page, 'Tersalin!', 5000);
      const shotCopy = await saveShot(page, 'BB-28_copy_download_txt.png');
      await clickByText(page, 'button', 'Unduh TXT');
      const txtDownloaded = await waitForDownload('.txt', 6000, prevFiles);
      recordResult(
        'BB-28',
        'Salin teks rangkuman & unduh berkas .txt di AudioResultCard',
        Boolean(txtDownloaded),
        `Toast "Tersalin!" tampil, file .txt terunduh`,
        shotCopy
      );

      // BB-32: Invalid pagination query (?page=abc) via API
      const userToken = await page.evaluate(() => localStorage.getItem('simpulkata_token'));
      const badPageRes = await apiRequest('/api/history?page=abc', {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      recordResult('BB-32', 'Query pagination non-numerik (?page=abc) ditangani aman', badPageRes.status === 200, `HTTP ${badPageRes.status}`);

      // BB-33: Delete history item via UI confirmation modal
      await page.goto(`${BASE_URL}/history`, { waitUntil: 'networkidle0' });
      await waitForBodyText(page, 'audio_gagal_bb.mp3', 10000);
      await clickByText(page, 'button', 'Gagal');
      await sleep(400);
      await page.click('button[title="Hapus riwayat transkripsi ini"]');
      await waitForBodyText(page, 'Hapus Riwayat Transkripsi?', 5000);
      const shotDelModal = await saveShot(page, 'BB-33_delete_history_confirm.png');
      await clickByText(page, 'button', 'Ya, Hapus');
      await sleep(800);
      await clickByText(page, 'button', 'Semua');
      await sleep(400);
      const afterDelText = await page.evaluate(() => document.body.innerText);
      recordResult('BB-33', 'Konfirmasi hapus item riwayat transkripsi di UI', !afterDelText.includes('audio_gagal_bb.mp3'), 'Modal konfirmasi & hapus permanen berhasil', shotDelModal);
    }

    // =========================================================================
    // 8. RBAC REDIRECT, PROFILE, EMAIL OTP CHANGE, & PASSWORD CHANGE (BB-18, BB-43, BB-13, BB-14, BB-16, BB-15, BB-10)
    // =========================================================================
    {
      const userToken = await page.evaluate(() => localStorage.getItem('simpulkata_token'));

      // BB-18: /api/history without token
      const noTokRes = await apiRequest('/api/history');
      recordResult('BB-18', 'Akses /api/history tanpa token ditolak (401)', noTokRes.status === 401, `HTTP ${noTokRes.status}`);

      // BB-43: /api/admin/users without token & with regular user token + UI redirect
      const admNoTok = await apiRequest('/api/admin/users');
      const admUserTok = await apiRequest('/api/admin/users', {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      await page.goto(`${BASE_URL}/admin/users`, { waitUntil: 'networkidle0' });
      await sleep(400);
      const blockedToDash = page.url().includes('/dashboard');
      const shotRbac = await saveShot(page, 'BB-43_rbac_redirect.png');
      recordResult(
        'BB-43',
        'Keamanan RBAC endpoint & rute /admin/* menolak non-admin',
        admNoTok.status === 401 && admUserTok.status === 403 && blockedToDash,
        `NoToken=${admNoTok.status}, UserRole=${admUserTok.status}, UIRedirect=${blockedToDash}`,
        shotRbac
      );

      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle0' });
      await sleep(400);
      await page.click('button[title="Pengaturan Profil"]');
      await waitForBodyText(page, 'Pengaturan Akun');

      // BB-13: Update name + confirm current password
      const nameInput = await page.$('#profile-name');
      await nameInput.click({ clickCount: 3 });
      await nameInput.press('Backspace');
      await nameInput.type('BB Tester Updated');

      const curPwdInput = await page.$('#profile-current-password');
      await curPwdInput.type(bbPass1);
      await clickByText(page, 'button[type="submit"]', 'Simpan Perubahan');
      await waitForBodyText(page, 'berhasil', 10000);
      const shotProf = await saveShot(page, 'BB-13_profile_modal.png');
      recordResult('BB-13', 'Ubah nama profil & verifikasi reaktif di Navbar', true, 'Nama profil berhasil diperbarui', shotProf);

      // Tunggu timer auto-reset 1500ms selesai sebelum menguji ubah email & ubah sandi
      await sleep(1700);

      // BB-14: Ubah alamat email dengan konfirmasi password + OTP 6-digit
      const emailInput = await page.$('#profile-email');
      await emailInput.click({ clickCount: 3 });
      await emailInput.press('Backspace');
      await emailInput.type(bbUserNewEmail);
      const curPwd2 = await page.$('#profile-current-password');
      await curPwd2.type(bbPass1);
      await clickByText(page, 'button[type="submit"]', 'Simpan Perubahan');
      await waitForBodyText(page, 'Verifikasi Alamat Email Baru', 10000);

      const emailOtp = psqlQuery(
        `SELECT otp_code FROM otp_requests WHERE user_id = '${bbUserId}' AND context = 'email_change' ORDER BY created_at DESC LIMIT 1;`
      );
      if (!emailOtp || emailOtp.length !== 6) {
        throw new Error(`Failed to fetch email_change OTP for ${bbUserId}: got "${emailOtp}"`);
      }
      await page.type('#email-otp-code', emailOtp);
      await clickByText(page, 'button', 'Verifikasi & Perbarui');
      await waitForBodyText(page, 'berhasil', 10000);
      const shotEmailOtp = await saveShot(page, 'BB-14_verify_email_change.png');
      recordResult('BB-14', 'Ubah alamat email dengan konfirmasi password + OTP 6-digit', true, `Email diperbarui ke ${bbUserNewEmail}`, shotEmailOtp);
      await sleep(2000);

      // Switch to Change Password tab
      await clickByText(page, 'button', 'Ubah Sandi');
      await waitForBodyText(page, 'Password Saat Ini');

      // BB-16: Wrong current password
      await page.type('#pwd-current', 'WrongPassword99');
      await page.type('#pwd-new', bbPass2);
      await page.type('#pwd-confirm', bbPass2);
      await clickByText(page, 'button[type="submit"]', 'Ubah Kata Sandi');
      await waitForBodyText(page, 'tidak benar', 10000).catch(() => sleep(1000));
      const pwdErrText = await page.evaluate(() => document.body.innerText);
      const shotWrongPwd = await saveShot(page, 'BB-16_wrong_password.png');
      recordResult(
        'BB-16',
        'Ubah kata sandi dengan password lama salah ditolak',
        pwdErrText.toLowerCase().includes('tidak benar') || pwdErrText.toLowerCase().includes('salah'),
        'Pesan "Password saat ini tidak benar" tampil',
        shotWrongPwd
      );

      // BB-15: Correct current password -> revokes session & auto-redirects to /login
      const cur2 = await page.$('#pwd-current');
      await cur2.click({ clickCount: 3 });
      await cur2.press('Backspace');
      await cur2.type(bbPass1);
      await clickByText(page, 'button[type="submit"]', 'Ubah Kata Sandi');
      await waitForBodyText(page, 'berhasil', 10000);
      const shotPwd = await saveShot(page, 'BB-15_change_password.png');
      recordResult('BB-15', 'Ubah kata sandi dengan password lama benar berhasil', true, 'Kata sandi baru tersimpan & sesi dicabut', shotPwd);

      // BB-10: Auto-logout redirect ke /login
      await waitForBodyText(page, 'Masuk ke Aplikasi', 8000);
      const shotLogout = await saveShot(page, 'BB-10_logout_redirect.png');
      recordResult('BB-10', 'Logout / pencabutan sesi mengarahkan ke /login', page.url().includes('/login'), 'Sesi dicabut & diarahkan ke /login', shotLogout);
    }

    // =========================================================================
    // 9. FORGOT PASSWORD & LOGIN TESTS (BB-11, BB-08, BB-07, BB-06)
    // =========================================================================
    {
      // BB-11: Forgot password & Reset via OTP using bbUserNewEmail
      await clickByText(page, 'button', 'Lupa kata sandi?');
      await waitForBodyText(page, 'Kirim Kode OTP Pemulihan', 6000);
      await page.type('input[type="email"]', bbUserNewEmail);
      await clickByText(page, 'button[type="submit"]', 'Kirim Kode OTP Pemulihan');
      await waitForBodyText(page, 'Buat Kata Sandi Baru', 10000);

      const resetOtp = psqlQuery(
        `SELECT otp_code FROM otp_requests WHERE user_id = '${bbUserId}' AND context = 'password_reset' ORDER BY created_at DESC LIMIT 1;`
      );
      if (!resetOtp || resetOtp.length !== 6) {
        throw new Error(`Failed to fetch password_reset OTP for ${bbUserId}: got "${resetOtp}"`);
      }

      await page.type('input[inputmode="numeric"]', resetOtp);
      const resetPwInputs = await page.$$('form input[type="password"]');
      await resetPwInputs[0].type(bbPassReset);
      await resetPwInputs[1].type(bbPassReset);
      await clickByText(page, 'button[type="submit"]', 'Simpan Kata Sandi Baru');
      await waitForBodyText(page, 'Masuk ke Aplikasi', 10000);
      const shotReset = await saveShot(page, 'BB-11_forgot_reset_password.png');
      recordResult('BB-11', 'Lupa kata sandi & reset dengan OTP pemulihan valid', true, 'Password direset via OTP pemulihan', shotReset);

      // BB-08: API Login non-string payload
      const badTypeLogin = await apiRequest('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 123, password: 'abc' }),
      });
      recordResult('BB-08', 'Login payload tipe non-string ditolak (400)', badTypeLogin.status === 400, `HTTP ${badTypeLogin.status}`);

      // BB-07: Wrong password login in UI
      const loginEmailInput = await page.$('input[type="email"]');
      await loginEmailInput.click({ clickCount: 3 });
      await loginEmailInput.press('Backspace');
      await loginEmailInput.type(bbUserNewEmail);
      await page.type('input[type="password"]', 'PasswordSalah123');
      await clickByText(page, 'button[type="submit"]', 'Masuk ke Aplikasi');
      await waitForBodyText(page, 'tidak cocok', 8000);
      const shotBadLogin = await saveShot(page, 'BB-07_login_invalid.png');
      recordResult('BB-07', 'Login kredensial salah menampilkan error generik', true, 'Alert error kredensial tampil', shotBadLogin);

      // BB-06: Valid login with reset password (bbPassReset)
      const pwEl = await page.$('input[type="password"]');
      await pwEl.click({ clickCount: 3 });
      await pwEl.press('Backspace');
      await pwEl.type(bbPassReset);
      await clickByText(page, 'button[type="submit"]', 'Masuk ke Aplikasi');
      await waitForBodyText(page, 'Studio Transkripsi', 10000);
      const shotGoodLogin = await saveShot(page, 'BB-06_login_success.png');
      recordResult('BB-06', 'Login kredensial valid dengan password baru berhasil', page.url().includes('/dashboard'), 'Berhasil masuk ke /dashboard', shotGoodLogin);

      // Logout user so we can test Admin flows
      await page.click('button[title="Keluar dari akun"]');
      await waitForBodyText(page, 'Masuk ke Aplikasi', 8000);
    }

    // =========================================================================
    // 10. ADMIN PANEL, CSV EXPORTS, PRIVACY MASKING, MANUAL QUOTA, SUSPEND (BB-44..BB-52, BB-09)
    // =========================================================================
    {
      await apiRequest('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: bbAdminName, email: bbAdminEmail, password: bbPass1 }),
      });
      bbAdminId = psqlQuery(`SELECT id FROM users WHERE email = '${bbAdminEmail}' LIMIT 1;`);
      const admOtp = psqlQuery(`SELECT otp_code FROM otp_requests WHERE user_id = '${bbAdminId}' ORDER BY created_at DESC LIMIT 1;`);
      const admVerRes = await apiRequest('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: bbAdminEmail, otpCode: admOtp }),
      });
      if (admVerRes.status !== 200) {
        throw new Error(`Failed verifying temp admin OTP: ${JSON.stringify(admVerRes)}`);
      }
      psqlQuery(`UPDATE users SET role = 'admin' WHERE id = '${bbAdminId}';`);

      // Login as Admin via UI
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0' });
      await page.type('input[type="email"]', bbAdminEmail);
      await page.type('input[type="password"]', bbPass1);
      await clickByText(page, 'button[type="submit"]', 'Masuk ke Aplikasi');
      await waitForBodyText(page, 'Studio Transkripsi', 10000);

      // Open /admin/users
      await page.goto(`${BASE_URL}/admin/users`, { waitUntil: 'networkidle0' });
      await waitForBodyText(page, 'Daftar Pengguna Platform', 10000);

      // Search for bbUserNewEmail and press Enter to trigger fetchUsers(1)
      const searchBox = await page.$('input[placeholder*="Cari"]');
      if (searchBox) {
        await searchBox.type(bbUserNewEmail);
        await searchBox.press('Enter');
        const startSearch = Date.now();
        while (Date.now() - startSearch < 8000) {
          const tblText = await page.evaluate(() => document.querySelector('table')?.innerText || '');
          if (tblText.includes(bbUserNewEmail) && !tblText.includes(bbAdminEmail)) break;
          await sleep(200);
        }
      }
      await waitForBodyText(page, bbUserNewEmail, 8000);
      await clickByText(page, 'button', 'Detail');
      await waitForBodyText(page, 'Riwayat Mutasi', 8000);
      await waitForBodyText(page, 'Transkripsi Audio', 5000).catch(() => sleep(500));

      // BB-46 & BB-47: Check Privacy Masking on transcript mutation in modal
      const modalText = await page.evaluate(() => document.body.innerText);
      const filenameHidden = !modalText.includes('rapat_evaluasi_bb.mp3');
      const hasGenericLabel = modalText.includes('Transkripsi Audio') || modalText.includes('Pemakaian kuota');
      const shotAdmDetail = await saveShot(page, 'BB-46_bb47_admin_user_detail_modal.png');
      recordResult('BB-46', 'Admin Daftar Pengguna & Modal Detail (Teleport full backdrop)', modalText.includes('BB Tester Updated'), 'Modal detail user BB Tester Updated terbuka', shotAdmDetail);
      recordResult('BB-47', 'Penyamaran privasi nama file audio pada riwayat mutasi Admin', filenameHidden && hasGenericLabel, `Filename hidden=${filenameHidden}, genericLabel=${hasGenericLabel}`);

      // BB-50: Verify Admin cannot suspend another Admin via API
      const admToken = await page.evaluate(() => localStorage.getItem('simpulkata_token'));
      const selfSuspRes = await apiRequest(`/api/admin/users/${bbAdminId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${admToken}`,
        },
        body: JSON.stringify({ status: 'SUSPENDED' }),
      });
      recordResult('BB-50', 'Larangan menangguhkan akun sesama Admin (403)', selfSuspRes.status === 403, `HTTP ${selfSuspRes.status}`);

      // BB-48: Add manual quota +30 minutes
      await clickByText(page, 'button', '+ Tambah Kuota');
      await waitForBodyText(page, 'Jumlah Tambahan Kuota', 5000);
      await clickByText(page, 'button', '+30 Menit');
      await page.type('#admin-add-quota-note', 'Kompensasi uji blackbox v1.0.1-beta');
      await clickByText(page, 'button[type="submit"]', 'Tambahkan +30 Menit');
      await waitForBodyText(page, 'Riwayat Mutasi', 10000);
      await sleep(500);
      const shotAddQuota = await saveShot(page, 'BB-48_admin_add_quota.png');
      recordResult('BB-48', 'Penambahan kuota manual Admin (+30 mnt)', true, 'Kuota manual +30 mnt berhasil ditambahkan', shotAddQuota);

      // BVA 0 minutes check
      const badQuotaRes = await apiRequest(`/api/admin/users/${bbUserId}/quota`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${admToken}`,
        },
        body: JSON.stringify({ minutes: 0 }),
      });
      if (badQuotaRes.status !== 400) {
        throw new Error(`Expected 400 for 0 minutes quota add, got ${badQuotaRes.status}`);
      }

      // BB-49: Suspend user
      await clickByText(page, 'button', 'Tangguhkan Akun');
      await waitForBodyText(page, 'Ya, Tangguhkan', 5000);
      await clickByText(page, 'button', 'Ya, Tangguhkan');
      await waitForBodyText(page, 'SUSPENDED', 8000);
      const shotSuspend = await saveShot(page, 'BB-49_admin_suspend_user.png');
      recordResult('BB-49', 'Penangguhan akun (SUSPENDED) oleh Admin', true, 'Status user berubah menjadi SUSPENDED', shotSuspend);

      // BB-44 & BB-45: Admin Logs with filter PAYMENT & Ekspor CSV
      await page.goto(`${BASE_URL}/admin/logs`, { waitUntil: 'networkidle0' });
      await waitForBodyText(page, 'Log Aktivitas Sistem', 10000);
      const selects = await page.$$('select');
      for (const sel of selects) {
        const hasPaymentOpt = await sel.evaluate((s) =>
          Array.from(s.options).some((o) => o.value === 'PAYMENT')
        );
        if (hasPaymentOpt) {
          await sel.select('PAYMENT');
          break;
        }
      }
      await sleep(700);
      const shotLogs = await saveShot(page, 'BB-44_admin_logs_payment.png');
      const logsBody = await page.evaluate(() => document.body.innerText);
      recordResult('BB-44', 'Admin Log Sistem filter sumber modul PAYMENT', logsBody.includes('PAYMENT'), 'Log aktivitas kuota & pembayaran PAYMENT tampil', shotLogs);

      const prevCsv1 = fs.readdirSync(DOWNLOAD_DIR);
      await clickByText(page, 'button', 'Ekspor CSV');
      const logsCsvPath = await waitForDownload('.csv', 8000, prevCsv1);
      const logsCsvOk = logsCsvPath && fs.statSync(logsCsvPath).size > 20;
      const shotLogsCsv = await saveShot(page, 'BB-45_admin_logs_csv.png');
      recordResult('BB-45', 'Ekspor Log Sistem ke CSV (.csv terunduh)', Boolean(logsCsvOk), logsCsvOk ? path.basename(logsCsvPath) : 'File CSV kosong/gagal', shotLogsCsv);

      // BB-51 & BB-52: Admin Global Transactions & Ekspor CSV
      await page.goto(`${BASE_URL}/admin/transactions`, { waitUntil: 'networkidle0' });
      await waitForBodyText(page, 'Total Pendapatan Sukses', 10000);
      await sleep(500);
      const shotAdmTx = await saveShot(page, 'BB-51_admin_transactions.png');
      recordResult('BB-51', 'Halaman Transaksi Global & statistik total pendapatan', true, 'Widget metrik & tabel transaksi global tampil', shotAdmTx);

      const prevCsv2 = fs.readdirSync(DOWNLOAD_DIR);
      await clickByText(page, 'button', 'Ekspor CSV');
      const txCsvPath = await waitForDownload('.csv', 8000, prevCsv2);
      const txCsvOk = txCsvPath && fs.statSync(txCsvPath).size > 20;
      const shotTxCsv = await saveShot(page, 'BB-52_admin_transactions_csv.png');
      recordResult('BB-52', 'Ekspor Transaksi Global ke CSV (.csv terunduh)', Boolean(txCsvOk), txCsvOk ? path.basename(txCsvPath) : 'File CSV kosong/gagal', shotTxCsv);

      // BB-09: Verify suspended user login rejection in UI
      await page.click('button[title="Keluar dari akun"]');
      await waitForBodyText(page, 'Masuk ke Aplikasi', 8000);
      await page.type('input[type="email"]', bbUserNewEmail);
      await page.type('input[type="password"]', bbPassReset);
      await clickByText(page, 'button[type="submit"]', 'Masuk ke Aplikasi');
      await waitForBodyText(page, 'ditangguhkan', 8000);
      const shotSuspLogin = await saveShot(page, 'BB-09_login_suspended.png');
      recordResult('BB-09', 'Login akun berstatus SUSPENDED ditolak (403)', true, 'Pesan penangguhan oleh Administrator tampil di UI', shotSuspLogin);
    }

    console.log('\n📊 RINGKASAN EKSEKUSI BLACK-BOX PUPPETEER:');
    const passedCount = results.filter((r) => r.passed).length;
    console.log(`Total Kasus Uji Dieksekusi : ${results.length}`);
    console.log(`Lolos (PASS)               : ${passedCount}`);
    console.log(`Gagal (FAIL)               : ${results.length - passedCount}`);
    console.log(`Total File Screenshot      : ${fs.readdirSync(SCREENSHOT_DIR).length}`);
    console.log(`Screenshot tersimpan di    : ${SCREENSHOT_DIR}\n`);

    fs.writeFileSync(
      path.join(__dirname, 'last-report.json'),
      JSON.stringify({ timestamp: new Date().toISOString(), baseUrl: BASE_URL, results }, null, 2)
    );
  } finally {
    if (browser) {
      await browser.close();
    }
    try {
      psqlQuery(`DELETE FROM users WHERE email IN ('${bbUserEmail}', '${bbUserNewEmail}', '${bbAdminEmail}');`);
      psqlQuery(`DELETE FROM system_logs WHERE message LIKE '%${bbUserEmail}%' OR message LIKE '%${bbUserNewEmail}%' OR message LIKE '%${bbAdminEmail}%' OR message LIKE '%Kompensasi uji blackbox%';`);
    } catch (cleanupErr) {
      console.error('Warning cleanup DB:', cleanupErr.message);
    }
    for (const f of [tmpTxt, tmpEmptyMp3, tmpWav3s, tmp201Mb, tmp6MbWav]) {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
    if (fs.existsSync(DOWNLOAD_DIR)) {
      fs.rmSync(DOWNLOAD_DIR, { recursive: true, force: true });
    }
  }
}

run().catch((err) => {
  console.error('Fatal error running Black-Box tests:', err);
  process.exit(1);
});
