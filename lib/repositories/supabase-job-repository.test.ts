import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SupabaseJobRepository } from './supabase-job-repository';
import { supabase } from '@/lib/supabase/client';

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('SupabaseJobRepository', () => {
  let repository: SupabaseJobRepository;

  const mockJob = {
    id: 1,
    created_at: '2026-09-11T10:00:00.000Z',
    updated_at: '2026-09-11T10:00:00.000Z',
    title: 'Senior Frontend Engineer',
    requirements: 'React, TypeScript, CSS',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new SupabaseJobRepository();
  });

  it('should find all job descriptions', async () => {
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [mockJob], error: null }),
    };
    (supabase.from as any).mockReturnValue(mockQuery);

    const result = await repository.findAll();
    expect(result).toEqual([mockJob]);
    expect(supabase.from).toHaveBeenCalledWith('job_descriptions');
    expect(mockQuery.select).toHaveBeenCalledWith('*');
    expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false });
  });

  it('should find job description by ID', async () => {
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: mockJob, error: null }),
    };
    (supabase.from as any).mockReturnValue(mockQuery);

    const result = await repository.findById(1);
    expect(result).toEqual(mockJob);
    expect(mockQuery.eq).toHaveBeenCalledWith('id', 1);
  });

  it('should create job description', async () => {
    const mockQuery = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockJob, error: null }),
    };
    (supabase.from as any).mockReturnValue(mockQuery);

    const result = await repository.create({
      title: 'Senior Frontend Engineer',
      requirements: 'React, TypeScript, CSS',
    });
    expect(result).toEqual(mockJob);
  });

  it('should update job description', async () => {
    const mockQuery = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { ...mockJob, title: 'Lead Frontend' }, error: null }),
    };
    (supabase.from as any).mockReturnValue(mockQuery);

    const result = await repository.update(1, { title: 'Lead Frontend' });
    expect(result.title).toBe('Lead Frontend');
  });

  it('should delete job description by ID', async () => {
    const mockQuery = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    };
    (supabase.from as any).mockReturnValue(mockQuery);

    await repository.delete(1);
    expect(mockQuery.eq).toHaveBeenCalledWith('id', 1);
  });

  it('should throw error when database query fails', async () => {
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB connection error' } }),
    };
    (supabase.from as any).mockReturnValue(mockQuery);

    await expect(repository.findAll()).rejects.toThrow('Database error fetching job descriptions: DB connection error');
  });
});
