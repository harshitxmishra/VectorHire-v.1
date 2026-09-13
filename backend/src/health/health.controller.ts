import { Controller, Get, Inject, Optional, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '../common/decorators/public.decorator';
import { QueueService, SystemQueueMetrics } from '../queue/queue.service';
import { HealthService } from './health.service';

@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(
    @Inject(HealthService)
    private readonly healthService: HealthService,
    @Optional()
    @Inject(QueueService)
    private readonly queueService?: QueueService
  ) {}

  /**
   * Liveness Probe: GET /health/live (or /api/v1/health/live)
   * Determines whether the Node.js / NestJS process is running.
   * Ultra-lightweight: zero dependency on Redis, Database, or external services.
   */
  @Public()
  @Get('live')
  getLive() {
    return {
      status: 'ok',
    };
  }

  /**
   * Readiness Probe: GET /health/ready (or /api/v1/health/ready)
   * Determines whether the application is ready to accept user and API traffic.
   * Verifies critical backend infrastructure:
   *   - Supabase / PostgreSQL database connectivity
   *   - Redis queue infrastructure connectivity
   * Returns:
   *   - HTTP 200 { status: 'ok', checks: { database: 'ok', redis: 'ok' } } if all critical dependencies are ready.
   *   - HTTP 503 { status: 'degraded', checks: { database: ..., redis: ... } } if any dependency is unavailable.
   */
  @Public()
  @Get('ready')
  async getReady(@Res({ passthrough: true }) res: Response) {
    let dbStatus: 'ok' | 'unavailable' = 'unavailable';
    let redisStatus: 'ok' | 'unavailable' = 'unavailable';

    // 1. Verify Database Connectivity
    try {
      const dbHealth = await this.healthService.isDatabaseHealthy();
      if (dbHealth.status === 'healthy') {
        dbStatus = 'ok';
      }
    } catch {
      dbStatus = 'unavailable';
    }

    // 2. Verify Redis Connectivity
    if (this.queueService) {
      try {
        const redisHealth = await this.queueService.isRedisHealthy();
        if (redisHealth.status === 'healthy') {
          redisStatus = 'ok';
        }
      } catch {
        redisStatus = 'unavailable';
      }
    }

    const isReady = dbStatus === 'ok' && redisStatus === 'ok';

    if (!isReady) {
      res.status(HttpStatus.SERVICE_UNAVAILABLE);
    }

    return {
      status: isReady ? 'ok' : 'degraded',
      checks: {
        database: dbStatus,
        redis: redisStatus,
      },
    };
  }

  /**
   * Composite Health: GET /health (or /api/v1/health)
   * Comprehensive operational status for existing clients, monitoring, and debugging.
   * Safe, non-blocking, and never crashes on dependency degradation.
   */
  @Public()
  @Get()
  async getHealth() {
    let dbStatus: 'ok' | 'unavailable' = 'unavailable';
    let redisStatus: 'ok' | 'unreachable' = 'unreachable';
    let queueMetrics: SystemQueueMetrics | null = null;

    // Database check
    try {
      const dbHealth = await this.healthService.isDatabaseHealthy();
      if (dbHealth.status === 'healthy') {
        dbStatus = 'ok';
      }
    } catch {
      dbStatus = 'unavailable';
    }

    // Redis check & Queue metrics
    if (this.queueService) {
      try {
        const redisHealth = await this.queueService.isRedisHealthy();
        if (redisHealth.status === 'healthy') {
          redisStatus = 'ok';
          queueMetrics = await this.queueService.getSystemQueueMetrics();
        } else {
          redisStatus = 'unreachable';
        }
      } catch {
        redisStatus = 'unreachable';
        queueMetrics = null;
      }
    }

    const isHealthy = redisStatus === 'ok' && dbStatus === 'ok';

    return {
      status: isHealthy ? 'ok' : 'degraded',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: {
        status: dbStatus,
      },
      redis: {
        status: redisStatus,
      },
      queues: redisStatus === 'ok' ? queueMetrics : null,
    };
  }
}
