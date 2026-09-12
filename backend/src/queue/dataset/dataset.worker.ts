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
import { DatasetImportJobData, DatasetImportJobResult } from './dataset.types';
import { createRedisClient } from '../redis.config';
import { Redis } from 'ioredis';
import { DatasetsService } from '../../datasets/datasets.service';
import {
  readStagedDataset,
  cleanupStagedFile,
  pruneStaleStagedFiles,
} from '../../datasets/dataset-staging.util';
import { parseCSV, mapCandidateRow } from '@/lib/utils/csv-parser';
import { StructuredLogger } from '../../common/logging/structured-logger.service';

@Injectable()
export class DatasetWorker implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(DatasetWorker.name);
  private readonly structuredLogger = new StructuredLogger(DatasetWorker.name);
  private worker?: Worker<DatasetImportJobData, DatasetImportJobResult>;
  private redisClient?: Redis;

  constructor(
    @Inject(forwardRef(() => DatasetsService))
    private readonly datasetsService: DatasetsService
  ) {}

  onModuleInit() {
    // Prune any stale temporary staged files on initialization
    pruneStaleStagedFiles();

    this.redisClient = createRedisClient();

    this.worker = new Worker<DatasetImportJobData, DatasetImportJobResult>(
      QUEUE_NAMES.DATASET_PROCESSING,
      async (job: Job<DatasetImportJobData, DatasetImportJobResult>) => {
        return this.processJob(job);
      },
      {
        connection: this.redisClient,
        concurrency: 5,
      }
    );

    this.worker.on('error', (err: Error) => {
      this.logger.warn(`Dataset worker connection error: ${err.message}`);
    });

    this.logger.log(`Initialized worker: ${QUEUE_NAMES.DATASET_PROCESSING} (concurrency: 5)`);
  }

  async processJob(
    job: Job<DatasetImportJobData, DatasetImportJobResult>
  ): Promise<DatasetImportJobResult> {
    const startTime = Date.now();
    const { uploadId, datasetName, uploadedBy, mode, correlationId } = job.data;
    const attempt = (job.attemptsMade ?? 0) + 1;
    const maxAttempts = job.opts?.attempts ?? 3;

    this.structuredLogger.logJobStarted({
      queue: QUEUE_NAMES.DATASET_PROCESSING,
      jobId: job.id,
      jobName: job.name,
      correlationId,
      attempt,
      maxAttempts,
    });

    try {
      // 1. Read staged CSV text
      const csvText = await readStagedDataset(uploadId);

      // 2. Parse and map candidate rows using standard domain parser
      const rows = parseCSV(csvText);
      const candidates = rows.map(mapCandidateRow).filter((row) => row !== null);

      if (candidates.length === 0) {
        // Non-recoverable validation error — clean up staged file immediately
        await cleanupStagedFile(uploadId);
        throw new Error(
          'No valid candidate rows found. Ensure the CSV contains valid Name and Email headers.'
        );
      }

      // 3. Delegate to domain service for atomic transaction in PostgreSQL
      const result = await this.datasetsService.importDatasetAtomic({
        dataset_name: datasetName,
        uploaded_by: uploadedBy,
        mode,
        candidates,
      });

      // 4. Clean up staged file upon successful processing
      await cleanupStagedFile(uploadId);
      const durationMs = Date.now() - startTime;

      this.structuredLogger.logJobCompleted({
        queue: QUEUE_NAMES.DATASET_PROCESSING,
        jobId: job.id,
        jobName: job.name,
        correlationId,
        durationMs,
        attempt,
        maxAttempts,
      });

      return {
        datasetId: result.dataset_id,
        datasetName: result.dataset_name,
        mode: result.mode,
        totalCandidates: result.total_candidates,
        status: 'completed',
        correlationId,
        processedAt: new Date().toISOString(),
      };
    } catch (err) {
      const durationMs = Date.now() - startTime;

      // On final attempt (or if attempts limit reached), clean up staged file
      const attemptsLimit = job.opts?.attempts ?? 3;
      const isFinalAttempt = attempt >= attemptsLimit;
      if (isFinalAttempt) {
        await cleanupStagedFile(uploadId);
      }

      this.structuredLogger.logJobFailed({
        queue: QUEUE_NAMES.DATASET_PROCESSING,
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
    this.logger.log('Shutting down DatasetWorker...');
    if (this.worker) {
      await this.worker.close();
    }
    if (this.redisClient) {
      await this.redisClient.quit().catch(() => {});
    }
  }

  // Exposed for testing
  getWorkerInstance(): Worker<DatasetImportJobData, DatasetImportJobResult> | undefined {
    return this.worker;
  }
}
