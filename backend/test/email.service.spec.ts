import 'reflect-metadata';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EmailService } from '../src/email/email.service';
import { supabase } from '@/lib/supabase/client';
import * as emailService from '@/lib/services/email-service';
import { InternalServerErrorException } from '@nestjs/common';

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock('@/lib/services/email-service', () => ({
  sendCandidateEmail: vi.fn(),
}));

describe('EmailService', () => {
  let service: EmailService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new EmailService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should send emails to eligible candidates and update status', async () => {
    const mockCandidates = [
      { id: 1, full_name: 'John Doe', email: 'john@example.com' },
      { id: 2, full_name: 'Jane Smith', email: 'jane@example.com' },
    ];

    const mockCandidatesQuery = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({ data: mockCandidates, error: null }),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    };

    const mockLogsQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({ data: [{ candidate_id: 2 }], error: null }),
    };

    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'candidates') return mockCandidatesQuery;
      if (table === 'email_logs') return mockLogsQuery;
      return {};
    });

    (emailService.sendCandidateEmail as any).mockResolvedValue({ status: 'sent' });

    const result = await service.sendEmails({
      candidateIds: [1, 2],
      type: 'assessment',
      force: false,
      assessmentTitle: 'React Test',
    });

    expect(result.sent).toBe(1);
    expect(result.skipped).toBe(1);
    expect(result.results[0].status).toBe('sent');
    expect(result.results[1].status).toBe('skipped');
  });

  it('should throw InternalServerErrorException if candidate lookup fails', async () => {
    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } }),
    });

    await expect(
      service.sendEmails({
        candidateIds: [1],
        type: 'offer',
      }),
    ).rejects.toThrow(InternalServerErrorException);
  });
});
