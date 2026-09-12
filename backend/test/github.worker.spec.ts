import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { GithubWorker } from '../src/queue/github/github.worker';
import { GithubService } from '../src/github/github.service';
import { Job } from 'bullmq';
import { GithubJobData, GithubJobResult } from '../src/queue/github/github.types';

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

describe('GithubWorker', () => {
  let worker: GithubWorker;
  let githubService: GithubService;

  const mockGithubIntel = {
    score: 85,
    summary: 'Solid GitHub portfolio with strong open source contributions.',
    languages: ['TypeScript', 'Python'],
    portfolioVerdict: 'Strong Full-Stack Portfolio',
    highlights: ['Maintains popular utility package', 'Active contribution graph'],
    strongestRepo: 'vector-hire',
  };

  const mockGithubService = {
    analyzeCandidate: vi.fn(),
    getCachedAnalysis: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    githubService = mockGithubService as unknown as GithubService;
    worker = new GithubWorker(githubService);
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

  it('should process job by delegating to GithubService.analyzeCandidate', async () => {
    mockGithubService.analyzeCandidate.mockResolvedValue(mockGithubIntel);

    const jobData: GithubJobData = {
      candidateId: 10,
      force: false,
      correlationId: 'corr-gh-1',
      enqueuedAt: Date.now(),
    };

    const mockJob = {
      id: 'job-gh-101',
      data: jobData,
    } as unknown as Job<GithubJobData, GithubJobResult>;

    const result = await worker.processJob(mockJob);

    expect(githubService.analyzeCandidate).toHaveBeenCalledWith(10, false);
    expect(result).toMatchObject({
      ...mockGithubIntel,
      candidateId: 10,
      correlationId: 'corr-gh-1',
    });
    expect(result.processedAt).toBeDefined();
  });

  it('should pass force flag to GithubService.analyzeCandidate', async () => {
    mockGithubService.analyzeCandidate.mockResolvedValue(mockGithubIntel);

    const jobData: GithubJobData = {
      candidateId: 10,
      force: true,
      correlationId: 'corr-gh-2',
      enqueuedAt: Date.now(),
    };

    const mockJob = {
      id: 'job-gh-102',
      data: jobData,
    } as unknown as Job<GithubJobData, GithubJobResult>;

    await worker.processJob(mockJob);

    expect(githubService.analyzeCandidate).toHaveBeenCalledWith(10, true);
  });

  it('should propagate errors from GithubService for BullMQ retry lifecycle', async () => {
    mockGithubService.analyzeCandidate.mockRejectedValue(new Error('GitHub API rate limit'));

    const jobData: GithubJobData = {
      candidateId: 10,
      force: false,
      correlationId: 'corr-gh-3',
      enqueuedAt: Date.now(),
    };

    const mockJob = {
      id: 'job-gh-103',
      data: jobData,
    } as unknown as Job<GithubJobData, GithubJobResult>;

    await expect(worker.processJob(mockJob)).rejects.toThrow('GitHub API rate limit');
  });

  it('should gracefully close worker and redis on application shutdown', async () => {
    const workerInstance = worker.getWorkerInstance();
    const redisMock = (worker as any).redisClient;

    await worker.onApplicationShutdown();

    expect(workerInstance?.close).toHaveBeenCalled();
    expect(redisMock.quit).toHaveBeenCalled();
  });
});
