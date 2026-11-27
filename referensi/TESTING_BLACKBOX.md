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

> **Catatan Bukti Pengujian**:
> - Test case bertanda **`[API Verified]`** telah dieksekusi langsung ke backend `http://localhost:3000` (`v1.0.1-beta`) dan dicatat respons aktualnya.
> - Test case berbasis antarmuka peramban (*UI*) dilengkapi petunjuk lokasi tangkapan layar pada kolom **Bukti / Screenshot** untuk dilampirkan pada laporan akhir.

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
| **BB-01** | UC-01 | Registrasi akun baru dengan data valid | Happy | Buka `/register`, isi Nama `Budi Santoso`, Email `budi@example.com`, Password `Rahasia123`, klik **Daftar** | Akun dibuat berstatus `PENDING`, OTP 6-digit dikirim ke email, halaman berpindah ke verifikasi OTP | `201 Created`, status `PENDING`, OTP terkirim | Pass | `[Screenshot: Form Register -> OTP]` |
| **BB-02** | UC-01 | Registrasi dengan email yang sudah terdaftar | Bad | Isi email yang sudah aktif di database, klik **Daftar** | Sistem menolak dengan `409 Conflict` & pesan ramah email sudah terdaftar | `409 Conflict` tampil di form tanpa crash | Pass | `[Screenshot: Alert Email Duplikat]` |
| **BB-03** | UC-01 | Verifikasi OTP 6-digit valid | Happy | Masukkan 6-digit OTP dari email, klik **Verifikasi** | Status akun menjadi `ACTIVE`, mendapat bonus kuota awal `1.800s` (30 menit) & mutasi `CREDIT`, otomatis login ke `/dashboard` | Status `ACTIVE`, kuota `30 mnt`, masuk `/dashboard` | Pass | `[Screenshot: Dashboard Kuota 30 mnt]` |
| **BB-04** | UC-01 | Verifikasi OTP salah / kedaluwarsa (>5 menit) | Bad | Masukkan OTP `000000` atau OTP yang sudah >5 menit | Sistem menolak dengan `400 Bad Request` dan pesan OTP tidak valid / kedaluwarsa | Ditolak `400`, status tetap `PENDING` | Pass | `[Screenshot: Pesan OTP Salah]` |
| **BB-05** | UC-01 | Proteksi cooldown kirim ulang OTP (<60 detik) | Edge | Klik **Kirim Ulang OTP** sebelum jeda 60 detik berakhir | Tombol nonaktif dengan hitung mundur; jika dipaksa via API dibalas `429 Too Many Requests` | Tombol disabled & cooldown berjalan | Pass | `[Screenshot: Cooldown Resend OTP]` |
| **BB-06** | UC-02 | Login dengan kredensial valid (`ACTIVE`) | Happy | Buka `/login`, isi email & password valid, klik **Masuk** | Mengembalikan Access Token (15m) & Refresh Token, diarahkan ke `/dashboard` | `200 OK`, masuk `/dashboard`, token tersimpan | Pass | `[Screenshot: Login Sukses]` |
| **BB-07** | UC-02 | Login dengan password salah / email tidak terdaftar | Bad | `POST /api/auth/login` dengan `notfound@example.com` / `wrong` | Ditolak `401 INVALID_CREDENTIALS` dengan pesan generik `"Email atau kata sandi salah."` | `[API Verified]` `HTTP 401`, `INVALID_CREDENTIALS` | Pass | Output API `curl` |
| **BB-08** | UC-02 | Login dengan payload tipe non-string | Bad | `POST /api/auth/login` body `{"email":123,"password":"abc"}` | Ditolak `400 VALIDATION_ERROR` (bukan 500 Internal Server Error) | `[API Verified]` `HTTP 400`, `VALIDATION_ERROR` | Pass | Output API `curl` |
| **BB-09** | UC-02 | Login menggunakan akun berstatus `SUSPENDED` | Bad | Login memakai akun yang telah ditangguhkan oleh Admin | Ditolak `403 ACCOUNT_SUSPENDED` dengan pesan akun ditangguhkan oleh Administrator | `HTTP 403`, pesan penangguhan tampil di UI | Pass | `[Screenshot: Error Akun Suspended]` |
| **BB-10** | UC-02 | Refresh Token Rotation & Logout | Happy | Panggil `POST /api/auth/refresh` lalu `POST /api/auth/logout` | Access token diperbarui dengan refresh token baru; setelah logout sesi dihapus dari `user_sessions` | Token baru terbit; logout mencabut sesi | Pass | `[Screenshot: Network / Logout]` |
| **BB-11** | UC-03 | Lupa kata sandi & reset dengan OTP valid | Happy | Klik **Lupa Kata Sandi**, masukkan email terdaftar, input OTP reset + password baru min 8 karakter | Password diperbarui dengan hash bcrypt baru dan seluruh sesi aktif dicabut | `200 OK`, login sukses dengan password baru | Pass | `[Screenshot: Form Reset Password]` |
| **BB-12** | UC-03 | Reset kata sandi pada akun `SUSPENDED` | Bad | Request OTP forgot-password atau reset-password untuk akun `SUSPENDED` | Ditolak `403 ACCOUNT_SUSPENDED` | Permintaan ditolak `403`, password tidak berubah | Pass | Log & respons API |

