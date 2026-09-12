import 'reflect-metadata';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ResumeController } from '../src/resume/resume.controller';
import { ResumeService } from '../src/resume/resume.service';
import { QueueService } from '../src/queue/queue.service';

describe('ResumeController', () => {
  let controller: ResumeController;
  let service: ResumeService;
  let queueService: QueueService;

  const mockService = {
    validateCandidateForParsing: vi.fn(),
    parseResume: vi.fn(),
  };

  const mockQueueService = {
    enqueueResumeProcessing: vi.fn().mockResolvedValue({ id: 'job-res-101' }),
    getResumeJobStatus: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    service = mockService as unknown as ResumeService;
    queueService = mockQueueService as unknown as QueueService;
    controller = new ResumeController(service, queueService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should validate candidate and enqueue resume processing returning 202 (POST /api/v1/candidates/:id/parse-resume)', async () => {
    mockService.validateCandidateForParsing.mockResolvedValue({ id: 1, resume_url: 'https://example.com/res.pdf' });

    const result = await controller.parseResume(1);

    expect(mockService.validateCandidateForParsing).toHaveBeenCalledWith(1);
    expect(queueService.enqueueResumeProcessing).toHaveBeenCalledWith(
      expect.objectContaining({
        candidateId: 1,
        correlationId: expect.any(String),
        enqueuedAt: expect.any(Number),
      })
    );
    expect(result).toMatchObject({
      jobId: 'job-res-101',
      status: 'queued',
      correlationId: expect.any(String),
    });
  });

  it('should propagate validation error when candidate has no resume URL', async () => {
    mockService.validateCandidateForParsing.mockRejectedValue(new BadRequestException('Candidate has no resume URL.'));

    await expect(controller.parseResume(1)).rejects.toThrow(BadRequestException);
    expect(queueService.enqueueResumeProcessing).not.toHaveBeenCalled();
  });

  it('should retrieve job status (GET /api/v1/candidates/jobs/:jobId)', async () => {
    const mockStatus = {
      jobId: 'job-res-101',
      state: 'completed' as const,
      correlationId: 'corr-123',
      result: { candidateId: 1, status: 'success' as const, correlationId: 'corr-123', processedAt: '2026-09-12' },
      enqueuedAt: 1000,
      finishedAt: 2000,
    };
    mockQueueService.getResumeJobStatus.mockResolvedValue(mockStatus);

    const result = await controller.getJobStatus('job-res-101');
    expect(result).toEqual(mockStatus);
    expect(queueService.getResumeJobStatus).toHaveBeenCalledWith('job-res-101');
  });

  it('should throw NotFoundException when job is not found', async () => {
    mockQueueService.getResumeJobStatus.mockResolvedValue(null);

    await expect(controller.getJobStatus('non-existent')).rejects.toThrow(NotFoundException);
  });
});
