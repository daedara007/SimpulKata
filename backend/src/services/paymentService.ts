/**
 * services/paymentService.ts - Layanan Integrasi Pembayaran & Webhook Midtrans Sandbox
 * Berdasarkan referensi/erd.puml dan SRS FR-FIN-03 / UC-13 & FR-FIN-04 / UC-14 (SD-13 & SD-14)
 * Mendukung pengujian resmi SDD TC-04 (Signature Security) & TC-08 (Idempotency Handling)
 */

import crypto from 'crypto';
import { orderModel, userModel } from '../models';
import { logService } from './logService';
import {
  OrderPackage,
  OrderRow,
  MidtransWebhookPayload,
} from '../types';

export const AVAILABLE_PACKAGES: OrderPackage[] = [
  {
    id: 'starter_200',
    name: 'Paket Starter',
    minutes: 200,
    amount: 50000,
    description: 'Cocok untuk wawancara singkat, tugas kuliah, dan audio hingga 3.3 jam.',
    badge: 'Starter',
    features: [
      '200 Menit (12.000 detik) Saldo Kuota',
      'Transkrip Lengkap & Rangkuman AI',
      'Format Audio hingga 200MB',
      'Masa Berlaku Selamanya',
    ],
  },
  {
    id: 'pro_450',
    name: 'Paket Edukasi Pro',
    minutes: 450,
    amount: 100000,
    description: 'Pilihan terbaik untuk materi kuliah semesteran, wawancara skripsi, dan seminar.',
    badge: 'Rekomendasi',
    features: [
      '450 Menit (27.000 detik) Saldo Kuota',
      'Transkrip Lengkap & Rangkuman AI',
      'Prioritas Pemrosesan Whisper & Llama',
      'Penyimpanan Riwayat Permanen',
    ],
  },
  {
    id: 'enterprise_1200',
    name: 'Paket Enterprise',
    minutes: 1200,
    amount: 250000,
    description: 'Dirancang untuk tim bisnis, rapat mingguan, podcast panjang, dan kebutuhan profesional.',
    badge: 'Nilai Terbaik',
    features: [
      '1.200 Menit (72.000 detik) Saldo Kuota',
      'Seluruh Fitur Edukasi Pro',
      'Kapasitas Unggah Skala Besar',
      'Dukungan Teknis Prioritas',
    ],
  },
];

export class PaymentService {
  private serverKey: string;
  private clientKey: string;
  private isProduction: boolean;

  constructor() {
    this.serverKey = process.env.MIDTRANS_SERVER_KEY || '';
    this.clientKey = process.env.MIDTRANS_CLIENT_KEY || '';
    this.isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';
  }

  /**
   * Mengambil daftar paket kuota resmi yang tersedia
   */
  getPackages(): OrderPackage[] {
    return AVAILABLE_PACKAGES;
  }

  /**
   * Mengambil detail paket berdasarkan ID
   */
  getPackageById(packageId: string): OrderPackage | null {
    return AVAILABLE_PACKAGES.find((p) => p.id === packageId) || null;
  }

  /**
   * Mengecek apakah kredensial Midtrans Sandbox telah diisi dan valid
   */
  private isMidtransConfigured(): boolean {
    return (
      Boolean(this.serverKey) &&
      !this.serverKey.includes('your_server_key') &&
      this.serverKey.trim() !== '' &&
      (this.serverKey.startsWith('SB-Mid-server-') || this.serverKey.startsWith('Mid-server-'))
    );
  }

