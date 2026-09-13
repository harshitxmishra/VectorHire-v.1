import { Injectable, Logger, OnModuleInit, OnApplicationShutdown } from '@nestjs/common';
import { Queue, Job, JobsOptions } from 'bullmq';
import { Redis } from 'ioredis';
import { QUEUE_NAMES, JOB_NAMES, DEFAULT_JOB_OPTIONS } from './queue.constants';
import { DemonstratorJobData, DemonstratorJobResult } from './demonstrator/demonstrator.types';
import {
  AiEvaluationJobData,
  AiEvaluationJobResult,
  JobStatusResponse,
} from './ai/ai-evaluation.types';
import {
  ResumeJobData,
  ResumeJobResult,
  ResumeJobStatusResponse,
} from './resume/resume.types';
import {
  GithubJobData,
  GithubJobResult,
  GithubJobStatusResponse,
} from './github/github.types';
import {
  DatasetImportJobData,
  DatasetImportJobResult,
  DatasetJobStatusResponse,
} from './dataset/dataset.types';
import {
  EmailJobData,
  EmailJobResult,
  EmailJobStatusResponse,
} from './email/email.types';
import { createRedisClient } from './redis.config';
import { sanitizeJobErrorMessage } from '../common/logging/structured-logger.service';

export interface RedisHealthResult {
  status: 'healthy' | 'unhealthy' | 'unreachable';
  latencyMs?: number;
  error?: string;
}

export interface QueueMetrics {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
}

export interface SystemQueueMetrics {
  [queueName: string]: QueueMetrics;
}

