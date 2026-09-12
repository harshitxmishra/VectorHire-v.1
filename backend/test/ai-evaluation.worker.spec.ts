import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { AiEvaluationWorker } from '../src/queue/ai/ai-evaluation.worker';
import { AiService } from '../src/ai/ai.service';
import { Job } from 'bullmq';
import { AiEvaluationJobData, AiEvaluationJobResult } from '../src/queue/ai/ai-evaluation.types';

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

describe('AiEvaluationWorker', () => {
  let worker: AiEvaluationWorker;
  let aiService: AiService;

  const mockAiService = {
    evaluateCandidate: vi.fn(),
    getCachedEvaluation: vi.fn(),
  };

  const mockCandidateEval = {
    score: 92,
    summary: 'Strong backend engineering fundamentals and system design.',
    strengths: ['TypeScript', 'NestJS', 'PostgreSQL'],
    weaknesses: ['Frontend animation performance'],
    recommendation: 'Advance to final stage',
    interviewQuestions: ['Describe PostgreSQL locking mechanisms.'],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    aiService = mockAiService as unknown as AiService;
    worker = new AiEvaluationWorker(aiService);
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

  it('should process job by delegating to AiService.evaluateCandidate', async () => {
    mockAiService.evaluateCandidate.mockResolvedValue(mockCandidateEval);

    const jobData: AiEvaluationJobData = {
      candidate_id: 15,
      full_name: 'Alice Smith',
      college: 'Stanford',
      cgpa: 9.4,
      github: 'https://github.com/alicesmith',
      status: 'screened',
      ai_score: 90,
      correlationId: 'corr-xyz-123',
      enqueuedAt: Date.now(),
    };

    const mockJob = {
      id: 'job-ai-100',
      data: jobData,
    } as unknown as Job<AiEvaluationJobData, AiEvaluationJobResult>;

    const result = await worker.processJob(mockJob);

    expect(aiService.evaluateCandidate).toHaveBeenCalledWith(jobData);
    expect(result).toMatchObject({
      candidateId: 15,
      score: 92,
      summary: mockCandidateEval.summary,
      strengths: mockCandidateEval.strengths,
      weaknesses: mockCandidateEval.weaknesses,
      recommendation: mockCandidateEval.recommendation,
      interviewQuestions: mockCandidateEval.interviewQuestions,
      correlationId: 'corr-xyz-123',
    });
    expect(result.processedAt).toBeDefined();
  });

  it('should propagate errors from AiService to let BullMQ handle retries', async () => {
    const error = new Error('AI Provider timeout');
    mockAiService.evaluateCandidate.mockRejectedValue(error);

    const jobData: AiEvaluationJobData = {
      candidate_id: 15,
      full_name: 'Alice Smith',
      college: 'Stanford',
      cgpa: 9.4,
      github: 'https://github.com/alicesmith',
      status: 'screened',
      ai_score: 90,
      correlationId: 'corr-xyz-123',
      enqueuedAt: Date.now(),
    };

    const mockJob = {
      id: 'job-ai-100',
      data: jobData,
    } as unknown as Job<AiEvaluationJobData, AiEvaluationJobResult>;

    await expect(worker.processJob(mockJob)).rejects.toThrow('AI Provider timeout');
  });

  it('should gracefully close worker and redis connection on application shutdown', async () => {
    const workerInstance = worker.getWorkerInstance();
    const redisMock = (worker as any).redisClient;

    await worker.onApplicationShutdown();

    expect(workerInstance?.close).toHaveBeenCalled();
    expect(redisMock.quit).toHaveBeenCalled();
  });
});
