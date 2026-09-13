import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HealthController } from '../../src/health/health.controller';
import { HealthService } from '../../src/health/health.service';
import { QueueService } from '../../src/queue/queue.service';
import { Response } from 'express';
import { HttpStatus } from '@nestjs/common';

describe('Health & Readiness Integration Boundary', () => {
  let controller: HealthController;
  let mockHealthService: { isDatabaseHealthy: ReturnType<typeof vi.fn> };
  let mockQueueService: { isRedisHealthy: ReturnType<typeof vi.fn>; getSystemQueueMetrics: ReturnType<typeof vi.fn> };
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockHealthService = {
      isDatabaseHealthy: vi.fn(),
    };

    mockQueueService = {
      isRedisHealthy: vi.fn(),
      getSystemQueueMetrics: vi.fn(),
    };

    mockResponse = {
      status: vi.fn().mockReturnThis(),
    };

    controller = new HealthController(
      mockHealthService as unknown as HealthService,
      mockQueueService as unknown as QueueService,
    );
  });

  describe('GET /health/live (Process-only Liveness Probe)', () => {
    it('returns HTTP 200 without querying database or Redis', async () => {
      const result = controller.getLive();

      expect(result).toEqual({ status: 'ok' });
      expect(mockHealthService.isDatabaseHealthy).not.toHaveBeenCalled();
      expect(mockQueueService.isRedisHealthy).not.toHaveBeenCalled();
    });
  });

  describe('GET /health/ready (Readiness Probe with Dependency Invariants)', () => {
    it('returns HTTP 200 { status: "ok" } when both Database and Redis are healthy', async () => {
      mockHealthService.isDatabaseHealthy.mockResolvedValue({ status: 'healthy', latencyMs: 15 });
      mockQueueService.isRedisHealthy.mockResolvedValue({ status: 'healthy', latencyMs: 2 });

      const result = await controller.getReady(mockResponse as Response);

      expect(result).toEqual({
        status: 'ok',
        checks: {
          database: 'ok',
          redis: 'ok',
        },
      });
      expect(mockResponse.status).not.toHaveBeenCalledWith(HttpStatus.SERVICE_UNAVAILABLE);
    });

    it('returns HTTP 503 { status: "degraded" } when Database is unreachable', async () => {
      mockHealthService.isDatabaseHealthy.mockResolvedValue({
        status: 'unavailable',
        error: 'Database connection timeout',
      });
      mockQueueService.isRedisHealthy.mockResolvedValue({ status: 'healthy', latencyMs: 2 });

      const result = await controller.getReady(mockResponse as Response);

      expect(result).toEqual({
        status: 'degraded',
        checks: {
          database: 'unavailable',
          redis: 'ok',
        },
      });
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.SERVICE_UNAVAILABLE);
    });

    it('returns HTTP 503 { status: "degraded" } when Redis is disconnected', async () => {
      mockHealthService.isDatabaseHealthy.mockResolvedValue({ status: 'healthy', latencyMs: 10 });
      mockQueueService.isRedisHealthy.mockResolvedValue({
        status: 'unreachable',
        error: 'Redis connection refused',
      });

      const result = await controller.getReady(mockResponse as Response);

      expect(result).toEqual({
        status: 'degraded',
        checks: {
          database: 'ok',
          redis: 'unavailable',
        },
      });
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.SERVICE_UNAVAILABLE);
    });

    it('returns HTTP 503 when both Database and Redis are degraded', async () => {
      mockHealthService.isDatabaseHealthy.mockRejectedValue(new Error('Network down'));
      mockQueueService.isRedisHealthy.mockRejectedValue(new Error('Redis timeout'));

      const result = await controller.getReady(mockResponse as Response);

      expect(result).toEqual({
        status: 'degraded',
        checks: {
          database: 'unavailable',
          redis: 'unavailable',
        },
      });
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.SERVICE_UNAVAILABLE);
    });
  });

  describe('GET /health (Composite Health Semantics)', () => {
    it('returns fully populated healthy composite status with queue metrics', async () => {
      mockHealthService.isDatabaseHealthy.mockResolvedValue({ status: 'healthy', latencyMs: 12 });
      mockQueueService.isRedisHealthy.mockResolvedValue({ status: 'healthy', latencyMs: 1 });
      mockQueueService.getSystemQueueMetrics.mockResolvedValue({
        queues: {
          'ai-evaluation-queue': { waiting: 0, active: 0, completed: 5, failed: 0, delayed: 0 },
        },
        timestamp: '2026-09-12T12:00:00.000Z',
      });

      const result = await controller.getHealth();

      expect(result.status).toBe('ok');
      expect(result.database.status).toBe('ok');
      expect(result.redis.status).toBe('ok');
      expect(result.queues).toBeDefined();
      expect(typeof result.uptime).toBe('number');
      expect(typeof result.timestamp).toBe('string');
    });

    it('sanitizes errors and never crashes when dependencies throw unexpected exceptions', async () => {
      mockHealthService.isDatabaseHealthy.mockRejectedValue(new Error('DB password authentication failed for user postgres'));
      mockQueueService.isRedisHealthy.mockRejectedValue(new Error('ioredis://secret-auth-key:password@host unreachable'));

      const result = await controller.getHealth();

      expect(result.status).toBe('degraded');
      expect(result.database.status).toBe('unavailable');
      expect(result.redis.status).toBe('unreachable');
      expect(result.queues).toBeNull();
      // Ensure raw error message with secrets is NOT leaked in top-level object
      expect(JSON.stringify(result)).not.toContain('password');
      expect(JSON.stringify(result)).not.toContain('secret-auth-key');
    });
  });
});
