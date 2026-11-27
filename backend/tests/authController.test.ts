import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcrypt';
import authController from '../src/controllers/authController';
import userModel from '../src/models/userModel';
import sessionModel from '../src/models/sessionModel';
import otpModel from '../src/models/otpModel';
import emailService from '../src/services/emailService';
import logService from '../src/services/logService';

vi.mock('bcrypt');
vi.mock('../src/models/userModel', () => {
  const mock = {
    findByEmail: vi.fn(),
    create: vi.fn(),
    updatePendingUser: vi.fn(),
    getStatusById: vi.fn(),
  };
  return { default: mock, userModel: mock };
});
vi.mock('../src/models/sessionModel', () => {
  const mock = {
    create: vi.fn(),
    findByRefreshToken: vi.fn(),
    deleteByRefreshToken: vi.fn(),
    deleteByUserId: vi.fn(),
    rotate: vi.fn(),
  };
  return { default: mock, sessionModel: mock };
});
vi.mock('../src/models/otpModel', () => {
  const mock = {
    invalidatePrevious: vi.fn(),
    create: vi.fn(),
  };
  return { default: mock, otpModel: mock };
});
vi.mock('../src/services/emailService', () => {
  const mock = { sendOtpEmail: vi.fn() };
  return { default: mock, emailService: mock };
});
vi.mock('../src/services/logService', () => {
  const mock = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
  return { default: mock, logService: mock };
});

function createMockReply() {
  const reply: any = {
    statusCode: 200,
    payload: null,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    send(body: any) {
      this.payload = body;
      return this;
    },
  };
  return reply;
}

