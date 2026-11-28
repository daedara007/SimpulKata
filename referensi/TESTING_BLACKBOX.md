# 📋 Dokumen Pengujian Perangkat Lunak — Black-Box Testing

**Proyek**: SimpulKata (Platform Transkripsi Audio & Rangkuman AI)  
**Versi Aplikasi**: `v1.0.1-beta`  
**Mata Kuliah**: Implementasi dan Pengujian Perangkat Lunak (IPPL)  
**Pengembang / Penguji**: Kevin Jonathan Wijaya (NIM: 11241040)  
**Tanggal Pengujian**: 27 November 2026  
**Referensi Kebutuhan**: `referensi/SRS.md` (UC-01 s/d UC-18), `referensi/SDD.md`, `referensi/Sequence/SD-01..SD-18`

---

## 1. Metodologi Pengujian Black-Box

Pengujian **Black-Box** dilakukan untuk memverifikasi fungsionalitas sistem dari sudut pandang pengguna akhir (*end-to-end*) dan kontrak API tanpa meninjau struktur kode internal. Teknik perancangan kasus uji yang diterapkan meliputi:

1. ***Equivalence Partitioning* (EP)**: Memilah input menjadi kelas valid dan tidak valid (contoh: format audio `.mp3/.wav/.m4a/.webm` vs `.txt/.exe`, role `'user'` vs `'admin'`, status akun `'ACTIVE'`/`'PENDING'`/`'SUSPENDED'`).
2. ***Boundary Value Analysis* (BVA)**: Menguji nilai batas kritis (contoh: ukuran berkas maksimal `200 MB`, file kosong `0 bytes`, panjang password min `8` karakter, kode OTP `6` digit, penambahan kuota manual admin rentang `1..10.000` menit, saldo kuota `0` detik).
3. ***Use Case & Error Handling Testing***: Memastikan alur utama (*Happy Case*), alur penolakan (*Bad Case*), dan kondisi keamanan/edge (*Edge/Security Case*) berjalan sesuai spesifikasi.

> **Catatan Bukti Pengujian (Terverifikasi 28 November 2026)**:
> - Test case bertanda **`[Puppeteer Verified]`** telah dijalankan secara otomatis menggunakan Chromium *headless* melalui skrip [`scripts/blackbox/run-blackbox.mjs`](../scripts/blackbox/run-blackbox.mjs) terhadap aplikasi aktif (`http://localhost:8080`, `v1.0.1-beta`) dengan **52/52 skenario lolos (0 gagal)** dan menghasilkan **43 tangkapan layar PNG aktual** di direktori `referensi/screenshots/`.
> - Test case bertanda **`[API Verified]`** diverifikasi langsung ke backend `http://localhost:3000`.
> - **Temuan Bug Nyata saat Eksekusi Black-Box (`BB-15`)**: Saat menguji ubah kata sandi melalui UI modal profil, ditemukan bahwa pesan sukses `pwdSuccessMessage` sempat langsung terhapus oleh pemanggilan `resetPasswordForm()` sebelum dirender ke layar. Perbaikan telah diterapkan pada `frontend/src/controllers/useProfileController.ts`, di-*rebuild*, dan diverifikasi kembali hingga tampil sempurna (`screenshots/BB-15_change_password.png`).

---

## 2. Rekapitulasi Cakupan Pengujian

| Kategori Modul | Cakupan Use Case | Jumlah Test Case | Status |
|---|---|---:|---|
| Autentikasi, OTP & Keamanan Sesi | UC-01, UC-02, UC-03 | 12 | Pass |
| Profil, Kata Sandi & Kuota | UC-04, UC-05, UC-06 | 6 | Pass |
| Audio, Chunked Upload & Transkripsi AI | UC-07, UC-08, UC-09, UC-10 | 10 | Pass |
| Riwayat & Arsip Transkripsi | UC-11, UC-12 | 5 | Pass |
| Pembayaran Midtrans, Auto-Sync & Mutasi Kuota | UC-13, UC-14, UC-18 | 9 | Pass |
| Panel Administrator & Keamanan RBAC | UC-15, UC-16, UC-17 + v1.0.1-beta | 10 | Pass |
| Kesehatan Sistem & Responsivitas Mobile | Non-Fungsional | 4 | Pass |
| **Total Kasus Uji Black-Box** | **UC-01 s/d UC-18 + v1.0.1-beta** | **56** | **Pass** |

---

## 3. Daftar Kasus Uji (*Test Cases*)

### A. Autentikasi, Verifikasi OTP & Pemulihan Kata Sandi (UC-01, UC-02, UC-03)

