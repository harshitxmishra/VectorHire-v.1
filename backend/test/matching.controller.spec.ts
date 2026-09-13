import 'reflect-metadata';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MatchingController } from '../src/matching/matching.controller';
import { MatchingService } from '../src/matching/matching.service';
import { BadRequestException } from '@nestjs/common';

describe('MatchingController', () => {
  let controller: MatchingController;
  let service: MatchingService;

  const mockMatchResult = {
    matchPercentage: 92,
    matchedSkills: ['TypeScript', 'Node.js', 'PostgreSQL'],
    missingSkills: ['Kubernetes'],
    experienceMatch: 'Strong backend development experience',
    educationMatch: 'Computer Science degree',
    recommendation: 'Highly Recommended',
  };

  const mockJobMatches = [
    {
      id: 1,
      candidate_id: 5,
      job_description_id: 1,
      match_percentage: 92,
      matched_skills: ['TypeScript', 'Node.js'],
      missing_skills: ['Kubernetes'],
      experience_match: 'Strong',
      education_match: 'CS Degree',
      recommendation: 'Proceed',
      created_at: '2026-09-11T10:00:00.000Z',
    },
  ];

  const mockPaginatedResult = {
    matches: mockJobMatches,
    total: 1,
    page: 1,
    limit: 25,
    totalPages: 1,
    candidateCount: 50,
    totalMatchesForJob: 1,
    metrics: {
      totalMatches: 1,
      highMatchCount: 1,
      averageMatchScore: 92,
    },
  };

  const mockBatchResult = {
    jobDescriptionId: 1,
    evaluatedCount: 5,
    matchCount: 5,
    results: [
      { candidate_id: 5, matchPercentage: 92, recommendation: 'Proceed' },
    ],
  };

  const mockService = {
    getMatchesForJD: vi.fn().mockResolvedValue(mockJobMatches),
    getPaginatedMatchesForJD: vi.fn().mockResolvedValue(mockPaginatedResult),
    getBestMatches: vi.fn().mockResolvedValue({ 5: 92 }),
    evaluateCandidateMatch: vi.fn().mockResolvedValue(mockMatchResult),
    batchEvaluateMatches: vi.fn().mockResolvedValue(mockBatchResult),
  };

  beforeEach(() => {
    service = mockService as unknown as MatchingService;
    controller = new MatchingController(service);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should get matches by query param (GET /api/v1/matching?jobDescriptionId=1)', async () => {
    const result = await controller.getMatches('1');
    expect(result).toEqual(mockJobMatches);
    expect(service.getMatchesForJD).toHaveBeenCalledWith(1);
  });

  it('should throw BadRequestException if jobDescriptionId query param is missing', async () => {
    await expect(controller.getMatches(undefined)).rejects.toThrow(BadRequestException);
  });

  it('should get best matches per candidate (GET /api/v1/matching/best)', async () => {
    const result = await controller.getBestMatches();
    expect(result).toEqual({ 5: 92 });
    expect(service.getBestMatches).toHaveBeenCalled();
  });

  it('should get matches for JD path param (GET /api/v1/matching/jd/:id)', async () => {
    const result = await controller.getMatchesForJD(1);
    expect(result).toEqual(mockJobMatches);
    expect(service.getMatchesForJD).toHaveBeenCalledWith(1);
  });

  it('should get paginated matches with metrics (GET /api/v1/matching/jd/:id/paginated)', async () => {
    const query = { page: 1, limit: 25, minScore: 80, sortBy: 'match_percentage' as const, sortOrder: 'desc' as const };
    const result = await controller.getPaginatedMatchesForJD(1, query);
    expect(result).toEqual(mockPaginatedResult);
    expect(service.getPaginatedMatchesForJD).toHaveBeenCalledWith(1, query);
  });

  it('should evaluate candidate match (POST /api/v1/matching/evaluate)', async () => {
    const dto = { candidate_id: 5, job_description_id: 1 };
    const result = await controller.evaluateMatch(dto);
    expect(result).toEqual(mockMatchResult);
    expect(service.evaluateCandidateMatch).toHaveBeenCalledWith(dto);
  });

  it('should batch evaluate matches for a JD (POST /api/v1/matching/jd/:id/run)', async () => {
    const dto = { candidate_ids: [5, 6, 7], force: true };
    const result = await controller.runJobMatching(1, dto);
    expect(result).toEqual(mockBatchResult);
    expect(service.batchEvaluateMatches).toHaveBeenCalledWith(1, dto);
  });
});
