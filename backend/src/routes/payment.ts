/**
 * routes/payment.ts - Definisi Rute API Pemesanan Kuota & Webhook Pembayaran
 * Berdasarkan referensi/erd.puml dan SRS FR-FIN-03 / UC-13 & FR-FIN-04 / UC-14
 */

import { FastifyInstance } from 'fastify';
import { paymentController } from '../controllers/paymentController';

export async function orderRoutes(fastify: FastifyInstance) {
  // 1. Rute Publik: Ambil daftar paket kuota yang tersedia
  fastify.get('/packages', (request, reply) => paymentController.getPackages(request, reply));

  // 2. Rute Webhook Internal: POST /api/orders/webhook
  fastify.post('/webhook', (request, reply) => paymentController.handleWebhook(request, reply));

  // 3. Rute Terproteksi JWT: Checkout pembelian kuota (SRS UC-13 / SD-13)
  fastify.register(async (protectedRoutes) => {
    protectedRoutes.addHook('onRequest', async (request, reply) => {
      try {
        await request.jwtVerify();
      } catch {
        return reply.status(401).send({
          status: 'error',
          code: 'UNAUTHORIZED',
          message: 'Autentikasi token JWT diperlukan.',
        });
      }
    });

    // Inisiasi checkout pesanan baru
    protectedRoutes.post('/checkout', (request, reply) => paymentController.checkout(request, reply));

    // Detail status pesanan
    protectedRoutes.get('/:orderNumber', (request, reply) => paymentController.getOrderDetail(request, reply));

    // Simulator pembayaran sukses instan
    protectedRoutes.post('/:orderNumber/simulate-pay', (request, reply) =>
      paymentController.simulatePayment(request, reply)
    );
  });
}

export default orderRoutes;
