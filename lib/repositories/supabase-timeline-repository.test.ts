import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SupabaseTimelineRepository } from './supabase-timeline-repository';
import { supabase } from '@/lib/supabase/client';

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('SupabaseTimelineRepository', () => {
  let repository: SupabaseTimelineRepository;

  const mockTimelineEvent = {
    id: 1,
    candidate_id: 10,
    event_type: 'applied',
    details: 'Candidate profile created',
    created_at: '2026-09-11T10:00:00.000Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new SupabaseTimelineRepository();
  });

  it('should find timeline events by candidate ID ordered by created_at ascending', async () => {
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [mockTimelineEvent], error: null }),
    };
    (supabase.from as any).mockReturnValue(mockQuery);

    const result = await repository.findByCandidateId(10);
    expect(result).toEqual([mockTimelineEvent]);
    expect(supabase.from).toHaveBeenCalledWith('candidate_timeline');
    expect(mockQuery.select).toHaveBeenCalledWith('*');
    expect(mockQuery.eq).toHaveBeenCalledWith('candidate_id', 10);
    expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: true });
  });

  it('should create and append a timeline event', async () => {
    const mockQuery = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockTimelineEvent, error: null }),
    };
    (supabase.from as any).mockReturnValue(mockQuery);

    const input = {
      candidate_id: 10,
      event_type: 'applied',
      details: 'Candidate profile created',
    };
    const result = await repository.create(input);
    expect(result).toEqual(mockTimelineEvent);
    expect(mockQuery.insert).toHaveBeenCalledWith({
      candidate_id: 10,
      event_type: 'applied',
      details: 'Candidate profile created',
    });
  });

  it('should find distinct candidate IDs by event type', async () => {
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: [{ candidate_id: 10 }, { candidate_id: 20 }], error: null }),
    };
    (supabase.from as any).mockReturnValue(mockQuery);

    const result = await repository.findDistinctCandidateIdsByEventType('assessment_sent');
    expect(result).toEqual([10, 20]);
    expect(mockQuery.eq).toHaveBeenCalledWith('event_type', 'assessment_sent');
  });

  it('should find recent timeline events with candidate relation ordered descending', async () => {
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [{ ...mockTimelineEvent, candidates: { full_name: 'Test Candidate', email: 'test@example.com' } }],
        error: null,
      }),
    };
    (supabase.from as any).mockReturnValue(mockQuery);

    const result = await repository.findRecent(15);
    expect(result).toHaveLength(1);
    expect(result[0].candidates?.full_name).toBe('Test Candidate');
    expect(supabase.from).toHaveBeenCalledWith('candidate_timeline');
    expect(mockQuery.select).toHaveBeenCalledWith('*, candidates:candidate_id(full_name, email)');
    expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(mockQuery.limit).toHaveBeenCalledWith(15);
  });

  it('should throw error when database query fails', async () => {
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error: { message: 'Query failed' } }),
    };
    (supabase.from as any).mockReturnValue(mockQuery);

    await expect(repository.findByCandidateId(10)).rejects.toThrow('Database error fetching timeline for candidate 10: Query failed');
  });
});
