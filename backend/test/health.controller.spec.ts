import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { HealthController } from '../src/health/health.controller';
import { HealthService } from '../src/health/health.service';
import { QueueService } from '../src/queue/queue.service';

describe('HealthController (Phase 5.3 Health, Liveness & Readiness)', () => {
  let controller: HealthController;
  let mockHealthService: {
    isDatabaseHealthy: ReturnType<typeof vi.fn>;
  };
  let mockQueueService: {
    isRedisHealthy: ReturnType<typeof vi.fn>;
    getSystemQueueMetrics: ReturnType<typeof vi.fn>;
  };
  let mockResponse: Partial<Response>;

  beforeEach(async () => {
    mockHealthService = {
      isDatabaseHealthy: vi.fn().mockResolvedValue({ status: 'healthy', latencyMs: 5 }),
    };

    mockQueueService = {
      isRedisHealthy: vi.fn().mockResolvedValue({ status: 'healthy', latencyMs: 2 }),
      getSystemQueueMetrics: vi.fn().mockResolvedValue({
        'demonstrator-queue': {
          waiting: 0,
          active: 1,
          completed: 5,
          failed: 0,
          delayed: 0,
          paused: 0,
        },
      }),
    };

    mockResponse = {
      status: vi.fn().mockReturnThis(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthService,
          useValue: mockHealthService,
        },
        {
          provide: QueueService,
          useValue: mockQueueService,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /health/live (Liveness)', () => {
    it('should return HTTP 200 status "ok" without querying dependencies', async () => {
      const live = controller.getLive();
      expect(live).toEqual({ status: 'ok' });
      expect(mockHealthService.isDatabaseHealthy).not.toHaveBeenCalled();
      expect(mockQueueService.isRedisHealthy).not.toHaveBeenCalled();
    });
  });

  describe('GET /health/ready (Readiness)', () => {
    it('should return HTTP 200 with all checks "ok" when database and Redis are healthy', async () => {
      const ready = await controller.getReady(mockResponse as Response);

      expect(ready.status).toBe('ok');
      expect(ready.checks).toEqual({
        database: 'ok',
        redis: 'ok',
      });
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should return HTTP 503 and degraded status when Redis is unavailable', async () => {
      mockQueueService.isRedisHealthy.mockResolvedValue({
        status: 'unreachable',
        error: 'ECONNREFUSED',
      });

      const ready = await controller.getReady(mockResponse as Response);

      expect(ready.status).toBe('degraded');
      expect(ready.checks).toEqual({
        database: 'ok',
        redis: 'unavailable',
      });
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.SERVICE_UNAVAILABLE);
    });

    it('should return HTTP 503 and degraded status when Database is unavailable', async () => {
      mockHealthService.isDatabaseHealthy.mockResolvedValue({
        status: 'unavailable',
        error: 'Postgres unreachable',
      });

      const ready = await controller.getReady(mockResponse as Response);

      expect(ready.status).toBe('degraded');
      expect(ready.checks).toEqual({
        database: 'unavailable',
        redis: 'ok',
      });
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.SERVICE_UNAVAILABLE);
    });

    it('should return HTTP 503 when both Database and Redis are unavailable', async () => {
      mockHealthService.isDatabaseHealthy.mockResolvedValue({
        status: 'unavailable',
        error: 'Postgres unreachable',
      });
      mockQueueService.isRedisHealthy.mockResolvedValue({
        status: 'unreachable',
        error: 'Redis unreachable',
      });

      const ready = await controller.getReady(mockResponse as Response);

      expect(ready.status).toBe('degraded');
      expect(ready.checks).toEqual({
        database: 'unavailable',
        redis: 'unavailable',
      });
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.SERVICE_UNAVAILABLE);
    });

    it('should not crash if database probe throws unhandled error and set 503 degraded', async () => {
      mockHealthService.isDatabaseHealthy.mockRejectedValue(new Error('Fatal DB crash'));

      const ready = await controller.getReady(mockResponse as Response);

      expect(ready.status).toBe('degraded');
      expect(ready.checks.database).toBe('unavailable');
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.SERVICE_UNAVAILABLE);
    });
  });

  describe('GET /health (Composite)', () => {
    it('should return composite health with database, redis, and queue metrics when healthy', async () => {
      const health = await controller.getHealth();

      expect(health.status).toBe('ok');
      expect(health).toHaveProperty('uptime');
      expect(typeof health.uptime).toBe('number');
      expect(health).toHaveProperty('timestamp');
      expect(health.database).toEqual({ status: 'ok' });
      expect(health.redis).toEqual({ status: 'ok' });
      expect(health.queues).toBeDefined();
      expect(health.queues?.['demonstrator-queue']).toEqual({
        waiting: 0,
        active: 1,
        completed: 5,
        failed: 0,
        delayed: 0,
        paused: 0,
      });
      // Ensure no credentials/secrets leaked
      expect(health).not.toHaveProperty('supabaseKey');
      expect(health).not.toHaveProperty('redisUrl');
      expect(health).not.toHaveProperty('password');
    });

    it('should return status "degraded" and queues null when redis is unreachable', async () => {
      mockQueueService.isRedisHealthy.mockResolvedValue({
        status: 'unreachable',
        error: 'Connection refused',
      });

      const health = await controller.getHealth();

      expect(health.status).toBe('degraded');
      expect(health.database).toEqual({ status: 'ok' });
      expect(health.redis).toEqual({ status: 'unreachable' });
      expect(health.queues).toBeNull();
    });

    it('should return status "degraded" when database is unavailable', async () => {
      mockHealthService.isDatabaseHealthy.mockResolvedValue({
        status: 'unavailable',
        error: 'Database timeout',
      });

      const health = await controller.getHealth();

      expect(health.status).toBe('degraded');
      expect(health.database).toEqual({ status: 'unavailable' });
      expect(health.redis).toEqual({ status: 'ok' });
    });

    it('should not crash if isRedisHealthy throws an unexpected exception and report degraded', async () => {
      mockQueueService.isRedisHealthy.mockRejectedValue(new Error('Fatal Redis socket error'));

      const health = await controller.getHealth();

      expect(health.status).toBe('degraded');
      expect(health.redis).toEqual({ status: 'unreachable' });
      expect(health.queues).toBeNull();
    });
  });
});
