import 'reflect-metadata';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { AiController } from '../src/ai/ai.controller';
import { AiService } from '../src/ai/ai.service';
import { QueueService } from '../src/queue/queue.service';

describe('AiController', () => {
  let controller: AiController;
  let aiService: AiService;
  let queueService: QueueService;

  const mockEvaluation = {
    score: 88,
    summary: 'Solid full-stack engineering profile',
    strengths: ['NestJS', 'PostgreSQL', 'TypeScript'],
    weaknesses: ['Limited distributed systems experience'],
    recommendation: 'Advance to technical interview',
    interviewQuestions: ['Explain dependency injection in NestJS', 'How do you design database indexes?'],
  };

  const mockAiService = {
    getCachedEvaluation: vi.fn(),
    evaluateCandidate: vi.fn(),
  };

  const mockQueueService = {
    enqueueAiEvaluation: vi.fn().mockResolvedValue({ id: 'job-ai-999' }),
    getAiEvaluationJobStatus: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    aiService = mockAiService as unknown as AiService;
    queueService = mockQueueService as unknown as QueueService;
    controller = new AiController(aiService, queueService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should enqueue evaluation job and return 202 with jobId when not cached', async () => {
    mockAiService.getCachedEvaluation.mockResolvedValue(null);

    const dto = {
      candidate_id: 10,
      full_name: 'Jane Doe',
      college: 'MIT',
      cgpa: 9.1,
      github: 'https://github.com/janedoe',
      status: 'screened',
      ai_score: 85,
    };

    const response = await controller.evaluateCandidate(dto);

    expect(response).toMatchObject({
      jobId: 'job-ai-999',
      status: 'queued',
    });
    expect(response.correlationId).toBeDefined();
    expect(queueService.enqueueAiEvaluation).toHaveBeenCalledWith(
      expect.objectContaining({
        candidate_id: 10,
        full_name: 'Jane Doe',
        correlationId: expect.any(String),
      })
    );
  });

  it('should return cached evaluation immediately if candidate already evaluated and force=false', async () => {
    mockAiService.getCachedEvaluation.mockResolvedValue(mockEvaluation);

    const dto = {
      candidate_id: 10,
      full_name: 'Jane Doe',
      college: 'MIT',
      cgpa: 9.1,
      github: 'https://github.com/janedoe',
      status: 'screened',
      ai_score: 85,
      force: false,
    };

    const response = await controller.evaluateCandidate(dto);

    expect(response).toMatchObject({
      jobId: 'cached-10',
      status: 'completed',
      result: mockEvaluation,
    });
    expect(queueService.enqueueAiEvaluation).not.toHaveBeenCalled();
  });

  it('should enqueue evaluation job if force=true even when cached evaluation exists', async () => {
    mockAiService.getCachedEvaluation.mockResolvedValue(mockEvaluation);

    const dto = {
      candidate_id: 10,
      full_name: 'Jane Doe',
      college: 'MIT',
      cgpa: 9.1,
      github: 'https://github.com/janedoe',
      status: 'screened',
      ai_score: 85,
      force: true,
    };

    const response = await controller.evaluateCandidate(dto);

    expect(response).toMatchObject({
      jobId: 'job-ai-999',
      status: 'queued',
    });
    expect(queueService.enqueueAiEvaluation).toHaveBeenCalled();
  });

  it('should return job status via GET /api/v1/ai/jobs/:jobId', async () => {
    const mockStatus = {
      jobId: 'job-ai-999',
      state: 'completed' as const,
      correlationId: 'corr-123',
      result: mockEvaluation,
      enqueuedAt: 123456789,
      finishedAt: 123456799,
    };
    mockQueueService.getAiEvaluationJobStatus.mockResolvedValue(mockStatus);

    const result = await controller.getJobStatus('job-ai-999');
    expect(result).toEqual(mockStatus);
    expect(queueService.getAiEvaluationJobStatus).toHaveBeenCalledWith('job-ai-999');
  });

  it('should throw NotFoundException if job is not found', async () => {
    mockQueueService.getAiEvaluationJobStatus.mockResolvedValue(null);

    await expect(controller.getJobStatus('non-existent-id')).rejects.toThrow(NotFoundException);
  });
});