| ID | Use Case | Skenario Pengujian | Tipe | Langkah Pengujian & Data Uji | Expected Result | Actual Result | Status | Bukti / Screenshot |
|---|---|---|---|---|---|---|---|---|
| **BB-01** | UC-01 | Registrasi akun baru dengan data valid | Happy | Buka `/register`, isi Nama `BlackBox Tester`, Email test, Password `SimpulTest123`, klik **Daftar Sekarang** | Akun dibuat berstatus `PENDING`, OTP 6-digit dikirim ke DB/email, halaman berpindah ke verifikasi OTP | `[Puppeteer Verified]` Status `PENDING`, OTP diterbitkan, halaman pindah ke form OTP | Pass | [BB-01_register_otp_screen.png](screenshots/BB-01_register_otp_screen.png) |
| **BB-02** | UC-01 | Registrasi dengan email yang sudah terdaftar | Bad | Buka `/register` di konteks terpisah, isi email `ACTIVE` yang sama, klik **Daftar Sekarang** | Sistem menolak dengan `409 Conflict` & pesan ramah email sudah terdaftar | `[Puppeteer Verified]` Alert penolakan `409` email sudah terdaftar tampil di UI | Pass | [BB-02_duplicate_email.png](screenshots/BB-02_duplicate_email.png) |
| **BB-03** | UC-01 | Verifikasi OTP 6-digit valid | Happy | Masukkan 6-digit OTP valid dari DB, klik **Verifikasi & Masuk** | Status akun menjadi `ACTIVE`, mendapat bonus kuota awal `1.800s` (30 menit) & mutasi `CREDIT`, otomatis login ke `/dashboard` | `[Puppeteer Verified]` Status `ACTIVE`, masuk `/dashboard`, navbar tampil `30 mnt` | Pass | [BB-03_dashboard_after_otp.png](screenshots/BB-03_dashboard_after_otp.png) |
| **BB-04** | UC-01 | Verifikasi OTP salah / kedaluwarsa (>5 menit) | Bad | Masukkan OTP `000000` pada form OTP, klik **Verifikasi & Masuk** | Sistem menolak dengan `400 Bad Request` dan pesan OTP tidak valid | `[Puppeteer Verified]` Alert penolakan OTP tidak valid tampil di UI | Pass | [BB-04_otp_invalid.png](screenshots/BB-04_otp_invalid.png) |
| **BB-05** | UC-01 | Proteksi cooldown kirim ulang OTP (<60 detik) | Edge | Periksa status tombol kirim ulang OTP saat cooldown 60 detik berjalan | Tombol nonaktif (`disabled`) dengan hitung mundur; jika dipaksa via API dibalas `429 Too Many Requests` | `[Puppeteer Verified]` Tombol `disabled` & hitung mundur aktif | Pass | [BB-05_resend_cooldown.png](screenshots/BB-05_resend_cooldown.png) |
| **BB-06** | UC-02 | Login dengan kredensial valid (`ACTIVE`) | Happy | Buka `/login`, isi email & password baru valid, klik **Masuk ke Aplikasi** | Mengembalikan Access Token (15m) & Refresh Token, diarahkan ke `/dashboard` | `[Puppeteer Verified]` `200 OK`, masuk `/dashboard`, token tersimpan | Pass | [BB-06_login_success.png](screenshots/BB-06_login_success.png) |
| **BB-07** | UC-02 | Login dengan password salah / email tidak terdaftar | Bad | Isi email terdaftar + password `PasswordSalah123` di `/login` | Ditolak `401 INVALID_CREDENTIALS` dengan pesan generik `"Email atau kata sandi tidak cocok. Silakan coba lagi."` | `[Puppeteer + API Verified]` `HTTP 401`, pesan generik tampil di UI | Pass | [BB-07_login_invalid.png](screenshots/BB-07_login_invalid.png) |
| **BB-08** | UC-02 | Login dengan payload tipe non-string | Bad | `POST /api/auth/login` body `{"email":123,"password":"abc"}` | Ditolak `400 VALIDATION_ERROR` (bukan 500 Internal Server Error) | `[API Verified]` `HTTP 400`, `VALIDATION_ERROR` | Pass | Output Puppeteer & API |
| **BB-09** | UC-02 | Login menggunakan akun berstatus `SUSPENDED` | Bad | Login memakai akun yang baru ditangguhkan oleh Admin | Ditolak `403 ACCOUNT_SUSPENDED` dengan pesan akun ditangguhkan oleh Administrator | `[Puppeteer Verified]` `HTTP 403`, pesan penangguhan tampil di UI | Pass | [BB-09_login_suspended.png](screenshots/BB-09_login_suspended.png) |
| **BB-10** | UC-02 | Refresh Token Rotation & Logout / Pencabutan Sesi | Happy | Klik tombol Logout atau lakukan ubah kata sandi | Sesi dicabut dan pengguna diarahkan kembali ke `/login` | `[Puppeteer Verified]` Sesi dibersihkan, redirect ke `/login` | Pass | [BB-10_logout_redirect.png](screenshots/BB-10_logout_redirect.png) |
| **BB-11** | UC-03 | Lupa kata sandi & reset dengan OTP valid | Happy | Klik **Lupa kata sandi?**, isi email terdaftar, kirim OTP `password_reset`, isi OTP + password baru `SimpulReset123` | Password diperbarui dengan hash bcrypt baru dan diarahkan ke form login | `[Puppeteer Verified]` Reset password via OTP UI sukses & login ulang berhasil | Pass | [BB-11_forgot_reset_password.png](screenshots/BB-11_forgot_reset_password.png) |
| **BB-12** | UC-03 | Reset kata sandi pada akun `SUSPENDED` | Bad | Request OTP forgot-password atau reset-password untuk akun `SUSPENDED` | Ditolak `403 ACCOUNT_SUSPENDED` | Ditolak `403`, terverifikasi via Unit Test `WB-AUTH` | Pass | Vitest `authController.test.ts` |

---

### B. Profil, Keamanan Kata Sandi & Sisa Kuota (UC-04, UC-05, UC-06)

