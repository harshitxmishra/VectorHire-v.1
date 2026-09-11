import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { DemonstratorWorker } from '../src/queue/demonstrator/demonstrator.worker';
import { DemonstratorJobData } from '../src/queue/demonstrator/demonstrator.types';

// Mock bullmq and ioredis
vi.mock('bullmq', () => {
  const MockWorker = vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    close: vi.fn().mockResolvedValue(undefined),
  }));

  return {
    Worker: MockWorker,
  };
});

vi.mock('../src/queue/redis.config', () => ({
  createRedisClient: vi.fn().mockReturnValue({
    quit: vi.fn().mockResolvedValue('OK'),
    on: vi.fn(),
  }),
}));

describe('DemonstratorWorker', () => {
  let worker: DemonstratorWorker;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DemonstratorWorker],
    }).compile();

    worker = module.get<DemonstratorWorker>(DemonstratorWorker);
    worker.onModuleInit();
  });

  afterEach(async () => {
    await worker.onApplicationShutdown();
    vi.clearAllMocks();
  });

  it('should be defined and initialized', () => {
    expect(worker).toBeDefined();
    expect(worker.getWorkerInstance()).toBeDefined();
  });

  it('should process a valid job payload successfully', async () => {
    const mockJob: any = {
      id: 'job-101',
      data: {
        message: 'Hello Queue',
        correlationId: 'corr-xyz-123',
        timestamp: Date.now(),
      } as DemonstratorJobData,
    };

    const result = await worker.processJob(mockJob);

    expect(result).toBeDefined();
    expect(result.processed).toBe(true);
    expect(result.receivedMessage).toBe('Hello Queue');
    expect(result.correlationId).toBe('corr-xyz-123');
    expect(result.processedAt).toBeDefined();
    expect(new Date(result.processedAt).getTime()).not.toBeNaN();
  });

  it('should throw an error when job data requests failure (to test retry/failure policy)', async () => {
    const mockJob: any = {
      id: 'job-102',
      data: {
        message: 'Fail Me',
        correlationId: 'corr-fail-999',
        timestamp: Date.now(),
        shouldFail: true,
      } as DemonstratorJobData,
    };

    await expect(worker.processJob(mockJob)).rejects.toThrow(
      'Demonstrator intentional failure for correlationId: corr-fail-999'
    );
  });

  it('should gracefully close worker and redis client on shutdown', async () => {
    const workerInstance = worker.getWorkerInstance();
    const redisMock = (worker as any).redisClient;

    await worker.onApplicationShutdown();

    expect(workerInstance?.close).toHaveBeenCalled();
    expect(redisMock.quit).toHaveBeenCalled();
  });
});
