/**
 * controllers/adminController.ts - Controller khusus peran Administrator
 * Berdasarkan referensi/erd.puml dan SRS FR-ADM-02 / UC-15 (SD-15)
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { logModel, userModel, orderModel, quotaMutationModel, formatDurationDisplay } from '../models';
import { QuotaMutation } from '../types';
import { logService } from '../services/logService';
import { paymentService } from '../services/paymentService';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class AdminController {
  /**
   * Helper untuk memverifikasi apakah pengguna memiliki role 'admin'
   * (SD-15 Langkah 3)
   */
  private checkAdminRole(request: FastifyRequest, reply: FastifyReply): boolean {
    const userRole = request.user?.role;
    if (userRole !== 'admin') {
      logService.warn('AUTH', `Percobaan akses admin tidak sah oleh user ${request.user?.id || 'anonim'} (Role: ${userRole || 'none'})`);
      reply.status(403).send({
        status: 'error',
        code: 'FORBIDDEN',
        message: 'Akses ditolak. Fitur ini hanya dapat diakses oleh Administrator.',
      });
      return false;
    }
    return true;
  }

  /**
   * GET /api/admin/logs
   * Mengambil riwayat log sistem dengan paginasi, filter, dan statistik (SD-15 Langkah 2-7)
   */
  async getLogs(request: FastifyRequest, reply: FastifyReply) {
    if (!this.checkAdminRole(request, reply)) return;

    try {
      const query = (request.query || {}) as {
        level?: string;
        source?: string;
        search?: string;
        startDate?: string;
        endDate?: string;
        page?: string;
        limit?: string;
      };

      const page = parseInt(query.page || '1', 10);
      const limit = parseInt(query.limit || '50', 10);

      const [logResult, stats] = await Promise.all([
        logModel.findLogs({
          level: query.level,
          source: query.source,
          search: query.search,
          startDate: query.startDate,
          endDate: query.endDate,
          page,
          limit,
        }),
        logModel.getLogStats(),
      ]);

      return reply.status(200).send({
        status: 'success',
        data: {
          ...logResult,
          stats,
        },
      });
    } catch (err: any) {
      logService.error('SYSTEM', 'Gagal mengambil riwayat log sistem', err);
      return reply.status(500).send({
        status: 'error',
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Gagal memuat log sistem dari basis data.',
      });
    }
  }

  /**
   * GET /api/admin/logs/export
   * Mengunduh berkas laporan log dalam format CSV (SD-15 Langkah 8-12)
   */
  async exportLogs(request: FastifyRequest, reply: FastifyReply) {
    if (!this.checkAdminRole(request, reply)) return;

    try {
      const query = (request.query || {}) as {
        level?: string;
        source?: string;
        search?: string;
        startDate?: string;
        endDate?: string;
      };

      const logs = await logModel.getLogsForExport({
        level: query.level,
        source: query.source,
        search: query.search,
        startDate: query.startDate,
        endDate: query.endDate,
        limit: 3000,
      });

      // Konversi data log ke format CSV dengan escaping koma dan kutip
      const header = ['"ID"', '"Waktu (WIB/Lokal)"', '"Level"', '"Sumber"', '"Pesan Log"'].join(',');
      const rows = logs.map((log) => {
        const escapedId = `"${log.id}"`;
        const timeStr = typeof log.created_at === 'string'
          ? log.created_at
          : new Date(log.created_at).toISOString();
        const escapedTime = `"${timeStr}"`;
        const escapedLevel = `"${log.level}"`;
        const escapedSource = `"${log.source.replace(/"/g, '""')}"`;
        const escapedMsg = `"${log.message.replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`;
        return [escapedId, escapedTime, escapedLevel, escapedSource, escapedMsg].join(',');
      });

      const csvContent = [header, ...rows].join('\r\n');
      const filename = `simpulkata-logs-${Date.now()}.csv`;

      reply
        .header('Content-Type', 'text/csv; charset=utf-8')
        .header('Content-Disposition', `attachment; filename="${filename}"`)
        .send(csvContent);

      logService.info('SYSTEM', `Administrator ${request.user?.id} mengekspor ${logs.length} entri log ke CSV.`);
    } catch (err: any) {
      logService.error('SYSTEM', 'Gagal mengekspor log ke format CSV', err);
      return reply.status(500).send({
        status: 'error',
        code: 'EXPORT_FAILED',
        message: 'Gagal mengekspor berkas CSV log sistem.',
      });
    }
  }

  /**
   * GET /api/admin/users
   * Mengambil daftar pengguna terdaftar beserta saldo kuota dan status (SRS UC-16 & SD-16)
   */
  async getUsers(request: FastifyRequest, reply: FastifyReply) {
    if (!this.checkAdminRole(request, reply)) return;

    try {
      const query = (request.query || {}) as {
        status?: string;
        search?: string;
        page?: string;
        limit?: string;
      };

      const page = parseInt(query.page || '1', 10);
      const limit = parseInt(query.limit || '50', 10);

      const userResult = await userModel.findUsers({
        status: query.status,
        search: query.search,
        page,
        limit,
      });

      return reply.status(200).send({
        status: 'success',
        data: userResult,
      });
    } catch (err: any) {
      logService.error('SYSTEM', 'Gagal memuat daftar pengguna untuk admin', err);
      return reply.status(500).send({
        status: 'error',
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Gagal memuat daftar pengguna dari basis data.',
      });
    }
  }

  /**
   * GET /api/admin/users/export
   * Mengunduh berkas laporan daftar pengguna dalam format CSV (SD-16 Langkah 8-12)
   */
  async exportUsers(request: FastifyRequest, reply: FastifyReply) {
    if (!this.checkAdminRole(request, reply)) return;

    try {
      const query = (request.query || {}) as {
        status?: string;
        search?: string;
      };

      const users = await userModel.getUsersForExport({
        status: query.status,
        search: query.search,
        limit: 5000,
      });

      // Helper konversi durasi detik ke format Xm Ys untuk kenyamanan laporan CSV
      const formatDuration = (totalSeconds: number): string => {
        const sec = Math.max(0, Math.floor(totalSeconds || 0));
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m}m ${s}s`;
      };

      // Header kolom CSV
      const header = [
        '"ID"',
        '"Nama Lengkap"',
        '"Alamat Email"',
        '"Peran"',
        '"Status Akun"',
        '"Saldo Kuota (Detik)"',
        '"Saldo Kuota (Format)"',
        '"Tanggal Bergabung"',
      ].join(',');

      const rows = users.map((u) => {
        const escapedId = `"${u.id}"`;
        const escapedName = `"${u.name.replace(/"/g, '""')}"`;
        const escapedEmail = `"${u.email.replace(/"/g, '""')}"`;
        const escapedRole = `"${u.role}"`;
        const escapedStatus = `"${u.status}"`;
        const escapedSec = `"${u.balance || 0}"`;
        const escapedFormatted = `"${formatDuration(u.balance || 0)}"`;
        const timeStr = typeof u.created_at === 'string'
          ? u.created_at
          : new Date(u.created_at).toISOString();
        const escapedDate = `"${timeStr}"`;
        return [
          escapedId,
          escapedName,
          escapedEmail,
          escapedRole,
          escapedStatus,
          escapedSec,
          escapedFormatted,
          escapedDate,
        ].join(',');
      });

      const csvContent = [header, ...rows].join('\r\n');
      const filename = `simpulkata-users-${Date.now()}.csv`;

      reply
        .header('Content-Type', 'text/csv; charset=utf-8')
        .header('Content-Disposition', `attachment; filename="${filename}"`)
        .send(csvContent);

      logService.info('SYSTEM', `Administrator ${request.user?.id} mengekspor ${users.length} data pengguna ke CSV.`);
    } catch (err: any) {
      logService.error('SYSTEM', 'Gagal mengekspor daftar pengguna ke CSV', err);
      return reply.status(500).send({
        status: 'error',
        code: 'EXPORT_FAILED',
        message: 'Gagal mengekspor data pengguna ke CSV.',
      });
    }
  }

  /**
   * GET /api/admin/transactions
   * Mengambil riwayat transaksi global seluruh pengguna beserta statistik pendapatan (SRS UC-17 & SD-17)
   */
  async getTransactions(request: FastifyRequest, reply: FastifyReply) {
    if (!this.checkAdminRole(request, reply)) return;

    try {
      // Pastikan order pending > 24 jam otomatis ditandai kedaluwarsa sebelum menghitung statistik
      await orderModel.expireStalePendingOrders(24);

      const query = (request.query || {}) as {
        status?: string;
        search?: string;
        startDate?: string;
        endDate?: string;
        page?: string;
        limit?: string;
      };

      const page = Math.max(1, parseInt(query.page || '1', 10));
      const limit = Math.min(100, Math.max(1, parseInt(query.limit || '50', 10)));

      let [orderResult, stats] = await Promise.all([
        orderModel.findGlobalOrders({
          status: query.status,
          search: query.search,
          startDate: query.startDate,
          endDate: query.endDate,
          page,
          limit,
        }),
        orderModel.getRevenueStats(query.startDate, query.endDate),
      ]);

      // Sinkronkan otomatis maksimal 5 pesanan pending aktif pada halaman saat ini dengan Midtrans
      const pendingOrders = orderResult.orders.filter((o) => o.status === 'pending').slice(0, 5);
      if (pendingOrders.length > 0) {
        const syncResults = await Promise.allSettled(
          pendingOrders.map((o) => paymentService.syncOrderStatus(o.order_number))
        );
        const anySynced = syncResults.some(
          (r) => r.status === 'fulfilled' && r.value.synced
        );
        if (anySynced) {
          [orderResult, stats] = await Promise.all([
            orderModel.findGlobalOrders({
              status: query.status,
              search: query.search,
              startDate: query.startDate,
              endDate: query.endDate,
              page,
              limit,
            }),
            orderModel.getRevenueStats(query.startDate, query.endDate),
          ]);
        }
      }

      return reply.status(200).send({
        status: 'success',
        data: {
          ...orderResult,
          stats,
        },
      });
    } catch (err: any) {
      logService.error('SYSTEM', 'Gagal memuat daftar transaksi global untuk admin', err);
      return reply.status(500).send({
        status: 'error',
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Gagal memuat transaksi global dari basis data.',
      });
    }
  }

  /**
   * GET /api/admin/transactions/export
   * Mengunduh berkas laporan transaksi global dalam format CSV (SD-17 Langkah 8-12)
   */
  async exportTransactions(request: FastifyRequest, reply: FastifyReply) {
    if (!this.checkAdminRole(request, reply)) return;

    try {
      // Pastikan order pending > 24 jam otomatis ditandai kedaluwarsa sebelum menghitung statistik
      await orderModel.expireStalePendingOrders(24);

      const query = (request.query || {}) as {
        status?: string;
        search?: string;
        startDate?: string;
        endDate?: string;
      };

      const orders = await orderModel.getOrdersForExport({
        status: query.status,
        search: query.search,
        startDate: query.startDate,
        endDate: query.endDate,
        limit: 5000,
      });

      const header = [
        '"ID"',
        '"Nomor Pesanan"',
        '"Nama Pelanggan"',
        '"Email Pelanggan"',
        '"Paket Kuota"',
        '"Durasi Menit"',
        '"Nominal (IDR)"',
        '"Metode Pembayaran"',
        '"Status"',
        '"Tanggal Transaksi"',
      ].join(',');

      const rows = orders.map((o) => {
        const escapedId = `"${o.id}"`;
        const escapedOrderNum = `"${o.order_number}"`;
        const escapedName = `"${(o.user_name || '').replace(/"/g, '""')}"`;
        const escapedEmail = `"${(o.user_email || '').replace(/"/g, '""')}"`;
        const escapedPkg = `"${(o.package_name || '').replace(/"/g, '""')}"`;
        const escapedMin = `"${o.package_minutes || 0}"`;
        const escapedAmount = `"${o.amount || 0}"`;
        const escapedType = `"${(o.payment_type || 'snap').replace(/"/g, '""')}"`;
        const escapedStatus = `"${o.status}"`;
        const timeStr = typeof o.created_at === 'string'
          ? o.created_at
          : new Date(o.created_at).toISOString();
        const escapedDate = `"${timeStr}"`;

        return [
          escapedId,
          escapedOrderNum,
          escapedName,
          escapedEmail,
          escapedPkg,
          escapedMin,
          escapedAmount,
          escapedType,
          escapedStatus,
          escapedDate,
        ].join(',');
      });

      const csvContent = [header, ...rows].join('\r\n');
      const filename = `simpulkata-transactions-${Date.now()}.csv`;

      reply
        .header('Content-Type', 'text/csv; charset=utf-8')
        .header('Content-Disposition', `attachment; filename="${filename}"`)
        .send(csvContent);

      logService.info('SYSTEM', `Administrator ${request.user?.id} mengekspor ${orders.length} data transaksi ke CSV.`);
    } catch (err: any) {
      logService.error('SYSTEM', 'Gagal mengekspor data transaksi ke CSV', err);
      return reply.status(500).send({
        status: 'error',
        code: 'EXPORT_FAILED',
        message: 'Gagal mengekspor data transaksi ke CSV.',
      });
    }
  }

  /**
   * Mensanitasi entri mutasi kuota sebelum dikirim ke Administrator agar nama file audio
   * dan ID transkrip pengguna tidak bocor (privacy-preserving ledger)
   */
  private sanitizeMutationForAdmin(mutation: QuotaMutation): QuotaMutation {
    const durationLabel = formatDurationDisplay(mutation.amount_seconds);

    switch (mutation.reference_type) {
      case 'TRANSCRIPTION':
        return {
          ...mutation,
          description: `Pemakaian Transkripsi Audio (-${durationLabel})`,
          reference_id: null,
        };
      case 'REFUND':
        return {
          ...mutation,
          description: `Pengembalian Kuota Otomatis (+${durationLabel})`,
          reference_id: null,
        };
      case 'REGISTRATION':
        return {
          ...mutation,
          description: `Bonus Kuota Pengguna Baru (+${durationLabel})`,
          reference_id: null,
        };
      case 'MANUAL_ADJUSTMENT':
        return {
          ...mutation,
          reference_id: null,
        };
      case 'TOPUP':
      default:
        return mutation;
    }
  }

  /**
   * GET /api/admin/users/:userId/quota-mutations
   * Mengambil riwayat mutasi kuota milik pengguna tertentu dengan keterangan tersanitasi privasi
   */
  async getUserQuotaMutations(request: FastifyRequest, reply: FastifyReply) {
    if (!this.checkAdminRole(request, reply)) return;

    const { userId } = request.params as { userId: string };
    if (!userId || !UUID_REGEX.test(userId)) {
      return reply.status(400).send({
        status: 'error',
        code: 'INVALID_USER_ID',
        message: 'Format ID pengguna tidak valid.',
      });
    }

    try {
      const targetUser = await userModel.findById(userId);
      if (!targetUser) {
        return reply.status(404).send({
          status: 'error',
          code: 'USER_NOT_FOUND',
          message: 'Pengguna tidak ditemukan.',
        });
      }

      const query = (request.query || {}) as {
        page?: string;
        limit?: string;
        type?: string;
      };

      const page = Math.max(1, parseInt(query.page || '1', 10) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(query.limit || '15', 10) || 15));
      const rawType = (query.type || 'ALL').toUpperCase();
      const filterType = (rawType === 'CREDIT' || rawType === 'DEBIT') ? rawType : 'ALL';

      const result = await quotaMutationModel.getUserMutations(userId, {
        page,
        limit,
        type: filterType,
      });

      const sanitizedMutations = result.mutations.map((m) => this.sanitizeMutationForAdmin(m));

      return reply.status(200).send({
        status: 'success',
        data: {
          user: targetUser,
          mutations: sanitizedMutations,
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      });
    } catch (err: any) {
      logService.error('SYSTEM', `Gagal memuat mutasi kuota user ${userId} untuk admin`, err);
      return reply.status(500).send({
        status: 'error',
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Gagal memuat riwayat mutasi kuota pengguna.',
      });
    }
  }

  /**
   * POST /api/admin/users/:userId/quota
   * Menambahkan saldo kuota langsung ke pengguna tertentu oleh Administrator (MANUAL_ADJUSTMENT)
   */
  async addUserQuota(request: FastifyRequest, reply: FastifyReply) {
    if (!this.checkAdminRole(request, reply)) return;

    const { userId } = request.params as { userId: string };
    if (!userId || !UUID_REGEX.test(userId)) {
      return reply.status(400).send({
        status: 'error',
        code: 'INVALID_USER_ID',
        message: 'Format ID pengguna tidak valid.',
      });
    }

    const body = (request.body || {}) as { minutes?: unknown; note?: unknown };
    const minutes = typeof body.minutes === 'number' ? body.minutes : Number(body.minutes);

    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 10000) {
      return reply.status(400).send({
        status: 'error',
        code: 'INVALID_QUOTA_AMOUNT',
        message: 'Jumlah tambahan kuota harus berupa bilangan bulat antara 1 hingga 10.000 menit.',
      });
    }

    const cleanNote = typeof body.note === 'string'
      ? body.note.replace(/\s+/g, ' ').trim().slice(0, 180)
      : '';

    try {
      const targetUser = await userModel.findById(userId);
      if (!targetUser) {
        return reply.status(404).send({
          status: 'error',
          code: 'USER_NOT_FOUND',
          message: 'Pengguna tidak ditemukan.',
        });
      }

      if (targetUser.status === 'PENDING') {
        return reply.status(400).send({
          status: 'error',
          code: 'USER_PENDING_VERIFICATION',
          message: 'Akun pengguna masih berstatus PENDING (belum verifikasi OTP). Penambahan kuota hanya dapat dilakukan setelah akun aktif.',
        });
      }

      const addedSeconds = minutes * 60;
      const durationLabel = formatDurationDisplay(addedSeconds);
      const description = cleanNote
        ? `Penambahan Kuota Admin: ${cleanNote} (+${durationLabel})`
        : `Penambahan Kuota Manual oleh Admin (+${durationLabel})`;

      const adjustmentResult = await userModel.addQuotaManualWithMutation({
        userId,
        addedSeconds,
        description,
        adminId: request.user!.id,
      });

      if (!adjustmentResult) {
        return reply.status(404).send({
          status: 'error',
          code: 'USER_NOT_FOUND',
          message: 'Pengguna tidak ditemukan.',
        });
      }

      logService.info(
        'PAYMENT',
        `Administrator ${request.user?.id} menambahkan kuota manual +${minutes} menit (${addedSeconds}s) ke ${targetUser.email} (${userId}). Saldo kini: ${adjustmentResult.user.balance}s.${cleanNote ? ` Catatan: ${cleanNote}` : ''}`
      );

      return reply.status(200).send({
        status: 'success',
        message: `Berhasil menambahkan +${minutes} menit kuota ke akun ${targetUser.name}.`,
        data: {
          user: adjustmentResult.user,
          mutation: this.sanitizeMutationForAdmin(adjustmentResult.mutation),
        },
      });
    } catch (err: any) {
      logService.error('PAYMENT', `Gagal menambahkan kuota manual ke user ${userId}`, err);
      return reply.status(500).send({
        status: 'error',
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Gagal menambahkan saldo kuota pengguna.',
      });
    }
  }
}

export const adminController = new AdminController();
export default adminController;
