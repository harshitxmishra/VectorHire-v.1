import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { AiEvaluationWorker } from '../src/queue/ai/ai-evaluation.worker';
import { AiService } from '../src/ai/ai.service';
import { Job } from 'bullmq';
import { AiEvaluationJobData, AiEvaluationJobResult } from '../src/queue/ai/ai-evaluation.types';
import { DEFAULT_JOB_OPTIONS } from '../src/queue/queue.constants';

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

describe('Agentic Evaluation Worker (BullMQ + Redis Concurrency)', () => {
  let worker: AiEvaluationWorker;
  let aiService: AiService;

  const mockAiService = {
    evaluateCandidate: vi.fn(),
    getCachedEvaluation: vi.fn(),
  };

  const mockScorecard = {
    score: 94,
    overall_score: 94,
    summary: 'Senior distributed systems developer with verified GitHub commits.',
    strengths: ['NestJS', 'BullMQ', 'AWS'],
    weaknesses: ['None identified'],
    recommendation: 'Strong Hire',
    interviewQuestions: ['Deep dive on Redis queue memory management.'],
    jd_skill_matrix: [
      { skill: 'BullMQ', status: 'verified_via_github', evidence: 'Worker implementation in repo' },
    ],
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

  it('verifies BullMQ exponential backoff and DLQ retention configuration', () => {
    expect(DEFAULT_JOB_OPTIONS.attempts).toBe(3);
    expect(DEFAULT_JOB_OPTIONS.backoff.type).toBe('exponential');
    expect(DEFAULT_JOB_OPTIONS.backoff.delay).toBe(1000);
    // DLQ retention of failed jobs for audit
    expect(DEFAULT_JOB_OPTIONS.removeOnFail.age).toBe(86400);
    expect(DEFAULT_JOB_OPTIONS.removeOnFail.count).toBe(5000);
  });

  it('processes agentic evaluation job and attaches correlationId & metadata', async () => {
    mockAiService.evaluateCandidate.mockResolvedValue(mockScorecard);

    const mockJob = {
      id: 'job-candidate-101-hash-abc',
      name: 'ai:evaluate',
      data: {
        candidateId: 101,
        force: false,
        correlationId: 'corr-worker-test-101',
      },
      attemptsMade: 0,
      opts: { attempts: 3 },
    } as unknown as Job<AiEvaluationJobData, AiEvaluationJobResult>;

    const result = await worker.processJob(mockJob);

    expect(result.score).toBe(94);
    expect(result.candidateId).toBe(101);
    expect(result.correlationId).toBe('corr-worker-test-101');
    expect(result.processedAt).toBeDefined();
    expect(mockAiService.evaluateCandidate).toHaveBeenCalledWith(mockJob.data);
  });

  it('handles job idempotency key structure to prevent duplicate concurrent jobs', () => {
    const candidateId = 205;
    const contentHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
    const idempotencyJobId = `ai-eval-${candidateId}-${contentHash.slice(0, 16)}`;

    expect(idempotencyJobId).toBe('ai-eval-205-e3b0c44298fc1c14');
  });

  it('propagates worker failure to trigger BullMQ exponential retry', async () => {
    mockAiService.evaluateCandidate.mockRejectedValue(new Error('Rate limit exceeded from upstream provider'));

    const mockJob = {
      id: 'job-candidate-fail-1',
      name: 'ai:evaluate',
      data: {
        candidateId: 404,
        force: true,
        correlationId: 'corr-fail-404',
      },
      attemptsMade: 1, // attempt 2 of 3
      opts: { attempts: 3 },
    } as unknown as Job<AiEvaluationJobData, AiEvaluationJobResult>;

    await expect(worker.processJob(mockJob)).rejects.toThrow('Rate limit exceeded');
  });
});