  /**
   * Membuat pesanan pembelian kuota baru dan sesi Midtrans Snap (SRS UC-13 / SD-13)
   */
  async createCheckout(
    user: { id: string; name: string; email: string },
    packageId: string
  ): Promise<{
    order: OrderRow;
    package: OrderPackage;
    snapToken: string;
    redirectUrl: string;
    clientKey: string;
    isMock: boolean;
  }> {
    const pkg = this.getPackageById(packageId);
    if (!pkg) {
      throw new Error(`Paket kuota '${packageId}' tidak ditemukan.`);
    }

    // 1. Generate nomor order unik (Format: ORD-TIMESTAMP-RANDOM4)
    const timestamp = Date.now().toString().slice(-6);
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const orderNumber = `ORD-${Date.now()}-${randomSuffix}`;

    // 2. Simpan order ke basis data dengan status 'pending' (SD-13 Langkah 7-8)
    const order = await orderModel.create({
      userId: user.id,
      orderNumber,
      packageId: pkg.id,
      packageName: pkg.name,
      packageMinutes: pkg.minutes,
      amount: pkg.amount,
    });

    logService.info(
      'PAYMENT',
      `Pesanan baru dibuat: ${orderNumber} (${pkg.name} - Rp${pkg.amount}) oleh ${user.email}`
    );

    // 3. Integrasi Midtrans Snap API Sandbox jika Server Key terpasang (SD-13 Langkah 9-10)
    if (this.isMidtransConfigured()) {
      try {
        const snapApiUrl = this.isProduction
          ? 'https://app.midtrans.com/snap/v1/transactions'
          : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

        const basicAuth = Buffer.from(`${this.serverKey}:`).toString('base64');

        const snapPayload = {
          transaction_details: {
            order_id: orderNumber,
            gross_amount: pkg.amount,
          },
          customer_details: {
            first_name: user.name,
            email: user.email,
          },
          item_details: [
            {
              id: pkg.id,
              price: pkg.amount,
              quantity: 1,
              name: pkg.name,
            },
          ],
        };

        const response = await fetch(snapApiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Basic ${basicAuth}`,
          },
          body: JSON.stringify(snapPayload),
        });

        if (!response.ok) {
          const errText = await response.text();
          logService.warn('PAYMENT', `Midtrans Snap API gagal (${response.status}): ${errText}`);
          throw new Error(`Gagal menghubungi gateway Midtrans: ${response.statusText}`);
        }

        const snapData = (await response.json()) as { token: string; redirect_url: string };

        // 4. Update order dengan snap token dan redirect url dari Midtrans
        const updatedOrder = await orderModel.updateGatewayToken(
          orderNumber,
          snapData.token,
          snapData.redirect_url
        );

        return {
          order: updatedOrder || order,
          package: pkg,
          snapToken: snapData.token,
          redirectUrl: snapData.redirect_url,
          clientKey: this.clientKey,
          isMock: false,
        };
      } catch (err: any) {
        logService.warn(
          'PAYMENT',
          `Fallback ke Simulator Sandbox karena error Midtrans: ${err.message}`
        );
      }
    }

    // 5. Fallback Mock Sandbox Simulator (Memastikan aplikasi selalu dapat diuji tanpa hambatan network)
    const mockSnapToken = `mock-snap-${orderNumber}`;
    const mockRedirectUrl = `/orders/${orderNumber}/simulate`;
    const updatedOrder = await orderModel.updateGatewayToken(
      orderNumber,
      mockSnapToken,
      mockRedirectUrl
    );

    return {
      order: updatedOrder || order,
      package: pkg,
      snapToken: mockSnapToken,
      redirectUrl: mockRedirectUrl,
      clientKey: this.clientKey || 'mock-client-key',
      isMock: true,
    };
  }

  /**
   * Menghitung Digital Signature SHA-512 sesuai spesifikasi resmi Midtrans (SDD TC-04)
   * Formula: SHA512(order_id + status_code + gross_amount + ServerKey)
   */
  calculateSignature(orderId: string, statusCode: string, grossAmount: string): string {
    const raw = `${orderId}${statusCode}${grossAmount}${this.serverKey}`;
    return crypto.createHash('sha512').update(raw).digest('hex');
  }

  /**
   * Memvalidasi Digital Signature dari webhook Midtrans (SDD TC-04)
   */
  verifySignature(
    orderId: string,
    statusCode: string,
    grossAmount: string,
    signatureKey: string
  ): boolean {
    if (!this.serverKey) return true; // Mode sandbox tanpa key
    const expected = this.calculateSignature(orderId, statusCode, grossAmount);
    return expected.toLowerCase() === signatureKey.toLowerCase();
  }

  /**
   * Menangani Webhook Notifikasi Pembayaran dari Midtrans (SRS UC-14 / SD-14)
   * Dilengkapi proteksi keamanan signature (TC-04) dan idempotency duplikat (TC-08)
   */
  async processWebhook(payload: MidtransWebhookPayload): Promise<{
    success: boolean;
    message: string;
    duplicate?: boolean;
    orderNumber: string;
  }> {
    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
      payment_type,
    } = payload;

    // 1. Cari data order di basis data
    const order = await orderModel.findByOrderNumber(order_id);
    if (!order) {
      logService.warn('PAYMENT', `Webhook ditolak: Order '${order_id}' tidak ditemukan di database.`);
      const err: any = new Error(`Order '${order_id}' tidak ditemukan.`);
      err.statusCode = 404;
      throw err;
    }

    // 2. Validasi Digital Signature Midtrans (SDD TC-04)
    if (this.isMidtransConfigured()) {
      const isValidSig = this.verifySignature(order_id, status_code, gross_amount, signature_key);
      if (!isValidSig) {
        logService.warn(
          'PAYMENT',
          `Percobaan webhook palsu (Invalid Signature) untuk order ${order_id}. Signature ditolak.`
        );
        const err: any = new Error('Digital Signature tidak valid.');
        err.statusCode = 401;
        throw err;
      }
    }

    // 3. Penanganan Webhook Duplikat / Idempotency Check (SDD TC-08 & SD-14 Langkah 5b)
    if (order.status === 'completed') {
      logService.info(
        'PAYMENT',
        `Webhook duplikat untuk order ${order_id} diabaikan. Order sudah berstatus 'completed' sebelumnya.`
      );
      return {
        success: true,
        message: 'Order sudah selesai (Idempotent: duplikasi diabaikan)',
        duplicate: true,
        orderNumber: order.order_number,
      };
    }

    // 4. Periksa Status Pembayaran dari Gateway
    const isSuccess =
      transaction_status === 'settlement' ||
      (transaction_status === 'capture' && fraud_status === 'accept');

    if (isSuccess) {
      // Pembayaran Sukses: Update order status & Tambah Saldo Pengguna (SD-14 Langkah 5-10)
      await orderModel.markCompleted(order_id, payment_type);
      const addedSeconds = order.package_minutes * 60;
      const updatedBalance = await userModel.addBalance(order.user_id, addedSeconds);

      logService.info(
        'PAYMENT',
        `Pembayaran sukses untuk order ${order.order_number} (${order.package_name}). Saldo bertambah ${order.package_minutes} menit (${addedSeconds}s). Saldo pengguna kini: ${updatedBalance}s.`
      );

      return {
        success: true,
        message: 'Pembayaran berhasil diverifikasi dan saldo kuota telah ditambahkan.',
        orderNumber: order.order_number,
      };
    } else if (
      transaction_status === 'deny' ||
      transaction_status === 'cancel' ||
      transaction_status === 'expire'
    ) {
      // Pembayaran Gagal / Dibatalkan
      const statusToSet = transaction_status === 'cancel' ? 'cancelled' : 'failed';
      await orderModel.markFailed(order_id, statusToSet);
      logService.warn(
        'PAYMENT',
        `Transaksi order ${order.order_number} tidak berhasil (Status: ${transaction_status}).`
      );

      return {
        success: true,
        message: `Transaksi berstatus '${transaction_status}'.`,
        orderNumber: order.order_number,
      };
    } else {
      // Transaksi masih pending
      return {
        success: true,
        message: `Transaksi sedang diproses (Status: ${transaction_status}).`,
        orderNumber: order.order_number,
      };
    }
  }

  /**
   * Simulasi Pembayaran Sukses untuk Pengujian Cepat & Demo Lokal
   */
  async simulatePaymentSuccess(orderNumber: string): Promise<{
    success: boolean;
    orderNumber: string;
    addedMinutes: number;
    newBalance: number;
  }> {
    const order = await orderModel.findByOrderNumber(orderNumber);
    if (!order) {
      throw new Error(`Order '${orderNumber}' tidak ditemukan.`);
    }

    if (order.status === 'completed') {
      const user = await userModel.findById(order.user_id);
      return {
        success: true,
        orderNumber: order.order_number,
        addedMinutes: 0,
        newBalance: user?.balance || 0,
      };
    }

    // Update order status dan tambah saldo kuota
    await orderModel.markCompleted(orderNumber, 'simulation_sandbox');
    const addedSeconds = order.package_minutes * 60;
    const newBalance = await userModel.addBalance(order.user_id, addedSeconds);

    logService.info(
      'PAYMENT',
      `[SIMULASI SANDBOX] Pembayaran sukses untuk order ${order.order_number}. Saldo bertambah ${order.package_minutes} menit (${addedSeconds}s). Saldo pengguna: ${newBalance}s.`
    );

    return {
      success: true,
      orderNumber: order.order_number,
      addedMinutes: order.package_minutes,
      newBalance,
    };
  }

  /**
   * Mengecek status pesanan ke Midtrans API secara aktif (Polling / On-Demand Sync)
   * Menjamin pesanan dan saldo kuota terupdate meskipun webhook Midtrans terhalang firewall/localhost
   */
  async syncOrderStatus(orderNumber: string): Promise<{
    order: OrderRow;
    newBalance?: number;
    synced: boolean;
  }> {
    const order = await orderModel.findByOrderNumber(orderNumber);
    if (!order) {
      throw new Error(`Pesanan '${orderNumber}' tidak ditemukan.`);
    }

    if (order.status === 'completed' || !this.isMidtransConfigured()) {
      return { order, synced: false };
    }

    try {
      const basicAuth = Buffer.from(`${this.serverKey}:`).toString('base64');
      const statusUrl = this.isProduction
        ? `https://api.midtrans.com/v2/${orderNumber}/status`
        : `https://api.sandbox.midtrans.com/v2/${orderNumber}/status`;

      const response = await fetch(statusUrl, {
        headers: {
          Accept: 'application/json',
          Authorization: `Basic ${basicAuth}`,
        },
      });

      if (!response.ok) {
        return { order, synced: false };
      }

      const statusData = (await response.json()) as any;
      const txStatus = statusData.transaction_status;

      if (txStatus === 'settlement' || txStatus === 'capture') {
        const paymentType = statusData.payment_type || 'snap';
        const updatedOrder = await orderModel.markCompleted(orderNumber, paymentType);

        // Tambahkan saldo kuota ke akun pengguna
        const addedSeconds = order.package_minutes * 60;
        const newBalance = await userModel.addBalance(order.user_id, addedSeconds);

        logService.info(
          'PAYMENT',
          `Pesanan ${orderNumber} berhasil diverifikasi langsung dari Midtrans API (${txStatus}). Saldo pengguna ${order.user_id} ditambah +${addedSeconds}s (Total: ${newBalance}s).`
        );

        return {
          order: updatedOrder || order,
          newBalance: newBalance ?? undefined,
          synced: true,
        };
      } else if (txStatus === 'cancel' || txStatus === 'expire' || txStatus === 'deny') {
        const updatedOrder = await orderModel.markFailed(orderNumber, 'cancelled');
        return {
          order: updatedOrder || order,
          synced: true,
        };
      }

      return { order, synced: false };
    } catch (err: any) {
      logService.warn('PAYMENT', `Sinkronisasi aktif Midtrans untuk ${orderNumber} gagal: ${err.message}`);
      return { order, synced: false };
    }
  }
}

export const paymentService = new PaymentService();
export default paymentService;
