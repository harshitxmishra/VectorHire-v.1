import 'reflect-metadata';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GithubController } from '../src/github/github.controller';
import { GithubService } from '../src/github/github.service';
import { GitHubIntelligence } from '@/lib/types';

describe('GithubController', () => {
  let controller: GithubController;
  let service: GithubService;

  const mockAnalysis: GitHubIntelligence = {
    score: 85,
    portfolioVerdict: 'Strong portfolio',
    summary: 'High activity on open source',
    languages: ['TypeScript', 'Rust'],
    highlights: ['Maintains popular library'],
    topRepos: [],
    prCount: 15,
    issueCount: 5,
    recentCommits: 42,
  };

  const mockService = {
    analyzeCandidate: vi.fn().mockResolvedValue(mockAnalysis),
    searchUrl: vi.fn().mockResolvedValue(mockAnalysis),
  };

  beforeEach(() => {
    service = mockService as unknown as GithubService;
    controller = new GithubController(service);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should analyze candidate GitHub (POST /api/v1/ai/github)', async () => {
    const result = await controller.analyze({ candidate_id: 10 });
    expect(result).toEqual(mockAnalysis);
    expect(service.analyzeCandidate).toHaveBeenCalledWith(10);
  });

  it('should search GitHub URL (POST /api/v1/ai/github/search)', async () => {
    const result = await controller.search({ url: 'https://github.com/torvalds' });
    expect(result).toEqual(mockAnalysis);
    expect(service.searchUrl).toHaveBeenCalledWith('https://github.com/torvalds');
  });
});