describe('White-Box: authController (login, register, refreshSession)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- LOGIN ---
  it('WB-AUTH-01 (login Path 1): mengembalikan 400 VALIDATION_ERROR jika email/password kosong atau non-string', async () => {
    const req: any = { body: { email: 123, password: '' } };
    const reply = createMockReply();
    await authController.login(req, reply);
    expect(reply.statusCode).toBe(400);
    expect(reply.payload.code).toBe('VALIDATION_ERROR');
  });

  it('WB-AUTH-02 (login Path 2): mengembalikan 401 INVALID_CREDENTIALS jika email tidak ditemukan', async () => {
    vi.mocked(userModel.findByEmail).mockResolvedValue(null);
    const req: any = { body: { email: 'notfound@mail.com', password: 'password123' } };
    const reply = createMockReply();
    await authController.login(req, reply);
    expect(reply.statusCode).toBe(401);
    expect(reply.payload.code).toBe('INVALID_CREDENTIALS');
  });

  it('WB-AUTH-03 (login Path 3): mengembalikan 401 INVALID_CREDENTIALS jika password salah', async () => {
    vi.mocked(userModel.findByEmail).mockResolvedValue({
      id: 'u1',
      email: 'user@mail.com',
      password_hash: 'hashed',
      status: 'ACTIVE',
    } as any);
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);
    const req: any = { body: { email: 'user@mail.com', password: 'wrong' } };
    const reply = createMockReply();
    await authController.login(req, reply);
    expect(reply.statusCode).toBe(401);
    expect(reply.payload.code).toBe('INVALID_CREDENTIALS');
  });

  it('WB-AUTH-04 (login Path 4): mengembalikan 403 ACCOUNT_NOT_VERIFIED jika status akun PENDING', async () => {
    vi.mocked(userModel.findByEmail).mockResolvedValue({
      id: 'u1',
      email: 'pending@mail.com',
      password_hash: 'hashed',
      status: 'PENDING',
    } as any);
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
    const req: any = { body: { email: 'pending@mail.com', password: 'password123' } };
    const reply = createMockReply();
    await authController.login(req, reply);
    expect(reply.statusCode).toBe(403);
    expect(reply.payload.code).toBe('ACCOUNT_NOT_VERIFIED');
  });

  it('WB-AUTH-05 (login Path 5): mengembalikan 403 ACCOUNT_SUSPENDED jika status akun SUSPENDED', async () => {
    vi.mocked(userModel.findByEmail).mockResolvedValue({
      id: 'u1',
      email: 'suspended@mail.com',
      password_hash: 'hashed',
      status: 'SUSPENDED',
    } as any);
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
    const req: any = { body: { email: 'suspended@mail.com', password: 'password123' } };
    const reply = createMockReply();
    await authController.login(req, reply);
    expect(reply.statusCode).toBe(403);
    expect(reply.payload.code).toBe('ACCOUNT_SUSPENDED');
  });

  it('WB-AUTH-06 (login Path 6): mengembalikan 200 dengan JWT token dan refreshToken jika akun ACTIVE', async () => {
    vi.mocked(userModel.findByEmail).mockResolvedValue({
      id: 'u1',
      name: 'Kevin',
      email: 'kevin@mail.com',
      password_hash: 'hashed',
      role: 'user',
      balance: 1800,
      status: 'ACTIVE',
      avatar_url: null,
    } as any);
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
    vi.mocked(sessionModel.create).mockResolvedValue({} as any);

    const req: any = {
      body: { email: '  KEVIN@mail.com ', password: 'password123' },
      ip: '127.0.0.1',
      headers: { 'user-agent': 'Vitest' },
      server: { jwt: { sign: vi.fn().mockReturnValue('mock.jwt.token') } },
    };
    const reply = createMockReply();
    await authController.login(req, reply);
    expect(reply.statusCode).toBe(200);
    expect(reply.payload.token).toBe('mock.jwt.token');
    expect(sessionModel.create).toHaveBeenCalledTimes(1);
    expect(logService.info).toHaveBeenCalled();
  });

  // --- REGISTER ---
  it('WB-AUTH-07 (register): menolak nama < 2 karakter dengan 400 VALIDATION_ERROR', async () => {
    const req: any = { body: { name: 'A', email: 'a@mail.com', password: 'Password123' } };
    const reply = createMockReply();
    await authController.register(req, reply);
    expect(reply.statusCode).toBe(400);
    expect(reply.payload.code).toBe('VALIDATION_ERROR');
  });

  it('WB-AUTH-08 (register): menolak format email tidak valid', async () => {
    const req: any = { body: { name: 'Budi', email: 'budi@invalid', password: 'Password123' } };
    const reply = createMockReply();
    await authController.register(req, reply);
    expect(reply.statusCode).toBe(400);
    expect(reply.payload.code).toBe('VALIDATION_ERROR');
  });

  it('WB-AUTH-09 (register): menolak kata sandi tanpa kombinasi huruf & angka', async () => {
    const req: any = { body: { name: 'Budi', email: 'budi@mail.com', password: 'abcdefgh' } };
    const reply = createMockReply();
    await authController.register(req, reply);
    expect(reply.statusCode).toBe(400);
    expect(reply.payload.code).toBe('VALIDATION_ERROR');
  });

  it('WB-AUTH-10 (register): mengembalikan 409 EMAIL_ALREADY_EXISTS jika email sudah ACTIVE', async () => {
    vi.mocked(userModel.findByEmail).mockResolvedValue({ id: 'u1', status: 'ACTIVE' } as any);
    const req: any = { body: { name: 'Budi', email: 'budi@mail.com', password: 'Password123' } };
    const reply = createMockReply();
    await authController.register(req, reply);
    expect(reply.statusCode).toBe(409);
    expect(reply.payload.code).toBe('EMAIL_ALREADY_EXISTS');
  });

  it('WB-AUTH-11 (register): membuat akun baru status PENDING, simpan OTP & kirim email (201)', async () => {
    vi.mocked(userModel.findByEmail).mockResolvedValue(null);
    vi.mocked(bcrypt.hash).mockResolvedValue('hashed_pw' as never);
    vi.mocked(userModel.create).mockResolvedValue({ id: 'u-new', name: 'Budi', email: 'budi@mail.com' } as any);
    vi.mocked(otpModel.invalidatePrevious).mockResolvedValue(0 as any);
    vi.mocked(otpModel.create).mockResolvedValue({} as any);
    vi.mocked(emailService.sendOtpEmail).mockResolvedValue({} as any);

    const req: any = { body: { name: 'Budi', email: 'Budi@mail.com', password: 'Password123' } };
    const reply = createMockReply();
    await authController.register(req, reply);
    expect(reply.statusCode).toBe(201);
    expect(userModel.create).toHaveBeenCalledWith(expect.objectContaining({ status: 'PENDING', balance: 1800 }));
    expect(emailService.sendOtpEmail).toHaveBeenCalledTimes(1);
  });

  // --- REFRESH SESSION ---
  it('WB-AUTH-12 (refreshSession): menolak jika refreshToken kosong (400)', async () => {
    const req: any = { body: {} };
    const reply = createMockReply();
    await authController.refreshSession(req, reply);
    expect(reply.statusCode).toBe(400);
    expect(reply.payload.code).toBe('VALIDATION_ERROR');
  });

  it('WB-AUTH-13 (refreshSession): menolak jika sesi tidak ditemukan (401 INVALID_REFRESH_TOKEN)', async () => {
    vi.mocked(sessionModel.findByRefreshToken).mockResolvedValue(null);
    const req: any = { body: { refreshToken: 'unknown-token' } };
    const reply = createMockReply();
    await authController.refreshSession(req, reply);
    expect(reply.statusCode).toBe(401);
    expect(reply.payload.code).toBe('INVALID_REFRESH_TOKEN');
  });

  it('WB-AUTH-14 (refreshSession): menghapus sesi & menolak 401 SESSION_EXPIRED jika kedaluwarsa', async () => {
    vi.mocked(sessionModel.findByRefreshToken).mockResolvedValue({
      id: 's1',
      expires_at: new Date(Date.now() - 60_000),
    } as any);
    const req: any = { body: { refreshToken: 'expired-token' } };
    const reply = createMockReply();
    await authController.refreshSession(req, reply);
    expect(reply.statusCode).toBe(401);
    expect(reply.payload.code).toBe('SESSION_EXPIRED');
    expect(sessionModel.deleteByRefreshToken).toHaveBeenCalledWith('expired-token');
  });

  it('WB-AUTH-15 (refreshSession): mencabut semua sesi & menolak 403 ACCOUNT_SUSPENDED jika akun ditangguhkan', async () => {
    vi.mocked(sessionModel.findByRefreshToken).mockResolvedValue({
      id: 's1',
      user_pk: 'u1',
      expires_at: new Date(Date.now() + 60_000),
    } as any);
    vi.mocked(userModel.getStatusById).mockResolvedValue('SUSPENDED');
    const req: any = { body: { refreshToken: 'valid-token' } };
    const reply = createMockReply();
    await authController.refreshSession(req, reply);
    expect(reply.statusCode).toBe(403);
    expect(reply.payload.code).toBe('ACCOUNT_SUSPENDED');
    expect(sessionModel.deleteByUserId).toHaveBeenCalledWith('u1');
  });

  it('WB-AUTH-16 (refreshSession): melakukan Refresh Token Rotation (RTR) jika sesi valid & ACTIVE (200)', async () => {
    vi.mocked(sessionModel.findByRefreshToken).mockResolvedValue({
      id: 's1',
      user_pk: 'u1',
      email: 'kevin@mail.com',
      name: 'Kevin',
      role: 'user',
      expires_at: new Date(Date.now() + 60_000),
    } as any);
    vi.mocked(userModel.getStatusById).mockResolvedValue('ACTIVE');
    const req: any = {
      body: { refreshToken: 'old-refresh' },
      ip: '127.0.0.1',
      headers: { 'user-agent': 'Vitest' },
      server: { jwt: { sign: vi.fn().mockReturnValue('new.access.token') } },
    };
    const reply = createMockReply();
    await authController.refreshSession(req, reply);
    expect(reply.statusCode).toBe(200);
    expect(reply.payload.token).toBe('new.access.token');
    expect(sessionModel.rotate).toHaveBeenCalledTimes(1);
  });
});