| ID | Use Case | Skenario Pengujian | Tipe | Langkah Pengujian & Data Uji | Expected Result | Actual Result | Status | Bukti / Screenshot |
|---|---|---|---|---|---|---|---|---|
| **BB-13** | UC-04 | Ubah nama lengkap & avatar profil | Happy | Buka modal Profil, ubah nama menjadi `BB Tester Updated`, masukkan password konfirmasi, klik **Simpan Perubahan** | Nama langsung terbarui di database dan `DashboardNavbar` tanpa relogin | `[Puppeteer Verified]` Profil & Navbar langsung terbarui ke `BB Tester Updated` | Pass | [BB-13_profile_modal.png](screenshots/BB-13_profile_modal.png) |
| **BB-14** | UC-04 | Ubah alamat email dengan konfirmasi password + OTP | Happy | Masukkan email baru `bb_user_new_...` + password saat ini, lalu input 6-digit OTP `email_change` dan klik **Verifikasi & Perbarui** | Email resmi berubah setelah OTP valid dan alert sukses tampil | `[Puppeteer Verified]` Email terbarui ke alamat baru pasca verifikasi OTP UI | Pass | [BB-14_verify_email_change.png](screenshots/BB-14_verify_email_change.png) |
| **BB-15** | UC-05 | Ubah kata sandi dengan password lama benar | Happy | Pada tab **Ubah Sandi**, isi password saat ini benar, password baru `SimpulBaru123`, klik **Ubah Kata Sandi** | Password diperbarui, pesan sukses tampil, seluruh sesi dicabut & redirect `/login` | `[Puppeteer Verified]` Pesan sukses tampil (*pasca perbaikan bug*), sesi dicabut ke `/login` | Pass | [BB-15_change_password.png](screenshots/BB-15_change_password.png) |
| **BB-16** | UC-05 | Ubah kata sandi dengan password lama salah | Bad | Isi password saat ini salah (`WrongPassword99`), klik **Ubah Kata Sandi** | Ditolak `400` dengan pesan `"Password saat ini tidak benar."` | `[Puppeteer Verified]` Alert penolakan tampil di modal tanpa menutup sesi | Pass | [BB-16_wrong_password.png](screenshots/BB-16_wrong_password.png) |
| **BB-17** | UC-06 | Tampilan sisa kuota di Desktop & Mobile Navbar | Happy | Login dan cek indikator kuota di `DashboardNavbar` pada layar `1280px` dan `375px` | Sisa kuota tampil dalam format menit ramah (`230 mnt`) di desktop maupun mobile | `[Puppeteer Verified]` Indikator kuota tampil jelas di kedua ukuran layar | Pass | [BB-17_mobile_dashboard_375px.png](screenshots/BB-17_mobile_dashboard_375px.png) |
| **BB-18** | UC-06 | Akses `/api/history` tanpa token JWT | Bad | `GET /api/history` tanpa header `Authorization` | Ditolak `401 UNAUTHORIZED` | `[API Verified]` `HTTP 401 UNAUTHORIZED` | Pass | Output Puppeteer & API |

---

### C. Unggah Audio, Rekam Langsung, Transkripsi STT & Rangkuman AI (UC-07 s/d UC-10)

| ID | Use Case | Skenario Pengujian | Tipe | Langkah Pengujian & Data Uji | Expected Result | Actual Result | Status | Bukti / Screenshot |
|---|---|---|---|---|---|---|---|---|
| **BB-19** | UC-07 | Unggah berkas audio valid (`.mp3`/`.wav`/`.m4a`) < 200MB | Happy | Pilih file audio ucapan manusia valid dengan saldo cukup, klik **Proses Transkripsi** | Durasi diekstrak lokal, kuota dipotong atomik, transkrip & rangkuman tampil | Terverifikasi melalui Unit Test lengkap `WB-AUD` (`audioController.test.ts`) | Pass | Vitest `audioController.test.ts` |
| **BB-20** | UC-07 | Unggah berkas berformat tidak didukung (`.txt`/`.pdf`) | Bad | Unggah file `.txt` pada `AudioUploadCard` | Ditolak sebelum menyentuh AI dengan peringatan format tidak didukung | `[Puppeteer Verified]` Alert format tidak didukung tampil di UI | Pass | [BB-20_invalid_format.png](screenshots/BB-20_invalid_format.png) |
| **BB-21** | UC-07 | Unggah file kosong (`0 bytes`) atau header audio rusak | Bad | Unggah file `.mp3` berukuran `0 bytes`, klik **Proses Transkripsi** | Ditolak `400 EMPTY_FILE`, kuota tidak terpotong, file sementara dihapus | `[Puppeteer Verified]` Ditolak `400`, alert UI tampil, kuota tetap utuh | Pass | [BB-21_empty_file_error.png](screenshots/BB-21_empty_file_error.png) |
| **BB-22** | UC-07 | Batas ukuran maksimal berkas (>200MB vs <=200MB) | Edge (BVA) | Unggah berkas *sparse* berukuran `201 MB` pada `AudioUploadCard` | Ditolak seketika di sisi klien dengan pesan batas maksimal `200MB` | `[Puppeteer Verified]` Alert `"Ukuran file melebihi batas maksimal 200MB"` tampil | Pass | [BB-22_max_size_200mb.png](screenshots/BB-22_max_size_200mb.png) |
| **BB-23** | UC-07 | *Chunked Upload* berkas besar (>5MB) | Happy | Unggah file `.wav` `6.06 MB` melalui `/api/upload/init`, `/chunk`, `/complete` | File dipecah menjadi 2 chunk (`5MB/keping`) dengan progress bar real-time | `[Puppeteer Verified]` Progress bar `Kepingan 1 dari 2 terkirim` berjalan | Pass | [BB-23_chunked_upload_progress.png](screenshots/BB-23_chunked_upload_progress.png) |
| **BB-24** | UC-08 | Rekam suara langsung lewat mikrofon peramban | Happy | Buka tab **Rekam Langsung**, klik **Mulai Merekam** (`--use-fake-device-for-media-stream`), rekam 2s, klik **Hentikan Rekaman** | Timer berjalan, rekaman `.m4a`/`.webm` selesai dengan pemutar pratinjau | `[Puppeteer Verified]` Rekaman virtual berhasil & pratinjau audio tampil | Pass | [BB-24_live_recording.png](screenshots/BB-24_live_recording.png), [BB-24_live_recording_active.png](screenshots/BB-24_live_recording_active.png) |
| **BB-25** | UC-09 | Pre-check kuota tidak cukup (durasi > sisa saldo) | Bad (BVA) | User bersisa saldo `1s` mengunggah `.wav` valid berdurasi `3s` | Ditolak seketika `402 INSUFFICIENT_QUOTA` sebelum memanggil API AI Whisper | `[Puppeteer Verified]` `402` tampil ramah (`melebihi sisa saldo kuota`), saldo tetap `1 dtk` | Pass | [BB-25_insufficient_quota_402.png](screenshots/BB-25_insufficient_quota_402.png) |
| **BB-26** | UC-09 | Pengembalian kuota (*Refund*) saat audio hening / gagal AI | Edge | Unggah audio hening total (`6.06 MB` silent WAV) ke pipeline Whisper aktif | Whisper mendeteksi tidak ada ucapan, status `failed`, kuota dikembalikan (`1.800s` utuh) | `[Puppeteer Verified]` Notice `"Kuota telah dikembalikan"` tampil & saldo utuh `1800s` | Pass | [BB-26_silent_audio_refund.png](screenshots/BB-26_silent_audio_refund.png) |
| **BB-27** | UC-10 | Tampilan rangkuman terstruktur & sanitasi Markdown/XSS | Happy | Buka `/transcripts/:id` dengan payload `<script>window.__xss=1</script>` dan sintaks Markdown | Rangkuman terformat HTML rapi tanpa tag `**` mentah dan skrip XSS terhapus (`DOMPurify`) | `[Puppeteer Verified]` `<script>` dihapus DOMPurify (`Script removed=true`), `<h3>`/`<strong>` tampil | Pass | [BB-27_bb30_transcript_detail_markdown.png](screenshots/BB-27_bb30_transcript_detail_markdown.png) |
| **BB-28** | UC-10 | Salin teks & unduh hasil `.txt` | Happy | Klik **Salin Rangkuman** & **Unduh TXT** di `AudioResultCard` | Tombol berubah `"Tersalin!"` dan file `.txt` berhasil terunduh ke disk | `[Puppeteer Verified]` Toast `"Tersalin!"` tampil & file `.txt` terunduh valid | Pass | [BB-28_copy_download_txt.png](screenshots/BB-28_copy_download_txt.png) |

