import 'reflect-metadata';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DatasetsService } from '../src/datasets/datasets.service';
import * as datasetService from '@/lib/services/dataset-service';
import { InternalServerErrorException } from '@nestjs/common';
import { DatasetUpload } from '@/lib/types';

vi.mock('@/lib/services/dataset-service', () => ({
  getDatasetUploads: vi.fn(),
  recordDatasetUpload: vi.fn(),
  deleteAllCandidates: vi.fn(),
}));

describe('DatasetsService', () => {
  let service: DatasetsService;

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
    service = new DatasetsService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return dataset uploads', async () => {
    (datasetService.getDatasetUploads as any).mockResolvedValue(mockDatasets);

    const result = await service.getDatasets();
    expect(result).toEqual(mockDatasets);
    expect(datasetService.getDatasetUploads).toHaveBeenCalled();
  });

  it('should throw InternalServerErrorException if getDatasetUploads fails', async () => {
    (datasetService.getDatasetUploads as any).mockRejectedValue(new Error('DB read error'));

    await expect(service.getDatasets()).rejects.toThrow(InternalServerErrorException);
  });
});
