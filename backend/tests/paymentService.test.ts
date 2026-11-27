import { describe, it, expect, vi, beforeEach } from 'vitest';
import { paymentService } from '../src/services/paymentService';
import orderModel from '../src/models/orderModel';
import userModel from '../src/models/userModel';
import quotaMutationModel from '../src/models/quotaMutationModel';

vi.mock('../src/models/orderModel', () => {
  const mock = {
    findByOrderNumber: vi.fn(),
    markCompleted: vi.fn(),
    markFailed: vi.fn(),
  };
  return { default: mock, orderModel: mock };
});
vi.mock('../src/models/userModel', () => {
  const mock = { addBalance: vi.fn() };
  return { default: mock, userModel: mock };
});
vi.mock('../src/models/quotaMutationModel', () => {
  const mock = { recordMutation: vi.fn() };
  return { default: mock, quotaMutationModel: mock };
});
vi.mock('../src/services/logService', () => {
  const mock = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
  return { default: mock, logService: mock };
});

describe('White-Box: paymentService (Signature & Webhook Basis Paths)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (paymentService as any).serverKey = 'SB-Mid-server-TESTKEY';
  });

  it('WB-PAY-01: memverifikasi Digital Signature SHA-512 valid vs tidak valid (SDD TC-04)', () => {
    const validSig = paymentService.calculateSignature('ORD-123', '200', '50000.00');
    expect(paymentService.verifySignature('ORD-123', '200', '50000.00', validSig)).toBe(true);
    expect(paymentService.verifySignature('ORD-123', '200', '50000.00', 'tampered-sig')).toBe(false);
  });

  it('WB-PAY-02 (Path 1): melempar error 404 jika order_id tidak ditemukan', async () => {
    vi.mocked(orderModel.findByOrderNumber).mockResolvedValue(null);

    await expect(
      paymentService.processWebhook({
        order_id: 'ORD-UNKNOWN',
        status_code: '200',
        gross_amount: '50000.00',
        signature_key: 'any',
        transaction_status: 'settlement',
      })
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('WB-PAY-03 (Path 2): melempar error 401 jika signature_key Midtrans tidak valid', async () => {
    vi.mocked(orderModel.findByOrderNumber).mockResolvedValue({
      order_number: 'ORD-123',
      status: 'pending',
    } as any);

    await expect(
      paymentService.processWebhook({
        order_id: 'ORD-123',
        status_code: '200',
        gross_amount: '50000.00',
        signature_key: 'fake-signature',
        transaction_status: 'settlement',
      })
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it('WB-PAY-04 (Path 3): mengabaikan webhook duplikat secara idempotent jika order sudah completed (SDD TC-08)', async () => {
    vi.mocked(orderModel.findByOrderNumber).mockResolvedValue({
      order_number: 'ORD-123',
      status: 'completed',
    } as any);
    const sig = paymentService.calculateSignature('ORD-123', '200', '50000.00');

    const res = await paymentService.processWebhook({
      order_id: 'ORD-123',
      status_code: '200',
      gross_amount: '50000.00',
      signature_key: sig,
      transaction_status: 'settlement',
    });

    expect(res.duplicate).toBe(true);
    expect(userModel.addBalance).not.toHaveBeenCalled();
  });

  it('WB-PAY-05 (Path 4): menandai order completed, menambah saldo & mencatat mutasi CREDIT saat settlement', async () => {
    vi.mocked(orderModel.findByOrderNumber).mockResolvedValue({
      order_number: 'ORD-123',
      user_id: 'u1',
      package_name: 'Paket Starter',
      package_minutes: 200,
      status: 'pending',
    } as any);
    vi.mocked(userModel.addBalance).mockResolvedValue(13800);
    const sig = paymentService.calculateSignature('ORD-123', '200', '50000.00');

    const res = await paymentService.processWebhook({
      order_id: 'ORD-123',
      status_code: '200',
      gross_amount: '50000.00',
      signature_key: sig,
      transaction_status: 'settlement',
      payment_type: 'qris',
    });

    expect(res.success).toBe(true);
    expect(orderModel.markCompleted).toHaveBeenCalledWith('ORD-123', 'qris');
    expect(userModel.addBalance).toHaveBeenCalledWith('u1', 12000);
    expect(quotaMutationModel.recordMutation).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'CREDIT', amountSeconds: 12000, balanceBefore: 1800, balanceAfter: 13800 })
    );
  });

  it('WB-PAY-06 (Path 5): memperbarui order menjadi failed jika status transaksi expire/deny/cancel', async () => {
    vi.mocked(orderModel.findByOrderNumber).mockResolvedValue({
      order_number: 'ORD-123',
      status: 'pending',
    } as any);
    const sig = paymentService.calculateSignature('ORD-123', '202', '50000.00');

    const res = await paymentService.processWebhook({
      order_id: 'ORD-123',
      status_code: '202',
      gross_amount: '50000.00',
      signature_key: sig,
      transaction_status: 'expire',
    });

    expect(res.success).toBe(true);
    expect(orderModel.markFailed).toHaveBeenCalledWith('ORD-123', 'failed');
  });
});
