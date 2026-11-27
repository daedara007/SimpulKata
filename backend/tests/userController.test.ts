import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcrypt';
import userController from '../src/controllers/userController';
import userModel from '../src/models/userModel';
import sessionModel from '../src/models/sessionModel';
import quotaMutationModel from '../src/models/quotaMutationModel';

vi.mock('bcrypt');
vi.mock('../src/models/userModel', () => {
  const mock = {
    getPasswordHash: vi.fn(),
    updatePassword: vi.fn(),
  };
  return { default: mock, userModel: mock };
});
vi.mock('../src/models/sessionModel', () => {
  const mock = { deleteByUserId: vi.fn() };
  return { default: mock, sessionModel: mock };
});
vi.mock('../src/models/quotaMutationModel', () => {
  const mock = { getUserMutations: vi.fn() };
  return { default: mock, quotaMutationModel: mock };
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

describe('White-Box: userController (changePassword & getQuotaMutations)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('WB-USR-01: menolak changePassword jika password baru < 8 karakter (BVA)', async () => {
    const req: any = {
      user: { id: 'u1' },
      body: { currentPassword: 'OldPass123', newPassword: 'Ab1', confirmPassword: 'Ab1' },
    };
    const reply = createMockReply();
    await userController.changePassword(req, reply);
    expect(reply.statusCode).toBe(400);
    expect(reply.payload.code).toBe('VALIDATION_ERROR');
  });

  it('WB-USR-02: menolak changePassword jika password baru tidak mengandung huruf & angka', async () => {
    const req: any = {
      user: { id: 'u1' },
      body: { currentPassword: 'OldPass123', newPassword: 'abcdefghij', confirmPassword: 'abcdefghij' },
    };
    const reply = createMockReply();
    await userController.changePassword(req, reply);
    expect(reply.statusCode).toBe(400);
    expect(reply.payload.code).toBe('VALIDATION_ERROR');
  });

  it('WB-USR-03: menolak changePassword jika konfirmasi password tidak cocok', async () => {
    const req: any = {
      user: { id: 'u1' },
      body: { currentPassword: 'OldPass123', newPassword: 'NewPass123', confirmPassword: 'NewPass999' },
    };
    const reply = createMockReply();
    await userController.changePassword(req, reply);
    expect(reply.statusCode).toBe(400);
    expect(reply.payload.code).toBe('VALIDATION_ERROR');
  });

  it('WB-USR-04: menolak changePassword jika password baru sama dengan password lama (SAME_PASSWORD)', async () => {
    const req: any = {
      user: { id: 'u1' },
      body: { currentPassword: 'OldPass123', newPassword: 'OldPass123', confirmPassword: 'OldPass123' },
    };
    const reply = createMockReply();
    await userController.changePassword(req, reply);
    expect(reply.statusCode).toBe(400);
    expect(reply.payload.code).toBe('SAME_PASSWORD');
  });

  it('WB-USR-05: menolak changePassword jika password lama tidak cocok dengan hash bcrypt', async () => {
    vi.mocked(userModel.getPasswordHash).mockResolvedValue('hashed_old');
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);
    const req: any = {
      user: { id: 'u1' },
      body: { currentPassword: 'WrongOld1', newPassword: 'NewPass123', confirmPassword: 'NewPass123' },
    };
    const reply = createMockReply();
    await userController.changePassword(req, reply);
    expect(reply.statusCode).toBe(400);
    expect(reply.payload.code).toBe('INVALID_PASSWORD');
  });

  it('WB-USR-06: berhasil ubah password dan langsung mencabut semua sesi aktif pengguna', async () => {
    vi.mocked(userModel.getPasswordHash).mockResolvedValue('hashed_old');
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
    vi.mocked(bcrypt.hash).mockResolvedValue('hashed_new' as never);
    vi.mocked(userModel.updatePassword).mockResolvedValue(true);
    vi.mocked(sessionModel.deleteByUserId).mockResolvedValue(2);

    const req: any = {
      user: { id: 'u1' },
      body: { currentPassword: 'OldPass123', newPassword: 'NewPass123', confirmPassword: 'NewPass123' },
    };
    const reply = createMockReply();
    await userController.changePassword(req, reply);
    expect(reply.statusCode).toBe(200);
    expect(sessionModel.deleteByUserId).toHaveBeenCalledWith('u1');
  });

  it('WB-USR-07: getQuotaMutations mengembalikan daftar mutasi dengan filter CREDIT/DEBIT', async () => {
    vi.mocked(quotaMutationModel.getUserMutations).mockResolvedValue({
      mutations: [{ id: 'm1', type: 'CREDIT', amount_seconds: 1800 }],
      total: 1,
      page: 1,
      limit: 15,
      totalPages: 1,
    } as any);
    const req: any = { user: { id: 'u1' }, query: { page: '1', limit: '15', type: 'CREDIT' } };
    const reply = createMockReply();
    await userController.getQuotaMutations(req, reply);
    expect(reply.statusCode).toBe(200);
    expect(quotaMutationModel.getUserMutations).toHaveBeenCalledWith('u1', { page: 1, limit: 15, type: 'CREDIT' });
  });
});
