import {
  Injectable,
  Logger,
  OnModuleInit,
  OnApplicationShutdown,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import { QUEUE_NAMES } from '../queue.constants';
import { ResumeJobData, ResumeJobResult } from './resume.types';
import { createRedisClient } from '../redis.config';
import { Redis } from 'ioredis';
import { ResumeService } from '../../resume/resume.service';
import { StructuredLogger } from '../../common/logging/structured-logger.service';

@Injectable()
export class ResumeWorker implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(ResumeWorker.name);
  private readonly structuredLogger = new StructuredLogger(ResumeWorker.name);
  private worker?: Worker<ResumeJobData, ResumeJobResult>;
  private redisClient?: Redis;

  constructor(
    @Inject(forwardRef(() => ResumeService))
    private readonly resumeService: ResumeService
  ) {}

  onModuleInit() {
    this.redisClient = createRedisClient();

    this.worker = new Worker<ResumeJobData, ResumeJobResult>(
      QUEUE_NAMES.RESUME_PROCESSING,
      async (job: Job<ResumeJobData, ResumeJobResult>) => {
        return this.processJob(job);
      },
      {
        connection: this.redisClient,
        concurrency: 5,
      }
    );

    this.worker.on('error', (err: Error) => {
      this.logger.warn(`Resume worker connection error: ${err.message}`);
    });

    this.logger.log(`Initialized worker: ${QUEUE_NAMES.RESUME_PROCESSING} (concurrency: 5)`);
  }

  async processJob(job: Job<ResumeJobData, ResumeJobResult>): Promise<ResumeJobResult> {
    const startTime = Date.now();
    const { candidateId, correlationId } = job.data;
    const attempt = (job.attemptsMade ?? 0) + 1;
    const maxAttempts = job.opts?.attempts ?? 3;

    this.structuredLogger.logJobStarted({
      queue: QUEUE_NAMES.RESUME_PROCESSING,
      jobId: job.id,
      jobName: job.name,
      correlationId,
      attempt,
      maxAttempts,
    });

    try {
      const result = await this.resumeService.parseResume(candidateId);
      const durationMs = Date.now() - startTime;

      this.structuredLogger.logJobCompleted({
        queue: QUEUE_NAMES.RESUME_PROCESSING,
        jobId: job.id,
        jobName: job.name,
        correlationId,
        durationMs,
        attempt,
        maxAttempts,
      });

      return {
        candidateId,
        status: result.status,
        correlationId,
        processedAt: new Date().toISOString(),
      };
    } catch (err) {
      const durationMs = Date.now() - startTime;
      this.structuredLogger.logJobFailed({
        queue: QUEUE_NAMES.RESUME_PROCESSING,
        jobId: job.id,
        jobName: job.name,
        correlationId,
        durationMs,
        error: err,
        attempt,
        maxAttempts,
      });
      throw err;
    }
  }

  async onApplicationShutdown() {
    this.logger.log('Shutting down ResumeWorker...');
    if (this.worker) {
      await this.worker.close();
    }
    if (this.redisClient) {
      await this.redisClient.quit().catch(() => {});
    }
  }

  // Exposed for testing
  getWorkerInstance(): Worker<ResumeJobData, ResumeJobResult> | undefined {
    return this.worker;
  }
}
