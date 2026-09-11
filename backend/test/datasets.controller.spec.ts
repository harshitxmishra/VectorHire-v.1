import 'reflect-metadata';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DatasetsController } from '../src/datasets/datasets.controller';
import { DatasetsService } from '../src/datasets/datasets.service';
import { DatasetUpload } from '@/lib/types';

describe('DatasetsController', () => {
  let controller: DatasetsController;
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

  const mockService = {
    getDatasets: vi.fn().mockResolvedValue(mockDatasets),
  };

  beforeEach(() => {
    service = mockService as unknown as DatasetsService;
    controller = new DatasetsController(service);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return dataset uploads (GET /api/v1/datasets)', async () => {
    const result = await controller.getDatasets();
    expect(result).toEqual(mockDatasets);
    expect(service.getDatasets).toHaveBeenCalled();
  });
});
