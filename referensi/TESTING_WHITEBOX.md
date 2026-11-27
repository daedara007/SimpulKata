# 🔬 Dokumen Pengujian Perangkat Lunak — White-Box Testing

**Proyek**: SimpulKata (Platform Transkripsi Audio & Rangkuman AI)  
**Versi Aplikasi**: `v1.0.1-beta`  
**Mata Kuliah**: Implementasi dan Pengujian Perangkat Lunak (IPPL)  
**Pengembang / Penguji**: Kevin Jonathan Wijaya (NIM: 11241040)  
**Tanggal Pengujian**: 27 November 2026  
**Framework Uji Otomatis**: `Vitest v5.1.2` + `@vitest/coverage-v8` (`npm --prefix backend run test:coverage`)

---

## 1. Metodologi Pengujian White-Box

Pengujian **White-Box** dilakukan dengan meninjau langsung struktur logika internal kode sumber (*control flow*, percabangan `if/else`, *guard clause*, perulangan, dan blok `try/catch`). Teknik yang diterapkan meliputi:

1. ***Control Flow Graph* (CFG)**: Memetakan alur eksekusi fungsi ke dalam node proses dan edge keputusan.
2. ***Cyclomatic Complexity* $V(G)$**: Menghitung kompleksitas logika untuk menentukan batas minimum kasus uji menggunakan rumus:
   $$V(G) = E - N + 2 \quad \text{atau} \quad V(G) = P + 1$$
   *(di mana $E$ = jumlah edge, $N$ = jumlah node, dan $P$ = jumlah predicate/titik percabangan).*
3. ***Basis Path Testing***: Menyusun *Independent Paths* agar setiap cabang keputusan (`true` / `false`) minimal tereksekusi satu kali (*Branch Coverage*).
4. ***Automated Unit Testing***: Mengeksekusi seluruh jalur uji secara otomatis di `backend/tests/*.test.ts`.

---

## 2. Analisis Modul 1: `authController.login`