---

### D. Riwayat & Arsip Transkripsi (UC-11, UC-12)

| ID | Use Case | Skenario Pengujian | Tipe | Langkah Pengujian & Data Uji | Expected Result | Actual Result | Status | Bukti / Screenshot |
|---|---|---|---|---|---|---|---|---|
| **BB-29** | UC-11 | Melihat daftar riwayat, filter status (`Semua`/`Selesai`/`Gagal`), & pencarian | Happy | Buka `/history`, uji filter `Selesai` vs `Gagal` | Daftar riwayat terfilter akurat sesuai milik user yang login | `[Puppeteer Verified]` Filter `Selesai` menyembunyikan item `Gagal` | Pass | [BB-29_history_desktop.png](screenshots/BB-29_history_desktop.png) |
| **BB-30** | UC-11 | Membuka detail dokumen riwayat mandiri | Happy | Klik salah satu kartu riwayat di `/history` | Navigasi ke `/transcripts/:id` menampilkan detail lengkap tanpa kotak upload | `[Puppeteer Verified]` Navigasi sukses ke `/transcripts/:id` fokus dokumen | Pass | [BB-27_bb30_transcript_detail_markdown.png](screenshots/BB-27_bb30_transcript_detail_markdown.png) |
| **BB-31** | UC-11 | Isolasi data multi-tenant saat akses ID transkrip user lain | Edge (Security) | User A memanggil `GET /api/transcripts/<id-milik-user-B>` | Ditolak `404` / `403` (tidak membocorkan data pengguna lain) | Akses ditolak dengan kepemilikan berbasis `user_id` | Pass | Vitest & Query DAO |
| **BB-32** | UC-11 | Query pagination tidak numerik (`?page=abc`) | Bad | Akses `GET /api/history?page=abc` dengan token valid | Ditangani aman dengan fallback ke halaman 1 (bukan 500 NaN error) | `[API Verified]` Mengembalikan `HTTP 200` halaman 1 | Pass | Output Puppeteer & API |
| **BB-33** | UC-12 | Menghapus item riwayat transkripsi | Happy | Klik ikon hapus di `/history` -> tangkap modal konfirmasi -> klik **Ya, Hapus** | Modal `"Hapus Riwayat Transkripsi?"` tampil, item terhapus permanen setelah konfirmasi | `[Puppeteer Verified]` Modal konfirmasi & penghapusan permanen UI berhasil | Pass | [BB-33_delete_history_confirm.png](screenshots/BB-33_delete_history_confirm.png) |

---

### E. Pembelian Kuota Midtrans, Auto-Sync & Mutasi Saldo (UC-13, UC-14, UC-18)

