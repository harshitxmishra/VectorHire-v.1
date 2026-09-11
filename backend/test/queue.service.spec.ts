import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { QueueService } from '../src/queue/queue.service';
import { QUEUE_NAMES, JOB_NAMES, DEFAULT_JOB_OPTIONS } from '../src/queue/queue.constants';
import { DemonstratorJobData } from '../src/queue/demonstrator/demonstrator.types';

// Mock bullmq and ioredis
vi.mock('bullmq', () => {
  const MockQueue = vi.fn().mockImplementation(() => ({
    add: vi.fn().mockImplementation((name, data, opts) =>
      Promise.resolve({
        id: 'job-123',
        name,
        data,
        opts,
      })
    ),
    getJob: vi.fn().mockImplementation((id) =>
      Promise.resolve({
        id,
        name: JOB_NAMES.DEMONSTRATOR_PING,
        data: { message: 'test', correlationId: 'corr-1', timestamp: Date.now() },
      })
    ),
    close: vi.fn().mockResolvedValue(undefined),
  }));

  return {
    Queue: MockQueue,
  };
});

vi.mock('../src/queue/redis.config', () => ({
  createRedisClient: vi.fn().mockReturnValue({
    ping: vi.fn().mockResolvedValue('PONG'),
    quit: vi.fn().mockResolvedValue('OK'),
    on: vi.fn(),
  }),
}));

describe('QueueService', () => {
  let service: QueueService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QueueService],
    }).compile();

    service = module.get<QueueService>(QueueService);
    service.onModuleInit();
  });

  afterEach(async () => {
    await service.onApplicationShutdown();
    vi.clearAllMocks();
  });

  it('should be defined and initialized', () => {
    expect(service).toBeDefined();
    expect(service.getDemonstratorQueueInstance()).toBeDefined();
  });

  it('should enqueue demonstrator job with default retry and cleanup options', async () => {
    const payload: DemonstratorJobData = {
      message: 'test-ping',
      correlationId: 'test-corr-123',
      timestamp: Date.now(),
    };

    const job = await service.enqueueDemonstrator(payload);

    expect(job).toBeDefined();
    expect(job.id).toBe('job-123');
    expect(job.name).toBe(JOB_NAMES.DEMONSTRATOR_PING);
    expect(job.data).toEqual(payload);
    expect(job.opts).toMatchObject({
      attempts: DEFAULT_JOB_OPTIONS.attempts,
      backoff: DEFAULT_JOB_OPTIONS.backoff,
      removeOnComplete: DEFAULT_JOB_OPTIONS.removeOnComplete,
      removeOnFail: DEFAULT_JOB_OPTIONS.removeOnFail,
    });
  });

  it('should allow overriding job options when enqueuing', async () => {
    const payload: DemonstratorJobData = {
      message: 'custom-ping',
      correlationId: 'custom-corr-456',
      timestamp: Date.now(),
    };

    const job = await service.enqueueDemonstrator(payload, { attempts: 5 });

    expect(job.opts).toMatchObject({
      attempts: 5,
    });
  });

  it('should retrieve demonstrator job by id', async () => {
    const job = await service.getDemonstratorJob('job-123');
    expect(job).toBeDefined();
    expect(job?.id).toBe('job-123');
  });

  it('should report healthy status when Redis ping returns PONG', async () => {
    const health = await service.isRedisHealthy();
    expect(health.status).toBe('healthy');
    expect(typeof health.latencyMs).toBe('number');
    expect(health.error).toBeUndefined();
  });

  it('should report unreachable when Redis ping fails or rejects', async () => {
    const redisMock = (service as any).redisClient;
    redisMock.ping = vi.fn().mockRejectedValue(new Error('Connection refused'));

    const health = await service.isRedisHealthy();
    expect(health.status).toBe('unreachable');
    expect(health.error).toContain('Connection refused');
  });

  it('should report unhealthy when Redis ping returns unexpected value', async () => {
    const redisMock = (service as any).redisClient;
    redisMock.ping = vi.fn().mockResolvedValue('ERR');

    const health = await service.isRedisHealthy();
    expect(health.status).toBe('unhealthy');
    expect(health.error).toContain('Unexpected ping response');
  });

  it('should gracefully close queue and redis on shutdown', async () => {
    const queue = service.getDemonstratorQueueInstance();
    const redisMock = (service as any).redisClient;

    await service.onApplicationShutdown();

    expect(queue?.close).toHaveBeenCalled();
    expect(redisMock.quit).toHaveBeenCalled();
  });
});
