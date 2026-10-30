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
- **Indikator Kuota Responsif pada Mobile Header (`CR-16`)**: Menambahkan badge informasi sisa kuota (`⏱️ Xm Ys`) pada navigasi atas di [`frontend/src/components/Dashboard.vue`](file:///home/kevin007/proyek/ippl/simpulkata/frontend/src/components/Dashboard.vue) khusus untuk tampilan layar kecil (viewport `< 640px`) agar pengguna mobile tetap dapat memantau saldo kuota tanpa harus membuka sidebar.
- **Vite Reverse Proxy (`/api`)**: Menambahkan konfigurasi reverse proxy pada `frontend/vite.config.js` untuk meneruskan seluruh lalu lintas permintaan dengan prefix `/api` ke container backend secara internal (`http://backend:3000` di lingkungan Docker, atau fallback ke `http://localhost:3000` saat development lokal).
- **Konfigurasi `BACKEND_URL` di Docker Compose**: Menambahkan environment variable `BACKEND_URL=http://backend:3000` pada service `frontend` di `docker-compose.yml`.
- **Dukungan Base URL Dinamis pada Axios**: Menambahkan konfigurasi `axios.defaults.baseURL` pada `frontend/src/main.js` yang mendukung environment variable `VITE_API_BASE_URL` dengan fallback ke *relative URL* (`''`).

### Changed
- **Migrasi Endpoint API ke Relative Path**:
  - `frontend/src/components/Auth.vue`: Mengubah endpoint login (`/api/auth/login`) dan registrasi (`/api/auth/register`) dari URL absolut `http://localhost:3000` menjadi relative path.
  - `frontend/src/components/Dashboard.vue`: Mengubah endpoint data profil pengguna (`/api/auth/me`), riwayat transkripsi (`/api/history`), dan unggah audio (`/api/process-audio`) menjadi relative path.
