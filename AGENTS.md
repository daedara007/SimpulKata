# 🤖 AGENTS.md - SimpulKata Project Context & Agent Guidelines

> **Catatan untuk AI Agent**: Berkas ini adalah *Single Source of Truth* mengenai arsitektur, konvensi teknis, dan aturan bisnis pada repositori **SimpulKata**. Setiap agen yang bekerja pada repositori ini wajib membaca dan mematuhi panduan di bawah ini sebelum mengusulkan atau melakukan perubahan kode.

---

## 1. Ikhtisar Proyek (*Project Overview*)

- **Nama Proyek**: SimpulKata
- **Deskripsi**: Platform web cerdas untuk mentranskripsikan rekaman percakapan suara (rapat, kuliah, wawancara) menjadi teks lengkap (*Speech-to-Text*), sekaligus menghasilkan intisari rangkuman terstruktur otomatis menggunakan *Large Language Model* (LLM).
- **Konteks Akademik**: Mata Kuliah **Implementasi dan Pengujian Perangkat Lunak (IPPL)**
- **Pengembang Utama**: Kevin Jonathan Wijaya (NIM: 11241040)
- **Repositori Git**: `https://github.com/daedara007/SimpulKata.git` (Branch: `main`)
- **Dokumentasi Formal**:
  - `referensi/SRS.md`: *Software Requirements Specification* (UC-01 s/d UC-18).
  - `referensi/SDD.md`: *Software Design Description*.
  - `referensi/Sequence/`: Diagram sekuens PlantUML (SD-01 s/d SD-18).
  - `referensi/erd.puml`: Diagram Relasi Entitas database.
  - `CHANGELOG.md`: Catatan rilis dan riwayat perbaikan berkala.

---

## 2. Arsitektur Sistem & Tech Stack

```
[ Frontend (Vue 3 + Vite) ] :8080
       │ (Request relatif: /api/*)
       ▼
[ Vite Dev / Reverse Proxy ] ───► Meneruskan ke backend internal
       │
       ▼
[ Backend (Fastify 4) ] :3000
       ├── Auth (JWT + Bcrypt)
       ├── Audio Controller (Local duration pre-check via music-metadata)
       ├── AI Service (Hugging Face Inference: Whisper & Llama 3.1)
       └── Database Pool (pg)
              │
              ▼
[ Database (PostgreSQL 15) ] :5432
```

### 2.1. Frontend
- **Framework & Bahasa**: Vue 3 (Composition API, `<script setup lang="ts">`), TypeScript 5+.
- **Styling**: Tailwind CSS 3 (Dark Mode glassmorphism, responsif).
- **Routing**: Single Page Application (SPA) berbasis reactive state di `frontend/src/App.vue` (`currentView`: `'home'`, `'auth'`, `'dashboard'`) disinkronkan dengan URL hash.
- **HTTP Client**: Axios dengan global request interceptor (otomatis memasang header `Authorization: Bearer <token>` dari `localStorage['simpulkata_token']`) dan response interceptor (menangani 401 Unauthorized secara terpusat).
- **Markdown Parsing**: Library `marked` untuk merender rangkuman AI secara rapi menjadi elemen HTML semantik tanpa teks mentah berbintang (`**`).

### 2.2. Backend
- **Runtime**: Node.js (v20+).
- **Framework Web**: Fastify 4 (dengan logger `pino-pretty`).
- **Plugins**:
  - `@fastify/cors`: Pengaturan CORS origin.
  - `@fastify/multipart`: Menerima unggahan audio (limit: 50MB, field: `'audio'`).
  - `@fastify/jwt`: Verifikasi dan pembuatan token sesi JWT.
- **Pemrosesan Audio Lokal**:
  - `music-metadata`: Ekstraksi durasi audio langsung dari buffer/file lokal sebelum memanggil AI.
  - `ffmpeg`: Konversi format audio (.wav/.m4a ke mono mp3 16kHz) jika diperlukan.
- **Database Client**: `pg` (Pool query ke PostgreSQL).

### 2.3. Model Kecerdasan Buatan (AI)
- **Speech-to-Text (STT)**: `openai/whisper-large-v3` via Hugging Face Inference API. Whisper menghasilkan teks transkripsi kontinu tuturan alami (tanpa *speaker diarization*).
- **Summarizer (LLM)**: `meta-llama/Llama-3.1-8B-Instruct` via Hugging Face Serverless Chat Completion API.

---

## 3. Aturan & Konvensi Penting (*Critical Rules for Agents*)

