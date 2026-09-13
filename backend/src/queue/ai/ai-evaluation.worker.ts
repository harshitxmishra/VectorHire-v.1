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
import {
  AiEvaluationJobData,
  AiEvaluationJobResult,
} from './ai-evaluation.types';
import { createRedisClient } from '../redis.config';
import { Redis } from 'ioredis';
import { AiService } from '../../ai/ai.service';
import { StructuredLogger } from '../../common/logging/structured-logger.service';

@Injectable()
export class AiEvaluationWorker implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(AiEvaluationWorker.name);
  private readonly structuredLogger = new StructuredLogger(AiEvaluationWorker.name);
  private worker?: Worker<AiEvaluationJobData, AiEvaluationJobResult>;
  private redisClient?: Redis;

  constructor(
    @Inject(forwardRef(() => AiService))
    private readonly aiService: AiService
  ) {}

  onModuleInit() {
    this.redisClient = createRedisClient();

    this.worker = new Worker<AiEvaluationJobData, AiEvaluationJobResult>(
      QUEUE_NAMES.AI_EVALUATION,
      async (job: Job<AiEvaluationJobData, AiEvaluationJobResult>) => {
        return this.processJob(job);
      },
      {
        connection: this.redisClient,
        concurrency: 5,
      }
    );

    this.worker.on('error', (err: Error) => {
      this.logger.warn(`AI Evaluation worker connection error: ${err.message}`);
    });

    this.logger.log(`Initialized worker: ${QUEUE_NAMES.AI_EVALUATION} (concurrency: 5)`);
  }

  async processJob(
    job: Job<AiEvaluationJobData, AiEvaluationJobResult>
  ): Promise<AiEvaluationJobResult> {
    const startTime = Date.now();
    const { candidate_id, correlationId } = job.data;
    const attempt = (job.attemptsMade ?? 0) + 1;
    const maxAttempts = job.opts?.attempts ?? 3;

    this.structuredLogger.logJobStarted({
      queue: QUEUE_NAMES.AI_EVALUATION,
      jobId: job.id,
      jobName: job.name,
      correlationId,
      attempt,
      maxAttempts,
    });

    try {
      // Delegate execution to the existing domain/AI service layer
      const evalResult = await this.aiService.evaluateCandidate(job.data);
      const durationMs = Date.now() - startTime;

      this.structuredLogger.logJobCompleted({
        queue: QUEUE_NAMES.AI_EVALUATION,
        jobId: job.id,
        jobName: job.name,
        correlationId,
        durationMs,
        attempt,
        maxAttempts,
      });

      return {
        candidateId: candidate_id,
        score: evalResult.score,
        summary: evalResult.summary,
        strengths: evalResult.strengths,
        weaknesses: evalResult.weaknesses,
        recommendation: evalResult.recommendation,
        interviewQuestions: evalResult.interviewQuestions,
        correlationId,
        processedAt: new Date().toISOString(),
      };
    } catch (err) {
      const durationMs = Date.now() - startTime;
      this.structuredLogger.logJobFailed({
        queue: QUEUE_NAMES.AI_EVALUATION,
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
    this.logger.log('Shutting down AiEvaluationWorker...');
    if (this.worker) {
      await this.worker.close();
    }
    if (this.redisClient) {
      await this.redisClient.quit().catch(() => {});
    }
  }

  // Exposed for testing
  getWorkerInstance(): Worker<AiEvaluationJobData, AiEvaluationJobResult> | undefined {
    return this.worker;
  }
}
