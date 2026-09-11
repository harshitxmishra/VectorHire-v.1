import 'reflect-metadata';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DatasetsService } from '../src/datasets/datasets.service';
import { InternalServerErrorException } from '@nestjs/common';
import { DatasetUpload } from '@/lib/types';

describe('DatasetsService', () => {
  let service: DatasetsService;
  let mockDatasetRepo: any;
  let mockCandidateRepo: any;

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

  beforeEach(() => {
    vi.clearAllMocks();

    mockDatasetRepo = {
      findAll: vi.fn().mockResolvedValue(mockDatasets),
      findById: vi.fn().mockResolvedValue(mockDatasets[0]),
      create: vi.fn().mockResolvedValue(mockDatasets[0]),
    };

    mockCandidateRepo = {
      deleteAll: vi.fn().mockResolvedValue(undefined),
    };

    service = new DatasetsService(mockDatasetRepo, mockCandidateRepo);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return dataset uploads from repository', async () => {
    const result = await service.getDatasets();
    expect(result).toEqual(mockDatasets);
    expect(mockDatasetRepo.findAll).toHaveBeenCalled();
  });

  it('should record dataset upload via repository', async () => {
    const input = {
      dataset_name: 'candidates-2026.csv',
      uploaded_by: 'Admin',
      mode: 'append' as const,
      total_candidates: 50,
    };

    const result = await service.recordUpload(input);
    expect(result).toEqual(mockDatasets[0]);
    expect(mockDatasetRepo.create).toHaveBeenCalledWith(input);
  });

  it('should clear candidates via candidate repository', async () => {
    await service.clearCandidates();
    expect(mockCandidateRepo.deleteAll).toHaveBeenCalled();
  });

  it('should throw InternalServerErrorException if getDatasets fails', async () => {
    mockDatasetRepo.findAll.mockRejectedValue(new Error('DB read error'));
    await expect(service.getDatasets()).rejects.toThrow(InternalServerErrorException);
  });

  it('should throw InternalServerErrorException if recordUpload fails', async () => {
    mockDatasetRepo.create.mockRejectedValue(new Error('DB insert error'));
    await expect(
      service.recordUpload({
        dataset_name: 'candidates.csv',
        uploaded_by: null,
        mode: 'append',
        total_candidates: 10,
      })
    ).rejects.toThrow(InternalServerErrorException);
  });

  it('should throw InternalServerErrorException if clearCandidates fails', async () => {
    mockCandidateRepo.deleteAll.mockRejectedValue(new Error('DB delete error'));
    await expect(service.clearCandidates()).rejects.toThrow(InternalServerErrorException);
  });
});