@Injectable()
export class QueueService implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(QueueService.name);
  private demonstratorQueue?: Queue<DemonstratorJobData, DemonstratorJobResult>;
  private aiEvaluationQueue?: Queue<AiEvaluationJobData, AiEvaluationJobResult>;
  private resumeQueue?: Queue<ResumeJobData, ResumeJobResult>;
  private githubQueue?: Queue<GithubJobData, GithubJobResult>;
  private datasetQueue?: Queue<DatasetImportJobData, DatasetImportJobResult>;
  private emailQueue?: Queue<EmailJobData, EmailJobResult>;
  private redisClient?: Redis;

  onModuleInit() {
    this.redisClient = createRedisClient();

    this.demonstratorQueue = new Queue<DemonstratorJobData, DemonstratorJobResult>(
      QUEUE_NAMES.DEMONSTRATOR,
      {
        connection: this.redisClient,
        defaultJobOptions: DEFAULT_JOB_OPTIONS,
      }
    );

    this.aiEvaluationQueue = new Queue<AiEvaluationJobData, AiEvaluationJobResult>(
      QUEUE_NAMES.AI_EVALUATION,
      {
        connection: this.redisClient,
        defaultJobOptions: DEFAULT_JOB_OPTIONS,
      }
    );

    this.resumeQueue = new Queue<ResumeJobData, ResumeJobResult>(
      QUEUE_NAMES.RESUME_PROCESSING,
      {
        connection: this.redisClient,
        defaultJobOptions: DEFAULT_JOB_OPTIONS,
      }
    );

    this.githubQueue = new Queue<GithubJobData, GithubJobResult>(
      QUEUE_NAMES.GITHUB_PROCESSING,
      {
        connection: this.redisClient,
        defaultJobOptions: DEFAULT_JOB_OPTIONS,
      }
    );

    this.datasetQueue = new Queue<DatasetImportJobData, DatasetImportJobResult>(
      QUEUE_NAMES.DATASET_PROCESSING,
      {
        connection: this.redisClient,
        defaultJobOptions: DEFAULT_JOB_OPTIONS,
      }
    );

    this.emailQueue = new Queue<EmailJobData, EmailJobResult>(
      QUEUE_NAMES.EMAIL_PROCESSING,
      {
        connection: this.redisClient,
        defaultJobOptions: DEFAULT_JOB_OPTIONS,
      }
    );

    this.logger.log(
      `Initialized queues: ${QUEUE_NAMES.DEMONSTRATOR}, ${QUEUE_NAMES.AI_EVALUATION}, ${QUEUE_NAMES.RESUME_PROCESSING}, ${QUEUE_NAMES.GITHUB_PROCESSING}, ${QUEUE_NAMES.DATASET_PROCESSING}, ${QUEUE_NAMES.EMAIL_PROCESSING}`
    );
  }

  /**
   * Enqueues a demonstrator job for background processing.
   */
  async enqueueDemonstrator(
    data: DemonstratorJobData,
    options?: JobsOptions
  ): Promise<Job<DemonstratorJobData, DemonstratorJobResult>> {
    if (!this.demonstratorQueue) {
      throw new Error('Demonstrator queue is not initialized');
    }

    const mergedOptions: JobsOptions = {
      ...DEFAULT_JOB_OPTIONS,
      ...options,
    };

    const job = await this.demonstratorQueue.add(
      JOB_NAMES.DEMONSTRATOR_PING,
      data,
      mergedOptions
    );

    this.logger.debug(
      `Enqueued demonstrator job ${job.id} (correlationId: ${data.correlationId})`
    );

    return job;
  }

  /**
   * Enqueues an AI evaluation job for asynchronous background processing.
   */
  async enqueueAiEvaluation(
    data: AiEvaluationJobData,
    options?: JobsOptions
  ): Promise<Job<AiEvaluationJobData, AiEvaluationJobResult>> {
    if (!this.aiEvaluationQueue) {
      throw new Error('AI evaluation queue is not initialized');
    }

    const mergedOptions: JobsOptions = {
      ...DEFAULT_JOB_OPTIONS,
      ...options,
    };

    const job = await this.aiEvaluationQueue.add(
      JOB_NAMES.AI_EVALUATE,
      data,
      mergedOptions
    );

    this.logger.log(
      `Enqueued AI evaluation job ${job.id} for candidate ${data.candidate_id ?? data.full_name} (correlationId: ${data.correlationId})`
    );

    return job;
  }

  /**
   * Enqueues a Resume parsing job for asynchronous processing.
   */
  async enqueueResumeProcessing(
    data: ResumeJobData,
    options?: JobsOptions
  ): Promise<Job<ResumeJobData, ResumeJobResult>> {
    if (!this.resumeQueue) {
      throw new Error('Resume processing queue is not initialized');
    }

    const mergedOptions: JobsOptions = {
      ...DEFAULT_JOB_OPTIONS,
      ...options,
    };

    const job = await this.resumeQueue.add(
      JOB_NAMES.RESUME_PARSE,
      data,
      mergedOptions
    );

    this.logger.log(
      `Enqueued Resume processing job ${job.id} for candidate ${data.candidateId} (correlationId: ${data.correlationId})`
    );

    return job;
  }

  /**
   * Enqueues a GitHub intelligence analysis job for asynchronous processing.
   */
  async enqueueGithubProcessing(
    data: GithubJobData,
    options?: JobsOptions
  ): Promise<Job<GithubJobData, GithubJobResult>> {
    if (!this.githubQueue) {
      throw new Error('GitHub processing queue is not initialized');
    }

    const mergedOptions: JobsOptions = {
      ...DEFAULT_JOB_OPTIONS,
      ...options,
    };

    const job = await this.githubQueue.add(
      JOB_NAMES.GITHUB_ANALYZE,
      data,
      mergedOptions
    );

    this.logger.log(
      `Enqueued GitHub analysis job ${job.id} for candidate ${data.candidateId} (correlationId: ${data.correlationId})`
    );

    return job;
  }

  /**
   * Enqueues a Dataset CSV import job for asynchronous processing.
   */
  async enqueueDatasetImport(
    data: DatasetImportJobData,
    options?: JobsOptions
  ): Promise<Job<DatasetImportJobData, DatasetImportJobResult>> {
    if (!this.datasetQueue) {
      throw new Error('Dataset processing queue is not initialized');
    }

    const mergedOptions: JobsOptions = {
      ...DEFAULT_JOB_OPTIONS,
      ...options,
    };

    const job = await this.datasetQueue.add(
      JOB_NAMES.DATASET_IMPORT,
      data,
      mergedOptions
    );

    this.logger.log(
      `Enqueued Dataset import job ${job.id} for dataset ${data.datasetName} (uploadId: ${data.uploadId}, correlationId: ${data.correlationId})`
    );

    return job;
  }

  /**
   * Enqueues an Email sending job for asynchronous processing.
   */
  async enqueueEmailSend(
    data: EmailJobData,
    options?: JobsOptions
  ): Promise<Job<EmailJobData, EmailJobResult>> {
    if (!this.emailQueue) {
      throw new Error('Email processing queue is not initialized');
    }

    const mergedOptions: JobsOptions = {
      ...DEFAULT_JOB_OPTIONS,
      ...options,
    };

    const job = await this.emailQueue.add(
      JOB_NAMES.EMAIL_SEND,
      data,
      mergedOptions
    );

    this.logger.log(
      `Enqueued Email send job ${job.id} for ${data.candidateIds.length} candidate(s) (type: ${data.type}, correlationId: ${data.correlationId})`
    );

    return job;
  }

  /**
   * Retrieves a demonstrator job by ID.
   */
  async getDemonstratorJob(
    jobId: string
  ): Promise<Job<DemonstratorJobData, DemonstratorJobResult> | undefined> {
    if (!this.demonstratorQueue) {
      return undefined;
    }
    return this.demonstratorQueue.getJob(jobId);
  }

  /**
   * Retrieves an AI evaluation job by ID.
   */
  async getAiEvaluationJob(
    jobId: string
  ): Promise<Job<AiEvaluationJobData, AiEvaluationJobResult> | undefined> {
    if (!this.aiEvaluationQueue) {
      return undefined;
    }
    return this.aiEvaluationQueue.getJob(jobId);
  }

  /**
   * Retrieves generic status for an AI evaluation job by ID.
   */
  async getAiEvaluationJobStatus(jobId: string): Promise<JobStatusResponse | null> {
    const job = await this.getAiEvaluationJob(jobId);
    if (!job) {
      return null;
    }

    const state = await job.getState();
    const isFailed = state === 'failed';

    return {
      jobId: job.id ?? jobId,
      state: state as JobStatusResponse['state'],
      correlationId: job.data?.correlationId,
      result: state === 'completed' ? job.returnvalue : undefined,
      error: isFailed ? sanitizeJobErrorMessage(job.failedReason) : undefined,
      enqueuedAt: job.timestamp,
      finishedAt: job.finishedOn,
    };
  }

  /**
   * Retrieves a Resume job by ID.
   */
  async getResumeJob(
    jobId: string
  ): Promise<Job<ResumeJobData, ResumeJobResult> | undefined> {
    if (!this.resumeQueue) {
      return undefined;
    }
    return this.resumeQueue.getJob(jobId);
  }

  /**
   * Retrieves status for a Resume processing job by ID.
   */
  async getResumeJobStatus(jobId: string): Promise<ResumeJobStatusResponse | null> {
    const job = await this.getResumeJob(jobId);
    if (!job) {
      return null;
    }

    const state = await job.getState();
    const isFailed = state === 'failed';

    return {
      jobId: job.id ?? jobId,
      state: state as ResumeJobStatusResponse['state'],
      correlationId: job.data?.correlationId,
      result: state === 'completed' ? job.returnvalue : undefined,
      error: isFailed ? sanitizeJobErrorMessage(job.failedReason) : undefined,
      enqueuedAt: job.timestamp,
      finishedAt: job.finishedOn,
    };
  }

  /**
   * Retrieves a GitHub job by ID.
   */
  async getGithubJob(
    jobId: string
  ): Promise<Job<GithubJobData, GithubJobResult> | undefined> {
    if (!this.githubQueue) {
      return undefined;
    }
    return this.githubQueue.getJob(jobId);
  }

  /**
   * Retrieves status for a GitHub processing job by ID.
   */
  async getGithubJobStatus(jobId: string): Promise<GithubJobStatusResponse | null> {
    const job = await this.getGithubJob(jobId);
    if (!job) {
      return null;
    }

    const state = await job.getState();
    const isFailed = state === 'failed';

    return {
      jobId: job.id ?? jobId,
      state: state as GithubJobStatusResponse['state'],
      correlationId: job.data?.correlationId,
      result: state === 'completed' ? job.returnvalue : undefined,
      error: isFailed ? sanitizeJobErrorMessage(job.failedReason) : undefined,
      enqueuedAt: job.timestamp,
      finishedAt: job.finishedOn,
    };
  }

  /**
   * Retrieves a Dataset job by ID.
   */
  async getDatasetJob(
    jobId: string
  ): Promise<Job<DatasetImportJobData, DatasetImportJobResult> | undefined> {
    if (!this.datasetQueue) {
      return undefined;
    }
    return this.datasetQueue.getJob(jobId);
  }

  /**
   * Retrieves status for a Dataset processing job by ID.
   */
  async getDatasetJobStatus(jobId: string): Promise<DatasetJobStatusResponse | null> {
    const job = await this.getDatasetJob(jobId);
    if (!job) {
      return null;
    }

    const state = await job.getState();
    const isFailed = state === 'failed';

    return {
      jobId: job.id ?? jobId,
      state: state as DatasetJobStatusResponse['state'],
      correlationId: job.data?.correlationId,
      result: state === 'completed' ? job.returnvalue : undefined,
      error: isFailed ? sanitizeJobErrorMessage(job.failedReason) : undefined,
      enqueuedAt: job.timestamp,
      finishedAt: job.finishedOn,
    };
  }

  /**
   * Retrieves an Email job by ID.
   */
  async getEmailJob(
    jobId: string
  ): Promise<Job<EmailJobData, EmailJobResult> | undefined> {
    if (!this.emailQueue) {
      return undefined;
    }
    return this.emailQueue.getJob(jobId);
  }

  /**
   * Retrieves status for an Email processing job by ID.
   */
  async getEmailJobStatus(jobId: string): Promise<EmailJobStatusResponse | null> {
    const job = await this.getEmailJob(jobId);
    if (!job) {
      return null;
    }

    const state = await job.getState();
    const isFailed = state === 'failed';

    return {
      jobId: job.id ?? jobId,
      state: state as EmailJobStatusResponse['state'],
      correlationId: job.data?.correlationId,
      result: state === 'completed' ? job.returnvalue : undefined,
      error: isFailed ? sanitizeJobErrorMessage(job.failedReason) : undefined,
      enqueuedAt: job.timestamp,
      finishedAt: job.finishedOn,
    };
  }

  /**
   * Collects operational job counts across all initialized queues.
   * Safe and non-blocking: never throws unhandled errors if Redis is down.
   */
  async getSystemQueueMetrics(): Promise<SystemQueueMetrics | null> {
    const queues: Array<{ name: string; queue?: Queue<any, any> }> = [
      { name: QUEUE_NAMES.DEMONSTRATOR, queue: this.demonstratorQueue },
      { name: QUEUE_NAMES.AI_EVALUATION, queue: this.aiEvaluationQueue },
      { name: QUEUE_NAMES.RESUME_PROCESSING, queue: this.resumeQueue },
      { name: QUEUE_NAMES.GITHUB_PROCESSING, queue: this.githubQueue },
      { name: QUEUE_NAMES.DATASET_PROCESSING, queue: this.datasetQueue },
      { name: QUEUE_NAMES.EMAIL_PROCESSING, queue: this.emailQueue },
    ];

    try {
      const metrics: SystemQueueMetrics = {};
      for (const { name, queue } of queues) {
        if (!queue) continue;
        const counts = await queue.getJobCounts();
        metrics[name] = {
          waiting: counts.waiting ?? 0,
          active: counts.active ?? 0,
          completed: counts.completed ?? 0,
          failed: counts.failed ?? 0,
          delayed: counts.delayed ?? 0,
          paused: counts.paused ?? 0,
        };
      }
      return metrics;
    } catch (err: any) {
      this.logger.warn(`Failed to retrieve queue metrics: ${err?.message || err}`);
      return null;
    }
  }

  /**
   * Health check for Redis connectivity.
   * Performs an isolated PING with a 1.5s timeout. Never throws unhandled errors.
   */
  async isRedisHealthy(): Promise<RedisHealthResult> {
    if (!this.redisClient) {
      return { status: 'unreachable', error: 'Redis client not initialized' };
    }

    const start = Date.now();
    try {
      const pingPromise = this.redisClient.ping();
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Redis ping timeout (1500ms)')), 1500)
      );

      const res = await Promise.race([pingPromise, timeoutPromise]);
      const latencyMs = Date.now() - start;

      if (res === 'PONG') {
        return { status: 'healthy', latencyMs };
      }
      return { status: 'unhealthy', latencyMs, error: `Unexpected ping response: ${res}` };
    } catch (err: any) {
      return {
        status: 'unreachable',
        latencyMs: Date.now() - start,
        error: err?.message || 'Redis connection failed',
      };
    }
  }

  /**
   * Graceful shutdown of queue resources and connections.
   */
  async onApplicationShutdown() {
    this.logger.log('Shutting down QueueService...');
    if (this.demonstratorQueue) {
      await this.demonstratorQueue.close();
    }
    if (this.aiEvaluationQueue) {
      await this.aiEvaluationQueue.close();
    }
    if (this.resumeQueue) {
      await this.resumeQueue.close();
    }
    if (this.githubQueue) {
      await this.githubQueue.close();
    }
    if (this.datasetQueue) {
      await this.datasetQueue.close();
    }
    if (this.emailQueue) {
      await this.emailQueue.close();
    }
    if (this.redisClient) {
      await this.redisClient.quit().catch(() => {});
    }
  }

  // Exposed for unit testing inspection
  getDemonstratorQueueInstance(): Queue<DemonstratorJobData, DemonstratorJobResult> | undefined {
    return this.demonstratorQueue;
  }

  getAiEvaluationQueueInstance(): Queue<AiEvaluationJobData, AiEvaluationJobResult> | undefined {
    return this.aiEvaluationQueue;
  }

  getResumeQueueInstance(): Queue<ResumeJobData, ResumeJobResult> | undefined {
    return this.resumeQueue;
  }

  getGithubQueueInstance(): Queue<GithubJobData, GithubJobResult> | undefined {
    return this.githubQueue;
  }

  getDatasetQueueInstance(): Queue<DatasetImportJobData, DatasetImportJobResult> | undefined {
    return this.datasetQueue;
  }

  getEmailQueueInstance(): Queue<EmailJobData, EmailJobResult> | undefined {
    return this.emailQueue;
  }
}