---

### B. Profil, Keamanan Kata Sandi & Sisa Kuota (UC-04, UC-05, UC-06)

| ID | Use Case | Skenario Pengujian | Tipe | Langkah Pengujian & Data Uji | Expected Result | Actual Result | Status | Bukti / Screenshot |
|---|---|---|---|---|---|---|---|---|
| **BB-13** | UC-04 | Ubah nama lengkap & avatar profil | Happy | Buka modal Profil, ubah nama menjadi `Kevin J.`, pilih avatar, klik **Simpan** | Nama dan avatar langsung terbarui di database dan `DashboardNavbar` tanpa relogin | Profil terbarui reaktif di Navbar & Modal | Pass | `[Screenshot: Modal Profil]` |
| **BB-14** | UC-04 | Ubah alamat email dengan konfirmasi password + OTP | Happy | Masukkan email baru & password saat ini, lalu verifikasi OTP 6-digit di `POST /api/users/verify-email-change` | Email resmi berubah setelah OTP valid | Email terbarui setelah verifikasi OTP | Pass | `[Screenshot: Verifikasi Email Baru]` |
| **BB-15** | UC-05 | Ubah kata sandi dengan password lama benar | Happy | Isi password saat ini, password baru (`Baru12345`), konfirmasi sama, klik **Ubah Kata Sandi** | Password diperbarui, seluruh sesi lain dicabut | `200 OK`, pesan sukses tampil | Pass | `[Screenshot: Tab Keamanan Profil]` |
| **BB-16** | UC-05 | Ubah kata sandi dengan password lama salah | Bad | Isi password saat ini salah (`Salah123`), klik **Ubah Kata Sandi** | Ditolak `401` dengan pesan kata sandi saat ini tidak cocok | `401` tampil di modal, password tidak berubah | Pass | `[Screenshot: Error Password Lama]` |
| **BB-17** | UC-06 | Tampilan sisa kuota di Desktop & Mobile Navbar | Happy | Login dan cek indikator kuota di `DashboardNavbar` pada layar `1280px` dan `375px` | Sisa kuota tampil dalam format menit ramah (`30 mnt`) di desktop maupun mobile | Indikator kuota tampil jelas di kedua ukuran layar | Pass | `[Screenshot: Navbar Mobile & Desktop]` |
| **BB-18** | UC-06 | Akses `/api/history` tanpa token JWT | Bad | `GET /api/history` tanpa header `Authorization` | Ditolak `401 UNAUTHORIZED` | `[API Verified]` `HTTP 401`, `UNAUTHORIZED` | Pass | Output API `curl` |

---

### C. Unggah Audio, Rekam Langsung, Transkripsi STT & Rangkuman AI (UC-07 s/d UC-10)

