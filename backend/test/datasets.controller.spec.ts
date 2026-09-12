import 'reflect-metadata';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DatasetsController } from '../src/datasets/datasets.controller';
import { DatasetsService } from '../src/datasets/datasets.service';
import { QueueService } from '../src/queue/queue.service';
import { DatasetUpload } from '@/lib/types';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import * as stagingUtil from '../src/datasets/dataset-staging.util';

describe('DatasetsController', () => {
  let controller: DatasetsController;
  let service: DatasetsService;
  let queueService: QueueService;

  const mockDatasets: DatasetUpload[] = [
    {
      id: 1,
      dataset_name: 'candidates-2026.csv',
      uploaded_by: 'Admin',
      mode: 'append',
      total_candidates: 50,
      created_at: '2026-09-11T10:00:00.000Z',
    },
  ];

  const mockService = {
    getDatasets: vi.fn().mockResolvedValue(mockDatasets),
  };

  const mockQueueService = {
    enqueueDatasetImport: vi.fn().mockResolvedValue({ id: 'job-dataset-123' }),
    getDatasetJobStatus: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    service = mockService as unknown as DatasetsService;
    queueService = mockQueueService as unknown as QueueService;
    controller = new DatasetsController(service, queueService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return dataset uploads (GET /api/v1/datasets)', async () => {
    const result = await controller.getDatasets();
    expect(result).toEqual(mockDatasets);
    expect(service.getDatasets).toHaveBeenCalled();
  });

  describe('importDataset (POST /api/v1/datasets/import)', () => {
    it('should throw BadRequestException if no file is uploaded', async () => {
      await expect(controller.importDataset(undefined)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if file is not CSV/text', async () => {
      const invalidFile = {
        fieldname: 'file',
        originalname: 'image.png',
        encoding: '7bit',
        mimetype: 'image/png',
        size: 100,
        buffer: Buffer.from('fake image content'),
      };

      await expect(controller.importDataset(invalidFile)).rejects.toThrow(BadRequestException);
    });

    it('should stage file, enqueue job, and return 202 with jobId on valid CSV', async () => {
      const validFile = {
        fieldname: 'file',
        originalname: 'candidates.csv',
        encoding: '7bit',
        mimetype: 'text/csv',
        size: 100,
        buffer: Buffer.from('Name,Email\nAlice,alice@example.com'),
      };

      vi.spyOn(stagingUtil, 'stageDatasetFile').mockResolvedValue('/tmp/upload_123.csv');

      const result = await controller.importDataset(
        validFile,
        'replace',
        'Batch 2026',
        'admin@vectorhire.io'
      );

      expect(result).toEqual({
        jobId: 'job-dataset-123',
        status: 'queued',
        correlationId: expect.any(String),
      });

      expect(stagingUtil.stageDatasetFile).toHaveBeenCalled();
      expect(queueService.enqueueDatasetImport).toHaveBeenCalledWith(
        expect.objectContaining({
          datasetName: 'Batch 2026',
          uploadedBy: 'admin@vectorhire.io',
          mode: 'replace',
          correlationId: expect.any(String),
        })
      );
    });

    it('should clean up staged file if enqueueing fails', async () => {
      const validFile = {
        fieldname: 'file',
        originalname: 'candidates.csv',
        encoding: '7bit',
        mimetype: 'text/csv',
        size: 100,
        buffer: Buffer.from('Name,Email\nAlice,alice@example.com'),
      };

      vi.spyOn(stagingUtil, 'stageDatasetFile').mockResolvedValue('/tmp/upload_123.csv');
      const cleanupSpy = vi.spyOn(stagingUtil, 'cleanupStagedFile').mockResolvedValue();
      mockQueueService.enqueueDatasetImport.mockRejectedValueOnce(new Error('Redis connection refused'));

      await expect(controller.importDataset(validFile)).rejects.toThrow('Redis connection refused');
      expect(cleanupSpy).toHaveBeenCalled();
    });
  });

  describe('getJobStatus (GET /api/v1/datasets/jobs/:jobId)', () => {
    it('should return job status if found', async () => {
      mockQueueService.getDatasetJobStatus.mockResolvedValueOnce({
        jobId: 'job-dataset-123',
        state: 'completed',
        result: {
          datasetId: 5,
          datasetName: 'Test Dataset',
          mode: 'append',
          totalCandidates: 25,
          status: 'completed',
          correlationId: 'corr-1',
          processedAt: '2026-09-12T10:00:00.000Z',
        },
      });

      const result = await controller.getJobStatus('job-dataset-123');
      expect(result.state).toBe('completed');
      expect(result.result?.totalCandidates).toBe(25);
    });

    it('should throw NotFoundException if job not found', async () => {
      mockQueueService.getDatasetJobStatus.mockResolvedValueOnce(null);
      await expect(controller.getJobStatus('job-unknown')).rejects.toThrow(NotFoundException);
    });
  });
});
