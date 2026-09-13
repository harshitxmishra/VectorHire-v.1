import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  SupabaseCandidateRepository,
  CANDIDATE_DIRECTORY_COLUMNS,
} from './supabase-candidate-repository';
import { supabase } from '@/lib/supabase/client';

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('SupabaseCandidateRepository', () => {
  let repository: SupabaseCandidateRepository;

  const mockCandidate = {
    id: 1,
    full_name: 'John Doe',
    email: 'john@example.com',
    college: 'MIT',
    cgpa: 9.2,
    status: 'Screening',
    ai_score: 88,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new SupabaseCandidateRepository();
  });

  it('should find all candidates sorted by ai_score', async () => {
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [mockCandidate], error: null }),
    };
    (supabase.from as any).mockReturnValue(mockQuery);

    const result = await repository.findAll();
    expect(result).toEqual([mockCandidate]);
    expect(supabase.from).toHaveBeenCalledWith('candidates');
    expect(mockQuery.select).toHaveBeenCalledWith('*');
    expect(mockQuery.order).toHaveBeenCalledWith('ai_score', { ascending: false });
  });

  it('should find paginated candidates with explicit projection, search, filters, and deterministic sorting', async () => {
    const mockQuery: any = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({
        data: [mockCandidate],
        count: 1,
        error: null,
      }),
    };
    (supabase.from as any).mockReturnValue(mockQuery);

    const result = await repository.findPaginated({
      search: 'john',
      status: 'Screening',
      college: 'MIT',
      minScore: 80,
      sortBy: 'ai_score',
      sortOrder: 'desc',
      page: 1,
      limit: 20,
    });

    expect(result).toEqual({
      candidates: [mockCandidate],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });
    expect(mockQuery.select).toHaveBeenCalledWith(CANDIDATE_DIRECTORY_COLUMNS, { count: 'exact' });
    expect(mockQuery.eq).toHaveBeenCalledWith('status', 'Screening');
    expect(mockQuery.eq).toHaveBeenCalledWith('college', 'MIT');
    expect(mockQuery.gte).toHaveBeenCalledWith('ai_score', 80);
    expect(mockQuery.or).toHaveBeenCalled();
    expect(mockQuery.order).toHaveBeenCalledWith('ai_score', { ascending: false });
    expect(mockQuery.order).toHaveBeenCalledWith('id', { ascending: true });
    expect(mockQuery.range).toHaveBeenCalledWith(0, 19);
  });

  it('should find candidate by ID', async () => {
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: mockCandidate, error: null }),
    };
    (supabase.from as any).mockReturnValue(mockQuery);

    const result = await repository.findById(1);
    expect(result).toEqual(mockCandidate);
    expect(mockQuery.eq).toHaveBeenCalledWith('id', 1);
  });

  it('should find candidates by multiple IDs', async () => {
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({ data: [mockCandidate], error: null }),
    };
    (supabase.from as any).mockReturnValue(mockQuery);

    const result = await repository.findByIds([1]);
    expect(result).toEqual([mockCandidate]);
    expect(mockQuery.in).toHaveBeenCalledWith('id', [1]);
  });

  it('should create candidate', async () => {
    const mockQuery = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockCandidate, error: null }),
    };
    (supabase.from as any).mockReturnValue(mockQuery);

    const result = await repository.create({ full_name: 'John Doe', email: 'john@example.com' });
    expect(result).toEqual(mockCandidate);
  });

  it('should update candidate status', async () => {
    const mockQuery = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { ...mockCandidate, status: 'Interview Eligible' }, error: null }),
    };
    (supabase.from as any).mockReturnValue(mockQuery);

    const result = await repository.updateStatus(1, 'Interview Eligible');
    expect(result.status).toBe('Interview Eligible');
  });

  it('should bulk update candidate statuses via updateStatusMany', async () => {
    const mockQuery = {
      update: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      select: vi.fn().mockResolvedValue({
        data: [
          { ...mockCandidate, status: 'Shortlisted' },
          { id: 2, full_name: 'Jane Doe', status: 'Shortlisted' },
        ],
        error: null,
      }),
    };
    (supabase.from as any).mockReturnValue(mockQuery);

    const result = await repository.updateStatusMany([1, 2], 'Shortlisted');
    expect(result).toHaveLength(2);
    expect(result[0].status).toBe('Shortlisted');
    expect(mockQuery.in).toHaveBeenCalledWith('id', [1, 2]);
  });

  it('should delete candidate by ID', async () => {
    const mockQuery = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    };
    (supabase.from as any).mockReturnValue(mockQuery);

    await repository.delete(1);
    expect(mockQuery.eq).toHaveBeenCalledWith('id', 1);
  });

  it('should clear all candidates table', async () => {
    const mockQuery = {
      delete: vi.fn().mockReturnThis(),
      not: vi.fn().mockResolvedValue({ error: null }),
    };
    (supabase.from as any).mockReturnValue(mockQuery);

    await repository.deleteAll();
    expect(mockQuery.not).toHaveBeenCalledWith('id', 'is', null);
  });

  it('should throw error when database query fails', async () => {
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB connection error' } }),
    };
    (supabase.from as any).mockReturnValue(mockQuery);

    await expect(repository.findAll()).rejects.toThrow('Database error fetching candidates: DB connection error');
  });
});