| ID | Use Case | Skenario Pengujian | Tipe | Langkah Pengujian & Data Uji | Expected Result | Actual Result | Status | Bukti / Screenshot |
|---|---|---|---|---|---|---|---|---|
| **BB-19** | UC-07 | Unggah berkas audio valid (`.mp3`/`.wav`/`.m4a`) < 200MB | Happy | Pilih file `rapat.mp3` (durasi 120s, kuota user 1800s), klik **Proses Transkripsi** | Durasi diekstrak lokal, kuota dipotong atomik `-120s` (menjadi `1680s`), transkrip & rangkuman tampil | Transkrip selesai, saldo berkurang `2 mnt`, file fisik di disk terhapus | Pass | `[Screenshot: Hasil Transkrip & Rangkuman]` |
| **BB-20** | UC-07 | Unggah berkas berformat tidak didukung (`.txt`/`.pdf`) | Bad | Pilih file `catatan.txt` pada area unggah | Ditolak di client/backend (`400 INVALID_FORMAT`) sebelum menyentuh AI | Pesan format tidak didukung tampil | Pass | `[Screenshot: Error Format Tidak Valid]` |
| **BB-21** | UC-07 | Unggah file kosong (`0 bytes`) atau header audio rusak | Bad | Unggah file `rusak.mp3` (0 bytes / bukan audio asli) | Ditolak `400 EMPTY_FILE` / `INVALID_AUDIO_FILE`, kuota tidak terpotong, file sementara dihapus | Ditolak `400`, saldo kuota tetap utuh | Pass | Log backend & UI error card |
| **BB-22** | UC-07 | Batas ukuran maksimal berkas (>200MB vs <=200MB) | Edge (BVA) | Pilih file berukuran `201 MB` | Ditolak dengan pesan batas maksimal `200 MB` | Upload diblokir dengan peringatan batas 200MB | Pass | `[Screenshot: Validasi Batas 200MB]` |
| **BB-23** | UC-07 | *Chunked Upload* berkas besar (misal 110MB) | Happy | Unggah file > 5MB/100MB melalui `/api/upload/init`, `/chunk`, `/complete` | File dipecah per 5MB dengan progress bar real-time, dirangkai di server, lalu diproses asinkron | Progress 0-100% berjalan, file terangkai & selesai | Pass | `[Screenshot: Progress Chunked Upload]` |
| **BB-24** | UC-08 | Rekam suara langsung lewat mikrofon peramban | Happy | Klik **Rekam Audio**, izinkan mikrofon, rekam suara 10 detik, klik **Hentikan & Proses** | Waveform/timer berjalan, Wake Lock aktif, rekaman `.webm` diproses menjadi transkrip & rangkuman | Rekaman terproses menjadi teks & rangkuman | Pass | `[Screenshot: Mode Rekam Langsung]` |
| **BB-25** | UC-09 | Pre-check kuota tidak cukup (durasi > sisa saldo) | Bad (BVA) | User bersisa saldo `30s` mengunggah audio berdurasi `120s` | Ditolak seketika `402 INSUFFICIENT_QUOTA` sebelum memanggil API AI Whisper, saldo tetap `30s` | `402` tampil ramah dengan tombol Top Up, file sementara dihapus | Pass | `[Screenshot: Alert Kuota Kurang]` |
| **BB-26** | UC-09 | Pengembalian kuota (*Refund*) saat audio hening / gagal AI | Edge | Unggah audio hening total tanpa ucapan manusia | Whisper mendeteksi teks kosong/halusinasi, status `failed`, kuota dikembalikan (`CREDIT` tipe `REFUND`) | Kuota kembali utuh di `quota_mutations` | Pass | `[Screenshot: Mutasi Refund Kuota]` |
| **BB-27** | UC-10 | Tampilan rangkuman terstruktur & sanitasi Markdown/XSS | Happy | Buka tab **Rangkuman**, cek rendering HTML (`marked` + `DOMPurify`) | Rangkuman tampil rapi (**Topik Utama**, **Poin Penting**, **Tindak Lanjut**) tanpa tag `**` mentah atau skrip XSS | Teks terformat rapi, skrip berbahaya tersanitasi | Pass | `[Screenshot: Tab Rangkuman & Salin]` |
| **BB-28** | UC-10 | Salin teks & unduh hasil `.txt` | Happy | Klik **Salin Rangkuman** / **Unduh TXT** di `AudioResultCard` | Teks tersalin ke clipboard dengan notifikasi, file `.txt` terunduh bersih | Clipboard terisi dan file `.txt` terunduh | Pass | `[Screenshot: Toast Salin Berhasil]` |

---

### D. Riwayat & Arsip Transkripsi (UC-11, UC-12)

