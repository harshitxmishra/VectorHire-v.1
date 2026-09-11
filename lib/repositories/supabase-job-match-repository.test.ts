import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SupabaseJobMatchRepository } from './supabase-job-match-repository';
import { supabase } from '@/lib/supabase/client';

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('SupabaseJobMatchRepository', () => {
  let repository: SupabaseJobMatchRepository;

  const mockMatchResult = {
    id: 1,
    candidate_id: 10,
    job_description_id: 2,
    match_percentage: 88,
    matched_skills: ['TypeScript', 'Node.js'],
    missing_skills: ['Docker'],
    experience_match: 'Strong backend experience',
    education_match: 'CS Degree',
    recommendation: 'Proceed to interview',
    evaluated_at: '2026-09-11T10:00:00.000Z',
    created_at: '2026-09-11T10:00:00.000Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new SupabaseJobMatchRepository();
  });

  it('should find job matches by job description ID ordered by match_percentage descending', async () => {
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [mockMatchResult], error: null }),
    };
    (supabase.from as any).mockReturnValue(mockQuery);

    const result = await repository.findByJobDescriptionId(2);
    expect(result).toEqual([mockMatchResult]);
    expect(supabase.from).toHaveBeenCalledWith('job_match_results');
    expect(mockQuery.select).toHaveBeenCalledWith('*');
    expect(mockQuery.eq).toHaveBeenCalledWith('job_description_id', 2);
    expect(mockQuery.order).toHaveBeenCalledWith('match_percentage', { ascending: false });
  });

  it('should find best scores per candidate', async () => {
    const mockRows = [
      { candidate_id: 10, match_percentage: 75 },
      { candidate_id: 10, match_percentage: 90 },
      { candidate_id: 20, match_percentage: 80 },
    ];
    const mockQuery = {
      select: vi.fn().mockResolvedValue({ data: mockRows, error: null }),
    };
    (supabase.from as any).mockReturnValue(mockQuery);

    const result = await repository.findBestScoresPerCandidate();
    expect(result).toEqual({ 10: 90, 20: 80 });
    expect(supabase.from).toHaveBeenCalledWith('job_match_results');
    expect(mockQuery.select).toHaveBeenCalledWith('candidate_id, match_percentage');
  });

  it('should upsert a job match evaluation', async () => {
    const mockQuery = {
      upsert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockMatchResult, error: null }),
    };
    (supabase.from as any).mockReturnValue(mockQuery);

    const input = {
      candidate_id: 10,
      job_description_id: 2,
      match_percentage: 88,
      matched_skills: ['TypeScript', 'Node.js'],
      missing_skills: ['Docker'],
      experience_match: 'Strong backend experience',
      education_match: 'CS Degree',
      recommendation: 'Proceed to interview',
    };

    const result = await repository.upsert(input);
    expect(result).toEqual(mockMatchResult);
    expect(supabase.from).toHaveBeenCalledWith('job_match_results');
    expect(mockQuery.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        candidate_id: 10,
        job_description_id: 2,
        match_percentage: 88,
      }),
      { onConflict: 'candidate_id,job_description_id' }
    );
  });

  it('should throw error when query fails', async () => {
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error: { message: 'Database connection failed' } }),
    };
    (supabase.from as any).mockReturnValue(mockQuery);

    await expect(repository.findByJobDescriptionId(2)).rejects.toThrow(
      'Database error fetching job matches for JD 2: Database connection failed'
    );
  });
});
