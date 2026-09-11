import 'reflect-metadata';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MatchingService } from '../src/matching/matching.service';
import { NotFoundException, BadGatewayException, InternalServerErrorException } from '@nestjs/common';
import * as aiClient from '@/lib/ai/client';

vi.mock('@/lib/ai/client', () => ({
  aiGenerateJSON: vi.fn(),
}));

describe('MatchingService', () => {
  let service: MatchingService;
  let mockJobMatchRepo: any;
  let mockCandidateRepo: any;
  let mockJobRepo: any;
  let mockTimelineRepo: any;

  const mockCandidate = {
    id: 5,
    full_name: 'Alice Smith',
    branch: 'Computer Science',
    best_ai_project: 'RAG Pipeline',
    research_work: 'NLP paper',
    github: 'https://github.com/alice',
    resume_text: 'Experienced software engineer',
    test_la: 85,
    test_code: 90,
  };

  const mockJob = {
    id: 2,
    title: 'Senior Full Stack Engineer',
    requirements: 'TypeScript, React, Node.js, PostgreSQL',
  };

  const mockMatchResult = {
    matchPercentage: 92,
    matchedSkills: ['TypeScript', 'Node.js', 'PostgreSQL'],
    missingSkills: ['Kubernetes'],
    experienceMatch: 'Strong full stack experience',
    educationMatch: 'CS Degree',
    recommendation: 'Strong candidate',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockJobMatchRepo = {
      findByJobDescriptionId: vi.fn().mockResolvedValue([
        { id: 1, candidate_id: 5, job_description_id: 2, match_percentage: 92 },
      ]),
      findBestScoresPerCandidate: vi.fn().mockResolvedValue({ 5: 92 }),
      upsert: vi.fn().mockResolvedValue({ id: 1, candidate_id: 5, job_description_id: 2, match_percentage: 92 }),
    };

    mockCandidateRepo = {
      findById: vi.fn().mockResolvedValue(mockCandidate),
    };

    mockJobRepo = {
      findById: vi.fn().mockResolvedValue(mockJob),
    };

    mockTimelineRepo = {
      create: vi.fn().mockResolvedValue({ id: 10, candidate_id: 5, event_type: 'jd_matched' }),
    };

    service = new MatchingService(
      mockJobMatchRepo,
      mockCandidateRepo,
      mockJobRepo,
      mockTimelineRepo,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should get matches for JD using JobMatchRepository', async () => {
    const result = await service.getMatchesForJD(2);
    expect(result).toEqual([{ id: 1, candidate_id: 5, job_description_id: 2, match_percentage: 92 }]);
    expect(mockJobMatchRepo.findByJobDescriptionId).toHaveBeenCalledWith(2);
  });

  it('should throw InternalServerErrorException if getMatchesForJD fails', async () => {
    mockJobMatchRepo.findByJobDescriptionId.mockRejectedValue(new Error('DB error'));
    await expect(service.getMatchesForJD(2)).rejects.toThrow(InternalServerErrorException);
  });

  it('should get best matches per candidate', async () => {
    const result = await service.getBestMatches();
    expect(result).toEqual({ 5: 92 });
    expect(mockJobMatchRepo.findBestScoresPerCandidate).toHaveBeenCalled();
  });

  it('should evaluate candidate match successfully and log timeline event', async () => {
    (aiClient.aiGenerateJSON as any).mockResolvedValue(mockMatchResult);

    const dto = { candidate_id: 5, job_description_id: 2 };
    const result = await service.evaluateCandidateMatch(dto);

    expect(result).toEqual(mockMatchResult);
    expect(mockCandidateRepo.findById).toHaveBeenCalledWith(5);
    expect(mockJobRepo.findById).toHaveBeenCalledWith(2);
    expect(mockJobMatchRepo.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        candidate_id: 5,
        job_description_id: 2,
        match_percentage: 92,
        matched_skills: ['TypeScript', 'Node.js', 'PostgreSQL'],
      })
    );
    expect(mockTimelineRepo.create).toHaveBeenCalledWith({
      candidate_id: 5,
      event_type: 'jd_matched',
      details: '92% match',
    });
  });

  it('should throw NotFoundException if candidate is not found', async () => {
    mockCandidateRepo.findById.mockResolvedValue(null);

    const dto = { candidate_id: 999, job_description_id: 2 };
    await expect(service.evaluateCandidateMatch(dto)).rejects.toThrow(NotFoundException);
    expect(mockJobMatchRepo.upsert).not.toHaveBeenCalled();
  });

  it('should throw NotFoundException if job description is not found', async () => {
    mockJobRepo.findById.mockResolvedValue(null);

    const dto = { candidate_id: 5, job_description_id: 999 };
    await expect(service.evaluateCandidateMatch(dto)).rejects.toThrow(NotFoundException);
    expect(mockJobMatchRepo.upsert).not.toHaveBeenCalled();
  });

  it('should throw BadGatewayException if AI matching fails', async () => {
    (aiClient.aiGenerateJSON as any).mockRejectedValue(new Error('AI provider offline'));

    const dto = { candidate_id: 5, job_description_id: 2 };
    await expect(service.evaluateCandidateMatch(dto)).rejects.toThrow(BadGatewayException);
    expect(mockJobMatchRepo.upsert).not.toHaveBeenCalled();
  });
});
