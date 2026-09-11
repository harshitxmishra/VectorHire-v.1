import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SupabaseDatasetRepository } from './supabase-dataset-repository';
import { supabase } from '@/lib/supabase/client';

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('SupabaseDatasetRepository', () => {
  let repository: SupabaseDatasetRepository;

  const mockDataset = {
    id: 1,
    dataset_name: 'candidates-2026.csv',
    uploaded_by: 'recruiter@example.com',
    mode: 'append' as const,
    total_candidates: 45,
    created_at: '2026-09-11T10:00:00.000Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new SupabaseDatasetRepository();
  });

  it('should find all dataset uploads ordered by created_at descending', async () => {
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [mockDataset], error: null }),
    };
    (supabase.from as any).mockReturnValue(mockQuery);

    const result = await repository.findAll();
    expect(result).toEqual([mockDataset]);
    expect(supabase.from).toHaveBeenCalledWith('dataset_uploads');
    expect(mockQuery.select).toHaveBeenCalledWith('*');
    expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false });
  });

  it('should find dataset upload by id', async () => {
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: mockDataset, error: null }),
    };
    (supabase.from as any).mockReturnValue(mockQuery);

    const result = await repository.findById(1);
    expect(result).toEqual(mockDataset);
    expect(supabase.from).toHaveBeenCalledWith('dataset_uploads');
    expect(mockQuery.eq).toHaveBeenCalledWith('id', 1);
  });

  it('should return null when dataset upload is not found by id', async () => {
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    };
    (supabase.from as any).mockReturnValue(mockQuery);

    const result = await repository.findById(999);
    expect(result).toBeNull();
  });

  it('should create a dataset upload record', async () => {
    const mockQuery = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockDataset, error: null }),
    };
    (supabase.from as any).mockReturnValue(mockQuery);

    const input = {
      dataset_name: 'candidates-2026.csv',
      uploaded_by: 'recruiter@example.com',
      mode: 'append' as const,
      total_candidates: 45,
    };

    const result = await repository.create(input);
    expect(result).toEqual(mockDataset);
    expect(supabase.from).toHaveBeenCalledWith('dataset_uploads');
    expect(mockQuery.insert).toHaveBeenCalledWith(input);
  });

  it('should throw error when database query fails', async () => {
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB connection error' } }),
    };
    (supabase.from as any).mockReturnValue(mockQuery);

    await expect(repository.findAll()).rejects.toThrow(
      'Database error fetching dataset uploads: DB connection error'
    );
  });
});
