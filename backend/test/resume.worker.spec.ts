import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ResumeWorker } from '../src/queue/resume/resume.worker';
import { ResumeService } from '../src/resume/resume.service';
import { Job } from 'bullmq';
import { ResumeJobData, ResumeJobResult } from '../src/queue/resume/resume.types';

// Mock bullmq and ioredis
vi.mock('bullmq', () => {
  const MockWorker = vi.fn().mockImplementation((name, processor, opts) => ({
    name,
    processor,
    opts,
    on: vi.fn(),
    close: vi.fn().mockResolvedValue(undefined),
  }));

  return {
    Worker: MockWorker,
  };
});

vi.mock('../src/queue/redis.config', () => ({
  createRedisClient: vi.fn().mockReturnValue({
    ping: vi.fn().mockResolvedValue('PONG'),
    quit: vi.fn().mockResolvedValue('OK'),
    on: vi.fn(),
  }),
}));

describe('ResumeWorker', () => {
  let worker: ResumeWorker;
  let resumeService: ResumeService;

  const mockResumeService = {
    parseResume: vi.fn(),
    validateCandidateForParsing: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    resumeService = mockResumeService as unknown as ResumeService;
    worker = new ResumeWorker(resumeService);
    worker.onModuleInit();
  });

  afterEach(async () => {
    await worker.onApplicationShutdown();
  });

  it('should be defined and initialized with concurrency 5', () => {
    expect(worker).toBeDefined();
    const workerInstance = worker.getWorkerInstance();
    expect(workerInstance).toBeDefined();
    expect((workerInstance as any).opts.concurrency).toBe(5);
  });

  it('should process job by delegating to ResumeService.parseResume', async () => {
    mockResumeService.parseResume.mockResolvedValue({
      candidateId: 10,
      status: 'success',
    });

    const jobData: ResumeJobData = {
      candidateId: 10,
      correlationId: 'corr-resume-1',
      enqueuedAt: Date.now(),
    };

    const mockJob = {
      id: 'job-res-1',
      data: jobData,
    } as unknown as Job<ResumeJobData, ResumeJobResult>;

    const result = await worker.processJob(mockJob);

    expect(resumeService.parseResume).toHaveBeenCalledWith(10);
    expect(result).toMatchObject({
      candidateId: 10,
      status: 'success',
      correlationId: 'corr-resume-1',
    });
    expect(result.processedAt).toBeDefined();
  });

  it('should propagate errors when ResumeService fails so BullMQ can retry', async () => {
    mockResumeService.parseResume.mockRejectedValue(new Error('SSRF check failed'));

    const jobData: ResumeJobData = {
      candidateId: 10,
      correlationId: 'corr-resume-1',
      enqueuedAt: Date.now(),
    };

    const mockJob = {
      id: 'job-res-1',
      data: jobData,
    } as unknown as Job<ResumeJobData, ResumeJobResult>;

    await expect(worker.processJob(mockJob)).rejects.toThrow('SSRF check failed');
  });

  it('should propagate unhandled errors from ResumeService for retry handling', async () => {
    mockResumeService.parseResume.mockRejectedValue(new Error('Network error'));

    const jobData: ResumeJobData = {
      candidateId: 10,
      correlationId: 'corr-resume-1',
      enqueuedAt: Date.now(),
    };

    const mockJob = {
      id: 'job-res-1',
      data: jobData,
    } as unknown as Job<ResumeJobData, ResumeJobResult>;

    await expect(worker.processJob(mockJob)).rejects.toThrow('Network error');
  });

  it('should gracefully close worker and redis on shutdown', async () => {
    const workerInstance = worker.getWorkerInstance();
    const redisMock = (worker as any).redisClient;

    await worker.onApplicationShutdown();

    expect(workerInstance?.close).toHaveBeenCalled();
    expect(redisMock.quit).toHaveBeenCalled();
  });
});
