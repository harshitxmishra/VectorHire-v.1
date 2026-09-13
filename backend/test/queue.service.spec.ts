import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { QueueService } from '../src/queue/queue.service';
import { QUEUE_NAMES, JOB_NAMES, DEFAULT_JOB_OPTIONS } from '../src/queue/queue.constants';
import { DemonstratorJobData } from '../src/queue/demonstrator/demonstrator.types';
import { AiEvaluationJobData } from '../src/queue/ai/ai-evaluation.types';
import { ResumeJobData } from '../src/queue/resume/resume.types';
import { GithubJobData } from '../src/queue/github/github.types';

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
    getJob: vi.fn().mockImplementation((id) => {
      if (id === 'not-found') return Promise.resolve(null);
      if (id === 'job-failed-raw') {
        return Promise.resolve({
          id,
          name: JOB_NAMES.AI_EVALUATE,
          data: { full_name: 'Jane Doe', correlationId: 'corr-1', candidate_id: 10 },
          getState: vi.fn().mockResolvedValue('failed'),
          failedReason: 'Error: Connection timed out to external host at /internal/path/file.ts:25',
          timestamp: 1000,
          finishedOn: 2000,
        });
      }
      return Promise.resolve({
        id,
        name: JOB_NAMES.AI_EVALUATE,
        data: { full_name: 'Jane Doe', correlationId: 'corr-1', candidate_id: 10 },
        getState: vi.fn().mockResolvedValue('completed'),
        returnvalue: { score: 90, summary: 'Great candidate' },
        timestamp: 1000,
        finishedOn: 2000,
      });
    }),
    getJobCounts: vi.fn().mockResolvedValue({
      waiting: 2,
      active: 1,
      completed: 10,
      failed: 0,
      delayed: 0,
      paused: 0,
    }),
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
    expect(service.getAiEvaluationQueueInstance()).toBeDefined();
    expect(service.getResumeQueueInstance()).toBeDefined();
    expect(service.getGithubQueueInstance()).toBeDefined();
    expect(service.getDatasetQueueInstance()).toBeDefined();
    expect(service.getEmailQueueInstance()).toBeDefined();
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

  it('should enqueue AI evaluation job with default retry and cleanup options', async () => {
    const payload: AiEvaluationJobData = {
      candidate_id: 10,
      full_name: 'Jane Doe',
      college: 'MIT',
      cgpa: 9.1,
      github: 'https://github.com/janedoe',
      status: 'screened',
      ai_score: 85,
      correlationId: 'test-corr-ai',
      enqueuedAt: Date.now(),
    };

    const job = await service.enqueueAiEvaluation(payload);

    expect(job).toBeDefined();
    expect(job.id).toBe('job-123');
    expect(job.name).toBe(JOB_NAMES.AI_EVALUATE);
    expect(job.data).toEqual(payload);
  });

  it('should retrieve AI evaluation job by id', async () => {
    const job = await service.getAiEvaluationJob('job-123');
    expect(job).toBeDefined();
    expect(job?.id).toBe('job-123');
  });

  it('should return formatted AI evaluation job status', async () => {
    const status = await service.getAiEvaluationJobStatus('job-123');
    expect(status).toEqual({
      jobId: 'job-123',
      state: 'completed',
      correlationId: 'corr-1',
      result: { score: 90, summary: 'Great candidate' },
      error: undefined,
      enqueuedAt: 1000,
      finishedAt: 2000,
    });
  });

  it('should sanitize error message in job status response without exposing paths or stack traces', async () => {
    const status = await service.getAiEvaluationJobStatus('job-failed-raw');
    expect(status).toEqual({
      jobId: 'job-failed-raw',
      state: 'failed',
      correlationId: 'corr-1',
      result: undefined,
      error: 'Processing timed out',
      enqueuedAt: 1000,
      finishedAt: 2000,
    });
  });

  it('should enqueue Resume processing job', async () => {
    const payload: ResumeJobData = {
      candidateId: 10,
      correlationId: 'test-corr-res',
      enqueuedAt: Date.now(),
    };

    const job = await service.enqueueResumeProcessing(payload);

    expect(job).toBeDefined();
    expect(job.id).toBe('job-123');
    expect(job.name).toBe(JOB_NAMES.RESUME_PARSE);
    expect(job.data).toEqual(payload);
  });

  it('should retrieve Resume job by id and return status', async () => {
    const job = await service.getResumeJob('job-123');
    expect(job).toBeDefined();

    const status = await service.getResumeJobStatus('job-123');
    expect(status).toMatchObject({
      jobId: 'job-123',
      state: 'completed',
    });
  });

  it('should enqueue GitHub processing job', async () => {
    const payload: GithubJobData = {
      candidateId: 10,
      force: false,
      correlationId: 'test-corr-gh',
      enqueuedAt: Date.now(),
    };

    const job = await service.enqueueGithubProcessing(payload);

    expect(job).toBeDefined();
    expect(job.id).toBe('job-123');
    expect(job.name).toBe(JOB_NAMES.GITHUB_ANALYZE);
    expect(job.data).toEqual(payload);
  });

  it('should retrieve GitHub job by id and return status', async () => {
    const job = await service.getGithubJob('job-123');
    expect(job).toBeDefined();

    const status = await service.getGithubJobStatus('job-123');
    expect(status).toMatchObject({
      jobId: 'job-123',
      state: 'completed',
    });
  });

  it('should enqueue dataset import job with default options', async () => {
    const payload = {
      uploadId: 'c28a964f-4eb8-42f7-b2f5-d018cb174824',
      datasetName: 'Batch 2026',
      uploadedBy: 'admin@vectorhire.io',
      mode: 'replace' as const,
      correlationId: 'corr-data-1',
      enqueuedAt: Date.now(),
    };

    const job = await service.enqueueDatasetImport(payload);

    expect(job).toBeDefined();
    expect(job.id).toBe('job-123');
    expect(job.name).toBe(JOB_NAMES.DATASET_IMPORT);
    expect(job.data).toEqual(payload);
  });

  it('should retrieve dataset job by id and return status', async () => {
    const job = await service.getDatasetJob('job-123');
    expect(job).toBeDefined();

    const status = await service.getDatasetJobStatus('job-123');
    expect(status).toMatchObject({
      jobId: 'job-123',
      state: 'completed',
    });
  });

  it('should enqueue email send job with default options', async () => {
    const payload = {
      candidateIds: [1, 2, 3],
      type: 'assessment' as const,
      assessmentTitle: 'Node.js Test',
      correlationId: 'corr-email-1',
      enqueuedAt: '2026-09-12T10:00:00.000Z',
    };

    const job = await service.enqueueEmailSend(payload);

    expect(job).toBeDefined();
    expect(job.id).toBe('job-123');
    expect(job.name).toBe(JOB_NAMES.EMAIL_SEND);
    expect(job.data).toEqual(payload);
  });

  it('should retrieve email job by id and return status', async () => {
    const job = await service.getEmailJob('job-123');
    expect(job).toBeDefined();

    const status = await service.getEmailJobStatus('job-123');
    expect(status).toMatchObject({
      jobId: 'job-123',
      state: 'completed',
    });
  });

  it('should return null when job is not found', async () => {
    const status = await service.getAiEvaluationJobStatus('not-found');
    expect(status).toBeNull();
    const resStatus = await service.getResumeJobStatus('not-found');
    expect(resStatus).toBeNull();
    const ghStatus = await service.getGithubJobStatus('not-found');
    expect(ghStatus).toBeNull();
    const dataStatus = await service.getDatasetJobStatus('not-found');
    expect(dataStatus).toBeNull();
    const emailStatus = await service.getEmailJobStatus('not-found');
    expect(emailStatus).toBeNull();
  });

  it('should collect queue metrics across all registered queues', async () => {
    const metrics = await service.getSystemQueueMetrics();

    expect(metrics).toBeDefined();
    expect(metrics?.[QUEUE_NAMES.DEMONSTRATOR]).toEqual({
      waiting: 2,
      active: 1,
      completed: 10,
      failed: 0,
      delayed: 0,
      paused: 0,
    });
    expect(metrics?.[QUEUE_NAMES.AI_EVALUATION]).toBeDefined();
    expect(metrics?.[QUEUE_NAMES.RESUME_PROCESSING]).toBeDefined();
    expect(metrics?.[QUEUE_NAMES.GITHUB_PROCESSING]).toBeDefined();
    expect(metrics?.[QUEUE_NAMES.DATASET_PROCESSING]).toBeDefined();
    expect(metrics?.[QUEUE_NAMES.EMAIL_PROCESSING]).toBeDefined();
  });

  it('should handle queue metrics collection error safely and return null without throwing', async () => {
    const demoQueue = service.getDemonstratorQueueInstance();
    if (demoQueue) {
      demoQueue.getJobCounts = vi.fn().mockRejectedValue(new Error('Redis connection lost'));
    }

    const metrics = await service.getSystemQueueMetrics();
    expect(metrics).toBeNull();
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

  it('should gracefully close queues and redis on shutdown', async () => {
    const demoQueue = service.getDemonstratorQueueInstance();
    const aiQueue = service.getAiEvaluationQueueInstance();
    const resumeQueue = service.getResumeQueueInstance();
    const githubQueue = service.getGithubQueueInstance();
    const datasetQueue = service.getDatasetQueueInstance();
    const emailQueue = service.getEmailQueueInstance();
    const redisMock = (service as any).redisClient;

    await service.onApplicationShutdown();

    expect(demoQueue?.close).toHaveBeenCalled();
    expect(aiQueue?.close).toHaveBeenCalled();
    expect(resumeQueue?.close).toHaveBeenCalled();
    expect(githubQueue?.close).toHaveBeenCalled();
    expect(datasetQueue?.close).toHaveBeenCalled();
    expect(emailQueue?.close).toHaveBeenCalled();
    expect(redisMock.quit).toHaveBeenCalled();
  });
});
