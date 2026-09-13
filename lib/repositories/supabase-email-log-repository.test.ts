import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SupabaseEmailLogRepository } from './supabase-email-log-repository';
import { supabase } from '@/lib/supabase/client';

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('SupabaseEmailLogRepository', () => {
  let repository: SupabaseEmailLogRepository;

  const mockEmailLog = {
    id: 1,
    candidate_id: 10,
    email_type: 'assessment' as const,
    recipient: 'john@example.com',
    status: 'pending' as const,
    error_message: null,
    sent_at: null,
    created_at: '2026-09-11T10:00:00.000Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new SupabaseEmailLogRepository();
  });

  it('should create a pending email log', async () => {
    const mockQuery = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockEmailLog, error: null }),
    };
    (supabase.from as any).mockReturnValue(mockQuery);

    const input = {
      candidate_id: 10,
      email_type: 'assessment' as const,
      recipient: 'john@example.com',
    };

    const result = await repository.create(input);
    expect(result).toEqual(mockEmailLog);
    expect(supabase.from).toHaveBeenCalledWith('email_logs');
    expect(mockQuery.insert).toHaveBeenCalledWith({
      candidate_id: 10,
      email_type: 'assessment',
      recipient: 'john@example.com',
      status: 'pending',
    });
  });

  it('should mark email log as sent', async () => {
    const mockQuery = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    };
    (supabase.from as any).mockReturnValue(mockQuery);

    await repository.markAsSent(1, '2026-09-11T10:05:00.000Z');
    expect(supabase.from).toHaveBeenCalledWith('email_logs');
    expect(mockQuery.update).toHaveBeenCalledWith({
      status: 'sent',
      sent_at: '2026-09-11T10:05:00.000Z',
    });
    expect(mockQuery.eq).toHaveBeenCalledWith('id', 1);
  });

  it('should mark email log as failed', async () => {
    const mockQuery = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    };
    (supabase.from as any).mockReturnValue(mockQuery);

    await repository.markAsFailed(1, 'SMTP connection timeout');
    expect(supabase.from).toHaveBeenCalledWith('email_logs');
    expect(mockQuery.update).toHaveBeenCalledWith({
      status: 'failed',
      error_message: 'SMTP connection timeout',
    });
    expect(mockQuery.eq).toHaveBeenCalledWith('id', 1);
  });

  it('should find sent candidate IDs for deduplication', async () => {
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({ data: [{ candidate_id: 10 }, { candidate_id: 20 }], error: null }),
    };
    (supabase.from as any).mockReturnValue(mockQuery);

    const result = await repository.findSentCandidateIds([10, 20, 30], 'assessment');
    expect(result).toEqual([10, 20]);
    expect(supabase.from).toHaveBeenCalledWith('email_logs');
    expect(mockQuery.select).toHaveBeenCalledWith('candidate_id');
    expect(mockQuery.in).toHaveBeenCalledWith('candidate_id', [10, 20, 30]);
  });

  it('should return empty array for findSentCandidateIds when candidateIds is empty', async () => {
    const result = await repository.findSentCandidateIds([], 'assessment');
    expect(result).toEqual([]);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('should find email logs by candidate ID', async () => {
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [mockEmailLog], error: null }),
    };
    (supabase.from as any).mockReturnValue(mockQuery);

    const result = await repository.findByCandidateId(10);
    expect(result).toEqual([mockEmailLog]);
    expect(mockQuery.eq).toHaveBeenCalledWith('candidate_id', 10);
    expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false });
  });

  it('should throw error when persistence fails', async () => {
    const mockQuery = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Insert failed' } }),
    };
    (supabase.from as any).mockReturnValue(mockQuery);

    await expect(
      repository.create({
        candidate_id: 10,
        email_type: 'assessment',
        recipient: 'john@example.com',
      })
    ).rejects.toThrow('Database error creating email log: Insert failed');
  });
});
