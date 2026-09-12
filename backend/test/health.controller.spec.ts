import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from '../src/health/health.controller';
import { QueueService } from '../src/queue/queue.service';

describe('HealthController', () => {
  let controller: HealthController;
  let mockQueueService: {
    isRedisHealthy: ReturnType<typeof vi.fn>;
    getSystemQueueMetrics: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
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

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
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

  it('should return status "ok" and include queue metrics when redis is healthy', async () => {
    const health = await controller.getHealth();
    expect(health.status).toBe('ok');
    expect(health).toHaveProperty('uptime');
    expect(typeof health.uptime).toBe('number');
    expect(health).toHaveProperty('timestamp');
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
    expect(health).not.toHaveProperty('database');
    expect(health).not.toHaveProperty('env');
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
    expect(health.redis).toEqual({ status: 'unreachable' });
    expect(health.queues).toBeNull();
  });

  it('should not crash if isRedisHealthy throws an unexpected exception and report degraded', async () => {
    mockQueueService.isRedisHealthy.mockRejectedValue(new Error('Fatal Redis socket error'));

    const health = await controller.getHealth();
    expect(health.status).toBe('degraded');
    expect(health.redis).toEqual({ status: 'unreachable' });
    expect(health.queues).toBeNull();
  });
});
