import 'reflect-metadata';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EmailService } from '../src/email/email.service';
import * as emailService from '@/lib/services/email-service';
import { InternalServerErrorException } from '@nestjs/common';

vi.mock('@/lib/services/email-service', () => ({
  sendCandidateEmail: vi.fn(),
}));

describe('EmailService', () => {
  let service: EmailService;
  let mockEmailLogRepo: any;
  let mockCandidateRepo: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockEmailLogRepo = {
      create: vi.fn(),
      markAsSent: vi.fn(),
      markAsFailed: vi.fn(),
      findSentCandidateIds: vi.fn().mockResolvedValue([2]),
    };

    mockCandidateRepo = {
      findByIds: vi.fn().mockResolvedValue([
        { id: 1, full_name: 'John Doe', email: 'john@example.com' },
        { id: 2, full_name: 'Jane Smith', email: 'jane@example.com' },
      ]),
      updateStatus: vi.fn().mockResolvedValue({ id: 1, status: 'Assessment Sent' }),
    };

    service = new EmailService(mockEmailLogRepo, mockCandidateRepo);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should send emails to eligible candidates and update status', async () => {
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
    expect(mockCandidateRepo.findByIds).toHaveBeenCalledWith([1, 2]);
    expect(mockEmailLogRepo.findSentCandidateIds).toHaveBeenCalledWith([1, 2], 'assessment');
    expect(mockCandidateRepo.updateStatus).toHaveBeenCalledWith(1, 'Assessment Sent');
  });

  it('should throw InternalServerErrorException if candidate lookup fails or returns empty', async () => {
    mockCandidateRepo.findByIds.mockRejectedValue(new Error('Database error'));

    await expect(
      service.sendEmails({
        candidateIds: [1],
        type: 'offer',
      }),
    ).rejects.toThrow(InternalServerErrorException);
  });

  it('should throw InternalServerErrorException if no candidates found', async () => {
    mockCandidateRepo.findByIds.mockResolvedValue([]);

    await expect(
      service.sendEmails({
        candidateIds: [1],
        type: 'offer',
      }),
    ).rejects.toThrow(InternalServerErrorException);
  });
});
