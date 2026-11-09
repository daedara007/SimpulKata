/**
 * controllers/adminController.ts - Controller khusus peran Administrator
 * Berdasarkan referensi/erd.puml dan SRS FR-ADM-02 / UC-15 (SD-15)
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { logModel, userModel } from '../models';
import { logService } from '../services/logService';

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
}

export const adminController = new AdminController();
export default adminController;
