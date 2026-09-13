import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SupabaseDatasetRepository } from './supabase-dataset-repository';
import { supabase } from '@/lib/supabase/client';

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
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

  const mockCandidate = {
    full_name: 'Alice Johnson',
    email: 'alice@example.com',
    college: 'MIT',
    cgpa: 3.9,
    status: 'Applied',
    ai_score: 88,
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

  it('should execute atomic dataset import in replace mode via RPC', async () => {
    const mockRpcResult = {
      dataset_id: 10,
      dataset_name: 'candidates-2026.csv',
      mode: 'replace',
      total_candidates: 1,
      success: true,
    };
    (supabase.rpc as any).mockResolvedValue({ data: mockRpcResult, error: null });

    const input = {
      dataset_name: 'candidates-2026.csv',
      uploaded_by: 'admin@example.com',
      mode: 'replace' as const,
      candidates: [mockCandidate],
    };

    const result = await repository.importAtomic(input);
    expect(result).toEqual(mockRpcResult);
    expect(supabase.rpc).toHaveBeenCalledWith('import_dataset_atomic', {
      p_dataset_name: 'candidates-2026.csv',
      p_uploaded_by: 'admin@example.com',
      p_mode: 'replace',
      p_candidates: [mockCandidate],
    });
  });

  it('should execute atomic dataset import in append mode via RPC', async () => {
    const mockRpcResult = {
      dataset_id: 11,
      dataset_name: 'batch-2.csv',
      mode: 'append',
      total_candidates: 1,
      success: true,
    };
    (supabase.rpc as any).mockResolvedValue({ data: mockRpcResult, error: null });

    const input = {
      dataset_name: 'batch-2.csv',
      uploaded_by: null,
      mode: 'append' as const,
      candidates: [mockCandidate],
    };

    const result = await repository.importAtomic(input);
    expect(result).toEqual(mockRpcResult);
    expect(supabase.rpc).toHaveBeenCalledWith('import_dataset_atomic', {
      p_dataset_name: 'batch-2.csv',
      p_uploaded_by: null,
      p_mode: 'append',
      p_candidates: [mockCandidate],
    });
  });

  it('should throw error on atomic import when candidates list is empty', async () => {
    await expect(
      repository.importAtomic({
        dataset_name: 'empty.csv',
        uploaded_by: null,
        mode: 'replace',
        candidates: [],
      })
    ).rejects.toThrow('Candidates list cannot be empty for atomic import');
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it('should throw and propagate database error on atomic import failure/rollback', async () => {
    (supabase.rpc as any).mockResolvedValue({
      data: null,
      error: { message: 'check constraint violation: invalid status' },
    });

    await expect(
      repository.importAtomic({
        dataset_name: 'invalid.csv',
        uploaded_by: null,
        mode: 'replace',
        candidates: [mockCandidate],
      })
    ).rejects.toThrow('Database error during atomic dataset import: check constraint violation: invalid status');
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
