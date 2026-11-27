# 🎙️ SimpulKata - Platform Transkripsi & Rangkuman AI

<p align="center">
  <img src="https://img.shields.io/badge/Vue.js-3.x-4FC08D?style=for-the-badge&logo=vuedotjs&logoColor=white" alt="Vue 3" />
  <img src="https://img.shields.io/badge/Fastify-4.x-000000?style=for-the-badge&logo=fastify&logoColor=white" alt="Fastify" />
  <img src="https://img.shields.io/badge/PostgreSQL-15-336791?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.x-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
</p>

> **SimpulKata** adalah platform web modern untuk transkripsi audio rapat, kuliah, dan wawancara menjadi teks lengkap secara otomatis, sekaligus menghasilkan intisari rangkuman terstruktur menggunakan kecerdasan buatan (*Artificial Intelligence*).

---

## 📌 Daftar Isi
- [Latar Belakang & Deskripsi](#-latar-belakang--deskripsi)
- [Fitur Utama](#-fitur-utama)
- [Arsitektur & Tech Stack](#-arsitektur--tech-stack)
- [Struktur Direktori](#-struktur-direktori)
- [Prasyarat Sistem](#-prasyarat-sistem)
- [Panduan Instalasi & Menjalankan](#-panduan-instalasi--menjalankan)
  - [Opsi 1: Menggunakan Docker Compose (Direkomendasikan)](#opsi-1-menggunakan-docker-compose-direkomendasikan)
  - [Opsi 2: Menjalankan Secara Manual (Development Lokal)](#opsi-2-menjalankan-secara-manual-development-lokal)
- [Konfigurasi Environment Variable](#-konfigurasi-environment-variable)
- [Daftar Endpoint API](#-daftar-endpoint-api)
- [Dokumentasi Rekayasa Perangkat Lunak](#-dokumentasi-rekayasa-perangkat-lunak)
- [Kontributor & Lisensi](#-kontributor--lisensi)

---

## 💡 Latar Belakang & Deskripsi

Dalam kegiatan perkuliahan, rapat kerja, dan wawancara penelitian, pencatatan manual sering kali memakan waktu serta berisiko kehilangan poin-poin penting. **SimpulKata** hadir untuk memecahkan masalah tersebut dengan menggabungkan:
1. **Speech-to-Text (STT)** untuk mengubah rekaman percakapan suara menjadi teks yang akurat.
2. **Large Language Model (LLM)** untuk mengekstraksi dan menyusun ringkasan terstruktur (Topik Utama, Poin-Poin Penting, dan Tindak Lanjut/Rencana Aksi).
3. **Manajemen Kuota Transparan** dengan validasi durasi berkas audio secara lokal di awal sebelum pemanggilan AI agar saldo kuota pengguna terlindungi.

---

## ✨ Fitur Utama

- 🔐 **Autentikasi & Keamanan Akun**:
  - Pendaftaran akun baru (*Register*) dan masuk (*Login*) aman.
  - Enkripsi password menggunakan **bcrypt**.
  - Sesi berbasis **JSON Web Token (JWT)** untuk mengamankan seluruh endpoint data pengguna.
- ⏱️ **Sistem Kuota Transparan & Adil**:
  - Setiap pengguna baru mendapatkan kuota gratis sebesar **30 menit** (*1.800 detik*).
  - Pengecekan durasi audio dilakukan sejak awal menggunakan metadata lokal (`music-metadata`).
  - Pemotongan kuota dihitung per detik aktual, mencegah kegagalan proses di tengah jalan.
- 🎙️ **Transkripsi Berkas Rekaman Audio**:
  - Mendukung berkas format `.mp3`, `.wav`, dan `.m4a` dengan batas ukuran hingga **50MB**.
  - Konversi dan optimalisasi format audio otomatis (*mono 16kHz*) menggunakan `ffmpeg`.
  - Transkripsi akurat menggunakan model *State-of-the-Art* **OpenAI Whisper Large v3**.
- 📝 **Rangkuman Cerdas Terstruktur**:
  - Menghasilkan ringkasan intisari otomatis menggunakan model **Meta Llama 3.1 8B Instruct**.
  - Output tersusun rapi: **Topik Utama**, **Poin Penting**, dan **Tindak Lanjut / Action Items**.
- 📚 **Riwayat & Arsip Transkripsi**:
  - Menyimpan seluruh transkrip dan rangkuman milik masing-masing pengguna.
  - Pencarian dan filter riwayat secara instan.
  - Fitur salin teks ke clipboard serta unduh transkrip/rangkuman dalam format berkas teks (`.txt`).
- 🎨 **Antarmuka Modern (Dark Mode)**:
  - Landing Page publik interaktif dengan simulasi demo transkrip, showcase alur kerja, pilihan paket kuota, dan FAQ.
  - Dashboard pengguna terpadu dengan status bar kuota real-time dan transisi halaman yang mulus.

---

## 🛠️ Arsitektur & Tech Stack

### Frontend
- **Framework**: [Vue 3](https://vuejs.org/) (Composition API, `<script setup>`)
- **Build Tool**: [Vite 8](https://vitejs.dev/)
- **Styling**: [Tailwind CSS 3](https://tailwindcss.com/)
- **HTTP Client**: [Axios](https://axios-http.com/) dengan JWT Bearer Interceptors

### Backend
- **Runtime**: [Node.js](https://nodejs.org/) (v20+)
- **Framework Web**: [Fastify 4](https://fastify.dev/) (Performa tinggi & *low overhead*)
- **Autentikasi**: `@fastify/jwt` & `bcrypt`
- **File Upload**: `@fastify/multipart`
- **Audio Processing**: `music-metadata` & `ffmpeg`
- **Database Client**: `pg` (Node-Postgres Connection Pool)

### Database
- **DBMS**: [PostgreSQL 15](https://www.postgresql.org/)
- **Skema**: Tabel `users` (otentikasi & saldo kuota) dan tabel `transcripts` (riwayat transkrip & rangkuman).

### Layanan Kecerdasan Buatan (AI)
- **Speech-to-Text**: `openai/whisper-large-v3` via Hugging Face Inference API / fal-ai router.
- **Summarization**: `meta-llama/Llama-3.1-8B-Instruct` via Hugging Face Serverless Chat Completion API.

---

## 📁 Struktur Direktori

```text
simpulkata/
├── backend/
│   ├── src/
│   │   ├── config/          # Konfigurasi database PostgreSQL
│   │   ├── controllers/     # Controller logika bisnis (audio & auth)
│   │   ├── routes/          # Definisi route Fastify (/api/auth, /api/process-audio, /api/history)
│   │   ├── services/        # Layanan integrasi AI (Whisper, Llama, audio duration)
│   │   └── server.js        # Entry point aplikasi Fastify
│   ├── storage/uploads/     # Direktori penyimpanan berkas audio sementara
│   ├── init.sql             # Skrip inisialisasi skema tabel & data awal database
│   ├── Dockerfile           # Dockerfile backend Fastify
│   ├── package.json
│   └── .env.example         # Template environment variables backend
├── frontend/
│   ├── src/
│   │   ├── components/      # Komponen Vue (Dashboard.vue, Auth.vue, Home.vue)
│   │   ├── App.vue          # Root component & reactive routing
│   │   ├── main.js          # Entry point Vue 3
│   │   └── style.css        # Tailwind CSS directives
│   ├── Dockerfile           # Dockerfile frontend Nginx / Vite preview
│   ├── package.json
│   └── vite.config.js
├── referensi/
│   ├── SRS.md               # Software Requirements Specification (SRS)
│   ├── SDD.md               # Software Design Description (SDD)
│   ├── erd.puml             # Diagram Entity Relationship (ERD)
│   └── Sequence/            # Diagram sequence PlantUML alur use-case (SD-01 s/d SD-14)
├── docker-compose.yml       # Konfigurasi multi-container Docker
├── .gitignore
└── README.md
```

---

## 💻 Prasyarat Sistem

Sebelum menjalankan aplikasi, pastikan sistem Anda telah terpasang:
- [Docker](https://docs.docker.com/get-docker/) & [Docker Compose](https://docs.docker.com/compose/) *(untuk deployment container)*
- [Node.js](https://nodejs.org/) v20.x atau lebih baru *(jika menjalankan secara manual)*
- [PostgreSQL](https://www.postgresql.org/) v15+ *(jika menjalankan secara manual)*
- [FFmpeg](https://ffmpeg.org/) terpasang di sistem *(jika menjalankan backend secara manual tanpa Docker)*
- **Hugging Face API Token** (Dapat dibuat gratis di [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens))

---

## 🚀 Panduan Instalasi & Menjalankan

### Opsi 1: Menggunakan Docker Compose (Direkomendasikan)

Metode ini akan secara otomatis mengompilasi dan menjalankan database PostgreSQL, backend Fastify, serta frontend Vue dalam satu perintah.

1. **Clone repositori**:
   ```bash
   git clone https://github.com/daedara007/SimpulKata.git
   cd SimpulKata
   ```

2. **Siapkan berkas `.env` untuk backend**:
   ```bash
   cp backend/.env.example backend/.env
   ```
   Buka `backend/.env` dan masukkan token Hugging Face Anda pada variabel `HUGGINGFACE_API_KEY`:
   ```env
   HUGGINGFACE_API_KEY=hf_your_actual_token_here
   ```

3. **Jalankan seluruh container**:
   ```bash
   docker compose up --build -d
   ```

4. **Akses aplikasi**:
   - 🌐 **Frontend Web**: [http://localhost:8080](http://localhost:8080)
   - 🔌 **Backend API**: [http://localhost:3000](http://localhost:3000)
   - 🗄️ **PostgreSQL**: `localhost:5432` (`user: admin`, `password: secretpassword`, `db: simpulkata_db`)

5. **Menghentikan layanan**:
   ```bash
   docker compose down
   ```

---

### Opsi 2: Menjalankan Secara Manual (Development Lokal)

Jika ingin menjalankan aplikasi untuk keperluan pengembangan kode secara lokal tanpa container:

#### 1. Setup Database
Pastikan PostgreSQL aktif, buat database bernama `simpulkata_db`, lalu jalankan skrip inisialisasi:
```bash
psql -U postgres -d simpulkata_db -f backend/init.sql
```

#### 2. Jalankan Backend
```bash
cd backend
cp .env.example .env
# Edit konfigurasi DB_URL dan HUGGINGFACE_API_KEY di file .env

npm install
npm run dev
# Backend akan berjalan di http://localhost:3000
```

#### 3. Jalankan Frontend
Buka terminal baru:
```bash
cd frontend
npm install
npm run dev
# Frontend akan berjalan di http://localhost:8080
```

---

## ⚙️ Konfigurasi Environment Variable

Konfigurasi backend disimpan di berkas `backend/.env`. Variabel yang tersedia:

| Variabel | Deskripsi | Default / Contoh |
|---|---|---|
| `PORT` | Port server backend Fastify | `3000` |
| `NODE_ENV` | Mode lingkungan | `development` / `production` |
| `DB_URL` | URI koneksi PostgreSQL | `postgres://admin:secretpassword@localhost:5432/simpulkata_db` |
| `HUGGINGFACE_API_KEY` | Token API dari Hugging Face | `hf_...` |
| `HF_WHISPER_MODEL` | Model Speech-to-Text | `openai/whisper-large-v3` |
| `HF_SUMMARY_MODEL` | Model LLM Summarization | `meta-llama/Llama-3.1-8B-Instruct` |
| `JWT_SECRET` | Secret key untuk penandatanganan token JWT | `simpulkata-jwt-secret-key` |
| `MAX_UPLOAD_SIZE_MB`| Batas ukuran berkas audio upload (dalam MB) | `50` |
| `UPLOAD_DIR` | Folder penyimpanan sementara berkas upload | `storage/uploads` |

---

## 📡 Daftar Endpoint API

Semua rute API utama diawali dengan `/api` (kecuali root healthcheck). Endpoint bertanda *(Protected)* wajib menyertakan header `Authorization: Bearer <token_jwt>`, dan endpoint *(Admin)* khusus untuk pengguna dengan peran `admin`.

### 1. Health & Sistem
- **`GET /health`** & **`GET /api/health`**
  - Mengecek status server Fastify, lingkungan aktif, dan versi layanan (`1.0.1-beta`).
- **`GET /health/db`**
  - Mengecek status koneksi ke database PostgreSQL.

### 2. Autentikasi (`/api/auth`)
- **`POST /api/auth/register`**
  - Mendaftarkan akun baru (status `PENDING`) dan mengirim kode OTP 6-digit ke email.
- **`POST /api/auth/verify-otp`**
  - Memverifikasi kode OTP, mengaktifkan akun (`ACTIVE`) dengan bonus kuota awal 30 menit, dan mengembalikan token login.
- **`POST /api/auth/resend-otp`**
  - Mengirim ulang kode OTP baru (dilengkapi proteksi *cooldown* 60 detik).
- **`POST /api/auth/forgot-password`**
  - Mengirim kode OTP pemulihan kata sandi ke email pengguna.
- **`POST /api/auth/reset-password`**
  - Memverifikasi OTP pemulihan dan menyetel kata sandi baru.
- **`POST /api/auth/login`**
  - Verifikasi email dan kata sandi, memeriksa status akun, dan mengembalikan Access Token JWT serta Refresh Token.
- **`POST /api/auth/refresh`**
  - Memperbarui Access Token menggunakan Refresh Token (*Refresh Token Rotation*).
- **`POST /api/auth/logout`**
  - Mencabut sesi Refresh Token dari database.
- **`GET /api/auth/me`** *(Protected)*
  - Mengambil data profil dan sisa saldo kuota terkini pengguna yang sedang login.

### 3. Profil & Mutasi Kuota Pengguna (`/api/users`)
- **`GET /api/users/profile`** *(Protected)*
  - Mengambil data profil lengkap pengguna aktif.
- **`PUT /api/users/profile`** *(Protected)*
  - Memperbarui nama, avatar, dan memicu verifikasi OTP untuk perubahan email (memerlukan konfirmasi kata sandi saat ini).
- **`POST /api/users/verify-email-change`** *(Protected)*
  - Memverifikasi kode OTP 6-digit untuk meresmikan alamat email baru.
- **`PUT /api/users/change-password`** *(Protected)*
  - Mengubah kata sandi dengan validasi kata sandi saat ini dan mencabut seluruh sesi aktif.
- **`GET /api/users/quota-mutations`** *(Protected)*
  - Mengambil riwayat mutasi keluar-masuk saldo kuota pengguna (filter: `ALL`, `CREDIT`, `DEBIT`, & paginasi).

### 4. Audio, Chunked Upload & Transkrip (`/api`)
- **`POST /api/process-audio`** *(Protected)*
  - Mengunggah berkas audio (`multipart/form-data`, field: `audio`), memeriksa durasi lokal, memvalidasi kuota, memproses transkripsi STT & rangkuman AI, dan memotong saldo kuota.
- **`POST /api/upload/init`** *(Protected)*
  - Menginisiasi sesi *chunked upload* untuk berkas audio besar (hingga 200MB) dan validasi kuota awal.
- **`POST /api/upload/chunk`** *(Protected)*
  - Mengunggah kepingan (*chunk*) berkas audio secara bertahap.
- **`POST /api/upload/complete`** *(Protected)*
  - Menggabungkan seluruh kepingan berkas, memvalidasi durasi & kuota secara atomik, dan memulai pemrosesan AI di latar belakang.
- **`POST /api/upload/abort`** *(Protected)*
  - Membatalkan sesi upload dan membersihkan kepingan sementara di server.
- **`GET /api/transcripts/:id`** *(Protected)*
  - Mengambil detail dan status pemrosesan satu data transkrip milik pengguna.
- **`GET /api/history`** *(Protected)*
  - Mengambil daftar riwayat transkrip milik pengguna (`page`, `limit`, `search`, `status`).
- **`DELETE /api/history/:id`** *(Protected)*
  - Menghapus satu item riwayat transkrip milik pengguna.

### 5. Paket Kuota, Checkout & Pembayaran Midtrans (`/api/orders` & `/api/webhook`)
- **`GET /api/orders/packages`**
  - Mengambil daftar katalog paket kuota resmi yang tersedia.
- **`POST /api/orders/checkout`** *(Protected)*
  - Menginisiasi transaksi pesanan baru dan membuat Snap Token Midtrans.
- **`GET /api/orders/my-orders`** *(Protected)*
  - Mengambil riwayat transaksi pembelian kuota milik pengguna aktif.
- **`GET /api/orders/:orderNumber`** *(Protected)*
  - Mengambil detail status pesanan berdasarkan nomor order.
- **`POST /api/orders/:orderNumber/sync`** *(Protected)*
  - Menyinkronkan status pesanan *pending* langsung dengan Midtrans API (termasuk deteksi kedaluwarsa & penambahan kuota otomatis jika sudah terbayar).
- **`POST /api/orders/:orderNumber/simulate-pay`** *(Protected)*
  - Simulator pembayaran sukses instan untuk keperluan pengujian sandbox.
- **`POST /api/orders/webhook`** & **`POST /api/webhook/payment`**
  - Endpoint webhook resmi Midtrans untuk verifikasi signature SHA-512 dan pembaruan saldo kuota secara atomik.

### 6. Panel Administrator (`/api/admin`)
- **`GET /api/admin/logs`** *(Admin)*
  - Mengambil riwayat log sistem dengan filter level (`ERROR`, `WARN`, `INFO`), sumber modul (`AUTH`, `AI_SERVICE`, `AUDIO_UPLOAD`, `SYSTEM`, `USER`, `DATABASE`, `PAYMENT`), pencarian, dan paginasi.
- **`GET /api/admin/logs/export`** *(Admin)*
  - Mengunduh laporan log sistem dalam format `.csv`.
- **`GET /api/admin/users`** *(Admin)*
  - Mengambil daftar seluruh pengguna terdaftar beserta statistik ringkasan, filter status, pencarian, dan paginasi.
- **`GET /api/admin/users/export`** *(Admin)*
  - Mengunduh daftar pengguna terdaftar dalam format `.csv`.
- **`GET /api/admin/users/:userId/quota-mutations`** *(Admin)*
  - Mengambil riwayat mutasi kuota milik pengguna tertentu dengan keterangan transkrip yang disamarkan demi menjaga privasi.
- **`POST /api/admin/users/:userId/quota`** *(Admin)*
  - Menambahkan saldo kuota manual langsung ke akun pengguna (`MANUAL_ADJUSTMENT`).
- **`PATCH /api/admin/users/:userId/status`** *(Admin)*
  - Menangguhkan (`SUSPENDED`) atau mengaktifkan kembali (`ACTIVE`) akun pengguna beserta pencabutan sesi aktifnya.
- **`GET /api/admin/transactions`** *(Admin)*
  - Mengambil daftar seluruh transaksi pembayaran global dan ringkasan total pendapatan (*revenue stats*).
- **`GET /api/admin/transactions/export`** *(Admin)*
  - Mengunduh laporan transaksi pembayaran global dalam format `.csv`.

---

## 📖 Dokumentasi Rekayasa Perangkat Lunak

Dokumentasi lengkap pengembangan sistem ini tersedia di dalam direktori [`referensi/`](referensi/):
- **SRS (Software Requirements Specification)**: [`referensi/SRS.md`](referensi/SRS.md) — Mencakup kebutuhan fungsional (UC-01 s/d UC-14), non-fungsional, dan use case diagram.
- **SDD (Software Design Description)**: [`referensi/SDD.md`](referensi/SDD.md) — Desain arsitektur perangkat lunak, diagram kelas, dan rancangan antarmuka.
- **Sequence Diagrams**: [`referensi/Sequence/`](referensi/Sequence/) — Diagram sekuens alur kerja sistem dalam format PlantUML (misal: `SD-09_memproses_audio_menjadi_transkrip.puml`, `SD-11_Melihat_riwayat_transkrip_audio.puml`).
- **Entity Relationship Diagram (ERD)**: [`referensi/erd.puml`](referensi/erd.puml).

---

## 👤 Kontributor & Lisensi

Proyek ini dikembangkan oleh:
- **Nama**: Kevin Jonathan Wijaya
- **NIM**: 11241040
- **Mata Kuliah**: Implementasi dan Pengujian Perangkat Lunak (IPPL)

Didistribusikan di bawah lisensi [MIT](LICENSE). Silakan gunakan dan kembangkan sesuai kebutuhan.
