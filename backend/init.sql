-- ==========================================================
-- SimpulKata - Inisiasi Skema Database (MVP)
-- Berdasarkan: erd.puml
-- Dibuat untuk: PostgreSQL 15
-- Catatan: Hanya tabel users dan transcripts (sesuai scope MVP)
-- ==========================================================

-- Aktifkan ekstensi UUID generator bawaan PostgreSQL
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------
-- TABEL: users
-- Menyimpan data akun pengguna dan saldo kuota pemrosesan
-- Relasi: 1 user → N transcripts
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255)    NOT NULL UNIQUE,
    password_hash   VARCHAR(255)    NOT NULL,
    name            VARCHAR(100)    NOT NULL,
    -- Saldo kuota dalam detik (misal: 600 = 10 menit pemrosesan)
    balance         INTEGER         NOT NULL DEFAULT 0,
    -- Role: 'user' untuk pengguna reguler, 'admin' untuk administrator
    role            VARCHAR(20)     NOT NULL DEFAULT 'user'
                        CHECK (role IN ('user', 'admin')),
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP       NOT NULL DEFAULT NOW()
);

-- Index untuk mempercepat pencarian user berdasarkan email (digunakan saat login)
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- ----------------------------------------------------------
-- TABEL: transcripts
-- Menyimpan metadata audio, hasil transkripsi Whisper (STT),
-- dan hasil rangkuman GPT (LLM) dalam satu record
-- Relasi: N transcripts → 1 user (FK ke tabel users)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS transcripts (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID            NOT NULL
                            REFERENCES users(id) ON DELETE CASCADE,
    original_file_name  VARCHAR(255)    NOT NULL,
    -- Path relatif file audio di server: storage/uploads/<filename>
    file_path           VARCHAR(255),
    -- Durasi audio hasil deteksi Whisper (dalam detik)
    duration_seconds    INTEGER         DEFAULT 0,
    -- Hasil transkripsi mentah dari OpenAI Whisper (STT)
    raw_text            TEXT,
    -- Hasil rangkuman terstruktur dari OpenAI GPT (LLM)
    summary_text        TEXT,
    -- Status alur pemrosesan:
    -- 'pending'    → File baru diunggah, belum diproses
    -- 'processing' → Sedang diproses oleh AI
    -- 'completed'  → Transkripsi (dan opsional rangkuman) selesai
    -- 'failed'     → Terjadi error saat pemrosesan AI
    status              VARCHAR(50)     NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    -- Jumlah token GPT yang dikonsumsi untuk rangkuman (0 jika belum dirangkum)
    tokens_used         INTEGER         NOT NULL DEFAULT 0,
    created_at          TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP       NOT NULL DEFAULT NOW()
);

-- Index untuk mempercepat query riwayat transkripsi per user (SD-11)
CREATE INDEX IF NOT EXISTS idx_transcripts_user_id ON transcripts (user_id);
-- Index untuk filter berdasarkan status (misal: tampilkan hanya 'completed')
CREATE INDEX IF NOT EXISTS idx_transcripts_status  ON transcripts (status);

-- ----------------------------------------------------------
-- FUNGSI: auto_update_updated_at()
-- Trigger function untuk otomatis memperbarui kolom updated_at
-- setiap kali ada operasi UPDATE pada tabel
-- ----------------------------------------------------------
CREATE OR REPLACE FUNCTION auto_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Pasang trigger pada tabel users
CREATE OR REPLACE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION auto_update_updated_at();

-- Pasang trigger pada tabel transcripts
CREATE OR REPLACE TRIGGER trg_transcripts_updated_at
    BEFORE UPDATE ON transcripts
    FOR EACH ROW EXECUTE FUNCTION auto_update_updated_at();

-- ----------------------------------------------------------
-- SEED DATA: Akun Admin Default (untuk keperluan testing)
-- Password: admin123 (hash bcrypt, cost factor 10)
-- GANTI password ini sebelum production!
-- ----------------------------------------------------------
INSERT INTO users (email, password_hash, name, balance, role)
VALUES (
    'admin@simpulkata.id',
    '$2b$10$YqurtUNTBpdjMu.5jZNlV.ocS3vJZEGZY9.ey6uSXGiRycZT6B45S',
    'Administrator',
    999999,
    'admin'
)
ON CONFLICT (email) DO NOTHING;