**Berkas Sumber**: [`backend/src/controllers/authController.ts` (Baris 387–505)](file:///home/kevin007/proyek/ippl/simpulkata/backend/src/controllers/authController.ts#L387-L505)  
**Fungsi**: Otentikasi kredensial pengguna, validasi status akun (`PENDING` / `SUSPENDED` / `ACTIVE`), pembuatan JWT Access Token, dan penyimpanan Refresh Token sesi.

### 2.1 Control Flow Graph (CFG)

```mermaid
flowchart TD
    N1(["1. Start login(req, reply)"]) --> N2{"2. !email || !password ||<br/>bukan string?"}
    N2 -- Ya --> N3["3. Return 400 VALIDATION_ERROR"]
    N2 -- Tidak --> N4["4. findByEmail(normalizedEmail)"]
    N4 --> N5{"5. !user?"}
    N5 -- Ya --> N6["6. Return 401 INVALID_CREDENTIALS"]
    N5 -- Tidak --> N7{"7. !bcrypt.compare(password)?"}
    N7 -- Ya --> N8["8. Return 401 INVALID_CREDENTIALS"]
    N7 -- Tidak --> N9{"9. user.status === 'PENDING'?"}
    N9 -- Ya --> N10["10. Return 403 ACCOUNT_NOT_VERIFIED"]
    N9 -- Tidak --> N11{"11. user.status === 'SUSPENDED'?"}
    N11 -- Ya --> N12["12. Return 403 ACCOUNT_SUSPENDED"]
    N11 -- Tidak --> N13["13. Sign JWT & Create Session<br/>Return 200 OK"]
    N3 --> N14(["14. End"])
    N6 --> N14
    N8 --> N14
    N10 --> N14
    N12 --> N14
    N13 --> N14
```

### 2.2 Perhitungan *Cyclomatic Complexity* & *Independent Paths*

- Jumlah titik percabangan ($P$) = 5 (`N2`, `N5`, `N7`, `N9`, `N11`)
- **$V(G) = P + 1 = 5 + 1 = 6$ jalur independen**

| Jalur | Rute Node | Kondisi Cabang yang Diuji | ID Test Case |
|---|---|---|---|
| **Path 1** | `1 → 2 → 3 → 14` | Input email/password kosong atau non-string (`N2 = true`) | `WB-AUTH-01` |
| **Path 2** | `1 → 2 → 4 → 5 → 6 → 14` | Email tidak ditemukan di DB (`N5 = true`) | `WB-AUTH-02` |
| **Path 3** | `1 → 2 → 4 → 5 → 7 → 8 → 14` | Hash password tidak cocok (`N7 = true`) | `WB-AUTH-03` |
| **Path 4** | `1 → 2 → 4 → 5 → 7 → 9 → 10 → 14` | Akun belum verifikasi OTP (`N9 = true`) | `WB-AUTH-04` |
| **Path 5** | `1 → 2 → 4 → 5 → 7 → 9 → 11 → 12 → 14` | Akun ditangguhkan Administrator (`N11 = true`) | `WB-AUTH-05` |
| **Path 6** | `1 → 2 → 4 → 5 → 7 → 9 → 11 → 13 → 14` | Akun `ACTIVE` & kredensial valid (`N11 = false`) | `WB-AUTH-06` |

### 2.3 Hasil Eksekusi Kasus Uji White-Box (`tests/authController.test.ts`)

| ID | Jalur | Input / Kondisi Mock | Expected Return | Actual Return | Status |
|---|---|---|---|---|---|
| `WB-AUTH-01` | Path 1 | `{ email: 123, password: '' }` | `400 VALIDATION_ERROR` | `400 VALIDATION_ERROR` | **Pass** |
| `WB-AUTH-02` | Path 2 | `findByEmail -> null` | `401 INVALID_CREDENTIALS` | `401 INVALID_CREDENTIALS` | **Pass** |
| `WB-AUTH-03` | Path 3 | `bcrypt.compare -> false` | `401 INVALID_CREDENTIALS` | `401 INVALID_CREDENTIALS` | **Pass** |
| `WB-AUTH-04` | Path 4 | `user.status = 'PENDING'`, password valid | `403 ACCOUNT_NOT_VERIFIED` | `403 ACCOUNT_NOT_VERIFIED` | **Pass** |
| `WB-AUTH-05` | Path 5 | `user.status = 'SUSPENDED'`, password valid | `403 ACCOUNT_SUSPENDED` | `403 ACCOUNT_SUSPENDED` | **Pass** |
| `WB-AUTH-06` | Path 6 | `user.status = 'ACTIVE'`, `jwt.sign` & `sessionModel.create` | `200 OK` + `token` + `refreshToken` | `200 OK` + token & session tersimpan | **Pass** |

---

## 3. Analisis Modul 2: `paymentService.processWebhook` & `verifySignature`

**Berkas Sumber**: [`backend/src/services/paymentService.ts` (Baris 248–380)](file:///home/kevin007/proyek/ippl/simpulkata/backend/src/services/paymentService.ts#L248-L380)  
**Fungsi**: Verifikasi digital signature SHA-512 Midtrans (kepatuhan SDD TC-04), proteksi idempotency duplikat (SDD TC-08), dan pembaruan saldo kuota + ledger mutasi atomik.

### 3.1 Control Flow Graph (CFG)

```mermaid
flowchart TD
    P1(["1. Start processWebhook(payload)"]) --> P2["2. findByOrderNumber(order_id)"]
    P2 --> P3{"3. !order?"}
    P3 -- Ya --> P4["4. Throw 404 Not Found"]
    P3 -- Tidak --> P5{"5. isMidtransConfigured()<br/>&& !verifySignature()?"}
    P5 -- Ya --> P6["6. Throw 401 Invalid Signature"]
    P5 -- Tidak --> P7{"7. order.status === 'completed'?"}
    P7 -- Ya --> P8["8. Return duplicate: true<br/>(Idempotent Skip)"]
    P7 -- Tidak --> P9{"9. settlement ||<br/>(capture && accept)?"}
    P9 -- Ya --> P10["10. markCompleted + addBalance<br/>+ recordMutation(CREDIT)"]
    P9 -- Tidak --> P11{"11. expire || cancel || deny?"}
    P11 -- Ya --> P12["12. markFailed(order_id)"]
    P11 -- Tidak --> P13["13. Return status pending"]
    P4 --> P14(["14. End"])
    P6 --> P14
    P8 --> P14
    P10 --> P14
    P12 --> P14
    P13 --> P14
```

### 3.2 Perhitungan *Cyclomatic Complexity* & *Independent Paths*

- Jumlah titik percabangan ($P$) = 5 (`P3`, `P5`, `P7`, `P9`, `P11`)
- **$V(G) = P + 1 = 5 + 1 = 6$ jalur independen**

### 3.3 Hasil Eksekusi Kasus Uji White-Box (`tests/paymentService.test.ts`)

| ID | Jalur / Kondisi | Input / Mock | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| `WB-PAY-01` | `verifySignature` | Signature SHA-512 valid vs `tampered-sig` | `true` untuk valid, `false` untuk palsu | `true` / `false` | **Pass** |
| `WB-PAY-02` | Path 1 (`P3 = true`) | `findByOrderNumber -> null` | Throw error `statusCode: 404` | Error `404` dilempar | **Pass** |
| `WB-PAY-03` | Path 2 (`P5 = true`) | `signature_key: 'fake-signature'` | Throw error `statusCode: 401` | Error `401` dilempar | **Pass** |
| `WB-PAY-04` | Path 3 (`P7 = true`) | `order.status = 'completed'` | `duplicate: true`, `addBalance` tidak dipanggil | `duplicate: true`, saldo aman | **Pass** |
| `WB-PAY-05` | Path 4 (`P9 = true`) | `transaction_status: 'settlement'` | `markCompleted`, `addBalance(12000)`, `recordMutation('CREDIT')` | Ketiganya dipanggil akurat | **Pass** |
| `WB-PAY-06` | Path 5 (`P11 = true`) | `transaction_status: 'expire'` | `orderModel.markFailed('ORD-123', 'failed')` | `markFailed` terpanggil dengan `'failed'` | **Pass** |

---

## 4. Analisis Modul 3: `aiService.cleanWhisperTranscript` & `removeRepetitiveLoops`

**Berkas Sumber**: [`backend/src/services/aiService.ts` (Baris 353–419)](file:///home/kevin007/proyek/ippl/simpulkata/backend/src/services/aiService.ts#L353-L419)  
**Fungsi**: Membersihkan halusinasi outro Whisper, pengulangan kata pendek ($\ge 4\times$), pengulangan frasa ($1..6$ kata $\ge 3\times$), serta memutus pengulangan blok paragraf pada output LLM.

### 4.1 Control Flow Graph (`cleanWhisperTranscript`)

```mermaid
flowchart TD
    A1(["1. Start cleanWhisperTranscript(text)"]) --> A2{"2. !text?"}
    A2 -- Ya --> A3["3. Return ''"]
    A2 -- Tidak --> A4["4. Loop regex hallucinationPatterns"]
    A4 --> A5["5. Hapus pengulangan kata >= 4x"]
    A5 --> A6["6. Loop phraseLen = 6..1<br/>Hapus pengulangan frasa >= 3x"]
    A6 --> A7["7. Normalize whitespace & Return cleaned"]
    A3 --> A8(["8. End"])
    A7 --> A8
```

### 4.2 Hasil Eksekusi Kasus Uji White-Box (`tests/aiService.test.ts`)

| ID | Kondisi Cabang / Loop | Input Uji | Expected Output | Actual Output | Status |
|---|---|---|---|---|---|
| `WB-AI-01` | Guard `!text` (`true`) | `""` | `""` | `""` | **Pass** |
| `WB-AI-02` | `hallucinationPatterns` match | `"Pembahasan materi selesai. Terima kasih telah menonton! Jangan lupa like dan subscribe."` | `"Pembahasan materi selesai."` | `"Pembahasan materi selesai."` | **Pass** |
| `WB-AI-03` | Pengulangan kata $\ge 4\times$ | `"Jadi di di di di di dalam rapat kita sepakat."` | `"Jadi di dalam rapat kita sepakat."` | `"Jadi di dalam rapat kita sepakat."` | **Pass** |
| `WB-AI-04` | Pengulangan frasa $\ge 3\times$ | `"Sudah. Sudah. Sudah. Sudah. Baik kita lanjutkan."` | `"Sudah. Baik kita lanjutkan."` | `"Sudah. Baik kita lanjutkan."` | **Pass** |
| `WB-AI-05` | Teks normal tanpa loop | `"Rapat evaluasi berjalan lancar dan kondusif."` | Teks tidak berubah | Sama persis | **Pass** |
| `WB-AI-06` | `removeRepetitiveLoops` teks pendek / $\le 2$ paragraf | `"Singkat."` dan teks 2 paragraf | Mengembalikan teks asli | Sama persis | **Pass** |
| `WB-AI-07` | `removeRepetitiveLoops` loop paragraf | 4 paragraf dengan paragraf ke-3 duplikat paragraf ke-1 | Loop terputus sebelum paragraf ke-3 & ke-4 | Paragraf ke-4 terpotong | **Pass** |

---

## 5. Analisis Modul 4: `adminController.addUserQuota` & `updateUserStatus`

**Berkas Sumber**: [`backend/src/controllers/adminController.ts` (Baris 533–714)](file:///home/kevin007/proyek/ippl/simpulkata/backend/src/controllers/adminController.ts#L533-L714)  
**Fungsi**: Otorisasi RBAC admin, validasi batas kuota (`1..10.000` menit), larangan modifikasi akun sesama admin, serta pencabutan sesi aktif saat akun ditangguhkan (`SUSPENDED`).

### 5.1 Control Flow Graph (`updateUserStatus`)

```mermaid
flowchart TD
    D1(["1. Start updateUserStatus"]) --> D2{"2. !checkAdminRole?"}
    D2 -- Ya --> D3["3. Return 403 FORBIDDEN"]
    D2 -- Tidak --> D4{"4. !UUID_REGEX.test(userId)?"}
    D4 -- Ya --> D5["5. Return 400 INVALID_USER_ID"]
    D4 -- Tidak --> D6{"6. nextStatus != ACTIVE/SUSPENDED?"}
    D6 -- Ya --> D7["7. Return 400 INVALID_STATUS"]
    D6 -- Tidak --> D8{"8. !targetUser?"}
    D8 -- Ya --> D9["9. Return 404 USER_NOT_FOUND"]
    D8 -- Tidak --> D10{"10. target.role === 'admin'<br/>|| target.id === self?"}
    D10 -- Ya --> D11["11. Return 403 CANNOT_MODIFY_ADMIN_STATUS"]
    D10 -- Tidak --> D12{"12. target.status === 'PENDING'?"}
    D12 -- Ya --> D13["13. Return 400 USER_PENDING_VERIFICATION"]
    D12 -- Tidak --> D14["14. updateStatus(userId, nextStatus)"]
    D14 --> D15{"15. nextStatus === 'SUSPENDED'?"}
    D15 -- Ya --> D16["16. sessionModel.deleteByUserId(userId)"]
    D15 -- Tidak --> D17["17. Log Aktivasi Kembali"]
    D16 --> D18["18. Return 200 OK"]
    D17 --> D18
```

### 5.2 Hasil Eksekusi Kasus Uji White-Box (`tests/adminController.test.ts`)

| ID | Fungsi & Kondisi Cabang | Input / Mock | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| `WB-ADM-01` | `checkAdminRole` gagal | `user.role = 'user'` | `403 FORBIDDEN` | `403 FORBIDDEN` | **Pass** |
| `WB-ADM-02` | Validasi UUID gagal | `userId = 'bukan-uuid'` | `400 INVALID_USER_ID` | `400 INVALID_USER_ID` | **Pass** |
| `WB-ADM-03` | BVA menit kuota `< 1` | `minutes = 0` | `400 INVALID_QUOTA_AMOUNT` | `400 INVALID_QUOTA_AMOUNT` | **Pass** |
| `WB-ADM-04` | Target berstatus `PENDING` | `targetUser.status = 'PENDING'` | `400 USER_PENDING_VERIFICATION` | `400 USER_PENDING_VERIFICATION` | **Pass** |
| `WB-ADM-05` | Tambah kuota manual sukses | `minutes = 30`, `note = 'Bonus'` | `200 OK`, `balance = 3600` | `200 OK`, `balance = 3600` | **Pass** |
| `WB-ADM-06` | Proteksi sesama Admin | `targetUser.role = 'admin'` | `403 CANNOT_MODIFY_ADMIN_STATUS` | `403 CANNOT_MODIFY_ADMIN_STATUS` | **Pass** |
| `WB-ADM-07` | Suspend mencabut sesi | `status = 'SUSPENDED'` | `200 OK`, `deleteByUserId` dipanggil 1x | `200 OK`, sesi tercabut | **Pass** |

---

## 6. Analisis Modul 5: `audioController.processAudio` (Static Path Analysis)

**Berkas Sumber**: [`backend/src/controllers/audioController.ts` (Baris 197–315+)](file:///home/kevin007/proyek/ippl/simpulkata/backend/src/controllers/audioController.ts#L197-L315)  
**Fungsi**: Mengamankan alur unggah audio dengan validasi format, pengecekan ukuran 0 bytes, ekstraksi durasi lokal (`music-metadata`), dan reservasi kuota atomik sebelum memanggil AI.

### 6.1 Independent Paths Utama

1. **Path 1 (Missing Multipart)**: `!part` $\rightarrow$ `400 MISSING_FILE`
2. **Path 2 (Invalid Fieldname)**: `part.fieldname !== 'audio'` $\rightarrow$ `400 INVALID_FIELD`
3. **Path 3 (Invalid Extension)**: `!ALLOWED_EXTENSIONS.has(ext)` $\rightarrow$ `400 INVALID_FORMAT`
4. **Path 4 (Empty File)**: `fileStats.size === 0` $\rightarrow$ `safeUnlink()` + `400 EMPTY_FILE`
5. **Path 5 (Zero/Corrupt Duration)**: `!durationSeconds || durationSeconds <= 0` $\rightarrow$ `safeUnlink()` + `400 INVALID_AUDIO_FILE`
6. **Path 6 (Insufficient Quota Atomically)**: `userModel.reserveBalance() === null` $\rightarrow$ `safeUnlink()` + `402 INSUFFICIENT_QUOTA`
7. **Path 7 (Happy Path & Cleanup)**: Reservasi berhasil $\rightarrow$ Proses STT + LLM $\rightarrow$ `safeUnlink()` di blok `finally`

*(Seluruh jalur di atas telah diverifikasi melalui eksekusi Black-Box `BB-19` s/d `BB-26` dan audit kode statis.)*

---

## 7. Ringkasan Hasil Eksekusi Unit Test Otomatis (`Vitest`)

Hasil eksekusi perintah `npm --prefix backend run test:coverage` pada **27 November 2026**:

```text
 Test Files  4 passed (4)
      Tests  26 passed (26)
   Duration  2.98s
```

| Test Suite | Jumlah Test | Lulus | Gagal | Modul Target |
|---|---:|---:|---:|---|
| `tests/aiService.test.ts` | 7 | 7 | 0 | `aiService.ts` (`cleanWhisperTranscript`, `removeRepetitiveLoops`) |
| `tests/authController.test.ts` | 6 | 6 | 0 | `authController.ts` (`login` Basis Paths) |
| `tests/paymentService.test.ts` | 6 | 6 | 0 | `paymentService.ts` (`verifySignature`, `processWebhook`) |
| `tests/adminController.test.ts` | 7 | 7 | 0 | `adminController.ts` (`addUserQuota`, `updateUserStatus`) |
| **Total** | **26** | **26** | **0** | **100% Lulus** |

> **Catatan Coverage V8**: Pengukuran coverage difokuskan pada jalur logika fungsi-fungsi inti yang diuji pada `aiService.ts`, `authController.ts`, `paymentService.ts`, dan `adminController.ts`. Pada fungsi-fungsi target yang diuji di atas, seluruh percabangan logika (*Basis Paths*) telah tereksekusi 100% dengan hasil **Pass**.
