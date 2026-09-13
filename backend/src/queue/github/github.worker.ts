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
import { GithubJobData, GithubJobResult } from './github.types';
import { createRedisClient } from '../redis.config';
import { Redis } from 'ioredis';
import { GithubService } from '../../github/github.service';
import { StructuredLogger } from '../../common/logging/structured-logger.service';

@Injectable()
export class GithubWorker implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(GithubWorker.name);
  private readonly structuredLogger = new StructuredLogger(GithubWorker.name);
  private worker?: Worker<GithubJobData, GithubJobResult>;
  private redisClient?: Redis;

  constructor(
    @Inject(forwardRef(() => GithubService))
    private readonly githubService: GithubService
  ) {}

  onModuleInit() {
    this.redisClient = createRedisClient();

    this.worker = new Worker<GithubJobData, GithubJobResult>(
      QUEUE_NAMES.GITHUB_PROCESSING,
      async (job: Job<GithubJobData, GithubJobResult>) => {
        return this.processJob(job);
      },
      {
        connection: this.redisClient,
        concurrency: 5,
      }
    );

    this.worker.on('error', (err: Error) => {
      this.logger.warn(`GitHub worker connection error: ${err.message}`);
    });

    this.logger.log(`Initialized worker: ${QUEUE_NAMES.GITHUB_PROCESSING} (concurrency: 5)`);
  }

  async processJob(job: Job<GithubJobData, GithubJobResult>): Promise<GithubJobResult> {
    const startTime = Date.now();
    const { candidateId, force, correlationId } = job.data;
    const attempt = (job.attemptsMade ?? 0) + 1;
    const maxAttempts = job.opts?.attempts ?? 3;

    this.structuredLogger.logJobStarted({
      queue: QUEUE_NAMES.GITHUB_PROCESSING,
      jobId: job.id,
      jobName: job.name,
      correlationId,
      attempt,
      maxAttempts,
    });

    try {
      const intel = await this.githubService.analyzeCandidate(candidateId, force);
      const durationMs = Date.now() - startTime;

      this.structuredLogger.logJobCompleted({
        queue: QUEUE_NAMES.GITHUB_PROCESSING,
        jobId: job.id,
        jobName: job.name,
        correlationId,
        durationMs,
        attempt,
        maxAttempts,
      });

      return {
        ...intel,
        candidateId,
        correlationId,
        processedAt: new Date().toISOString(),
      };
    } catch (err) {
      const durationMs = Date.now() - startTime;
      this.structuredLogger.logJobFailed({
        queue: QUEUE_NAMES.GITHUB_PROCESSING,
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
    this.logger.log('Shutting down GithubWorker...');
    if (this.worker) {
      await this.worker.close();
    }
    if (this.redisClient) {
      await this.redisClient.quit().catch(() => {});
    }
  }

  // Exposed for testing
  getWorkerInstance(): Worker<GithubJobData, GithubJobResult> | undefined {
    return this.worker;
  }
}
