/**
 * controllers/paymentController.ts - Controller untuk Pembelian Kuota & Webhook Pembayaran
 * Berdasarkan referensi/erd.puml dan SRS FR-FIN-03 / UC-13 & FR-FIN-04 / UC-14
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { paymentService } from '../services/paymentService';
import { orderModel } from '../models';
import { logService } from '../services/logService';
import { MidtransWebhookPayload } from '../types';

export class PaymentController {
  /**
   * GET /api/orders/packages
   * Mengambil daftar paket kuota audio yang tersedia (Publik / User)
   */
  async getPackages(_request: FastifyRequest, reply: FastifyReply) {
    const packages = paymentService.getPackages();
    return reply.status(200).send({
      status: 'success',
      data: {
        packages,
      },
    });
  }

  /**
   * Menentukan URL asal klien (untuk callback redirect Midtrans Snap kembali ke domain aktif pengguna)
   */
  private resolveClientOrigin(request: FastifyRequest): string {
    const originHeader = request.headers.origin;
    if (typeof originHeader === 'string' && /^https?:\/\//i.test(originHeader)) {
      return originHeader.replace(/\/+$/, '');
    }

    const refererHeader = request.headers.referer;
    if (typeof refererHeader === 'string' && /^https?:\/\//i.test(refererHeader)) {
      try {
        return new URL(refererHeader).origin;
      } catch {
        // abaikan referer rusak
      }
    }

    const forwardedHost = request.headers['x-forwarded-host'];
    const forwardedProto = request.headers['x-forwarded-proto'] || 'https';
    if (typeof forwardedHost === 'string' && forwardedHost.trim() !== '') {
      const host = forwardedHost.split(',')[0].trim();
      const proto = String(forwardedProto).split(',')[0].trim();
      return `${proto}://${host}`;
    }

    return (process.env.FRONTEND_URL || 'http://localhost:8080').replace(/\/+$/, '');
  }

  /**
   * POST /api/orders/checkout
   * Inisiasi pesanan pembelian kuota baru dan pembuatan sesi Midtrans Snap (SRS UC-13 / SD-13)
   */
  async checkout(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user;
    if (!user) {
      return reply.status(401).send({
        status: 'error',
        message: 'Autentikasi diperlukan untuk membeli kuota.',
      });
    }

    const { packageId } = (request.body || {}) as { packageId?: string };
    if (!packageId) {
      return reply.status(400).send({
        status: 'error',
        message: 'packageId wajib diisi.',
      });
    }

    try {
      const finishUrl = `${this.resolveClientOrigin(request)}/transactions`;
      const checkoutResult = await paymentService.createCheckout(
        {
          id: user.id,
          name: (user as any).name || user.email.split('@')[0] || 'Pengguna SimpulKata',
          email: user.email,
        },
        packageId,
        finishUrl
      );

      return reply.status(201).send({
        status: 'success',
        message: 'Sesi checkout berhasil dibuat.',
        data: checkoutResult,
      });
    } catch (err: any) {
      logService.error('PAYMENT', `Gagal membuat checkout order: ${err.message}`);
      return reply.status(err.statusCode || 500).send({
        status: 'error',
        message: err.message || 'Gagal membuat sesi pembayaran.',
      });
    }
  }

  /**
   * GET /api/orders/:orderNumber
   * Mengambil detail status pesanan terkini (Protected JWT)
   */
  async getOrderDetail(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user;
    const { orderNumber } = request.params as { orderNumber: string };

    const order = await orderModel.findByOrderNumber(orderNumber);
    if (!order) {
      return reply.status(404).send({
        status: 'error',
        message: `Pesanan '${orderNumber}' tidak ditemukan.`,
      });
    }

    // Pastikan hanya pemilik order atau admin yang bisa melihat
    if (order.user_id !== user.id && user.role !== 'admin') {
      return reply.status(403).send({
        status: 'error',
        message: 'Akses ditolak. Anda tidak berhak melihat pesanan ini.',
      });
    }

    // Jika pesanan masih pending, sinkronisasikan status aktif ke Midtrans
    let currentOrder = order;
    let newBalance: number | undefined;

    if (currentOrder.status === 'pending') {
      const syncResult = await paymentService.syncOrderStatus(orderNumber);
      currentOrder = syncResult.order;
      newBalance = syncResult.newBalance;
    }

    return reply.status(200).send({
      status: 'success',
      data: {
        order: currentOrder,
        newBalance,
        clientKey: paymentService.getClientKey(),
      },
    });
  }

  /**
   * POST /api/orders/:orderNumber/sync
   * Memicu sinkronisasi status aktif ke gateway Midtrans untuk pesanan tertentu
   */
  async syncOrder(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user;
    const { orderNumber } = request.params as { orderNumber: string };

    const order = await orderModel.findByOrderNumber(orderNumber);
    if (!order) {
      return reply.status(404).send({
        status: 'error',
        message: `Pesanan '${orderNumber}' tidak ditemukan.`,
      });
    }

    if (order.user_id !== user.id && user.role !== 'admin') {
      return reply.status(403).send({
        status: 'error',
        message: 'Akses ditolak.',
      });
    }

    try {
      const syncResult = await paymentService.syncOrderStatus(orderNumber);
      return reply.status(200).send({
        status: 'success',
        message: syncResult.synced
          ? `Status pesanan berhasil disinkronisasi menjadi '${syncResult.order.status}'.`
          : 'Status pesanan belum berubah dari gateway.',
        data: syncResult,
      });
    } catch (err: any) {
      return reply.status(500).send({
        status: 'error',
        message: err.message || 'Gagal sinkronisasi pesanan ke gateway.',
      });
    }
  }

  /**
   * POST /api/webhook/payment
   * Menangani notifikasi webhook resmi dari Midtrans (SRS UC-14 / SD-14)
   * Menguji kepatuhan SDD TC-04 (Digital Signature) & TC-08 (Idempotency)
   */
  async handleWebhook(request: FastifyRequest, reply: FastifyReply) {
    const payload = (request.body || {}) as MidtransWebhookPayload;

    if (!payload.order_id || !payload.transaction_status) {
      return reply.status(400).send({
        status: 'error',
        message: 'Payload webhook tidak lengkap. Wajib menyertakan order_id dan transaction_status.',
      });
    }

    try {
      const result = await paymentService.processWebhook(payload);
      return reply.status(200).send({
        status: 'success',
        message: result.message,
        data: result,
      });
    } catch (err: any) {
      const statusCode = err.statusCode || 500;
      return reply.status(statusCode).send({
        status: 'error',
        message: err.message || 'Gagal memproses notifikasi webhook.',
      });
    }
  }

  /**
   * POST /api/orders/:orderNumber/simulate-pay
   * Simulator pembayaran sukses instan untuk pengujian & demo langsung di antarmuka
   */
  async simulatePayment(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user;
    const { orderNumber } = request.params as { orderNumber: string };

    const order = await orderModel.findByOrderNumber(orderNumber);
    if (!order) {
      return reply.status(404).send({
        status: 'error',
        message: `Pesanan '${orderNumber}' tidak ditemukan.`,
      });
    }

    if (order.user_id !== user.id && user.role !== 'admin') {
      return reply.status(403).send({
        status: 'error',
        message: 'Akses ditolak.',
      });
    }

    try {
      const result = await paymentService.simulatePaymentSuccess(orderNumber);
      return reply.status(200).send({
        status: 'success',
        message: 'Pembayaran simulasi berhasil. Saldo kuota telah ditambahkan.',
        data: result,
      });
    } catch (err: any) {
      return reply.status(500).send({
        status: 'error',
        message: err.message || 'Gagal melakukan simulasi pembayaran.',
      });
    }
  }

  /**
   * GET /api/orders/my-orders
   * Mengambil riwayat transaksi pembelian kuota milik user yang sedang login (SRS UC-18 / SD-18)
   */
  async getMyOrders(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user;
    if (!user) {
      return reply.status(401).send({
        status: 'error',
        message: 'Autentikasi diperlukan.',
      });
    }

    try {
      // Kedaluwarsakan otomatis order pending yang sudah lewat > 24 jam
      await orderModel.expireStalePendingOrders(24);

      const query = (request.query || {}) as { page?: string; limit?: string };
      const page = Math.max(1, parseInt(query.page || '1', 10));
      const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)));

      let result = await orderModel.findUserOrders(user.id, page, limit);

      // Sinkronkan otomatis pesanan yang masih berstatus 'pending' ke Midtrans (jika webhook tertunda/terhalang)
      const activePending = result.orders.filter((o) => o.status === 'pending').slice(0, 5);
      if (activePending.length > 0) {
        const syncResults = await Promise.allSettled(
          activePending.map((o) => paymentService.syncOrderStatus(o.order_number))
        );
        const anySynced = syncResults.some(
          (r) => r.status === 'fulfilled' && r.value.synced
        );
        if (anySynced) {
          result = await orderModel.findUserOrders(user.id, page, limit);
        }
      }

      return reply.status(200).send({
        status: 'success',
        data: result,
      });
    } catch (err: any) {
      logService.error('PAYMENT', `Gagal mengambil riwayat transaksi user ${user.id}: ${err.message}`);
      return reply.status(500).send({
        status: 'error',
        message: 'Gagal memuat riwayat transaksi, silakan coba lagi.',
      });
    }
  }
}

export const paymentController = new PaymentController();
export default paymentController;