### ⚠️ 1. Jangan Gunakan URL Absolut di Frontend (Reverse Proxy Invariant)
- **ATURAN MUTLAK**: Seluruh panggilan API Axios di frontend **WAJIB** menggunakan *relative path* (contoh: `/api/auth/login`, `/api/process-audio`, `/api/history`).
- **ALASAN**: Vite telah dikonfigurasi dengan reverse proxy (`frontend/vite.config.js`) yang meneruskan `/api` ke container backend (`BACKEND_URL=http://backend:3000` di Docker, atau `http://localhost:3000` di development lokal). Menggunakan URL absolut `http://localhost:3000` akan memicu *Mixed Content Error* dan kegagalan jaringan saat aplikasi diakses melalui Cloudflare Tunnel (HTTPS) atau jaringan LAN.

### ⚠️ 2. Pre-Check Durasi Lokal Sebelum Pemanggilan AI (Quota Protection)
- Durasi audio **WAJIB** diekstrak secara lokal terlebih dahulu menggunakan `aiService.getAudioDuration(filePath)` di `audioController.js`.
- Jika saldo kuota pengguna (`user.balance`) lebih kecil dari durasi audio, proses **HARUS LANGSUNG DIBATALKAN** dengan status `402 Insufficient Quota` dan berkas fisik sementara langsung dihapus. Hal ini mencegah konsumsi kuota API AI dan melindungi saldo pengguna dari pemotongan berkas yang tidak cukup kuota.

### ⚠️ 3. Siklus Hidup Berkas Audio Sementara (*Temporary File Cleanup*)
- Berkas audio yang diunggah disimpan sementara di `backend/storage/uploads/`.
- Setelah pemrosesan selesai (baik berstatus sukses maupun gagal), berkas fisik di disk **WAJIB DIHAPUS** menggunakan helper `safeUnlink()`. Jangan biarkan berkas audio tersimpan permanen di disk server demi keamanan privasi pengguna dan efisiensi penyimpanan.

### ⚠️ 4. Format Output Rangkuman & Sanitasi Teks
- Rangkuman LLM harus diformat terstruktur: **Topik Utama**, **Poin-Poin Penting**, dan **Tindak Lanjut / Kesimpulan**.
- Model LLM sering kali menambahkan basa-basi pembuka (misal: *"Berikut adalah rangkuman dari transkripsi rapat/kuliah tersebut:"*). Backend dan Frontend memiliki regex pembersih untuk membuang kalimat pengantar ini.
- Teks rangkuman di frontend **harus selalu dirender menggunakan Markdown parser (`marked`)** dan diberi styling `.summary-markdown` agar tidak menampilkan sintaks mentah seperti `**Judul:**`.

### ⚠️ 5. Antarmuka Pengguna & Jargon Teknis
- **Jangan tampilkan jargon internal** kepada pengguna akhir di UI (misalnya: nama model teknis `Whisper large-v3`, `Llama-3.1-8B`, kode use-case `SRS UC-11 • SD-11`, atau id transkrip mentah UUID).
- Tampilkan istilah yang ramah dan profesional, misalnya: *"Sistem sedang mentranskripsikan audio..."*, *"Kuota terpakai: X menit"*.
- Status paket berbayar (*Edukasi Pro* dan *Enterprise*) saat ini adalah **placeholder / Segera Hadir** dengan tombol dinonaktifkan, sedangkan paket *Starter Free* (30 menit gratis) aktif.

---

## 4. Basis Data & Skema Kunci

Database: PostgreSQL 15 (`simpulkata_db`). Skrip inisialisasi: `backend/init.sql`.

### Tabel `users`
| Kolom | Tipe | Deskripsi |
|---|---|---|
| `id` | UUID (PK) | Identifier unik pengguna (`uuid_generate_v4()`) |
| `name` | VARCHAR(255) | Nama lengkap pengguna |
| `email` | VARCHAR(255) | Email unik pengguna (case-insensitive login) |
| `password_hash` | VARCHAR(255) | Hash kata sandi menggunakan bcrypt (10 rounds) |
| `balance` | INTEGER | Saldo kuota dalam hitungan **detik** (Default: 1.800 detik / 30 menit) |
| `role` | VARCHAR(50) | Peran pengguna (`'user'` atau `'admin'`) |
| `status` | VARCHAR(20) | Status akun (`'PENDING'`, `'ACTIVE'`, `'SUSPENDED'`) |
| `created_at` / `updated_at` | TIMESTAMP | Waktu pembuatan & pembaruan record |

### Tabel `otp_requests`
| Kolom | Tipe | Deskripsi |
|---|---|---|
| `id` | UUID (PK) | Identifier unik permintaan OTP |
| `user_id` | UUID (FK -> users.id) | Pemilik OTP (CASCADE on delete) |
| `otp_code` | VARCHAR(6) | Kode OTP 6-digit numerik |
| `context` | VARCHAR(50) | Konteks OTP (Default: `'registration'`) |
| `expires_at` | TIMESTAMP | Waktu kedaluwarsa OTP (5 menit dari dibuat) |
| `is_used` | BOOLEAN | Status apakah kode telah digunakan |
| `created_at` | TIMESTAMP | Waktu penerbitan OTP |