| ID | Use Case | Skenario Pengujian | Tipe | Langkah Pengujian & Data Uji | Expected Result | Actual Result | Status | Bukti / Screenshot |
|---|---|---|---|---|---|---|---|---|
| **BB-29** | UC-11 | Melihat daftar riwayat, filter status (`Semua`/`Selesai`/`Gagal`), & pencarian | Happy | Buka `/history`, ketik kata kunci nama file, klik filter `Selesai` / `Gagal` | Daftar riwayat terfilter akurat sesuai milik user yang login; UI mobile segmented tabs pas (`w-fit`) | Filter & search akurat, tampilan mobile rapi | Pass | `[Screenshot: Halaman Riwayat Mobile/Desktop]` |
| **BB-30** | UC-11 | Membuka detail dokumen riwayat mandiri | Happy | Klik salah satu kartu riwayat di `/history` | Navigasi ke `/transcripts/:id` menampilkan detail lengkap tanpa kotak upload | Halaman detail `/transcripts/:id` tampil fokus | Pass | `[Screenshot: Halaman Detail Transkrip]` |
| **BB-31** | UC-11 | Isolasi data multi-tenant saat akses ID transkrip user lain | Edge (Security) | User A memanggil `GET /api/transcripts/<id-milik-user-B>` | Ditolak `404` / `403` (tidak membocorkan data pengguna lain) | Akses ditolak, data User B aman | Pass | Respons API |
| **BB-32** | UC-11 | Query pagination tidak numerik (`?page=abc`) | Bad | Akses `GET /api/history?page=abc` dengan token valid | Ditangani aman dengan fallback ke halaman 1 (bukan 500 NaN error) | Mengembalikan `200 OK` halaman 1 | Pass | Respons API |
| **BB-33** | UC-12 | Menghapus item riwayat transkripsi | Happy | Klik tombol **Hapus** pada item riwayat lalu konfirmasi | Item terhapus dari database (`DELETE /api/history/:id`) dan hilang dari daftar | Item terhapus permanen dari daftar | Pass | `[Screenshot: Konfirmasi Hapus Riwayat]` |

---

### E. Pembelian Kuota Midtrans, Auto-Sync & Mutasi Saldo (UC-13, UC-14, UC-18)

