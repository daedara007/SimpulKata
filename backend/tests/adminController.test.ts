import { describe, it, expect, vi, beforeEach } from 'vitest';
import adminController from '../src/controllers/adminController';
import userModel from '../src/models/userModel';
import sessionModel from '../src/models/sessionModel';

vi.mock('../src/models/userModel', () => {
  const mock = {
    findById: vi.fn(),
    addQuotaManualWithMutation: vi.fn(),
    updateStatus: vi.fn(),
  };
  return { default: mock, userModel: mock };
});
vi.mock('../src/models/sessionModel', () => {
  const mock = { deleteByUserId: vi.fn() };
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

const VALID_UUID = '11111111-1111-4111-8111-111111111111';
const ADMIN_UUID = '99999999-9999-4999-8999-999999999999';

describe('White-Box: adminController.addUserQuota & updateUserStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('WB-ADM-01: menolak akses non-admin dengan 403 FORBIDDEN', async () => {
    const req: any = { user: { id: VALID_UUID, role: 'user' }, params: { userId: VALID_UUID } };
    const reply = createMockReply();

    await adminController.addUserQuota(req, reply);
    expect(reply.statusCode).toBe(403);
    expect(reply.payload.code).toBe('FORBIDDEN');
  });

  it('WB-ADM-02: menolak format UUID userId tidak valid (400 INVALID_USER_ID)', async () => {
    const req: any = { user: { id: ADMIN_UUID, role: 'admin' }, params: { userId: 'bukan-uuid' } };
    const reply = createMockReply();

    await adminController.addUserQuota(req, reply);
    expect(reply.statusCode).toBe(400);
    expect(reply.payload.code).toBe('INVALID_USER_ID');
  });

  it('WB-ADM-03: menolak jumlah menit kuota di luar batas 1..10000 (BVA)', async () => {
    const req: any = {
      user: { id: ADMIN_UUID, role: 'admin' },
      params: { userId: VALID_UUID },
      body: { minutes: 0 },
    };
    const reply = createMockReply();

    await adminController.addUserQuota(req, reply);
    expect(reply.statusCode).toBe(400);
    expect(reply.payload.code).toBe('INVALID_QUOTA_AMOUNT');
  });

  it('WB-ADM-04: menolak penambahan kuota ke akun berstatus PENDING', async () => {
    vi.mocked(userModel.findById).mockResolvedValue({ id: VALID_UUID, status: 'PENDING' } as any);
    const req: any = {
      user: { id: ADMIN_UUID, role: 'admin' },
      params: { userId: VALID_UUID },
      body: { minutes: 30 },
    };
    const reply = createMockReply();

    await adminController.addUserQuota(req, reply);
    expect(reply.statusCode).toBe(400);
    expect(reply.payload.code).toBe('USER_PENDING_VERIFICATION');
  });

  it('WB-ADM-05: berhasil menambahkan kuota manual & menyamarkan mutasi pada response', async () => {
    vi.mocked(userModel.findById).mockResolvedValue({ id: VALID_UUID, name: 'Budi', email: 'budi@mail.com', status: 'ACTIVE' } as any);
    vi.mocked(userModel.addQuotaManualWithMutation).mockResolvedValue({
      user: { id: VALID_UUID, balance: 3600 },
      mutation: {
        id: 'm1',
        type: 'CREDIT',
        amount_seconds: 1800,
        balance_before: 1800,
        balance_after: 3600,
        description: 'Penambahan Kuota Admin: Bonus (+30m)',
        reference_type: 'MANUAL_ADJUSTMENT',
        reference_id: ADMIN_UUID,
        created_at: new Date(),
      },
    } as any);

    const req: any = {
      user: { id: ADMIN_UUID, role: 'admin' },
      params: { userId: VALID_UUID },
      body: { minutes: 30, note: 'Bonus' },
    };
    const reply = createMockReply();

    await adminController.addUserQuota(req, reply);
    expect(reply.statusCode).toBe(200);
    expect(reply.payload.data.user.balance).toBe(3600);
  });

  it('WB-ADM-06: melarang admin menangguhkan akun sesama admin (403 CANNOT_MODIFY_ADMIN_STATUS)', async () => {
    vi.mocked(userModel.findById).mockResolvedValue({ id: VALID_UUID, role: 'admin', status: 'ACTIVE' } as any);
    const req: any = {
      user: { id: ADMIN_UUID, role: 'admin' },
      params: { userId: VALID_UUID },
      body: { status: 'SUSPENDED' },
    };
    const reply = createMockReply();

    await adminController.updateUserStatus(req, reply);
    expect(reply.statusCode).toBe(403);
    expect(reply.payload.code).toBe('CANNOT_MODIFY_ADMIN_STATUS');
  });

  it('WB-ADM-07: menangguhkan akun ACTIVE menjadi SUSPENDED dan langsung mencabut seluruh sesi aktifnya', async () => {
    vi.mocked(userModel.findById).mockResolvedValue({ id: VALID_UUID, name: 'Budi', email: 'budi@mail.com', role: 'user', status: 'ACTIVE' } as any);
    vi.mocked(userModel.updateStatus).mockResolvedValue({ id: VALID_UUID, status: 'SUSPENDED' } as any);
    vi.mocked(sessionModel.deleteByUserId).mockResolvedValue(1);

    const req: any = {
      user: { id: ADMIN_UUID, role: 'admin' },
      params: { userId: VALID_UUID },
      body: { status: 'SUSPENDED' },
    };
    const reply = createMockReply();

    await adminController.updateUserStatus(req, reply);
    expect(reply.statusCode).toBe(200);
    expect(sessionModel.deleteByUserId).toHaveBeenCalledWith(VALID_UUID);
  });
});
