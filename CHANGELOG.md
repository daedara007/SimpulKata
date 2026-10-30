# Changelog

Semua perubahan penting pada proyek **SimpulKata** akan didokumentasikan di berkas ini.

Format berkas ini mengacu pada [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
dan mengikuti prinsip [Semantic Versioning (SemVer)](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased] - 2026-10-30

### Security
- **Validasi Kunci Rahasia JWT Wajib & Hapus Fallback Default (`CR-01`)**: Menghapus fallback hardcoded `JWT_SECRET` di [`backend/src/server.js`](file:///home/kevin007/proyek/ippl/simpulkata/backend/src/server.js). Server kini memvalidasi dan mewajibkan variabel lingkungan `JWT_SECRET` serta menghentikan startup jika bernilai kosong atau nilai default yang tidak aman.
- **Sanitasi XSS pada Rangkuman AI dengan DOMPurify (`CR-05`)**: Mengintegrasikan pustaka `dompurify` pada [`frontend/src/components/Dashboard.vue`](file:///home/kevin007/proyek/ippl/simpulkata/frontend/src/components/Dashboard.vue) untuk membersihkan seluruh tag berbahaya dari output LLM sebelum dirender dengan `v-html`.
- **Upgrade Base Image Docker ke Node.js 24 LTS (`node:24-alpine`)**: Memperbarui base image pada `backend/Dockerfile` dan `frontend/Dockerfile` dari `node:20-alpine` (yang telah mencapai masa End-of-Life) menjadi `node:24-alpine` (Active LTS). Pembaruan ini memastikan penambalan seluruh kerentanan keamanan (*vulnerabilities*) Node.js core terbaru serta menyelaraskan paritas versi runtime antara kontainer Docker dan host developer.

### Fixed
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
- **Vite Reverse Proxy (`/api`)**: Menambahkan konfigurasi reverse proxy pada `frontend/vite.config.js` untuk meneruskan seluruh lalu lintas permintaan dengan prefix `/api` ke container backend secara internal (`http://backend:3000` di lingkungan Docker, atau fallback ke `http://localhost:3000` saat development lokal).
- **Konfigurasi `BACKEND_URL` di Docker Compose**: Menambahkan environment variable `BACKEND_URL=http://backend:3000` pada service `frontend` di `docker-compose.yml`.
- **Dukungan Base URL Dinamis pada Axios**: Menambahkan konfigurasi `axios.defaults.baseURL` pada `frontend/src/main.js` yang mendukung environment variable `VITE_API_BASE_URL` dengan fallback ke *relative URL* (`''`).

### Changed
- **Migrasi Endpoint API ke Relative Path**:
  - `frontend/src/components/Auth.vue`: Mengubah endpoint login (`/api/auth/login`) dan registrasi (`/api/auth/register`) dari URL absolut `http://localhost:3000` menjadi relative path.
  - `frontend/src/components/Dashboard.vue`: Mengubah endpoint data profil pengguna (`/api/auth/me`), riwayat transkripsi (`/api/history`), dan unggah audio (`/api/process-audio`) menjadi relative path.
