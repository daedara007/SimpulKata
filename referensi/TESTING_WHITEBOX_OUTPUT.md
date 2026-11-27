# 📄 Lampiran Output Aktual — White-Box Testing (Vitest + V8 Coverage)

**Proyek**: SimpulKata (`v1.0.1-beta`)  
**Perintah Eksekusi**: `cd backend && CI=true npx vitest run --coverage --reporter=verbose --no-color`  
**Tanggal Eksekusi**: 27 November 2026  
**Dokumen Induk**: [TESTING_WHITEBOX.md](./TESTING_WHITEBOX.md)

---

```text
RUN  v5.1.2 /home/kevin007/proyek/ippl/simpulkata/backend
      Coverage enabled with v8

stdout | tests/audioController.test.ts > White-Box: audioController.processAudio (Basis Path Testing) > WB-AUD-04 (Path 4): mengembalikan 400 EMPTY_FILE dan menghapus file jika ukuran file 0 bytes
[AudioController] File disimpan di: /home/kevin007/proyek/ippl/simpulkata/backend/storage/uploads/1795794395345-idnqf2e.mp3 (0 bytes)

stdout | tests/audioController.test.ts > White-Box: audioController.processAudio (Basis Path Testing) > WB-AUD-04 (Path 4): mengembalikan 400 EMPTY_FILE dan menghapus file jika ukuran file 0 bytes
[AudioController] File sementara dibersihkan: /home/kevin007/proyek/ippl/simpulkata/backend/storage/uploads/1795794395345-idnqf2e.mp3

stdout | tests/audioController.test.ts > White-Box: audioController.processAudio (Basis Path Testing) > WB-AUD-05 (Path 5): mengembalikan 402 INSUFFICIENT_QUOTA jika saldo user <= 0
[AudioController] File disimpan di: /home/kevin007/proyek/ippl/simpulkata/backend/storage/uploads/1795794395375-zsvzah3.mp3 (1024 bytes)

stdout | tests/audioController.test.ts > White-Box: audioController.processAudio (Basis Path Testing) > WB-AUD-05 (Path 5): mengembalikan 402 INSUFFICIENT_QUOTA jika saldo user <= 0
[AudioController] File sementara dibersihkan: /home/kevin007/proyek/ippl/simpulkata/backend/storage/uploads/1795794395375-zsvzah3.mp3

stdout | tests/audioController.test.ts > White-Box: audioController.processAudio (Basis Path Testing) > WB-AUD-06 (Path 6): mengembalikan 400 INVALID_AUDIO_FILE jika durasi lokal terdeteksi 0 detik
[AudioController] File disimpan di: /home/kevin007/proyek/ippl/simpulkata/backend/storage/uploads/1795794395384-fq4tnmu.mp3 (1024 bytes)

stdout | tests/audioController.test.ts > White-Box: audioController.processAudio (Basis Path Testing) > WB-AUD-06 (Path 6): mengembalikan 400 INVALID_AUDIO_FILE jika durasi lokal terdeteksi 0 detik
[AudioController] Durasi audio terdeteksi: 0 detik (Saldo user: 1800 detik)

stdout | tests/audioController.test.ts > White-Box: audioController.processAudio (Basis Path Testing) > WB-AUD-06 (Path 6): mengembalikan 400 INVALID_AUDIO_FILE jika durasi lokal terdeteksi 0 detik
[AudioController] File sementara dibersihkan: /home/kevin007/proyek/ippl/simpulkata/backend/storage/uploads/1795794395384-fq4tnmu.mp3

stdout | tests/audioController.test.ts > White-Box: audioController.processAudio (Basis Path Testing) > WB-AUD-07 (Path 7): mengembalikan 402 INSUFFICIENT_QUOTA jika reservasi kuota atomik gagal (durasi > saldo)
[AudioController] File disimpan di: /home/kevin007/proyek/ippl/simpulkata/backend/storage/uploads/1795794395389-ei3jqux.mp3 (2048 bytes)

stdout | tests/audioController.test.ts > White-Box: audioController.processAudio (Basis Path Testing) > WB-AUD-07 (Path 7): mengembalikan 402 INSUFFICIENT_QUOTA jika reservasi kuota atomik gagal (durasi > saldo)
[AudioController] Durasi audio terdeteksi: 120 detik (Saldo user: 30 detik)

stdout | tests/audioController.test.ts > White-Box: audioController.processAudio (Basis Path Testing) > WB-AUD-07 (Path 7): mengembalikan 402 INSUFFICIENT_QUOTA jika reservasi kuota atomik gagal (durasi > saldo)
[AudioController] File sementara dibersihkan: /home/kevin007/proyek/ippl/simpulkata/backend/storage/uploads/1795794395389-ei3jqux.mp3

 ✓ tests/authController.test.ts > White-Box: authController (login, register, refreshSession) > WB-AUTH-01 (login Path 1): mengembalikan 400 VALIDATION_ERROR jika email/password kosong atau non-string 17ms
 ✓ tests/authController.test.ts > White-Box: authController (login, register, refreshSession) > WB-AUTH-02 (login Path 2): mengembalikan 401 INVALID_CREDENTIALS jika email tidak ditemukan 5ms
 ✓ tests/authController.test.ts > White-Box: authController (login, register, refreshSession) > WB-AUTH-03 (login Path 3): mengembalikan 401 INVALID_CREDENTIALS jika password salah 3ms
 ✓ tests/authController.test.ts > White-Box: authController (login, register, refreshSession) > WB-AUTH-04 (login Path 4): mengembalikan 403 ACCOUNT_NOT_VERIFIED jika status akun PENDING 2ms
 ✓ tests/authController.test.ts > White-Box: authController (login, register, refreshSession) > WB-AUTH-05 (login Path 5): mengembalikan 403 ACCOUNT_SUSPENDED jika status akun SUSPENDED 2ms
 ✓ tests/authController.test.ts > White-Box: authController (login, register, refreshSession) > WB-AUTH-06 (login Path 6): mengembalikan 200 dengan JWT token dan refreshToken jika akun ACTIVE 5ms
 ✓ tests/authController.test.ts > White-Box: authController (login, register, refreshSession) > WB-AUTH-07 (register): menolak nama < 2 karakter dengan 400 VALIDATION_ERROR 2ms
 ✓ tests/authController.test.ts > White-Box: authController (login, register, refreshSession) > WB-AUTH-08 (register): menolak format email tidak valid 1ms
 ✓ tests/authController.test.ts > White-Box: authController (login, register, refreshSession) > WB-AUTH-09 (register): menolak kata sandi tanpa kombinasi huruf & angka 2ms
 ✓ tests/authController.test.ts > White-Box: authController (login, register, refreshSession) > WB-AUTH-10 (register): mengembalikan 409 EMAIL_ALREADY_EXISTS jika email sudah ACTIVE 4ms
 ✓ tests/authController.test.ts > White-Box: authController (login, register, refreshSession) > WB-AUTH-11 (register): membuat akun baru status PENDING, simpan OTP & kirim email (201) 9ms
 ✓ tests/authController.test.ts > White-Box: authController (login, register, refreshSession) > WB-AUTH-12 (refreshSession): menolak jika refreshToken kosong (400) 3ms
 ✓ tests/authController.test.ts > White-Box: authController (login, register, refreshSession) > WB-AUTH-13 (refreshSession): menolak jika sesi tidak ditemukan (401 INVALID_REFRESH_TOKEN) 1ms
 ✓ tests/authController.test.ts > White-Box: authController (login, register, refreshSession) > WB-AUTH-14 (refreshSession): menghapus sesi & menolak 401 SESSION_EXPIRED jika kedaluwarsa 2ms
 ✓ tests/authController.test.ts > White-Box: authController (login, register, refreshSession) > WB-AUTH-15 (refreshSession): mencabut semua sesi & menolak 403 ACCOUNT_SUSPENDED jika akun ditangguhkan 4ms
 ✓ tests/authController.test.ts > White-Box: authController (login, register, refreshSession) > WB-AUTH-16 (refreshSession): melakukan Refresh Token Rotation (RTR) jika sesi valid & ACTIVE (200) 2ms
 ✓ tests/audioController.test.ts > White-Box: audioController.processAudio (Basis Path Testing) > WB-AUD-01 (Path 1): mengembalikan 400 MISSING_FILE jika request tidak menyertakan multipart file 20ms
 ✓ tests/audioController.test.ts > White-Box: audioController.processAudio (Basis Path Testing) > WB-AUD-02 (Path 2): mengembalikan 400 INVALID_FIELD jika nama field bukan "audio" 2ms
 ✓ tests/audioController.test.ts > White-Box: audioController.processAudio (Basis Path Testing) > WB-AUD-03 (Path 3): mengembalikan 400 INVALID_FORMAT jika ekstensi file tidak didukung (.txt) 2ms
 ✓ tests/audioController.test.ts > White-Box: audioController.processAudio (Basis Path Testing) > WB-AUD-04 (Path 4): mengembalikan 400 EMPTY_FILE dan menghapus file jika ukuran file 0 bytes 33ms
 ✓ tests/audioController.test.ts > White-Box: audioController.processAudio (Basis Path Testing) > WB-AUD-05 (Path 5): mengembalikan 402 INSUFFICIENT_QUOTA jika saldo user <= 0 9ms
 ✓ tests/audioController.test.ts > White-Box: audioController.processAudio (Basis Path Testing) > WB-AUD-06 (Path 6): mengembalikan 400 INVALID_AUDIO_FILE jika durasi lokal terdeteksi 0 detik 6ms
 ✓ tests/audioController.test.ts > White-Box: audioController.processAudio (Basis Path Testing) > WB-AUD-07 (Path 7): mengembalikan 402 INSUFFICIENT_QUOTA jika reservasi kuota atomik gagal (durasi > saldo) 9ms
 ✓ tests/adminController.test.ts > White-Box: adminController.addUserQuota & updateUserStatus > WB-ADM-01: menolak akses non-admin dengan 403 FORBIDDEN 17ms
 ✓ tests/adminController.test.ts > White-Box: adminController.addUserQuota & updateUserStatus > WB-ADM-02: menolak format UUID userId tidak valid (400 INVALID_USER_ID) 3ms
 ✓ tests/adminController.test.ts > White-Box: adminController.addUserQuota & updateUserStatus > WB-ADM-03: menolak jumlah menit kuota di luar batas 1..10000 (BVA) 2ms
 ✓ tests/adminController.test.ts > White-Box: adminController.addUserQuota & updateUserStatus > WB-ADM-04: menolak penambahan kuota ke akun berstatus PENDING 4ms
 ✓ tests/adminController.test.ts > White-Box: adminController.addUserQuota & updateUserStatus > WB-ADM-05: berhasil menambahkan kuota manual & menyamarkan mutasi pada response 3ms
 ✓ tests/adminController.test.ts > White-Box: adminController.addUserQuota & updateUserStatus > WB-ADM-06: melarang admin menangguhkan akun sesama admin (403 CANNOT_MODIFY_ADMIN_STATUS) 2ms
 ✓ tests/adminController.test.ts > White-Box: adminController.addUserQuota & updateUserStatus > WB-ADM-07: menangguhkan akun ACTIVE menjadi SUSPENDED dan langsung mencabut seluruh sesi aktifnya 7ms
 ✓ tests/adminController.test.ts > White-Box: adminController.addUserQuota & updateUserStatus > WB-ADM-08: menyamarkan nama berkas audio & reference_id pada getUserQuotaMutations demi privasi 6ms
 ✓ tests/adminController.test.ts > White-Box: adminController.addUserQuota & updateUserStatus > WB-ADM-09: menolak getUserQuotaMutations jika userId tidak ditemukan (404) 3ms
 ✓ tests/paymentService.test.ts > White-Box: paymentService (Signature & Webhook Basis Paths) > WB-PAY-01: memverifikasi Digital Signature SHA-512 valid vs tidak valid (SDD TC-04) 18ms
 ✓ tests/paymentService.test.ts > White-Box: paymentService (Signature & Webhook Basis Paths) > WB-PAY-02 (Path 1): melempar error 404 jika order_id tidak ditemukan 18ms
 ✓ tests/paymentService.test.ts > White-Box: paymentService (Signature & Webhook Basis Paths) > WB-PAY-03 (Path 2): melempar error 401 jika signature_key Midtrans tidak valid 3ms
 ✓ tests/paymentService.test.ts > White-Box: paymentService (Signature & Webhook Basis Paths) > WB-PAY-04 (Path 3): mengabaikan webhook duplikat secara idempotent jika order sudah completed (SDD TC-08) 5ms
 ✓ tests/paymentService.test.ts > White-Box: paymentService (Signature & Webhook Basis Paths) > WB-PAY-05 (Path 4): menandai order completed, menambah saldo & mencatat mutasi CREDIT saat settlement 7ms
 ✓ tests/paymentService.test.ts > White-Box: paymentService (Signature & Webhook Basis Paths) > WB-PAY-06 (Path 5): memperbarui order menjadi failed jika status transaksi expire/deny/cancel 2ms
 ✓ tests/uploadController.test.ts > White-Box: uploadController.initUpload (Chunked Upload 200MB) > WB-UPL-01: mengembalikan 401 UNAUTHORIZED jika user tidak terautentikasi 16ms
 ✓ tests/uploadController.test.ts > White-Box: uploadController.initUpload (Chunked Upload 200MB) > WB-UPL-02: mengembalikan 400 INVALID_FILENAME jika fileName kosong 2ms
 ✓ tests/uploadController.test.ts > White-Box: uploadController.initUpload (Chunked Upload 200MB) > WB-UPL-03: mengembalikan 400 INVALID_FORMAT jika ekstensi tidak didukung (.exe) 3ms
 ✓ tests/uploadController.test.ts > White-Box: uploadController.initUpload (Chunked Upload 200MB) > WB-UPL-04 (BVA): mengembalikan 400 INVALID_FILE_SIZE jika fileSize > 200MB 2ms
 ✓ tests/uploadController.test.ts > White-Box: uploadController.initUpload (Chunked Upload 200MB) > WB-UPL-05 (BVA): mengembalikan 400 INVALID_TOTAL_CHUNKS jika totalChunks > 200 2ms
 ✓ tests/uploadController.test.ts > White-Box: uploadController.initUpload (Chunked Upload 200MB) > WB-UPL-06: mengembalikan 402 INSUFFICIENT_QUOTA jika saldo user <= 0 sebelum upload dimulai 5ms
 ✓ tests/userController.test.ts > White-Box: userController (changePassword & getQuotaMutations) > WB-USR-01: menolak changePassword jika password baru < 8 karakter (BVA) 20ms
 ✓ tests/userController.test.ts > White-Box: userController (changePassword & getQuotaMutations) > WB-USR-02: menolak changePassword jika password baru tidak mengandung huruf & angka 2ms
 ✓ tests/userController.test.ts > White-Box: userController (changePassword & getQuotaMutations) > WB-USR-03: menolak changePassword jika konfirmasi password tidak cocok 2ms
 ✓ tests/userController.test.ts > White-Box: userController (changePassword & getQuotaMutations) > WB-USR-04: menolak changePassword jika password baru sama dengan password lama (SAME_PASSWORD) 3ms
 ✓ tests/userController.test.ts > White-Box: userController (changePassword & getQuotaMutations) > WB-USR-05: menolak changePassword jika password lama tidak cocok dengan hash bcrypt 5ms
 ✓ tests/userController.test.ts > White-Box: userController (changePassword & getQuotaMutations) > WB-USR-06: berhasil ubah password dan langsung mencabut semua sesi aktif pengguna 6ms
 ✓ tests/userController.test.ts > White-Box: userController (changePassword & getQuotaMutations) > WB-USR-07: getQuotaMutations mengembalikan daftar mutasi dengan filter CREDIT/DEBIT 3ms
 ✓ tests/aiService.test.ts > White-Box: aiService.cleanWhisperTranscript & removeRepetitiveLoops > WB-AI-01: mengembalikan string kosong jika input kosong 12ms
 ✓ tests/aiService.test.ts > White-Box: aiService.cleanWhisperTranscript & removeRepetitiveLoops > WB-AI-02: menghapus halusinasi outro YouTube/internet umum 5ms
 ✓ tests/aiService.test.ts > White-Box: aiService.cleanWhisperTranscript & removeRepetitiveLoops > WB-AI-03: memangkas pengulangan kata pendek >= 4 kali berturut-turut 12ms
 ✓ tests/aiService.test.ts > White-Box: aiService.cleanWhisperTranscript & removeRepetitiveLoops > WB-AI-04: memangkas pengulangan frasa berulang >= 3 kali berturut-turut 2ms
 ✓ tests/aiService.test.ts > White-Box: aiService.cleanWhisperTranscript & removeRepetitiveLoops > WB-AI-05: mempertahankan teks normal yang memiliki pengulangan wajar (< 3 kali) 1ms
 ✓ tests/aiService.test.ts > White-Box: aiService.cleanWhisperTranscript & removeRepetitiveLoops > WB-AI-06: removeRepetitiveLoops mengembalikan teks asli jika panjang < 100 atau <= 2 paragraf 2ms
 ✓ tests/aiService.test.ts > White-Box: aiService.cleanWhisperTranscript & removeRepetitiveLoops > WB-AI-07: removeRepetitiveLoops memutus loop paragraf yang berulang 3ms

 Test Files  7 passed (7)
      Tests  58 passed (58)
   Start at  23:46:34
   Duration  4.74s (import 61%, worker 18%, transform 12%, tests 9%)

    Isolate  7 workers spawned · ~565ms startup each (spawn + environment, per file)
             at least ~753ms faster with isolate: false — reuses workers across files instead of one per file

 % Coverage report from v8
-------------------|---------|----------|---------|---------|-------------------
File               | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
-------------------|---------|----------|---------|---------|-------------------
All files          |   25.09 |    23.62 |   27.71 |   25.07 |                   
 controllers       |   27.24 |    27.65 |   27.45 |   27.46 |                   
  ...Controller.ts |    34.8 |    40.25 |   31.57 |   35.75 | ...85,696,707-708 
  ...Controller.ts |   24.74 |    18.11 |   28.57 |   24.74 | ...13-344,348-664 
  ...Controller.ts |   35.84 |    32.02 |   33.33 |   35.84 | ...00-501,592-891 
  ...Controller.ts |   12.13 |     17.5 |    9.09 |   12.37 | 43-66,129,145-623 
  ...Controller.ts |   29.13 |    24.56 |      40 |   29.13 | ...64,480,508-509 
 services          |   19.89 |    13.73 |   28.12 |   19.21 |                   
  aiService.ts     |   14.28 |     8.38 |      20 |    12.8 | 34-344,425-629    
  ...entService.ts |      30 |    21.36 |   41.66 |   30.43 | ...34,347,380-567 
-------------------|---------|----------|---------|---------|-------------------
```