| ID | Use Case | Skenario Pengujian | Tipe | Langkah Pengujian & Data Uji | Expected Result | Actual Result | Status | Bukti / Screenshot |
|---|---|---|---|---|---|---|---|---|
| **BB-34** | UC-13 | Mengambil daftar katalog paket kuota resmi | Happy | `GET /api/orders/packages` | Mengembalikan 3 paket resmi (`starter_200`, `pro_450`, `enterprise_1200`) | `[API Verified]` `HTTP 200` mengembalikan 3 paket resmi | Pass | Output Puppeteer & API |
| **BB-35** | UC-13 | Inisiasi checkout pesanan paket kuota | Happy | Buka `TopUpModal` dari `/transactions`, pilih **Paket Starter** | Order `pending` tercatat di tabel `orders` dan modal paket tampil lengkap | `[Puppeteer Verified]` 3 paket tampil di modal & checkout berhasil diterbitkan | Pass | [BB-35_topup_modal.png](screenshots/BB-35_topup_modal.png) |
| **BB-36** | UC-14 | Simulasi pembayaran sukses sandbox (`simulate-pay`) | Happy | Jalankan `POST /api/orders/:orderNumber/simulate-pay` dan muat ulang `/transactions` | Status order menjadi `completed`, saldo kuota bertambah `+200 mnt` (menjadi `230 mnt`) | `[Puppeteer Verified]` Saldo navbar naik ke `230 mnt` & order berstatus selesai | Pass | [BB-36_bb40_transactions_orders.png](screenshots/BB-36_bb40_transactions_orders.png) |
| **BB-37** | UC-14 | Webhook Midtrans dengan Digital Signature valid vs palsu | Edge (Security) | Kirim `POST /api/webhook/payment` dengan payload `{}` atau `signature_key` salah | Payload kosong -> `400`; signature salah -> `401`; signature valid -> `200` | `[API Verified]` Empty=`400`, BadSig=`401` (+ Vitest `WB-PAY`) | Pass | Output Puppeteer & Vitest |
| **BB-38** | UC-14 | Proteksi Idempotency webhook duplikat | Edge | Kirim ulang webhook `settlement` untuk `order_id` yang sudah berstatus `completed` | Webhook kedua diabaikan aman tanpa menambah saldo kuota dua kali | Saldo tidak bertambah ganda (`duplicate: true`) | Pass | Vitest `WB-PAY-04` |
| **BB-39** | UC-14 | Auto-Sync pesanan *pending* & kedaluwarsa (`sync`) | Happy | Tampilkan pesanan `pending` di `/transactions` lalu panggil `POST /api/orders/:orderNumber/sync` | Pesanan `pending` tampil di UI dan endpoint sync merespons `HTTP 200` | `[Puppeteer + API Verified]` Pesanan pending tampil & sync berjalan | Pass | [BB-39_pending_order_sync.png](screenshots/BB-39_pending_order_sync.png) |
| **BB-40** | UC-18 | Melihat riwayat pembelian pribadi (`/transactions`) | Happy | Buka menu **Tagihan** -> Tab **Riwayat Pembelian (Top Up)** | Menampilkan daftar order milik pengguna yang sedang login saja | `[Puppeteer Verified]` Invoice `ORD-...` tampil sesuai akun | Pass | [BB-36_bb40_transactions_orders.png](screenshots/BB-36_bb40_transactions_orders.png) |
| **BB-41** | UC-18 | Melihat buku besar **Mutasi Saldo Kuota** & filter (`Semua`/`Masuk`/`Keluar`) | Happy | Buka tab **Mutasi Saldo Kuota**, klik filter `+ Kuota Masuk` | Menampilkan mutasi `CREDIT` (+ hijau) dan saldo akhir dengan filter aktif | `[Puppeteer Verified]` Mutasi top-up & registrasi tampil rapi | Pass | [BB-41_quota_mutations.png](screenshots/BB-41_quota_mutations.png) |
| **BB-42** | UC-18 | Akses halaman Tagihan oleh user belum login | Bad | Buka `/transactions` sebelum autentikasi | Router guard mengarahkan ke `/login?redirect=/transactions` | `[Puppeteer Verified]` Redirect otomatis ke `/login` | Pass | [BB-42_auth_guard_redirect.png](screenshots/BB-42_auth_guard_redirect.png) |

---

### F. Panel Administrator & Fitur Kontrol v1.0.1-beta (UC-15, UC-16, UC-17)

