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
import { EmailJobData, EmailJobResult } from './email.types';
import { createRedisClient } from '../redis.config';
import { Redis } from 'ioredis';
import { EmailService } from '../../email/email.service';
import { StructuredLogger } from '../../common/logging/structured-logger.service';

@Injectable()
export class EmailWorker implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(EmailWorker.name);
  private readonly structuredLogger = new StructuredLogger(EmailWorker.name);
  private worker?: Worker<EmailJobData, EmailJobResult>;
  private redisClient?: Redis;

  constructor(
    @Inject(forwardRef(() => EmailService))
    private readonly emailService: EmailService
  ) {}

  onModuleInit() {
    this.redisClient = createRedisClient();

    this.worker = new Worker<EmailJobData, EmailJobResult>(
      QUEUE_NAMES.EMAIL_PROCESSING,
      async (job: Job<EmailJobData, EmailJobResult>) => {
        return this.processJob(job);
      },
      {
        connection: this.redisClient,
        concurrency: 2,
      }
    );

    this.worker.on('error', (err: Error) => {
      this.logger.warn(`Email worker connection error: ${err.message}`);
    });

    this.logger.log(`Initialized worker: ${QUEUE_NAMES.EMAIL_PROCESSING} (concurrency: 2)`);
  }

  async processJob(job: Job<EmailJobData, EmailJobResult>): Promise<EmailJobResult> {
    const startTime = Date.now();
    const { candidateIds, correlationId } = job.data;
    const attempt = (job.attemptsMade ?? 0) + 1;
    const maxAttempts = job.opts?.attempts ?? 3;

    this.structuredLogger.logJobStarted({
      queue: QUEUE_NAMES.EMAIL_PROCESSING,
      jobId: job.id,
      jobName: job.name,
      correlationId,
      attempt,
      maxAttempts,
    });

    try {
      const response = await this.emailService.sendEmails(job.data);
      const durationMs = Date.now() - startTime;

      this.structuredLogger.logJobCompleted({
        queue: QUEUE_NAMES.EMAIL_PROCESSING,
        jobId: job.id,
        jobName: job.name,
        correlationId,
        durationMs,
        attempt,
        maxAttempts,
      });

      return {
        sent: response.sent,
        failed: response.failed,
        skipped: response.skipped,
        total: candidateIds.length,
        results: response.results,
        correlationId,
        processedAt: new Date().toISOString(),
      };
    } catch (err) {
      const durationMs = Date.now() - startTime;
      this.structuredLogger.logJobFailed({
        queue: QUEUE_NAMES.EMAIL_PROCESSING,
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
    this.logger.log('Shutting down EmailWorker...');
    if (this.worker) {
      await this.worker.close();
    }
    if (this.redisClient) {
      await this.redisClient.quit().catch(() => {});
    }
  }

  // Exposed for unit testing inspection
  getWorkerInstance(): Worker<EmailJobData, EmailJobResult> | undefined {
    return this.worker;
  }
}
