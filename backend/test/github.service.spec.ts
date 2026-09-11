import 'reflect-metadata';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GithubService } from '../src/github/github.service';
import * as githubService from '@/lib/services/github-service';
import * as timelineService from '@/lib/services/timeline-service';
import { GitHubIntelligence } from '@/lib/types';
import { BadGatewayException } from '@nestjs/common';

vi.mock('@/lib/services/github-service', () => ({
  getOrAnalyzeGitHub: vi.fn(),
  fetchGitHubAnalysis: vi.fn(),
}));

vi.mock('@/lib/services/timeline-service', () => ({
  logTimelineEvent: vi.fn(),
}));

describe('GithubService', () => {
  let service: GithubService;

  const mockAnalysis: GitHubIntelligence = {
    score: 80,
    portfolioVerdict: 'Solid engineering',
    summary: 'Good activity',
    languages: ['TypeScript'],
    highlights: ['Well structured code'],
    topRepos: [],
    prCount: 10,
    issueCount: 2,
    recentCommits: 30,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    service = new GithubService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should analyze candidate and log timeline event', async () => {
    (githubService.getOrAnalyzeGitHub as any).mockResolvedValue(mockAnalysis);
    (timelineService.logTimelineEvent as any).mockResolvedValue({});

    const result = await service.analyzeCandidate(10);
    expect(result).toEqual(mockAnalysis);
    expect(githubService.getOrAnalyzeGitHub).toHaveBeenCalledWith(10);
    expect(timelineService.logTimelineEvent).toHaveBeenCalledWith(10, 'github_analyzed', 'Score: 80');
  });

  it('should search GitHub by URL', async () => {
    (githubService.fetchGitHubAnalysis as any).mockResolvedValue(mockAnalysis);

    const result = await service.searchUrl('https://github.com/torvalds');
    expect(result).toEqual(mockAnalysis);
    expect(githubService.fetchGitHubAnalysis).toHaveBeenCalledWith('https://github.com/torvalds');
  });

  it('should throw BadGatewayException if analyzeCandidate fails', async () => {
    (githubService.getOrAnalyzeGitHub as any).mockRejectedValue(new Error('GitHub API rate limit'));

    await expect(service.analyzeCandidate(10)).rejects.toThrow(BadGatewayException);
  });
});
