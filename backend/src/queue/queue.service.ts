import { Injectable, Logger, OnModuleInit, OnApplicationShutdown } from '@nestjs/common';
import { Queue, Job, JobsOptions } from 'bullmq';
import { Redis } from 'ioredis';
import { QUEUE_NAMES, JOB_NAMES, DEFAULT_JOB_OPTIONS } from './queue.constants';
import { DemonstratorJobData, DemonstratorJobResult } from './demonstrator/demonstrator.types';
import { createRedisClient } from './redis.config';

export interface RedisHealthResult {
  status: 'healthy' | 'unhealthy' | 'unreachable';
  latencyMs?: number;
  error?: string;
}

@Injectable()
export class QueueService implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(QueueService.name);
  private demonstratorQueue?: Queue<DemonstratorJobData, DemonstratorJobResult>;
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

    this.logger.log(`Initialized queue: ${QUEUE_NAMES.DEMONSTRATOR}`);
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
    if (this.redisClient) {
      await this.redisClient.quit().catch(() => {});
    }
  }

  // Exposed for unit testing inspection
  getDemonstratorQueueInstance(): Queue<DemonstratorJobData, DemonstratorJobResult> | undefined {
    return this.demonstratorQueue;
  }
}
