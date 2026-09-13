import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DatasetsService } from '../../src/datasets/datasets.service';
import { DatasetWorker } from '../../src/queue/dataset/dataset.worker';
import { DatasetRepository } from '@/lib/repositories/dataset-repository';
import { CandidateRepository } from '@/lib/repositories/candidate-repository';
import { Job } from 'bullmq';
import * as stagingUtil from '../../src/datasets/dataset-staging.util';

describe('Atomic Dataset Import Integration Boundary', () => {
  let datasetsService: DatasetsService;
  let mockDatasetRepo: {
    findAll: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    importAtomic: ReturnType<typeof vi.fn>;
  };
  let mockCandidateRepo: {
    deleteAll: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockDatasetRepo = {
      findAll: vi.fn(),
      create: vi.fn(),
      importAtomic: vi.fn(),
    };
    mockCandidateRepo = {
      deleteAll: vi.fn(),
    };
    datasetsService = new DatasetsService(
      mockDatasetRepo as unknown as DatasetRepository,
      mockCandidateRepo as unknown as CandidateRepository,
    );
  });

  describe('DatasetsService Atomic Contract', () => {
    it('executes atomic import in replace mode and receives audit record confirmation', async () => {
      const candidatesPayload = [
        {
          full_name: 'Elena Rostova',
          email: 'elena@example.com',
          college: 'Stanford',
          cgpa: 3.95,
          branch: 'CS',
        },
        {
          full_name: 'Marcus Vance',
          email: 'marcus@example.com',
          college: 'Berkeley',
          cgpa: 3.8,
          branch: 'EECS',
        },
      ];

      mockDatasetRepo.importAtomic.mockResolvedValue({
        dataset_id: 105,
        dataset_name: 'Fall 2026 Batch',
        mode: 'replace',
        total_candidates: 2,
        success: true,
      });

      const result = await datasetsService.importDatasetAtomic({
        dataset_name: 'Fall 2026 Batch',
        uploaded_by: 'admin@vectorhire.ai',
        mode: 'replace',
        candidates: candidatesPayload as any,
      });

      expect(result.dataset_id).toBe(105);
      expect(result.mode).toBe('replace');
      expect(result.total_candidates).toBe(2);
      expect(result.success).toBe(true);
      expect(mockDatasetRepo.importAtomic).toHaveBeenCalledWith(
        expect.objectContaining({
          dataset_name: 'Fall 2026 Batch',
          mode: 'replace',
          candidates: candidatesPayload,
        }),
      );
    });

    it('executes atomic import in append mode without purging existing candidates', async () => {
      mockDatasetRepo.importAtomic.mockResolvedValue({
        dataset_id: 106,
        dataset_name: 'Spring 2027 Expansion',
        mode: 'append',
        total_candidates: 1,
        success: true,
      });

      const result = await datasetsService.importDatasetAtomic({
        dataset_name: 'Spring 2027 Expansion',
        uploaded_by: 'hr@vectorhire.ai',
        mode: 'append',
        candidates: [{ full_name: 'John Doe', email: 'john@example.com' }] as any,
      });

      expect(result.mode).toBe('append');
      expect(mockCandidateRepo.deleteAll).not.toHaveBeenCalled();
    });
  });

  describe('DatasetWorker ↔ DatasetsService End-to-End Execution Flow', () => {
    it('stages CSV, parses candidate rows, delegates to atomic import, and cleans up staged file', async () => {
      const sampleCsv = `Name,Email,College,CGPA,Branch\nAlice Smith,alice@example.com,MIT,4.0,Computer Science\nBob Jones,bob@example.com,Caltech,3.85,Physics`;

      vi.spyOn(stagingUtil, 'readStagedDataset').mockResolvedValue(sampleCsv);
      const cleanupSpy = vi.spyOn(stagingUtil, 'cleanupStagedFile').mockResolvedValue();

      mockDatasetRepo.importAtomic.mockResolvedValue({
        dataset_id: 200,
        dataset_name: 'Campus Recruits',
        mode: 'replace',
        total_candidates: 2,
        success: true,
      });

      const worker = new DatasetWorker(datasetsService);
      const mockJob = {
        id: 'job-dataset-100',
        name: 'dataset-processing-job',
        data: {
          uploadId: 'upload-uuid-123',
          datasetName: 'Campus Recruits',
          uploadedBy: 'recruiter@vectorhire.ai',
          mode: 'replace' as const,
          correlationId: 'corr-dataset-100',
        },
        attemptsMade: 0,
        opts: { attempts: 3 },
      } as unknown as Job;

      const result = await worker.processJob(mockJob as any);

      expect(result.datasetId).toBe(200);
      expect(result.totalCandidates).toBe(2);
      expect(result.status).toBe('completed');
      expect(cleanupSpy).toHaveBeenCalledWith('upload-uuid-123');
    });

    it('rejects empty CSV and cleans up staged file immediately without database mutation', async () => {
      const invalidCsv = `InvalidHeader1,InvalidHeader2\nValue1,Value2`;

      vi.spyOn(stagingUtil, 'readStagedDataset').mockResolvedValue(invalidCsv);
      const cleanupSpy = vi.spyOn(stagingUtil, 'cleanupStagedFile').mockResolvedValue();

      const worker = new DatasetWorker(datasetsService);
      const mockJob = {
        id: 'job-dataset-101',
        name: 'dataset-processing-job',
        data: {
          uploadId: 'upload-invalid-uuid',
          datasetName: 'Empty Upload',
          uploadedBy: 'user@vectorhire.ai',
          mode: 'append' as const,
          correlationId: 'corr-dataset-101',
        },
        attemptsMade: 0,
        opts: { attempts: 3 },
      } as unknown as Job;

      await expect(worker.processJob(mockJob as any)).rejects.toThrow(/No valid candidate rows found/);
      expect(cleanupSpy).toHaveBeenCalledWith('upload-invalid-uuid');
      expect(mockDatasetRepo.importAtomic).not.toHaveBeenCalled();
    });
  });
});
