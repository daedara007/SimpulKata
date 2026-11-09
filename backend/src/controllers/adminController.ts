/**
 * controllers/adminController.ts - Controller khusus peran Administrator
 * Berdasarkan referensi/erd.puml dan SRS FR-ADM-02 / UC-15 (SD-15)
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { logModel } from '../models';
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
}

export const adminController = new AdminController();
export default adminController;
