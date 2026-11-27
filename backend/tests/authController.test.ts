import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcrypt';
import authController from '../src/controllers/authController';
import userModel from '../src/models/userModel';
import sessionModel from '../src/models/sessionModel';
import logService from '../src/services/logService';

vi.mock('bcrypt');
vi.mock('../src/models/userModel', () => {
  const mock = { findByEmail: vi.fn() };
  return { default: mock, userModel: mock };
});
vi.mock('../src/models/sessionModel', () => {
  const mock = { create: vi.fn() };
  return { default: mock, sessionModel: mock };
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

describe('White-Box: authController.login (Basis Path Testing)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('WB-AUTH-01 (Path 1): mengembalikan 400 VALIDATION_ERROR jika email/password kosong atau bukan string', async () => {
    const req: any = { body: { email: 123, password: '' } };
    const reply = createMockReply();

    await authController.login(req, reply);
    expect(reply.statusCode).toBe(400);
    expect(reply.payload.code).toBe('VALIDATION_ERROR');
  });

  it('WB-AUTH-02 (Path 2): mengembalikan 401 INVALID_CREDENTIALS jika email tidak ditemukan', async () => {
    vi.mocked(userModel.findByEmail).mockResolvedValue(null);
    const req: any = { body: { email: 'notfound@mail.com', password: 'password123' } };
    const reply = createMockReply();

    await authController.login(req, reply);
    expect(reply.statusCode).toBe(401);
    expect(reply.payload.code).toBe('INVALID_CREDENTIALS');
  });

  it('WB-AUTH-03 (Path 3): mengembalikan 401 INVALID_CREDENTIALS jika password salah', async () => {
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

  it('WB-AUTH-04 (Path 4): mengembalikan 403 ACCOUNT_NOT_VERIFIED jika status akun PENDING', async () => {
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

  it('WB-AUTH-05 (Path 5): mengembalikan 403 ACCOUNT_SUSPENDED jika status akun SUSPENDED', async () => {
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

  it('WB-AUTH-06 (Path 6): mengembalikan 200 dengan JWT token dan refreshToken jika kredensial valid dan akun ACTIVE', async () => {
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
      server: {
        jwt: {
          sign: vi.fn().mockReturnValue('mock.jwt.token'),
        },
      },
    };
    const reply = createMockReply();

    await authController.login(req, reply);
    expect(reply.statusCode).toBe(200);
    expect(reply.payload.status).toBe('success');
    expect(reply.payload.token).toBe('mock.jwt.token');
    expect(reply.payload.refreshToken).toBeTruthy();
    expect(sessionModel.create).toHaveBeenCalledTimes(1);
    expect(logService.info).toHaveBeenCalled();
  });
});
