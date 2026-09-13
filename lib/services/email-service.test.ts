import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  sendCandidateEmail,
  EmailProvider,
  EmailPayload,
  EmailSendResult,
} from './email-service';
import { EmailLogRepository } from '@/lib/repositories/email-log-repository';

vi.mock('@/lib/services/timeline-service', () => ({
  logTimelineEvent: vi.fn().mockResolvedValue({ id: 1 }),
}));

describe('email-service', () => {
  let mockRepo: EmailLogRepository;
  let mockProvider: EmailProvider;

  beforeEach(() => {
    vi.clearAllMocks();

    mockRepo = {
      create: vi.fn().mockResolvedValue({ id: 101, status: 'pending' }),
      markAsSent: vi.fn().mockResolvedValue(undefined),
      markAsFailed: vi.fn().mockResolvedValue(undefined),
      findSentCandidateIds: vi.fn().mockResolvedValue([]),
      findByCandidateId: vi.fn().mockResolvedValue([]),
      findByType: vi.fn().mockResolvedValue([]),
    };

    mockProvider = {
      sendEmail: vi.fn().mockResolvedValue({
        success: true,
        messageId: 'msg-123',
      }),
    };
  });

  it('should create pending log, send email via provider, mark as sent, and log timeline', async () => {
    const result = await sendCandidateEmail(
      42,
      'assessment',
      'candidate@example.com',
      'Alice Walker',
      {
        assessmentTitle: 'TypeScript Architecture Test',
        assessmentDeadline: '2026-09-20',
        assessmentUrl: 'https://assess.vectorhire.io/t/123',
        recruiterName: 'VectorHire Talent Team',
      },
      mockRepo,
      mockProvider
    );

    expect(result).toEqual({ status: 'sent' });
    expect(mockRepo.create).toHaveBeenCalledWith({
      candidate_id: 42,
      email_type: 'assessment',
      recipient: 'candidate@example.com',
      status: 'pending',
    });
    expect(mockProvider.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'candidate@example.com',
        subject: 'Next Step: Complete Your TypeScript Architecture Test',
        html: expect.stringContaining('TypeScript Architecture Test'),
      })
    );
    expect(mockRepo.markAsSent).toHaveBeenCalledWith(101);
  });

  it('should handle provider failure and mark log as failed', async () => {
    mockProvider.sendEmail = vi.fn().mockResolvedValue({
      success: false,
      error: 'SMTP 550 User unknown',
    });

    const result = await sendCandidateEmail(
      42,
      'offer',
      'invalid@example.com',
      'Bob Smith',
      undefined,
      mockRepo,
      mockProvider
    );

    expect(result).toEqual({
      status: 'failed',
      error: 'SMTP 550 User unknown',
    });
    expect(mockRepo.markAsFailed).toHaveBeenCalledWith(101, 'SMTP 550 User unknown');
  });

  it('should handle thrown error from provider and record error message', async () => {
    mockProvider.sendEmail = vi.fn().mockRejectedValue(new Error('Network timeout'));

    const result = await sendCandidateEmail(
      42,
      'interview',
      'candidate@example.com',
      'Charlie Brown',
      {
        interviewDate: 'Sept 15, 2026 at 2 PM',
        meetLink: 'https://meet.google.com/abc-def-ghi',
      },
      mockRepo,
      mockProvider
    );

    expect(result).toEqual({
      status: 'failed',
      error: 'Network timeout',
    });
    expect(mockRepo.markAsFailed).toHaveBeenCalledWith(101, 'Network timeout');
  });
});
