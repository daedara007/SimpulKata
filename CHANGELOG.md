# Changelog

Semua perubahan penting pada proyek **SimpulKata** akan didokumentasikan di berkas ini.

Format berkas ini mengacu pada [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
dan mengikuti prinsip [Semantic Versioning (SemVer)](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased] - 2026-10-30

### Added
- **Fitur Pemulihan Kata Sandi Melalui Email dengan Kode OTP (`UC-03`, `SD-03`)**:
  - Mengimplementasikan alur pemulihan kata sandi 2-tahap menggunakan kode OTP 6-digit acak aman via Resend API:
    - Endpoint `POST /api/auth/forgot-password`: Menerima email terdaftar, validasi keberadaan pengguna di database (SRS UC-03 A1 / SD-03 8b), proteksi cooldown 60 detik (`COOLDOWN_ACTIVE`), dan pengiriman email OTP dengan masa aktif 5 menit.
    - Endpoint `POST /api/auth/reset-password`: Menerima kode OTP, validasi panjang kata sandi baru ($\ge 8$ karakter), validasi kata sandi baru harus berbeda dengan kata sandi lama (SRS UC-03 A3), verifikasi kecocokan OTP di tabel `otp_requests` (`context = 'password_reset'`), pembaharuan hash kata sandi (bcrypt), dan penandaan OTP telah digunakan (`is_used = TRUE`).
  - **Mitigasi Keamanan Sesi**: Menghapus seluruh sesi refresh token aktif lama di tabel `user_sessions` saat kata sandi berhasil disetel ulang untuk mencegah penyalahgunaan sesi di perangkat lain yang mungkin telah disusupi.
  - **Template Email Pemulihan Bermerek**: Menambahkan template email HTML responsif khusus pemulihan kata sandi dengan aksen rose/peringatan keamanan pada `backend/src/services/emailService.js`.
  - **Antarmuka UI Form Interaktif**:
    - Menambahkan tombol *"Lupa kata sandi?"* pada form login di `frontend/src/components/Auth.vue`.
    - Menyediakan form 2-tahap responsif dengan input email terdaftar, input kode OTP terformat, input kata sandi baru & konfirmasi dengan toggle visibilitas sandi, serta tombol kirim ulang OTP dinamis dengan timer *cooldown*.
- **Verifikasi Email dengan Kode OTP 6-Digit via Resend API (`UC-01`, `SD-01`)**:
  - Mengimplementasikan alur pendaftaran akun dengan verifikasi email wajib menggunakan Resend API (`resend` SDK) dan kode OTP 6-digit numerik acak aman (`crypto.randomInt`).
  - Menambahkan tabel `otp_requests` pada basis data PostgreSQL (`simpulkata_db`) dengan masa berlaku OTP 5 menit (`expires_at`), status pemakaian (`is_used`), dan indeks optimasi query.
  - Menambahkan kolom status akun `status` (`'PENDING'`, `'ACTIVE'`, `'SUSPENDED'`) pada tabel `users`. Akun baru diinisialisasi dengan status `'PENDING'`.
  - **Opsi B (Instant Login)**: Setelah kode OTP diverifikasi dengan benar, status akun langsung diubah menjadi `'ACTIVE'` dan sistem secara otomatis menerbitkan Access Token JWT (15 menit) serta Refresh Token (7 hari), sehingga pengguna langsung diarahkan masuk ke Dashboard tanpa perlu login manual ulang.
  - **Mekanisme Proteksi & Cooldown**: Mencegah spam dengan memberlakukan jeda waktu (*cooldown*) pengiriman ulang kode OTP selama 60 detik (`COOLDOWN_ACTIVE`), membatalkan (*invalidate*) OTP sebelumnya saat OTP baru diminta, dan mencegah penggunaan ulang kode OTP yang sudah diverifikasi (`is_used = TRUE`).
  - **Antarmuka OTP Interaktif**: Menambahkan komponen tampilan verifikasi OTP responsif pada `frontend/src/components/Auth.vue` dengan input digit terformat, penghitung waktu mundur (*countdown*), tombol kirim ulang OTP dinamis, dan penanganan status `'PENDING'` otomatis saat login.
  - **Email Service & Template Responsif**: Membangun `backend/src/services/emailService.js` dengan template email HTML modern bermerek SimpulKata dan mekanisme fallback logger konsol untuk lingkungan pengujian/development.

### Refactored
- **Migrasi Menyeluruh Backend ke TypeScript (Fastify 5 + Strict Mode)**:
  - Mengonversi seluruh kode sumber backend dari JavaScript (CommonJS) menjadi TypeScript murni (`.ts`).
  - Menyiapkan konfigurasi `backend/tsconfig.json` dengan `target: ES2022`, module resolution `bundler`, dan kompilasi output ke `backend/dist/`.
  - Mengonfigurasi skrip eksekusi modern pada `backend/package.json`: `tsx watch src/server.ts` untuk hot-reload development instan dan `tsc` untuk production build.
  - Membangun layer pengetikan terpusat pada `backend/src/types/`:
    - `user.ts`: Interface entitas `UserRow`, `UserSafe`, `CreateUserDTO`, `UserSessionRow`, `SessionWithUser`.
    - `otp.ts`: Interface entitas `OtpRequestRow`, `CreateOtpDTO`, `OtpCooldownResult`.
    - `transcript.ts`: Interface entitas `TranscriptRow`, `TranscriptStatus`, `CreateTranscriptDTO`, `UpdateCompletedDTO`.
    - `fastify.d.ts`: TypeScript module augmentation untuk decorator `fastify.authenticate` dan payload `@fastify/jwt`.
  - Mengonversi seluruh layer arsitektur backend ke TypeScript:
    - **Database (`src/db.ts`)**: Generic query function `query<T>`, connection pool lifecycle, client transaction handler.
    - **Models (`src/models/*.ts`)**: `userModel.ts`, `sessionModel.ts`, `otpModel.ts`, `transcriptModel.ts`, `index.ts`.
    - **Services (`src/services/*.ts`)**: `emailService.ts` (Resend SDK typed client, template generator, console fallback), `aiService.ts` (Whisper transcription, LLM summarization, duration probe).
    - **Controllers (`src/controllers/*.ts`)**: `authController.ts` (registrasi, login, verifikasi OTP, refresh token, reset password), `audioController.ts` (multipart upload handler, background processing pipeline, history pagination).
    - **Routes & Server (`src/routes/*.ts`, `src/server.ts`)**: Typed Fastify plugins, error handler, not-found handler, startup database health check & background cleaner routines.
  - Menyelaraskan kontainer Docker `backend/Dockerfile` dengan kompilasi otomatis `npm run build` dan eksekusi produksi `node dist/server.js`.
  - Memverifikasi keberhasilan integrasi dengan `npm run type-check` (`tsc --noEmit`, 0 error), `npm run build`, dan pengujian regresi E2E auth 100% lulus.
- **Migrasi Menyeluruh Frontend ke TypeScript (Vue 3 + Vite)**:
  - Mengonversi seluruh kode sumber frontend dari JavaScript (ES Modules) menjadi TypeScript murni (`.ts` & `<script setup lang="ts">`).
  - Menyediakan konfigurasi `tsconfig.json`, `tsconfig.node.json`, dan `env.d.ts` dengan pengetikan ketat (*strict mode*).
  - Membangun sistem interface terpusat pada `frontend/src/types/`: `auth.ts` (entitas `User`, `SessionData`, payload auth & OTP), `audio.ts` (`TranscriptItem`, pagination, `HistoryResponse`, `ProcessAudioResponse`), dan `index.ts`.
  - Mengonversi seluruh lapisan MVC:
    - **Models (`models/*.ts`)**: `authModel.ts`, `audioModel.ts`, `index.ts` dengan pengetikan promise respons API yang eksplisit.
    - **Controllers (`controllers/*.ts`)**: `authController.ts`, `audioController.ts`, `historyController.ts` dengan reactive states dan callback yang sepenuhnya ter-type.
    - **Services & Utils (`services/*.ts`, `utils/*.ts`)**: `apiClient.ts` dengan typed Axios request/response interceptor & queue, `formatters.ts`, `clipboard.ts`, dan `markdown.ts`.
    - **Views (`components/*.vue`, `App.vue`)**: Mengadopsi `<script setup lang="ts">` dengan deklarasi `defineProps` dan `defineEmits` berbasis interface generic.
  - Memverifikasi keberhasilan integrasi dengan `vue-tsc --noEmit` (0 error) dan `vite build`.
- **Adopsi Arsitektur MVC pada Frontend SimpulKata**:
  - Memisahkan logika klien menjadi lapisan modular yang rapi:
    - **Models (`frontend/src/models/`)**: `authModel.js` (komunikasi endpoint autentikasi & pengelolaan sesi `localStorage`) dan `audioModel.js` (unggah audio, polling status transkrip, riwayat).
    - **Controllers (`frontend/src/controllers/`)**: `useAuthController.js` (state form login/register & alur auth), `useAudioController.js` (state upload, drag-and-drop, timer, polling asinkron, dan display hasil), dan `useHistoryController.js` (state pagination riwayat, filter status, seleksi item).
    - **Services (`frontend/src/services/`)**: `apiClient.js` (konfigurasi Axios terpusat dengan interceptor Bearer token dan Refresh Token Rotation otomatis).
    - **Utils (`frontend/src/utils/`)**: Ekstraksi fungsi bantuan independen: `formatters.js` (durasi, ukuran file, tanggal, badge), `clipboard.js` (salin teks dengan fallback textarea), dan `markdown.js` (parser Markdown dengan sanitasi DOMPurify).
    - **Views (`frontend/src/components/`)**: Menyederhanakan berkas komponen UI (`Auth.vue`, `Dashboard.vue`, `App.vue`) sehingga hanya berfokus pada render antarmuka dan *event binding* deklaratif.
- **Adopsi Arsitektur MVC pada Backend SimpulKata**:
  - Mengekstraksi seluruh query SQL langsung (*raw database queries*) dari controllers ke lapisan Data Access Object (DAO) / Model terdedikasi di `backend/src/models/`:
    - `userModel.js`: Enkapsulasi seluruh operasi tabel `users` (`findByEmail`, `findById`, `create`, `getBalance`, `reserveBalance`, `refundBalance`).
    - `sessionModel.js`: Enkapsulasi seluruh operasi tabel `user_sessions` (`create`, `findByRefreshToken`, `rotate`, `deleteByRefreshToken`, `deleteByUserId`, `deleteExpired`).
    - `transcriptModel.js`: Enkapsulasi seluruh operasi tabel `transcripts` (`create`, `findByIdAndUserId`, `updateRawText`, `updateCompleted`, `updateFailed`, `countHistory`, `findHistory`, `cleanupHangingProcessing`).
  - Mengonversi `backend/src/controllers/authController.js` dan `backend/src/controllers/audioController.js` menjadi Controller berbasis class bersih yang hanya berfokus pada validasi input HTTP, status code respons, dan orkestrasi service/model.
  - Memperbarui startup cleanup di `backend/src/server.js` untuk memanfaatkan `transcriptModel.cleanupHangingProcessing()` dan `sessionModel.deleteExpired()`.
  - Menjaga paritas fungsionalitas dan kompatibilitas API 100% tanpa mengubah kontrak payload/respons rute yang sudah ada.

### Security
- **Mekanisme Dual-Token & Rotasi Sesi (RTR)**: Memperpendek masa aktif Access Token JWT dari 7 hari menjadi 15 menit untuk memitigasi risiko penyadapan token, didukung oleh Refresh Token Rotation (RTR) di setiap pembaruan sesi yang dicatat pada tabel `user_sessions`.
- **Validasi Kunci Rahasia JWT Wajib & Hapus Fallback Default (`CR-01`)**: Menghapus fallback hardcoded `JWT_SECRET` di [`backend/src/server.js`](file:///home/kevin007/proyek/ippl/simpulkata/backend/src/server.js). Server kini memvalidasi dan mewajibkan variabel lingkungan `JWT_SECRET` serta menghentikan startup jika bernilai kosong atau nilai default yang tidak aman.
- **Sanitasi XSS pada Rangkuman AI dengan DOMPurify (`CR-05`)**: Mengintegrasikan pustaka `dompurify` pada [`frontend/src/components/Dashboard.vue`](file:///home/kevin007/proyek/ippl/simpulkata/frontend/src/components/Dashboard.vue) untuk membersihkan seluruh tag berbahaya dari output LLM sebelum dirender dengan `v-html`.
- **Upgrade Base Image Docker ke Node.js 24 LTS (`node:24-alpine`)**: Memperbarui base image pada `backend/Dockerfile` dan `frontend/Dockerfile` dari `node:20-alpine` (yang telah mencapai masa End-of-Life) menjadi `node:24-alpine` (Active LTS). Pembaruan ini memastikan penambalan seluruh kerentanan keamanan (*vulnerabilities*) Node.js core terbaru serta menyelaraskan paritas versi runtime antara kontainer Docker dan host developer.

### Fixed
- **Urutan Evaluasi Validasi OTP Reset Kata Sandi & Mitigasi Password Oracle (`SD-03 Langkah 18-20`)**: Memperbaiki urutan pemeriksaan pada [`backend/src/controllers/authController.js`](file:///home/kevin007/proyek/ippl/simpulkata/backend/src/controllers/authController.js) agar validitas kode OTP selalu diverifikasi terlebih dahulu sebelum membandingkan kata sandi baru dengan kata sandi lama. Hal ini mencegah celah keamanan *password enumeration / oracle* (di mana penyerang dapat menebak kata sandi lama pengguna tanpa perlu memiliki kode OTP valid) dan memastikan pesan kesalahan *"OTP tidak valid atau sudah kadaluarsa"* ditampilkan dengan tepat saat OTP salah.
- **Pencegahan Timeout Cloudflare 100 Detik melalui Pemrosesan Asinkron (`CR-06`, `TC-TRS-011`)**: Mengubah alur pemrosesan audio pada [`backend/src/controllers/audioController.js`](file:///home/kevin007/proyek/ippl/simpulkata/backend/src/controllers/audioController.js) menjadi asinkron dengan langsung mengembalikan respons `202 Accepted` bersama `transcript_id` dalam 1–2 detik setelah berkas tervalidasi dan kuota direservasi secara atomik. Frontend memantau status secara berkala (*polling*) sehingga audio berdurasi panjang (> 20 menit) tidak lagi terputus oleh batas waktu 100 detik (*HTTP 524 Timeout*) Cloudflare Tunnel.
- **Validasi Tipe Data Input Autentikasi (`CR-17`)**: Menambahkan validasi tipe data string ketat pada `email` dan `password` di [`backend/src/controllers/authController.js`](file:///home/kevin007/proyek/ippl/simpulkata/backend/src/controllers/authController.js) untuk mencegah uncaught exception (`500 Internal Server Error`) saat menerima payload non-string (misal integer/boolean).
- **Fallback Salin Teks pada Koneksi Non-HTTPS / HTTP LAN (`CR-14`)**: Menambahkan fallback berbasis elemen textarea sementara dan `document.execCommand('copy')` pada tombol "Salin Teks" di [`frontend/src/components/Dashboard.vue`](file:///home/kevin007/proyek/ippl/simpulkata/frontend/src/components/Dashboard.vue) ketika API `navigator.clipboard` tidak tersedia di konteks non-aman (*insecure context* seperti akses IP LAN).
- **Empty State & Reset Filter Riwayat Transkripsi (`CR-12`)**: Memperbaiki urutan evaluasi kondisi empty state riwayat pada `Dashboard.vue` sehingga filter (misal: "Gagal") yang tidak memiliki data menampilkan status kosong kontekstual *"Tidak ada data riwayat dengan status ini"* beserta tombol *"Reset Filter"*, bukan status kosong global.
- **Preservasi Hash Anchor Halaman Beranda saat Pengguna Login (`CR-11`)**: Memperbaiki routing hash di [`frontend/src/App.vue`](file:///home/kevin007/proyek/ippl/simpulkata/frontend/src/App.vue) sehingga navigasi ke anchor beranda (seperti `#fitur`, `#faq`, `#alur-kerja`, `#biaya`) tidak lagi memaksa pengalihan (*forced redirect*) ke `#dashboard` bagi pengguna yang sedang memiliki sesi login aktif.
- **Debouncing Peringatan Sesi Kedaluwarsa (`CR-13`)**: Menambahkan flag `isSessionExpiredAlertShowing` pada interceptor Axios di `App.vue` untuk mencegah pemanggilan ganda popup `alert()` saat beberapa request paralel menerima status `401 Unauthorized` secara bersamaan.
- **Pesan Kesalahan Autentikasi Ramah Pengguna (`CR-15`)**: Mengganti tampilan pesan kesalahan teknis Axios mentah pada [`frontend/src/components/Auth.vue`](file:///home/kevin007/proyek/ippl/simpulkata/frontend/src/components/Auth.vue) dengan pesan Bahasa Indonesia yang ramah dan jelas saat terjadi kegagalan jaringan atau respons server.
- **Penyelamatan Transkripsi Whisper & Penanganan Audio Hening (`CR-08`)**: Menyimpan `raw_text` transkripsi langsung ke database begitu Whisper selesai agar hasil transkripsi tidak hilang ketika layanan perangkum LLM mengalami timeout atau gangguan. Menangani audio tanpa ucapan/hening dengan pesan ramah HTTP 422 dan pengembalian (*refund*) kuota secara otomatis.
- **Sanitasi Parameter Query Riwayat (`CR-07`)**: Memperbaiki validasi `page` dan `limit` pada `/api/history` menggunakan `Number.isFinite` dengan fallback angka aman (mencegah `NaN` ke query SQL OFFSET), serta penanganan aman terhadap parameter filter array `status`.
- **Pembersihan Record Menggantung saat Startup (`CR-19`)**: Menambahkan pembersihan otomatis transkrip berstatus `'processing'` saat server booting/restart agar status riwayat tidak berkedip selamanya akibat restart kontainer.
- **Peningkatan Observabilitas Error Logging (`CR-09`)**: Memperbaiki pemanggilan logger Pino di [`backend/src/server.js`](file:///home/kevin007/proyek/ippl/simpulkata/backend/src/server.js) dengan menyertakan objek error `{ err }` lengkap saat startup dan health check database.
- **Reservasi Kuota Atomik & Pencegahan Race Condition (`CR-03`)**: Memperbaiki pemotongan kuota di [`backend/src/controllers/audioController.js`](file:///home/kevin007/proyek/ippl/simpulkata/backend/src/controllers/audioController.js) dengan query reservasi atomik (`UPDATE users SET balance = balance - $1 WHERE id = $2 AND balance >= $1`) di awal proses sebelum memanggil AI, dan mekanisme pengembalian (*refund*) otomatis jika proses transkripsi/rangkuman gagal.
- **Penolakan Berkas Audio Rusak / Durasi 0 & Fallback `ffprobe` (`CR-02`)**: Memperbaiki pembacaan durasi pada [`backend/src/services/aiService.js`](file:///home/kevin007/proyek/ippl/simpulkata/backend/src/services/aiService.js) dengan fallback `ffprobe` ketika metadata header VBR rusak, serta menolak langsung berkas dengan durasi `<= 0` pada [`backend/src/controllers/audioController.js`](file:///home/kevin007/proyek/ippl/simpulkata/backend/src/controllers/audioController.js) untuk mencegah konsumsi AI tanpa pemotongan kuota.
- **Pembersihan Berkas Konversi Parsial (`CR-10`)**: Menambahkan pembersihan berkas sisa `.converted.mp3` di blok catch fungsi `convertAudioToMp3` pada `aiService.js`.
- **Pesan Batas Unggah Dinamis (`CR-18`)**: Mengubah pesan penolakan 413 pada `audioController.js` agar membaca konfigurasi `MAX_UPLOAD_SIZE_MB` secara dinamis.
- **Network Error saat Akses Eksternal & Cloudflare Tunnel**: Memperbaiki kegagalan koneksi (*Network Error*) saat proses login, registrasi, dan pemrosesan audio ketika aplikasi diakses melalui Cloudflare Tunnel (HTTPS) maupun jaringan LAN. Masalah ini disebabkan oleh pemanggilan URL backend yang di-hardcode ke `http://localhost:3000` sehingga diblokir oleh kebijakan keamanan peramban (*Mixed Content Policy*) dan mengarahkan koneksi ke mesin klien pengguna.

### Added
- **Tabel `user_sessions` & Endpoint Refresh Token (`referensi/erd.puml`)**: Mengimplementasikan tabel `user_sessions` di basis data PostgreSQL sesuai diagram ERD untuk mencatat `refresh_token`, `ip_address`, `user_agent`, dan `expires_at`. Menambahkan endpoint `POST /api/auth/refresh` untuk rotasi sesi dan `POST /api/auth/logout` untuk mencabut sesi. Menambahkan Axios response interceptor otomatis di frontend yang merefresh token secara transparan saat menerima status 401 tanpa memutuskan sesi pengguna.
- **Endpoint Status Transkrip & Polling Asinkron (`CR-06`)**: Menambahkan endpoint `GET /api/transcripts/:id` pada [`backend/src/routes/audio.js`](file:///home/kevin007/proyek/ippl/simpulkata/backend/src/routes/audio.js) dan [`backend/src/controllers/audioController.js`](file:///home/kevin007/proyek/ippl/simpulkata/backend/src/controllers/audioController.js) dengan autentikasi JWT dan proteksi IDOR, serta fungsi polling `pollTranscript()` pada [`frontend/src/components/Dashboard.vue`](file:///home/kevin007/proyek/ippl/simpulkata/frontend/src/components/Dashboard.vue). Mendukung pula mode sinkron melalui parameter query `?sync=true` untuk fleksibilitas integrasi.
- **Indikator Kuota Responsif pada Mobile Header (`CR-16`)**: Menambahkan badge informasi sisa kuota (`⏱️ Xm Ys`) pada navigasi atas di [`frontend/src/components/Dashboard.vue`](file:///home/kevin007/proyek/ippl/simpulkata/frontend/src/components/Dashboard.vue) khusus untuk tampilan layar kecil (viewport `< 640px`) agar pengguna mobile tetap dapat memantau saldo kuota tanpa harus membuka sidebar.
- **Vite Reverse Proxy (`/api`)**: Menambahkan konfigurasi reverse proxy pada `frontend/vite.config.js` untuk meneruskan seluruh lalu lintas permintaan dengan prefix `/api` ke container backend secara internal (`http://backend:3000` di lingkungan Docker, atau fallback ke `http://localhost:3000` saat development lokal).
- **Konfigurasi `BACKEND_URL` di Docker Compose**: Menambahkan environment variable `BACKEND_URL=http://backend:3000` pada service `frontend` di `docker-compose.yml`.
- **Dukungan Base URL Dinamis pada Axios**: Menambahkan konfigurasi `axios.defaults.baseURL` pada `frontend/src/main.js` yang mendukung environment variable `VITE_API_BASE_URL` dengan fallback ke *relative URL* (`''`).

### Changed
- **Migrasi Endpoint API ke Relative Path**:
  - `frontend/src/components/Auth.vue`: Mengubah endpoint login (`/api/auth/login`) dan registrasi (`/api/auth/register`) dari URL absolut `http://localhost:3000` menjadi relative path.
  - `frontend/src/components/Dashboard.vue`: Mengubah endpoint data profil pengguna (`/api/auth/me`), riwayat transkripsi (`/api/history`), dan unggah audio (`/api/process-audio`) menjadi relative path.
