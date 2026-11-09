/**
 * services/logService.ts - Service terpusat pencatatan log sistem
 * Berdasarkan referensi/erd.puml dan SRS FR-ADM-02 / UC-15 (SD-15)
 *
 * Sifat: Non-blocking async fire-and-forget (tidak menghambat thread utama Fastify)
 */

import { logModel } from '../models';
import { LogLevel, LogSource } from '../types';

export class LogService {
  /**
   * Helper internal untuk menyimpan log ke basis data secara asinkron
   */
  private async persist(level: LogLevel, source: LogSource, message: string): Promise<void> {
    try {
      await logModel.create({
        level,
        source,
        message: message.trim(),
      });
    } catch (err: any) {
      // Fallback ke console jika database sedang sibuk/gagal
      console.error(`[LogService:FallbackError] Gagal menyimpan log ke DB:`, err?.message || err);
    }
  }

  /**
   * Catat log level INFO
   */
  info(source: LogSource, message: string): void {
    console.log(`[${source}] [INFO] ${message}`);
    setImmediate(() => {
      this.persist('INFO', source, message);
    });
  }

  /**
   * Catat log level WARN
   */
  warn(source: LogSource, message: string): void {
    console.warn(`[${source}] [WARN] ${message}`);
    setImmediate(() => {
      this.persist('WARN', source, message);
    });
  }

  /**
   * Catat log level ERROR
   */
  error(source: LogSource, message: string, errorObj?: any): void {
    let fullMessage = message;
    if (errorObj) {
      const errDetail = errorObj.stack || errorObj.message || String(errorObj);
      fullMessage = `${message} | Detail: ${errDetail}`;
    }

    console.error(`[${source}] [ERROR] ${fullMessage}`);
    setImmediate(() => {
      this.persist('ERROR', source, fullMessage);
    });
  }
}

export const logService = new LogService();
export default logService;
