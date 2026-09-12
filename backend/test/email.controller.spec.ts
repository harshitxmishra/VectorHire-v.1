import 'reflect-metadata';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EmailController } from '../src/email/email.controller';
import { QueueService } from '../src/queue/queue.service';
import { SendEmailDto } from '../src/email/dto/send-email.dto';
import { NotFoundException } from '@nestjs/common';

describe('EmailController', () => {
  let controller: EmailController;
  let mockQueueService: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockQueueService = {
      enqueueEmailSend: vi.fn().mockResolvedValue({
        id: 'email-job-123',
        timestamp: 1726130000000,
      }),
      getEmailJobStatus: vi.fn(),
    };

    controller = new EmailController(mockQueueService as unknown as QueueService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should enqueue email send job and return 202 (POST /api/v1/emails/send) with correlation ID', async () => {
    const dto: SendEmailDto = {
      candidateIds: [1, 2, 3],
      type: 'assessment',
      assessmentTitle: 'Fullstack Assessment',
    };

    const mockReq = { user: { id: 'user-abc' } };
    const result = await controller.sendEmails(dto, mockReq, 'custom-corr-123');

    expect(result).toEqual({
      jobId: 'email-job-123',
      status: 'queued',
      correlationId: 'custom-corr-123',
    });

    expect(mockQueueService.enqueueEmailSend).toHaveBeenCalledWith(
      expect.objectContaining({
        candidateIds: [1, 2, 3],
        type: 'assessment',
        assessmentTitle: 'Fullstack Assessment',
        requestedBy: 'user-abc',
        correlationId: 'custom-corr-123',
      })
    );
  });

  it('should generate a UUID v4 correlation ID if header is missing', async () => {
    const dto: SendEmailDto = {
      candidateIds: [1],
      type: 'offer',
    };

    const mockReq = { user: { id: 'user-abc' } };
    const result = await controller.sendEmails(dto, mockReq);

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(result.correlationId).toMatch(uuidRegex);
    expect(result.status).toBe('queued');
    expect(result.jobId).toBe('email-job-123');
  });

  it('should return job status when authorized (GET /api/v1/emails/jobs/:jobId)', async () => {
    const mockJob = {
      id: 'email-job-123',
      data: { requestedBy: 'user-abc' },
    };
    const mockStatus = {
      jobId: 'email-job-123',
      state: 'completed' as const,
      correlationId: 'email-test-123',
      result: {
        sent: 2,
        failed: 0,
        skipped: 1,
        total: 3,
        results: [
          { candidateId: 1, status: 'sent' as const },
          { candidateId: 2, status: 'sent' as const },
          { candidateId: 3, status: 'skipped' as const, error: 'Already sent.' },
        ],
        correlationId: 'email-test-123',
        processedAt: '2026-09-12T10:00:00.000Z',
      },
    };

    mockQueueService.getEmailJob = vi.fn().mockResolvedValue(mockJob);
    mockQueueService.getEmailJobStatus.mockResolvedValue(mockStatus);

    const mockReq = { user: { id: 'user-abc' } };
    const result = await controller.getJobStatus('email-job-123', mockReq);
    expect(result).toEqual(mockStatus);
    expect(mockQueueService.getEmailJobStatus).toHaveBeenCalledWith('email-job-123');
  });

  it('should throw ForbiddenException if user tries to query another user email job', async () => {
    const mockJob = {
      id: 'email-job-123',
      data: { requestedBy: 'user-other' },
    };

    mockQueueService.getEmailJob = vi.fn().mockResolvedValue(mockJob);

    const mockReq = { user: { id: 'user-malicious' } };
    await expect(controller.getJobStatus('email-job-123', mockReq)).rejects.toThrow(
      'You are not authorized to view this email job'
    );
  });

  it('should throw NotFoundException if job is not found', async () => {
    mockQueueService.getEmailJob = vi.fn().mockResolvedValue(null);
    mockQueueService.getEmailJobStatus.mockResolvedValue(null);

    const mockReq = { user: { id: 'user-abc' } };
    await expect(controller.getJobStatus('missing-job', mockReq)).rejects.toThrow(
      NotFoundException
    );
  });
});
