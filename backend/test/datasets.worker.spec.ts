import 'reflect-metadata';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DatasetWorker } from '../src/queue/dataset/dataset.worker';
import { DatasetsService } from '../src/datasets/datasets.service';
import { DatasetImportJobData } from '../src/queue/dataset/dataset.types';
import * as stagingUtil from '../src/datasets/dataset-staging.util';
import { Job } from 'bullmq';

// Mock redis client creation so tests do not attempt network connections
vi.mock('../src/queue/redis.config', () => ({
  createRedisClient: vi.fn(() => ({
    status: 'ready',
    on: vi.fn(),
    quit: vi.fn().mockResolvedValue('OK'),
  })),
}));

// Mock BullMQ Worker
vi.mock('bullmq', () => {
  return {
    Worker: vi.fn().mockImplementation((name, processor, opts) => {
      return {
        name,
        opts,
        processor,
        on: vi.fn(),
        close: vi.fn().mockResolvedValue(undefined),
      };
    }),
  };
});

describe('DatasetWorker', () => {
  let worker: DatasetWorker;
  let datasetsService: DatasetsService;

  const mockDatasetsService = {
    importDatasetAtomic: vi.fn(),
  };

  const sampleCsv = `Name,Email,College,CGPA,GitHub,Status
Alice Smith,alice@example.com,MIT,3.9,https://github.com/alicesmith,Applied
Bob Jones,bob@example.com,Stanford,3.8,https://github.com/bobjones,Applied`;

  beforeEach(() => {
    vi.clearAllMocks();
    datasetsService = mockDatasetsService as unknown as DatasetsService;
    worker = new DatasetWorker(datasetsService);
  });

  it('should initialize worker on module init with concurrency 5', () => {
    worker.onModuleInit();
    const workerInstance = worker.getWorkerInstance();

    expect(workerInstance).toBeDefined();
    expect(workerInstance?.name).toBe('dataset-processing-queue');
    expect(workerInstance?.opts?.concurrency).toBe(5);
  });

  it('should process job by reading staged CSV, parsing rows, delegating to atomic import, and cleaning up', async () => {
    worker.onModuleInit();

    const jobData: DatasetImportJobData = {
      uploadId: 'c28a964f-4eb8-42f7-b2f5-d018cb174824',
      datasetName: 'Batch 2026',
      uploadedBy: 'admin@vectorhire.io',
      mode: 'replace',
      correlationId: 'corr-data-1',
      enqueuedAt: Date.now(),
    };

    const mockJob = {
      id: 'job-dataset-100',
      data: jobData,
      opts: { attempts: 3 },
      attemptsMade: 1,
    } as unknown as Job;

    vi.spyOn(stagingUtil, 'readStagedDataset').mockResolvedValue(sampleCsv);
    const cleanupSpy = vi.spyOn(stagingUtil, 'cleanupStagedFile').mockResolvedValue();

    mockDatasetsService.importDatasetAtomic.mockResolvedValueOnce({
      dataset_id: 10,
      dataset_name: 'Batch 2026',
      mode: 'replace',
      total_candidates: 2,
      success: true,
    });

    const result = await worker.processJob(mockJob as any);

    expect(stagingUtil.readStagedDataset).toHaveBeenCalledWith('c28a964f-4eb8-42f7-b2f5-d018cb174824');
    expect(mockDatasetsService.importDatasetAtomic).toHaveBeenCalledWith(
      expect.objectContaining({
        dataset_name: 'Batch 2026',
        uploaded_by: 'admin@vectorhire.io',
        mode: 'replace',
        candidates: expect.arrayContaining([
          expect.objectContaining({
            full_name: 'Alice Smith',
            email: 'alice@example.com',
          }),
          expect.objectContaining({
            full_name: 'Bob Jones',
            email: 'bob@example.com',
          }),
        ]),
      })
    );
    expect(cleanupSpy).toHaveBeenCalledWith('c28a964f-4eb8-42f7-b2f5-d018cb174824');

    expect(result).toEqual({
      datasetId: 10,
      datasetName: 'Batch 2026',
      mode: 'replace',
      totalCandidates: 2,
      status: 'completed',
      correlationId: 'corr-data-1',
      processedAt: expect.any(String),
    });
  });

  it('should throw error and clean up staged file if CSV has no valid candidate rows', async () => {
    worker.onModuleInit();

    const emptyCsv = `InvalidHeader1,InvalidHeader2\nValue1,Value2`;
    vi.spyOn(stagingUtil, 'readStagedDataset').mockResolvedValue(emptyCsv);
    const cleanupSpy = vi.spyOn(stagingUtil, 'cleanupStagedFile').mockResolvedValue();

    const jobData: DatasetImportJobData = {
      uploadId: 'c28a964f-4eb8-42f7-b2f5-d018cb174824',
      datasetName: 'Empty Batch',
      uploadedBy: null,
      mode: 'append',
      correlationId: 'corr-data-2',
      enqueuedAt: Date.now(),
    };

    const mockJob = {
      id: 'job-dataset-101',
      data: jobData,
      opts: { attempts: 3 },
      attemptsMade: 1,
    } as unknown as Job;

    await expect(worker.processJob(mockJob as any)).rejects.toThrow(
      'No valid candidate rows found. Ensure the CSV contains valid Name and Email headers.'
    );

    expect(cleanupSpy).toHaveBeenCalledWith('c28a964f-4eb8-42f7-b2f5-d018cb174824');
    expect(mockDatasetsService.importDatasetAtomic).not.toHaveBeenCalled();
  });

  it('should rethrow error and preserve staged file if intermediate attempt fails so retry can succeed', async () => {
    worker.onModuleInit();

    vi.spyOn(stagingUtil, 'readStagedDataset').mockResolvedValue(sampleCsv);
    const cleanupSpy = vi.spyOn(stagingUtil, 'cleanupStagedFile').mockResolvedValue();
    mockDatasetsService.importDatasetAtomic.mockRejectedValueOnce(
      new Error('PostgreSQL transaction aborted: temporary lock contention')
    );

    const jobData: DatasetImportJobData = {
      uploadId: 'c28a964f-4eb8-42f7-b2f5-d018cb174824',
      datasetName: 'Failing Batch',
      uploadedBy: null,
      mode: 'append',
      correlationId: 'corr-data-3',
      enqueuedAt: Date.now(),
    };

    const mockJob = {
      id: 'job-dataset-102',
      data: jobData,
      opts: { attempts: 3 },
      attemptsMade: 1, // Intermediate attempt (1 < 3)
    } as unknown as Job;

    await expect(worker.processJob(mockJob as any)).rejects.toThrow(
      'PostgreSQL transaction aborted: temporary lock contention'
    );

    // Staged file should NOT be cleaned up so next attempt can read it
    expect(cleanupSpy).not.toHaveBeenCalled();
  });

  it('should clean up staged file if final attempt fails', async () => {
    worker.onModuleInit();

    vi.spyOn(stagingUtil, 'readStagedDataset').mockResolvedValue(sampleCsv);
    const cleanupSpy = vi.spyOn(stagingUtil, 'cleanupStagedFile').mockResolvedValue();
    mockDatasetsService.importDatasetAtomic.mockRejectedValueOnce(
      new Error('PostgreSQL transaction aborted: permanent constraint violation')
    );

    const jobData: DatasetImportJobData = {
      uploadId: 'c28a964f-4eb8-42f7-b2f5-d018cb174824',
      datasetName: 'Failing Batch',
      uploadedBy: null,
      mode: 'append',
      correlationId: 'corr-data-4',
      enqueuedAt: Date.now(),
    };

    const mockJob = {
      id: 'job-dataset-103',
      data: jobData,
      opts: { attempts: 3 },
      attemptsMade: 3, // Final attempt (3 >= 3)
    } as unknown as Job;

    await expect(worker.processJob(mockJob as any)).rejects.toThrow(
      'PostgreSQL transaction aborted: permanent constraint violation'
    );

    // Staged file should be cleaned up on final attempt failure
    expect(cleanupSpy).toHaveBeenCalledWith('c28a964f-4eb8-42f7-b2f5-d018cb174824');
  });

  it('should close worker and disconnect redis on shutdown', async () => {
    worker.onModuleInit();
    const workerInstance = worker.getWorkerInstance();

    await worker.onApplicationShutdown();
    expect(workerInstance?.close).toHaveBeenCalled();
  });
});
