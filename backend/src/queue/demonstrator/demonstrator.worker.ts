import { Injectable, Logger, OnModuleInit, OnApplicationShutdown } from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import { QUEUE_NAMES, JOB_NAMES } from '../queue.constants';
import { DemonstratorJobData, DemonstratorJobResult } from './demonstrator.types';
import { createRedisClient } from '../redis.config';
import { Redis } from 'ioredis';

@Injectable()
export class DemonstratorWorker implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(DemonstratorWorker.name);
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

    this.worker.on('completed', (job: Job<DemonstratorJobData, DemonstratorJobResult>) => {
      this.logger.debug(
        `Demonstrator job ${job.id} completed successfully (correlationId: ${job.data?.correlationId})`
      );
    });

    this.worker.on('failed', (job: Job<DemonstratorJobData, DemonstratorJobResult> | undefined, err: Error) => {
      this.logger.warn(
        `Demonstrator job ${job?.id} failed on attempt ${job?.attemptsMade}/${job?.opts?.attempts}: ${err.message}`
      );
    });

    this.worker.on('error', (err: Error) => {
      this.logger.warn(`Demonstrator worker error: ${err.message}`);
    });
  }

  async processJob(
    job: Job<DemonstratorJobData, DemonstratorJobResult>
  ): Promise<DemonstratorJobResult> {
    const { message, correlationId, shouldFail } = job.data;

    if (shouldFail) {
      this.logger.warn(
        `Demonstrator job ${job.id} requested intentional failure (correlationId: ${correlationId})`
      );
      throw new Error(`Demonstrator intentional failure for correlationId: ${correlationId}`);
    }

    return {
      processed: true,
      receivedMessage: message,
      correlationId,
      processedAt: new Date().toISOString(),
    };
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
