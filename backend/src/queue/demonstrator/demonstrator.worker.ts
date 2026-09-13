import { Injectable, Logger, OnModuleInit, OnApplicationShutdown } from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import { QUEUE_NAMES } from '../queue.constants';
import { DemonstratorJobData, DemonstratorJobResult } from './demonstrator.types';
import { createRedisClient } from '../redis.config';
import { Redis } from 'ioredis';
import { StructuredLogger } from '../../common/logging/structured-logger.service';

@Injectable()
export class DemonstratorWorker implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(DemonstratorWorker.name);
  private readonly structuredLogger = new StructuredLogger(DemonstratorWorker.name);
  private worker?: Worker<DemonstratorJobData, DemonstratorJobResult>;
  private redisClient?: Redis;

  onModuleInit() {
    this.redisClient = createRedisClient();

    this.worker = new Worker<DemonstratorJobData, DemonstratorJobResult>(
      QUEUE_NAMES.DEMONSTRATOR,
      async (job: Job<DemonstratorJobData, DemonstratorJobResult>) => {
        return this.processJob(job);
      },
      {
        connection: this.redisClient,
        concurrency: 5,
      }
    );

    this.worker.on('error', (err: Error) => {
      this.logger.warn(`Demonstrator worker error: ${err.message}`);
    });
  }

  async processJob(
    job: Job<DemonstratorJobData, DemonstratorJobResult>
  ): Promise<DemonstratorJobResult> {
    const startTime = Date.now();
    const { message, correlationId, shouldFail } = job.data;
    const attempt = (job.attemptsMade ?? 0) + 1;
    const maxAttempts = job.opts?.attempts ?? 3;

    this.structuredLogger.logJobStarted({
      queue: QUEUE_NAMES.DEMONSTRATOR,
      jobId: job.id,
      jobName: job.name,
      correlationId,
      attempt,
      maxAttempts,
    });

    try {
      if (shouldFail) {
        throw new Error(`Demonstrator intentional failure for correlationId: ${correlationId}`);
      }

      const durationMs = Date.now() - startTime;
      this.structuredLogger.logJobCompleted({
        queue: QUEUE_NAMES.DEMONSTRATOR,
        jobId: job.id,
        jobName: job.name,
        correlationId,
        durationMs,
        attempt,
        maxAttempts,
      });

      return {
        processed: true,
        receivedMessage: message,
        correlationId,
        processedAt: new Date().toISOString(),
      };
    } catch (err) {
      const durationMs = Date.now() - startTime;
      this.structuredLogger.logJobFailed({
        queue: QUEUE_NAMES.DEMONSTRATOR,
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
    this.logger.log('Shutting down DemonstratorWorker...');
    if (this.worker) {
      await this.worker.close();
    }
    if (this.redisClient) {
      await this.redisClient.quit().catch(() => {});
    }
  }

  // Exposed for testing worker handler directly
  getWorkerInstance(): Worker<DemonstratorJobData, DemonstratorJobResult> | undefined {
    return this.worker;
  }
}
