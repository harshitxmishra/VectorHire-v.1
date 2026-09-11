import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from '../src/health/health.controller';
import { QueueService } from '../src/queue/queue.service';

describe('HealthController', () => {
  let controller: HealthController;
  let mockQueueService: { isRedisHealthy: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockQueueService = {
      isRedisHealthy: vi.fn().mockResolvedValue({ status: 'healthy', latencyMs: 2 }),
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

  it('should return health status with redis reachability without exposing sensitive credentials', async () => {
    const health = await controller.getHealth();
    expect(health).toHaveProperty('status', 'ok');
    expect(health).toHaveProperty('uptime');
    expect(typeof health.uptime).toBe('number');
    expect(health).toHaveProperty('timestamp');
    expect(health).toHaveProperty('redis');
    expect(health.redis).toEqual({ status: 'healthy' });
    expect(health).not.toHaveProperty('database');
    expect(health).not.toHaveProperty('env');
    expect(health).not.toHaveProperty('supabaseKey');
    expect(health).not.toHaveProperty('redisUrl');
    expect(health).not.toHaveProperty('password');
  });

  it('should report redis as unreachable without crashing if redis is down', async () => {
    mockQueueService.isRedisHealthy.mockResolvedValue({
      status: 'unreachable',
      error: 'Connection refused',
    });

    const health = await controller.getHealth();
    expect(health.status).toBe('ok');
    expect(health.redis).toEqual({ status: 'unreachable' });
  });
});
