# Changelog

Semua perubahan penting pada proyek **SimpulKata** akan didokumentasikan di berkas ini.

Format berkas ini mengacu pada [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
dan mengikuti prinsip [Semantic Versioning (SemVer)](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased] - 2026-10-20

### Fixed
- **Network Error saat Akses Eksternal & Cloudflare Tunnel**: Memperbaiki kegagalan koneksi (*Network Error*) saat proses login, registrasi, dan pemrosesan audio ketika aplikasi diakses melalui Cloudflare Tunnel (HTTPS) maupun jaringan LAN. Masalah ini disebabkan oleh pemanggilan URL backend yang di-hardcode ke `http://localhost:3000` sehingga diblokir oleh kebijakan keamanan peramban (*Mixed Content Policy*) dan mengarahkan koneksi ke mesin klien pengguna.

### Added
- **Vite Reverse Proxy (`/api`)**: Menambahkan konfigurasi reverse proxy pada `frontend/vite.config.js` untuk meneruskan seluruh lalu lintas permintaan dengan prefix `/api` ke container backend secara internal (`http://backend:3000` di lingkungan Docker, atau fallback ke `http://localhost:3000` saat development lokal).
- **Konfigurasi `BACKEND_URL` di Docker Compose**: Menambahkan environment variable `BACKEND_URL=http://backend:3000` pada service `frontend` di `docker-compose.yml`.
- **Dukungan Base URL Dinamis pada Axios**: Menambahkan konfigurasi `axios.defaults.baseURL` pada `frontend/src/main.js` yang mendukung environment variable `VITE_API_BASE_URL` dengan fallback ke *relative URL* (`''`).

### Changed
- **Migrasi Endpoint API ke Relative Path**:
  - `frontend/src/components/Auth.vue`: Mengubah endpoint login (`/api/auth/login`) dan registrasi (`/api/auth/register`) dari URL absolut `http://localhost:3000` menjadi relative path.
  - `frontend/src/components/Dashboard.vue`: Mengubah endpoint data profil pengguna (`/api/auth/me`), riwayat transkripsi (`/api/history`), dan unggah audio (`/api/process-audio`) menjadi relative path.
