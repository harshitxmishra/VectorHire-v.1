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

  const mockJoinedMatchResult = {
    ...mockMatchResult,
    candidate: {
      id: 10,
      full_name: 'John Doe',
      email: 'john@example.com',
      college: 'Stanford University',
      branch: 'Computer Science',
      status: 'screened',
      ai_score: 92,
      resume_url: 'https://storage/resume.pdf',
      github: 'https://github.com/johndoe',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new SupabaseJobMatchRepository();
  });

  it('should find job matches by job description ID ordered by match_percentage descending and id ascending', async () => {
    const mockQuery: any = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockImplementation(() => mockQuery),
    };
    mockQuery.then = (resolve: any) => resolve({ data: [mockMatchResult], error: null });

    (supabase.from as any).mockReturnValue(mockQuery);

    const result = await repository.findByJobDescriptionId(2);
    expect(result).toEqual([mockMatchResult]);
    expect(supabase.from).toHaveBeenCalledWith('job_match_results');
    expect(mockQuery.select).toHaveBeenCalledWith(
      'id, created_at, candidate_id, job_description_id, match_percentage, matched_skills, missing_skills, experience_match, education_match, recommendation, evaluated_at'
    );
    expect(mockQuery.eq).toHaveBeenCalledWith('job_description_id', 2);
    expect(mockQuery.order).toHaveBeenCalledWith('match_percentage', { ascending: false });
    expect(mockQuery.order).toHaveBeenCalledWith('id', { ascending: true });
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
    const mockQuery: any = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockImplementation(() => mockQuery),
    };
    mockQuery.then = (resolve: any) => resolve({ data: null, error: { message: 'Database connection failed' } });

    (supabase.from as any).mockReturnValue(mockQuery);

    await expect(repository.findByJobDescriptionId(2)).rejects.toThrow(
      'Database error fetching job matches for JD 2: Database connection failed'
    );
  });

  describe('findPaginatedByJobId', () => {
    it('should compute whole-dataset metrics across all matches and return paginated page with candidate count', async () => {
      // Mock metrics query (all matches for JD 2)
      const mockMetricsQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: [
            { match_percentage: 88 },
            { match_percentage: 82 },
            { match_percentage: 70 },
            { match_percentage: 60 },
          ],
          error: null,
        }),
      };

      // Mock candidate count query
      const mockCandidateCountQuery = {
        select: vi.fn().mockResolvedValue({
          count: 50,
          error: null,
        }),
      };

      // Mock paginated matches query
      const mockMainQuery: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockImplementation(() => mockMainQuery),
        range: vi.fn().mockResolvedValue({
          data: [mockJoinedMatchResult],
          count: 4,
          error: null,
        }),
      };

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'candidates') {
          return mockCandidateCountQuery;
        }
        // For job_match_results, alternate or distinguish based on calls
        return {
          select: vi.fn((sel: string, opts?: any) => {
            if (sel === 'match_percentage') {
              return mockMetricsQuery;
            }
            return mockMainQuery;
          }),
        };
      });

      const result = await repository.findPaginatedByJobId(2, {
        page: 1,
        limit: 25,
        sortBy: 'match_percentage',
        sortOrder: 'desc',
      });

      expect(result.matches).toEqual([mockJoinedMatchResult]);
      expect(result.total).toBe(4);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(25);
      expect(result.totalPages).toBe(1);
      expect(result.candidateCount).toBe(50);
      expect(result.totalMatchesForJob).toBe(4);
      // Whole-dataset metrics:
      // totalMatches = 4
      // highMatchCount (>= 80) = 2 (88 and 82)
      // averageMatchScore = (88 + 82 + 70 + 60) / 4 = 75
      expect(result.metrics.totalMatches).toBe(4);
      expect(result.metrics.highMatchCount).toBe(2);
      expect(result.metrics.averageMatchScore).toBe(75);
    });

    it('should correctly handle filters (minScore, status, college, search)', async () => {
      const mockMetricsQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: [{ match_percentage: 95 }],
          error: null,
        }),
      };

      const mockCandidateCountQuery = {
        select: vi.fn().mockResolvedValue({ count: 10, error: null }),
      };

      const mockMainQuery: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        order: vi.fn().mockImplementation(() => mockMainQuery),
        range: vi.fn().mockResolvedValue({
          data: [mockJoinedMatchResult],
          count: 1,
          error: null,
        }),
      };

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'candidates') return mockCandidateCountQuery;
        return {
          select: vi.fn((sel: string) => {
            if (sel === 'match_percentage') return mockMetricsQuery;
            return mockMainQuery;
          }),
        };
      });

      const result = await repository.findPaginatedByJobId(2, {
        page: 1,
        limit: 10,
        minScore: 80,
        status: 'screened',
        college: 'Stanford',
        search: 'John',
      });

      expect(mockMainQuery.gte).toHaveBeenCalledWith('match_percentage', 80);
      expect(mockMainQuery.eq).toHaveBeenCalledWith('candidates.status', 'screened');
      expect(mockMainQuery.eq).toHaveBeenCalledWith('candidates.college', 'Stanford');
      expect(mockMainQuery.or).toHaveBeenCalledWith(
        'full_name.ilike.%John%,email.ilike.%John%,college.ilike.%John%,branch.ilike.%John%',
        { foreignTable: 'candidates' }
      );
      expect(result.matches).toHaveLength(1);
    });

    it('should handle zero matches state cleanly with null average', async () => {
      const mockMetricsQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      const mockCandidateCountQuery = {
        select: vi.fn().mockResolvedValue({ count: 25, error: null }),
      };

      const mockMainQuery: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockImplementation(() => mockMainQuery),
        range: vi.fn().mockResolvedValue({
          data: [],
          count: 0,
          error: null,
        }),
      };

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'candidates') return mockCandidateCountQuery;
        return {
          select: vi.fn((sel: string) => {
            if (sel === 'match_percentage') return mockMetricsQuery;
            return mockMainQuery;
          }),
        };
      });

      const result = await repository.findPaginatedByJobId(2, { page: 1, limit: 25 });
      expect(result.matches).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.candidateCount).toBe(25);
      expect(result.totalMatchesForJob).toBe(0);
      expect(result.metrics.totalMatches).toBe(0);
      expect(result.metrics.highMatchCount).toBe(0);
      expect(result.metrics.averageMatchScore).toBeNull();
    });
  });
});