| ID | Use Case | Skenario Pengujian | Tipe | Langkah Pengujian & Data Uji | Expected Result | Actual Result | Status | Bukti / Screenshot |
|---|---|---|---|---|---|---|---|---|
| **BB-34** | UC-13 | Mengambil daftar katalog paket kuota resmi | Happy | `GET /api/orders/packages` | Mengembalikan 3 paket (`starter_200` Rp50.000, `pro_450` Rp100.000, `enterprise_1200` Rp250.000) | `[API Verified]` `HTTP 200` dengan 3 paket | Pass | Output API `curl` |
| **BB-35** | UC-13 | Inisiasi checkout pesanan paket kuota | Happy | Buka `TopUpModal`, pilih **Paket Starter**, klik **Lanjut Pembayaran** | Order `pending` tercatat di tabel `orders`, Snap Token diterbitkan | Modal Midtrans Snap / Simulator terbuka | Pass | `[Screenshot: TopUpModal & Snap]` |
| **BB-36** | UC-14 | Simulasi pembayaran sukses sandbox (`simulate-pay`) | Happy | Klik **Simulasikan Pembayaran Sukses** pada order pending | Status order menjadi `completed`, saldo kuota bertambah `+200 mnt` (12.000s), Navbar & ledger mutasi terupdate otomatis | Saldo Navbar naik instan +200 mnt, mutasi `CREDIT` tercatat | Pass | `[Screenshot: Saldo Bertambah di Navbar]` |
| **BB-37** | UC-14 | Webhook Midtrans dengan Digital Signature valid vs palsu | Edge (Security) | Kirim `POST /api/webhook/payment` dengan payload tidak lengkap `{}` atau `signature_key` salah | Payload tidak lengkap -> `400`; signature salah -> `401`; signature SHA-512 valid -> `200` & saldo bertambah | `[API Verified]` Payload `{}` -> `HTTP 400`; signature invalid -> `401` (terverifikasi Unit Test) | Pass | Output API `curl` & Vitest |
| **BB-38** | UC-14 | Proteksi Idempotency webhook duplikat | Edge | Kirim ulang webhook `settlement` untuk `order_id` yang sudah berstatus `completed` | Webhook kedua diabaikan aman tanpa menambah saldo kuota dua kali | Saldo tidak bertambah ganda (`duplicate: true`) | Pass | Vitest `WB-PAY-04` |
| **BB-39** | UC-14 | Auto-Sync pesanan *pending* & kedaluwarsa (`sync`) | Happy | Buka `/transactions` saat ada order `pending` yang sudah dibayar/kedaluwarsa di Midtrans | Sistem memanggil sinkronisasi otomatis dan memperbarui status menjadi `completed` atau `failed` | Status order & saldo kuota tersinkron otomatis | Pass | `[Screenshot: Halaman Tagihan]` |
| **BB-40** | UC-18 | Melihat riwayat pembelian pribadi (`/transactions`) | Happy | Buka menu **Tagihan** -> Tab **Riwayat Pembelian (Top Up)** | Menampilkan daftar order milik pengguna yang sedang login saja | Daftar invoice tampil sesuai akun | Pass | `[Screenshot: Tab Riwayat Pembelian]` |
| **BB-41** | UC-18 | Melihat buku besar **Mutasi Saldo Kuota** & filter (`Semua`/`Masuk`/`Keluar`) | Happy | Buka tab **Mutasi Saldo Kuota**, uji filter `+ Kuota Masuk` dan `- Kuota Keluar` | Menampilkan mutasi `CREDIT` (+ hijau) dan `DEBIT` (- merah) lengkap dengan saldo akhir | Tabel mutasi & filter tampil akurat | Pass | `[Screenshot: Tab Mutasi Saldo Kuota]` |
| **BB-42** | UC-18 | Akses halaman Tagihan oleh user belum login | Bad | Buka `/transactions` dalam mode Incognito | Router guard mengarahkan ke `/login` | Diarahkan ke `/login` | Pass | `[Screenshot: Redirect Login]` |

---

### F. Panel Administrator & Fitur Kontrol v1.0.1-beta (UC-15, UC-16, UC-17)

