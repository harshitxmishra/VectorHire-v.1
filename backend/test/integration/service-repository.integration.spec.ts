import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CandidatesService } from '../../src/candidates/candidates.service';
import { JobsService } from '../../src/jobs/jobs.service';
import { InterviewsService } from '../../src/interviews/interviews.service';
import { TimelineService } from '../../src/timeline/timeline.service';
import { MatchingService } from '../../src/matching/matching.service';
import { CandidateRepository } from '@/lib/repositories/candidate-repository';
import { JobRepository } from '@/lib/repositories/job-repository';
import { InterviewRepository } from '@/lib/repositories/interview-repository';
import { TimelineRepository } from '@/lib/repositories/timeline-repository';
import { JobMatchRepository } from '@/lib/repositories/job-match-repository';
import { NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { Candidate, JobDescription, Interview, TimelineEvent, JobMatchResult } from '@/lib/types';

describe('Service-to-Repository Integration Boundaries', () => {
  describe('CandidatesService ↔ CandidateRepository Integration', () => {
    let service: CandidatesService;
    let mockRepo: {
      findAll: ReturnType<typeof vi.fn>;
      findById: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      updateStatus: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
      deleteAll: ReturnType<typeof vi.fn>;
    };

    beforeEach(() => {
      mockRepo = {
        findAll: vi.fn(),
        findById: vi.fn(),
        create: vi.fn(),
        updateStatus: vi.fn(),
        delete: vi.fn(),
        deleteAll: vi.fn(),
      };
      service = new CandidatesService(mockRepo as unknown as CandidateRepository);
    });

    it('retrieves all candidates via repository abstraction without bypassing it', async () => {
      const candidates: Candidate[] = [
        {
          id: 1,
          name: 'Alex Johnson',
          email: 'alex@example.com',
          role: 'Full Stack Engineer',
          status: 'applied',
          matchScore: 85,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      mockRepo.findAll.mockResolvedValue(candidates);

      const result = await service.findAll();
      expect(result).toEqual(candidates);
      expect(mockRepo.findAll).toHaveBeenCalledTimes(1);
    });

    it('throws NotFoundException when candidate does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      expect(mockRepo.findById).toHaveBeenCalledWith(999);
    });

    it('creates a candidate and propagates repository creation cleanly', async () => {
      const candidate: Candidate = {
        id: 42,
        name: 'Jordan Lee',
        email: 'jordan@example.com',
        role: 'AI Engineer',
        status: 'applied',
        matchScore: 90,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockRepo.create.mockResolvedValue(candidate);

      const result = await service.create({
        full_name: 'Jordan Lee',
        email: 'jordan@example.com',
        college: 'Stanford',
        cgpa: 3.9,
      } as any);

      expect(result).toEqual(candidate);
      expect(mockRepo.create).toHaveBeenCalled();
    });

    it('translates repository database failures into InternalServerErrorException', async () => {
      mockRepo.findAll.mockRejectedValue(new Error('Connection lost to database'));

      await expect(service.findAll()).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('JobsService ↔ JobRepository Integration', () => {
    let service: JobsService;
    let mockRepo: {
      findAll: ReturnType<typeof vi.fn>;
      findById: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
    };

    beforeEach(() => {
      mockRepo = {
        findAll: vi.fn(),
        findById: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      };
      service = new JobsService(mockRepo as unknown as JobRepository);
    });

    it('retrieves jobs and individual job details through repository abstraction', async () => {
      const job: JobDescription = {
        id: 10,
        title: 'Senior Backend Engineer',
        requirements: 'NestJS, TypeScript, PostgreSQL',
        created_at: new Date().toISOString(),
      };
      mockRepo.findAll.mockResolvedValue([job]);
      mockRepo.findById.mockResolvedValue(job);

      const allJobs = await service.findAll();
      const singleJob = await service.findOne(10);

      expect(allJobs).toHaveLength(1);
      expect(singleJob).toEqual(job);
      expect(mockRepo.findById).toHaveBeenCalledWith(10);
    });

    it('throws NotFoundException when job ID is not found', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('InterviewsService ↔ InterviewRepository Integration', () => {
    let service: InterviewsService;
    let mockInterviewRepo: {
      findAll: ReturnType<typeof vi.fn>;
      findByCandidateId: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      updateStatus: ReturnType<typeof vi.fn>;
    };
    let mockCandidateRepo: {
      findById: ReturnType<typeof vi.fn>;
      updateStatus: ReturnType<typeof vi.fn>;
    };

    beforeEach(() => {
      mockInterviewRepo = {
        findAll: vi.fn(),
        findByCandidateId: vi.fn(),
        create: vi.fn(),
        updateStatus: vi.fn(),
      };
      mockCandidateRepo = {
        findById: vi.fn(),
        updateStatus: vi.fn(),
      };
      service = new InterviewsService(
        mockInterviewRepo as unknown as InterviewRepository,
        mockCandidateRepo as unknown as CandidateRepository,
      );
    });

    it('manages interview scheduling and status updates through repository', async () => {
      const interview: Interview = {
        id: 5,
        candidate_id: 1,
        interviewer_name: 'Sarah Connor',
        scheduled_date: new Date().toISOString(),
        duration_minutes: 45,
        status: 'scheduled',
        created_at: new Date().toISOString(),
      };
      mockInterviewRepo.findAll.mockResolvedValue([interview]);
      mockCandidateRepo.findById.mockResolvedValue({ id: 1, full_name: 'John' });
      mockCandidateRepo.updateStatus.mockResolvedValue({ id: 1, status: 'interview scheduled' });
      mockInterviewRepo.create.mockResolvedValue(interview);
      mockInterviewRepo.updateStatus.mockResolvedValue({ ...interview, status: 'completed' });

      const all = await service.findAll();
      const created = await service.create({
        candidate_id: 1,
        interviewer_name: 'Sarah Connor',
        scheduled_date: interview.scheduled_date,
        duration_minutes: 45,
      });
      const updated = await service.updateStatus(5, { status: 'completed' });

      expect(all).toHaveLength(1);
      expect(created.id).toBe(5);
      expect(updated.status).toBe('completed');
    });
  });

  describe('TimelineService ↔ TimelineRepository Integration', () => {
    let service: TimelineService;
    let mockRepo: {
      findByCandidateId: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      deleteByCandidateId: ReturnType<typeof vi.fn>;
      findDistinctCandidateIdsForEvent: ReturnType<typeof vi.fn>;
    };

    beforeEach(() => {
      mockRepo = {
        findByCandidateId: vi.fn(),
        create: vi.fn(),
        deleteByCandidateId: vi.fn(),
        findDistinctCandidateIdsForEvent: vi.fn(),
      };
      service = new TimelineService(mockRepo as unknown as TimelineRepository);
    });

    it('fetches candidate timeline events and handles event recording', async () => {
      const events: TimelineEvent[] = [
        {
          id: 1,
          candidate_id: 10,
          event_type: 'applied',
          details: 'Application submitted',
          created_at: new Date().toISOString(),
        },
        {
          id: 2,
          candidate_id: 10,
          event_type: 'interview_scheduled',
          details: 'Interview set for next week',
          created_at: new Date().toISOString(),
        },
      ];
      mockRepo.findByCandidateId.mockResolvedValue(events);

      const result = await service.findByCandidateId(10);
      expect(result).toEqual(events);
      expect(mockRepo.findByCandidateId).toHaveBeenCalledWith(10);
    });
  });

  describe('MatchingService ↔ JobMatchRepository Integration', () => {
    let service: MatchingService;
    let mockMatchRepo: {
      findByJobDescriptionId: ReturnType<typeof vi.fn>;
      findBestScoresPerCandidate: ReturnType<typeof vi.fn>;
      upsert: ReturnType<typeof vi.fn>;
    };
    let mockCandidateRepo: { findById: ReturnType<typeof vi.fn> };
    let mockJobRepo: { findById: ReturnType<typeof vi.fn> };
    let mockTimelineRepo: { create: ReturnType<typeof vi.fn> };

    beforeEach(() => {
      mockMatchRepo = {
        findByJobDescriptionId: vi.fn(),
        findBestScoresPerCandidate: vi.fn(),
        upsert: vi.fn(),
      };
      mockCandidateRepo = {
        findById: vi.fn(),
      };
      mockJobRepo = {
        findById: vi.fn(),
      };
      mockTimelineRepo = {
        create: vi.fn(),
      };
      service = new MatchingService(
        mockMatchRepo as unknown as JobMatchRepository,
        mockCandidateRepo as unknown as CandidateRepository,
        mockJobRepo as unknown as JobRepository,
        mockTimelineRepo as unknown as TimelineRepository,
      );
    });

    it('retrieves matches and performs score queries across repository boundaries', async () => {
      const matchResult: JobMatchResult = {
        id: 1,
        candidate_id: 10,
        job_description_id: 2,
        match_percentage: 92,
        matched_skills: ['TypeScript', 'NestJS'],
        missing_skills: ['GraphQL'],
        experience_match: 'High',
        education_match: 'Strong',
        recommendation: 'Recommend for technical interview',
        evaluated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };
      mockMatchRepo.findByJobDescriptionId.mockResolvedValue([matchResult]);

      const results = await service.getMatchesForJD(2);
      expect(results).toEqual([matchResult]);
      expect(mockMatchRepo.findByJobDescriptionId).toHaveBeenCalledWith(2);
    });
  });
});