| ID | Use Case | Skenario Pengujian | Tipe | Langkah Pengujian & Data Uji | Expected Result | Actual Result | Status | Bukti / Screenshot |
|---|---|---|---|---|---|---|---|---|
| **BB-43** | Security | Akses endpoint `/api/admin/*` tanpa login atau oleh role `user` | Bad (RBAC) | `GET /api/admin/users` tanpa token, dengan token `user`, serta buka `/admin/users` di UI sebagai `user` | API: `401` / `403`; UI: redirect kembali ke `/dashboard` | `[Puppeteer + API Verified]` API=`401`/`403`, UI redirect ke `/dashboard` | Pass | [BB-43_rbac_redirect.png](screenshots/BB-43_rbac_redirect.png) |
| **BB-44** | UC-15 | Memantau Log Sistem, filter level & sumber modul (`PAYMENT`) | Happy | Login Admin, buka `/admin/logs`, pilih filter sumber `PAYMENT` | Menampilkan entri log terkait pembayaran dan penambahan kuota manual | `[Puppeteer Verified]` Filter `PAYMENT` menampilkan log penambahan kuota | Pass | [BB-44_admin_logs_payment.png](screenshots/BB-44_admin_logs_payment.png) |
| **BB-45** | UC-15 | Ekspor Log Sistem ke CSV | Happy | Klik tombol **Ekspor CSV** pada halaman Log Sistem | Mengunduh berkas `simpulkata-logs-*.csv` valid berisi data log terformat | `[Puppeteer Verified]` Berkas CSV terunduh & valid (`>20 bytes`) | Pass | [BB-45_admin_logs_csv.png](screenshots/BB-45_admin_logs_csv.png) |
| **BB-46** | UC-16 | Daftar Pengguna, pencarian & modal Detail Pengguna | Happy | Buka `/admin/users`, cari `bbUserNewEmail` + Enter, klik **Detail** | Modal terbuka dengan backdrop blur penuh sampai atas (via `<Teleport>`), menampilkan profil & mutasi | `[Puppeteer Verified]` Modal `BB Tester Updated` tampil menutupi seluruh viewport | Pass | [BB-46_bb47_admin_user_detail_modal.png](screenshots/BB-46_bb47_admin_user_detail_modal.png) |
| **BB-47** | v1.0.1-beta | Penyamaran privasi mutasi transkrip pada tampilan Admin | Edge (Privacy) | Lihat tab **Riwayat Mutasi** di modal detail user yang memiliki record transkripsi | Keterangan transkrip disamarkan (`Pemakaian Transkripsi Audio`) tanpa menampilkan nama file asli | `[Puppeteer Verified]` `Filename hidden=true`, label generik tampil | Pass | [BB-46_bb47_admin_user_detail_modal.png](screenshots/BB-46_bb47_admin_user_detail_modal.png) |
| **BB-48** | v1.0.1-beta | Penambahan kuota manual oleh Admin (`1..10.000` menit) | Happy/BVA | Pada tab **+ Tambah Kuota**, klik `+30 Menit`, isi catatan, submit; uji API input `0` | Input `30` sukses menambah saldo `+30 mnt`; input `0` ditolak `400` | `[Puppeteer + API Verified]` Penambahan `+30 mnt` sukses, input `0` ditolak `400` | Pass | [BB-48_admin_add_quota.png](screenshots/BB-48_admin_add_quota.png) |
| **BB-49** | v1.0.1-beta | Penangguhan akun (`SUSPENDED`) & pengaktifan kembali (`ACTIVE`) | Happy | Klik **Tangguhkan Akun** -> konfirmasi **Ya, Tangguhkan** | Status berubah `SUSPENDED`, seluruh sesi aktif user dicabut seketika | `[Puppeteer Verified]` Badge status berubah menjadi `SUSPENDED` | Pass | [BB-49_admin_suspend_user.png](screenshots/BB-49_admin_suspend_user.png) |
| **BB-50** | v1.0.1-beta | Larangan menangguhkan sesama akun Administrator | Edge (Security) | Admin memanggil `PATCH /api/admin/users/:adminId/status` menjadi `SUSPENDED` | Ditolak `403 CANNOT_MODIFY_ADMIN_STATUS` (tombol tangguhkan juga disembunyikan di UI admin) | `[API Verified]` Ditolak `HTTP 403` (+ Vitest `WB-ADM-06`) | Pass | Output Puppeteer & Vitest |
| **BB-51** | UC-17 | Melihat Transaksi Global & statistik total pendapatan | Happy | Buka `/admin/transactions` | Menampilkan 4 widget metrik pendapatan & tabel transaksi seluruh user | `[Puppeteer Verified]` 4 widget revenue & tabel transaksi global tampil | Pass | [BB-51_admin_transactions.png](screenshots/BB-51_admin_transactions.png) |
| **BB-52** | UC-17 | Ekspor Transaksi Global ke CSV | Happy | Klik tombol **Ekspor CSV** pada halaman Transaksi Global | Mengunduh laporan `simpulkata-transactions-*.csv` terformat lengkap | `[Puppeteer Verified]` Berkas CSV transaksi terunduh & valid | Pass | [BB-52_admin_transactions_csv.png](screenshots/BB-52_admin_transactions_csv.png) |

---

### G. Kesehatan Sistem, Landing Page & Responsivitas Mobile (Non-Fungsional)

| ID | Kategori | Skenario Pengujian | Tipe | Langkah Pengujian & Data Uji | Expected Result | Actual Result | Status | Bukti / Screenshot |
|---|---|---|---|---|---|---|---|---|
| **BB-53** | Health | Healthcheck backend API & versi | Happy | `GET /api/health` | `200 OK`, mengembalikan `version: "1.0.1-beta"` | `[API Verified]` `HTTP 200`, `"version":"1.0.1-beta"` | Pass | Output Puppeteer & `curl` |
| **BB-54** | Health | Healthcheck koneksi PostgreSQL | Happy | `GET /health/db` | `200 OK`, `database: "connected"`, versi PostgreSQL 15 | `[API Verified]` `HTTP 200`, `database: "connected"` | Pass | Output Puppeteer & `curl` |
| **BB-55** | Mobile UI | Tata letak Dashboard & Riwayat pada layar ponsel (`375px`) | Happy | Buka `/dashboard` & `/history` dengan Puppeteer Mobile (`375x812`) | Navigasi bawah mobile tampil rapi, filter tab Riwayat `w-fit`, tanpa horizontal overflow | `[Puppeteer Verified]` `scrollWidth <= innerWidth (true)`, UI bersih | Pass | [BB-55_mobile_history_375px.png](screenshots/BB-55_mobile_history_375px.png) |
| **BB-56** | Proxy / Tunnel | Akses aplikasi via Reverse Proxy / Cloudflare Tunnel HTTPS & Landing Page Paket/FAQ | Happy | Akses `/` (paket kuota & FAQ terbaru) serta pastikan seluruh request `/api/*` relatif | Paket kuota Midtrans (Rp 50rb/100rb/250rb) & FAQ terbaru tampil, jalur relatif berjalan via tunnel HTTPS | `[Puppeteer Verified]` Kartu paket & FAQ terbaru tampil rapi; jalur proxy relatif aktif | Pass | [BB-00_landing_pricing.png](screenshots/BB-00_landing_pricing.png), [BB-00_landing_faq.png](screenshots/BB-00_landing_faq.png) |

---

## 4. Lampiran: Re-Verifikasi Temuan QA Awal (`testingippl.md`)

Seluruh temuan kritis dan fungsional dari review QA fase awal (`CR-01` s/d `CR-19`) telah diaudit kembali terhadap basis kode **`v1.0.1-beta`** dengan hasil berikut:

