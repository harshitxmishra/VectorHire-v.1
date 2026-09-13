import { Injectable, Logger } from '@nestjs/common';
import { supabase } from '@/lib/supabase/client';

export interface DatabaseHealthResult {
  status: 'healthy' | 'unavailable';
  latencyMs?: number;
  error?: string;
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  /**
   * Health check for PostgreSQL / Supabase database connectivity.
   * Performs an isolated lightweight query (select 1 row limit 1) with a 2.0s timeout.
   * Never throws unhandled errors or exposes sensitive database credentials.
   */
  async isDatabaseHealthy(): Promise<DatabaseHealthResult> {
    const start = Date.now();
    try {
      const queryPromise = supabase
        .from('candidates')
        .select('id')
        .limit(1);

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Database probe timeout (2000ms)')), 2000)
      );

      const { error } = await Promise.race([queryPromise, timeoutPromise]);
      const latencyMs = Date.now() - start;

      if (error) {
        this.logger.warn(`Database health check failed: ${error.message}`);
        return {
          status: 'unavailable',
          latencyMs,
          error: error.message,
        };
      }

      return {
        status: 'healthy',
        latencyMs,
      };
    } catch (err: any) {
      const latencyMs = Date.now() - start;
      const errorMsg = err?.message || 'Database connection unreachable';
      this.logger.warn(`Database health check unreachable: ${errorMsg}`);
      return {
        status: 'unavailable',
        latencyMs,
        error: errorMsg,
      };
    }
  }
}
