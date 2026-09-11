import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SupabaseInterviewRepository } from './supabase-interview-repository';
import { supabase } from '@/lib/supabase/client';

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('SupabaseInterviewRepository', () => {
  let repository: SupabaseInterviewRepository;

  const mockInterview = {
    id: 1,
    candidate_id: 10,
    interviewer_name: 'Sarah Chen',
    scheduled_date: '2026-09-15T14:00:00.000Z',
    duration_minutes: 45,
    status: 'scheduled' as const,
    calendar_event_id: 'cal-123',
    meet_link: 'https://meet.google.com/abc-defg-hij',
    candidates: { full_name: 'Alice Johnson', email: 'alice@example.com' },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new SupabaseInterviewRepository();
  });

  it('should find all interviews ordered by scheduled_date', async () => {
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [mockInterview], error: null }),
    };
    (supabase.from as any).mockReturnValue(mockQuery);

    const result = await repository.findAll();
    expect(result).toEqual([mockInterview]);
    expect(supabase.from).toHaveBeenCalledWith('interviews');
    expect(mockQuery.select).toHaveBeenCalledWith('*, candidates(full_name, email)');
    expect(mockQuery.order).toHaveBeenCalledWith('scheduled_date', { ascending: true });
  });

  it('should find interview by ID', async () => {
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: mockInterview, error: null }),
    };
    (supabase.from as any).mockReturnValue(mockQuery);

    const result = await repository.findById(1);
    expect(result).toEqual(mockInterview);
    expect(mockQuery.eq).toHaveBeenCalledWith('id', 1);
  });

  it('should create interview', async () => {
    const mockQuery = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockInterview, error: null }),
    };
    (supabase.from as any).mockReturnValue(mockQuery);

    const input = {
      candidate_id: 10,
      interviewer_name: 'Sarah Chen',
      scheduled_date: '2026-09-15T14:00:00.000Z',
      duration_minutes: 45,
      calendar_event_id: 'cal-123',
      meet_link: 'https://meet.google.com/abc-defg-hij',
    };
    const result = await repository.create(input);
    expect(result).toEqual(mockInterview);
    expect(mockQuery.insert).toHaveBeenCalledWith(input);
  });

  it('should update interview status', async () => {
    const mockQuery = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { ...mockInterview, status: 'completed' }, error: null }),
    };
    (supabase.from as any).mockReturnValue(mockQuery);

    const result = await repository.updateStatus(1, 'completed');
    expect(result.status).toBe('completed');
    expect(mockQuery.update).toHaveBeenCalledWith({ status: 'completed' });
    expect(mockQuery.eq).toHaveBeenCalledWith('id', 1);
  });

  it('should delete interview by ID', async () => {
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
      order: vi.fn().mockResolvedValue({ data: null, error: { message: 'Connection timeout' } }),
    };
    (supabase.from as any).mockReturnValue(mockQuery);

    await expect(repository.findAll()).rejects.toThrow('Database error fetching interviews: Connection timeout');
  });
});