| ID Temuan | Ringkasan Masalah Lama | Perbaikan pada `v1.0.1-beta` | Status Akhir |
|---|---|---|---|
| **CR-01** | Fallback hardcoded `JWT_SECRET` di `server.js` | Dihapus; menggunakan secret dari `.env` (`server.ts`) | **Resolved (Pass)** |
| **CR-02** | Durasi audio 0 detik lolos diproses gratis | Ditolak `400 INVALID_AUDIO_FILE` jika durasi `<= 0` | **Resolved (Pass)** |
| **CR-03** | Pemotongan saldo kuota tidak atomik (race condition) | Reservasi atomik di awal (`userModel.reserveBalance` dengan `WHERE balance >= $1`) + refund bila gagal | **Resolved (Pass)** |
| **CR-04** | Vite dev server memblokir host Cloudflare Tunnel | Konfigurasi `allowedHosts` & reverse proxy relatif `/api` | **Resolved (Pass)** |
| **CR-05** | Potensi XSS `v-html` pada hasil rangkuman Markdown | Disanitasi dengan `DOMPurify.sanitize(marked.parse(...))` | **Resolved (Pass)** |
| **CR-06** | Proses STT+LLM sinkron memicu timeout 524 Cloudflare | Diproses asinkron di background (`202 Accepted` + polling status + *Chunked Upload* 200MB) | **Resolved (Pass)** |
| **CR-07** | Parameter `?page=abc` memicu `500 NaN` | Validasi & sanitasi `Number.isFinite` dengan nilai default aman | **Resolved (Pass)** |
| **CR-08** | Audio hening / gagal LLM membuang hasil & error 500 | Penanganan error ramah, `cleanWhisperTranscript`, dan refund kuota otomatis | **Resolved (Pass)** |
| **CR-11** | Event `hashchange` bentrok dengan anchor landing page | Diganti sepenuhnya dengan **Vue Router v4** History API | **Resolved (Pass)** |
| **CR-15** | Pesan teknis Axios & referensi Postman tampil di UI | Error handler disanitasi menjadi pesan pengguna yang ramah | **Resolved (Pass)** |
| **CR-16** | Sisa kuota tersembunyi di layar mobile `< 640px` | Indikator kuota & sub-navbar mobile ditampilkan jelas di `DashboardLayout` | **Resolved (Pass)** |
| **CR-17** | Login tanpa validasi tipe string (`{"email":123}`) -> 500 | Validasi `typeof email !== 'string'` mengembalikan `400 VALIDATION_ERROR` | **Resolved (Pass)** |
| **CR-19** | Record `processing` menggantung selamanya jika server restart | Pembersihan otomatis status menggantung & orphan chunk saat startup | **Resolved (Pass)** |


---

## 5. Lampiran Visual — Galeri Tangkapan Layar Pengujian Black-Box (43 Gambar Aktual)

Seluruh tangkapan layar di bawah ini dihasilkan secara otomatis oleh skrip [`scripts/blackbox/run-blackbox.mjs`](../scripts/blackbox/run-blackbox.mjs) menggunakan Chromium *headless* terhadap sistem yang berjalan pada `v1.0.1-beta`.

### 5.1. Landing Page, Paket Kuota, & FAQ (`BB-56`)

#### BB-56 (A) — Paket Kuota Fleksibel Midtrans di Halaman Utama
![BB-56 Paket Kuota](screenshots/BB-00_landing_pricing.png)

#### BB-56 (B) — FAQ Pembaruan Pembelian Kuota
![BB-56 FAQ](screenshots/BB-00_landing_faq.png)

---

### 5.2. Autentikasi, Registrasi OTP, & Pemulihan Kata Sandi (`BB-01` s/d `BB-11`, `BB-42`)

#### BB-01 — Registrasi Akun Baru Menuju Layar Verifikasi OTP
![BB-01 Register OTP](screenshots/BB-01_register_otp_screen.png)

#### BB-02 — Penolakan Registrasi Email Duplikat (`409 Conflict`)
![BB-02 Duplicate Email](screenshots/BB-02_duplicate_email.png)

#### BB-03 — Verifikasi OTP Valid & Masuk Dashboard dengan Bonus 30 Menit
![BB-03 Dashboard 30m](screenshots/BB-03_dashboard_after_otp.png)

#### BB-04 — Penolakan Verifikasi OTP Tidak Valid (`000000`)
![BB-04 Invalid OTP](screenshots/BB-04_otp_invalid.png)

#### BB-05 — Proteksi Cooldown Kirim Ulang OTP (< 60 Detik)
![BB-05 Resend Cooldown](screenshots/BB-05_resend_cooldown.png)

#### BB-06 — Login Kredensial Valid dengan Kata Sandi Aktif
![BB-06 Login Success](screenshots/BB-06_login_success.png)

#### BB-07 — Login Kredensial Salah Menampilkan Pesan Generik
![BB-07 Login Invalid](screenshots/BB-07_login_invalid.png)

#### BB-09 — Penolakan Login Akun Berstatus `SUSPENDED` (`403 Forbidden`)
![BB-09 Login Suspended](screenshots/BB-09_login_suspended.png)

#### BB-10 — Pencabutan Sesi & Pengalihan ke Halaman `/login`
![BB-10 Logout Redirect](screenshots/BB-10_logout_redirect.png)

#### BB-11 — Lupa Kata Sandi & Reset Menggunakan OTP Pemulihan
![BB-11 Forgot Password Reset](screenshots/BB-11_forgot_reset_password.png)

#### BB-42 — Proteksi Router Guard Halaman Tagihan (`/transactions`) Belum Login
![BB-42 Auth Guard Redirect](screenshots/BB-42_auth_guard_redirect.png)

---

### 5.3. Profil Pengguna, Ubah Email OTP, & Ubah Kata Sandi (`BB-13` s/d `BB-17`)

#### BB-13 — Pembaruan Nama Profil & Sinkronisasi Reaktif Navbar
![BB-13 Profile Modal](screenshots/BB-13_profile_modal.png)

#### BB-14 — Verifikasi Alamat Email Baru Menggunakan OTP 6-Digit
![BB-14 Verify Email Change](screenshots/BB-14_verify_email_change.png)

#### BB-15 — Ubah Kata Sandi Berhasil (Pesan Sukses & Pencabutan Sesi)
![BB-15 Change Password Success](screenshots/BB-15_change_password.png)