| ID | Use Case | Skenario Pengujian | Tipe | Langkah Pengujian & Data Uji | Expected Result | Actual Result | Status | Bukti / Screenshot |
|---|---|---|---|---|---|---|---|---|
| **BB-43** | Security | Akses endpoint `/api/admin/*` tanpa login atau oleh role `user` | Bad (RBAC) | `GET /api/admin/users` tanpa token; dan dengan token role `user` | Tanpa token -> `401 UNAUTHORIZED`; role `user` -> `403 FORBIDDEN` | `[API Verified]` Tanpa token `HTTP 401`; role user `403` | Pass | Output API `curl` |
| **BB-44** | UC-15 | Memantau Log Sistem, filter level & sumber modul (`PAYMENT`) | Happy | Login Admin, buka `/admin/logs`, filter `INFO` dan sumber `PAYMENT` | Menampilkan entri log terkait pembayaran dan penambahan kuota manual | Filter `PAYMENT` berfungsi akurat | Pass | `[Screenshot: Log Sistem Filter PAYMENT]` |
| **BB-45** | UC-15 | Ekspor Log Sistem ke CSV | Happy | Klik tombol **Ekspor CSV** pada halaman Log Sistem | Mengunduh berkas `.csv` berisi data log terformat rapi | File `.csv` terunduh dan terbaca di Excel | Pass | `[Screenshot: File CSV Log]` |
| **BB-46** | UC-16 | Daftar Pengguna, filter status & modal Detail Pengguna | Happy | Buka `/admin/users`, klik **Detail** pada salah satu pengguna | Modal terbuka dengan backdrop blur penuh sampai atas (via `<Teleport>`), menampilkan profil & mutasi | Modal tampil rapi menutupi seluruh viewport | Pass | `[Screenshot: Modal Detail Pengguna]` |
| **BB-47** | v1.0.1-beta | Penyamaran privasi mutasi transkrip pada tampilan Admin | Edge (Privacy) | Lihat tab **Riwayat Mutasi** di modal detail user yang pernah memproses transkripsi | Keterangan transkrip pengguna disamarkan (tidak menampilkan nama berkas audio user) | Nama file audio tersamarkan dengan label generik | Pass | `[Screenshot: Mutasi Tersamarkan]` |
| **BB-48** | v1.0.1-beta | Penambahan kuota manual oleh Admin (`1..10.000` menit) | Happy/BVA | Pada tab **+ Tambah Kuota**, masukkan `30` menit & catatan, klik **Tambahkan**; uji juga input `0` | Input `30` sukses menambah saldo `+30 mnt`, tercatat di mutasi & log `PAYMENT`; input `0` ditolak `400` | Penambahan `30 mnt` sukses, input `0` ditolak `400` | Pass | `[Screenshot: Form Tambah Kuota Admin]` |
| **BB-49** | v1.0.1-beta | Penangguhan akun (`SUSPENDED`) & pengaktifan kembali (`ACTIVE`) | Happy | Klik **Tangguhkan Akun** -> konfirmasi **Ya, Tangguhkan**; lalu klik **Aktifkan Kembali** | Status berubah `SUSPENDED`, seluruh sesi aktif user dicabut seketika; saat diaktifkan kembali status menjadi `ACTIVE` | Status berubah, sesi user tercabut, dapat diaktifkan lagi | Pass | `[Screenshot: Konfirmasi Tangguhkan]` |
| **BB-50** | v1.0.1-beta | Larangan menangguhkan sesama akun Administrator | Edge (Security) | Admin mencoba `PATCH /api/admin/users/:adminId/status` menjadi `SUSPENDED` | Ditolak `403 CANNOT_MODIFY_ADMIN_STATUS` | Ditolak `403` (terverifikasi Unit Test `WB-ADM-06`) | Pass | Vitest `WB-ADM-06` |
| **BB-51** | UC-17 | Melihat Transaksi Global & statistik total pendapatan | Happy | Buka `/admin/transactions` | Menampilkan 4 widget metrik pendapatan, filter status/tanggal, & tabel transaksi seluruh user | Widget revenue & daftar transaksi tampil akurat | Pass | `[Screenshot: Transaksi Global Admin]` |
| **BB-52** | UC-17 | Ekspor Transaksi Global ke CSV | Happy | Klik **Ekspor CSV** pada halaman Transaksi Global | Mengunduh laporan transaksi pembayaran format `.csv` | File `.csv` terunduh lengkap | Pass | `[Screenshot: File CSV Transaksi]` |

---

### G. Kesehatan Sistem & Responsivitas Mobile (Non-Fungsional)

| ID | Kategori | Skenario Pengujian | Tipe | Langkah Pengujian & Data Uji | Expected Result | Actual Result | Status | Bukti / Screenshot |
|---|---|---|---|---|---|---|---|---|
| **BB-53** | Health | Healthcheck backend API & versi | Happy | `GET /api/health` | `200 OK`, mengembalikan `version: "1.0.1-beta"` | `[API Verified]` `HTTP 200`, `"version":"1.0.1-beta"` | Pass | Output API `curl` |
| **BB-54** | Health | Healthcheck koneksi PostgreSQL | Happy | `GET /health/db` | `200 OK`, `database: "connected"`, versi PostgreSQL 15 | `[API Verified]` `HTTP 200`, `PostgreSQL 15.19` | Pass | Output API `curl` |
| **BB-55** | Mobile UI | Tata letak Dashboard & Riwayat pada layar ponsel (`375px`) | Happy | Buka `/dashboard` & `/history` dengan DevTools Mobile (`375x812`) | Navigasi bawah mobile tampil rapi, filter tab Riwayat tidak ter-stretch (`w-fit`), tidak ada horizontal overflow | Tata letak rapi dan responsif | Pass | `[Screenshot: Tampilan Mobile 375px]` |
| **BB-56** | Proxy / Tunnel | Akses aplikasi via Reverse Proxy / Cloudflare Tunnel HTTPS | Happy | Akses frontend `:8080` melalui HTTPS tunnel, lakukan login dan muat riwayat | Seluruh request `/api/*` lewat jalur relatif tanpa *Mixed Content Error* | Aplikasi berjalan normal di HTTPS tunnel | Pass | `[Screenshot: Akses HTTPS]` |

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