### Tabel `transcripts`
| Kolom | Tipe | Deskripsi |
|---|---|---|
| `id` | UUID (PK) | Identifier unik transkrip |
| `user_id` | UUID (FK -> users.id) | Pemilik data transkrip (CASCADE on delete) |
| `original_file_name` | VARCHAR(255) | Nama asli berkas audio yang diunggah |
| `file_path` | VARCHAR(500) | Path berkas (bersifat sementara saat diproses) |
| `status` | VARCHAR(50) | `'processing'`, `'completed'`, `'failed'` |
| `raw_text` | TEXT | Hasil teks transkripsi mentah dari Whisper |
| `summary_text` | TEXT | Hasil rangkuman intisari dari Llama 3.1 |
| `duration_seconds` | INTEGER | Durasi audio aktual dalam detik |
| `tokens_used` | INTEGER | Estimasi token LLM yang digunakan |
| `created_at` / `updated_at` | TIMESTAMP | Waktu pembuatan & pembaruan |

---

## 5. Daftar Endpoint API

| Method | Endpoint | Akses | Deskripsi |
|---|---|---|---|
| `POST` | `/api/auth/register` | Publik | Mendaftarkan akun baru (status PENDING) & mengirim kode OTP 6-digit |
| `POST` | `/api/auth/verify-otp` | Publik | Verifikasi kode OTP, aktivasi akun (ACTIVE), & auto-login |
| `POST` | `/api/auth/resend-otp` | Publik | Mengirim ulang kode OTP baru (dengan proteksi cooldown 60 detik) |
| `POST` | `/api/auth/forgot-password` | Publik | Meminta kode OTP pemulihan kata sandi melalui email (SRS UC-03 & SD-03) |
| `POST` | `/api/auth/reset-password` | Publik | Memverifikasi OTP dan menyetel kata sandi baru (SRS UC-03 & SD-03) |
| `POST` | `/api/auth/login` | Publik | Verifikasi login & mengembalikan token JWT |
| `POST` | `/api/auth/refresh` | Publik | Memperbarui access token dengan refresh token (RTR) |
| `POST` | `/api/auth/logout` | Protected (JWT) | Menghapus sesi refresh token dari database |
| `GET` | `/api/auth/me` | Protected (JWT) | Mengambil data profil dan saldo kuota terkini |
| `POST` | `/api/process-audio` | Protected (JWT) | Mengunggah audio, validasi kuota, transkripsi & rangkuman |
| `GET` | `/api/history` | Protected (JWT) | Mengambil arsip riwayat pengguna (pagination & filter) |
| `GET` | `/health` / `/api/health` | Publik | Healthcheck server Fastify |
| `GET` | `/health/db` | Publik | Healthcheck koneksi PostgreSQL |

---

## 6. Operasional & Perintah Kerja

### Menjalankan Lingkungan Docker
```bash
# Menjalankan seluruh layanan (db, backend, frontend) di latar belakang
docker compose up -d

# Melakukan rebuild kontainer setelah perubahan dependensi atau konfigurasi
docker compose up -d --build

# Melihat status kontainer
docker compose ps

# Memeriksa log layanan backend
docker compose logs -f backend
```

### Akses Database via Docker
```bash
docker compose exec db psql -U admin -d simpulkata_db -P pager=off
```

### Menjalankan Manual (Tanpa Docker)
```bash
# Terminal 1: Backend
cd backend && npm run dev    # Berjalan di port 3000

# Terminal 2: Frontend
cd frontend && npm run dev   # Berjalan di port 8080
```

---

## 7. Riwayat Pembaruan Terakhir (*Recent Changelog Highlights*)

- **Commit `48c95db` (Vite Reverse Proxy & Relative URLs)**:
  - Mengatasi masalah *Network Error* saat aplikasi diakses melalui Cloudflare Tunnel (HTTPS) / LAN.
  - Memasang reverse proxy pada `frontend/vite.config.js` (`/api` diteruskan ke `BACKEND_URL`).
  - Mengubah seluruh endpoint Axios di `Auth.vue` dan `Dashboard.vue` menjadi *relative path*.
- **Commit `872cdc5` (Perbaikan Tampilan Rangkuman & Sanitasi Markdown)**:
  - Mengintegrasikan library `marked` pada `Dashboard.vue` untuk mengonversi Markdown menjadi HTML rapi.
  - Menghapus tampilan teks mentah berbintang (`**Judul:**`).
  - Membersihkan otomatis kalimat basa-basi pengantar LLM (*"Berikut adalah rangkuman..."*).
- **Commit `4ea4a64`**: Menambahkan berkas `CHANGELOG.md` untuk mencatat riwayat pembaruan rilis.
- **Commit `4f53784`**: Menambahkan `README.md` dan `backend/.env.example`.