#### BB-16 — Penolakan Ubah Kata Sandi dengan Password Saat Ini Salah
![BB-16 Wrong Current Password](screenshots/BB-16_wrong_password.png)

#### BB-17 — Indikator Sisa Kuota pada Layar Mobile (`375px`)
![BB-17 Mobile Quota](screenshots/BB-17_mobile_dashboard_375px.png)

---

### 5.4. Validasi Audio, Chunked Upload, Live Mic, & Hasil AI (`BB-20` s/d `BB-28`)

#### BB-20 — Penolakan Format Berkas Tidak Didukung (`.txt`)
![BB-20 Invalid Format](screenshots/BB-20_invalid_format.png)

#### BB-21 — Penolakan Berkas Kosong (`0 bytes`) Sebelum Menyentuh AI
![BB-21 Empty File](screenshots/BB-21_empty_file_error.png)

#### BB-22 — Validasi BVA Batas Ukuran Maksimal (> 200MB)
![BB-22 Max Size 200MB](screenshots/BB-22_max_size_200mb.png)

#### BB-23 — Mekanisme Chunked Upload Berkas Besar (> 5MB / 2 Kepingan)
![BB-23 Chunked Upload](screenshots/BB-23_chunked_upload_progress.png)

#### BB-24 (A) — Mode Perekaman Mikrofon Langsung Aktif (Web Audio API)
![BB-24 Recording Active](screenshots/BB-24_live_recording_active.png)

#### BB-24 (B) — Pratinjau Audio Hasil Rekaman Mikrofon Siap Diproses
![BB-24 Recording Preview](screenshots/BB-24_live_recording.png)

#### BB-25 — Pre-Check Kuota Tidak Cukup Menolak `402` Sebelum Pemanggilan AI
![BB-25 Insufficient Quota](screenshots/BB-25_insufficient_quota_402.png)

#### BB-26 — Pengembalian Kuota Otomatis (`REFUND`) Saat Audio Hening Tanpa Ucapan
![BB-26 Silent Audio Refund](screenshots/BB-26_silent_audio_refund.png)

#### BB-27 & BB-30 — Halaman Detail Transkrip Mandiri, Rendering Markdown & Sanitasi XSS (`DOMPurify`)
![BB-27 BB-30 Transcript Detail](screenshots/BB-27_bb30_transcript_detail_markdown.png)

#### BB-28 — Tombol Salin Rangkuman (`Tersalin!`) & Unduh Berkas `.txt`
![BB-28 Copy and Download TXT](screenshots/BB-28_copy_download_txt.png)

---

### 5.5. Riwayat Transkripsi, Tagihan Midtrans, & Mutasi Kuota (`BB-29`, `BB-33`, `BB-35`..`BB-41`, `BB-55`)

#### BB-29 — Daftar Riwayat, Filter Status & Pencarian Desktop
![BB-29 History Desktop](screenshots/BB-29_history_desktop.png)

#### BB-33 — Dialog Konfirmasi Hapus Item Riwayat Transkripsi
![BB-33 Delete History Confirm](screenshots/BB-33_delete_history_confirm.png)

#### BB-35 — Modal Top Up Kuota Menampilkan 3 Paket Resmi Midtrans
![BB-35 TopUp Modal](screenshots/BB-35_topup_modal.png)

#### BB-36 & BB-40 — Pembayaran Sukses Sandbox (+200 mnt) & Riwayat Pembelian Pribadi
![BB-36 BB-40 Transactions Orders](screenshots/BB-36_bb40_transactions_orders.png)

#### BB-39 — Status Pesanan `Pending` & Sinkronisasi Gateway di Halaman Tagihan
![BB-39 Pending Order Sync](screenshots/BB-39_pending_order_sync.png)

#### BB-41 — Buku Besar Mutasi Saldo Kuota (`+ Kuota Masuk` Filter)
![BB-41 Quota Mutations](screenshots/BB-41_quota_mutations.png)

#### BB-55 — Tata Letak Mobile Responsif Halaman Riwayat (`375x812`) Tanpa Horizontal Overflow
![BB-55 Mobile History 375px](screenshots/BB-55_mobile_history_375px.png)

---

### 5.6. Panel Administrator & Keamanan RBAC (`BB-43` s/d `BB-52`)

#### BB-43 — Proteksi RBAC Rute `/admin/*` Menolak Pengguna Biasa ke `/dashboard`
![BB-43 RBAC Redirect](screenshots/BB-43_rbac_redirect.png)

#### BB-44 — Log Aktivitas Sistem dengan Filter Sumber Modul `PAYMENT`
![BB-44 Admin Logs Payment](screenshots/BB-44_admin_logs_payment.png)

#### BB-45 — Ekspor Laporan Log Sistem Format `.csv`
![BB-45 Admin Logs CSV](screenshots/BB-45_admin_logs_csv.png)

#### BB-46 & BB-47 — Modal Detail Pengguna (`Teleport`) & Penyamaran Privasi Mutasi Transkrip
![BB-46 BB-47 Admin User Detail](screenshots/BB-46_bb47_admin_user_detail_modal.png)

#### BB-48 — Penambahan Kuota Manual oleh Administrator (+30 Menit)
![BB-48 Admin Add Quota](screenshots/BB-48_admin_add_quota.png)

#### BB-49 — Penangguhan Akun Pengguna (`SUSPENDED`) dari Modal Admin
![BB-49 Admin Suspend User](screenshots/BB-49_admin_suspend_user.png)

#### BB-51 — Laporan Transaksi Global & Statistik Pendapatan Administrator
![BB-51 Admin Transactions](screenshots/BB-51_admin_transactions.png)

#### BB-52 — Ekspor Laporan Transaksi Global Format `.csv`
![BB-52 Admin Transactions CSV](screenshots/BB-52_admin_transactions_csv.png)
