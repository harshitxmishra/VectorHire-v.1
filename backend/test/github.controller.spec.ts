import 'reflect-metadata';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { GithubController } from '../src/github/github.controller';
import { GithubService } from '../src/github/github.service';
import { QueueService } from '../src/queue/queue.service';
import { GitHubIntelligence } from '@/lib/types';

describe('GithubController', () => {
  let controller: GithubController;
  let service: GithubService;
  let queueService: QueueService;

  const mockAnalysis: GitHubIntelligence = {
    score: 85,
    portfolioVerdict: 'Strong portfolio',
    summary: 'High activity on open source',
    languages: ['TypeScript', 'Rust'],
    highlights: ['Maintains popular library'],
    strongestRepo: 'my-lib',
  };

  const mockService = {
    getCachedAnalysis: vi.fn(),
    analyzeCandidate: vi.fn(),
    searchUrl: vi.fn().mockResolvedValue(mockAnalysis),
  };

  const mockQueueService = {
    enqueueGithubProcessing: vi.fn().mockResolvedValue({ id: 'job-gh-202' }),
    getGithubJobStatus: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    service = mockService as unknown as GithubService;
    queueService = mockQueueService as unknown as QueueService;
    controller = new GithubController(service, queueService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should enqueue candidate GitHub analysis when uncached and return 202 (POST /api/v1/ai/github)', async () => {
    mockService.getCachedAnalysis.mockResolvedValue(null);

    const result = await controller.analyze({ candidate_id: 10 });

    expect(result).toMatchObject({
      jobId: 'job-gh-202',
      status: 'queued',
      correlationId: expect.any(String),
    });
    expect(queueService.enqueueGithubProcessing).toHaveBeenCalledWith(
      expect.objectContaining({
        candidateId: 10,
        force: undefined,
        correlationId: expect.any(String),
      })
    );
  });

  it('should return cached analysis immediately if candidate has fresh analysis and force is false', async () => {
    mockService.getCachedAnalysis.mockResolvedValue(mockAnalysis);

    const result = await controller.analyze({ candidate_id: 10, force: false });

    expect(result).toMatchObject({
      jobId: 'cached-10',
      status: 'completed',
      result: mockAnalysis,
    });
    expect(queueService.enqueueGithubProcessing).not.toHaveBeenCalled();
  });

  it('should enqueue analysis if force is true even when cached analysis exists', async () => {
    mockService.getCachedAnalysis.mockResolvedValue(mockAnalysis);

    const result = await controller.analyze({ candidate_id: 10, force: true });

    expect(result).toMatchObject({
      jobId: 'job-gh-202',
      status: 'queued',
    });
    expect(queueService.enqueueGithubProcessing).toHaveBeenCalledWith(
      expect.objectContaining({
        candidateId: 10,
        force: true,
      })
    );
  });

  it('should retrieve job status (GET /api/v1/ai/github/jobs/:jobId)', async () => {
    const mockStatus = {
      jobId: 'job-gh-202',
      state: 'completed' as const,
      correlationId: 'corr-gh-1',
      result: { ...mockAnalysis, candidateId: 10, correlationId: 'corr-gh-1', processedAt: '2026-09-12' },
      enqueuedAt: 1000,
      finishedAt: 2000,
    };
    mockQueueService.getGithubJobStatus.mockResolvedValue(mockStatus);

    const result = await controller.getJobStatus('job-gh-202');
    expect(result).toEqual(mockStatus);
    expect(queueService.getGithubJobStatus).toHaveBeenCalledWith('job-gh-202');
  });

  it('should throw NotFoundException when job is not found', async () => {
    mockQueueService.getGithubJobStatus.mockResolvedValue(null);

    await expect(controller.getJobStatus('non-existent')).rejects.toThrow(NotFoundException);
  });

  it('should search GitHub URL synchronously (POST /api/v1/ai/github/search)', async () => {
    const result = await controller.search({ url: 'https://github.com/torvalds' });
    expect(result).toEqual(mockAnalysis);
    expect(service.searchUrl).toHaveBeenCalledWith('https://github.com/torvalds');
  });
});
