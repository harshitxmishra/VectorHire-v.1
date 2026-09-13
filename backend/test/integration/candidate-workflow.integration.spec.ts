import 'reflect-metadata';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CandidatesService } from '../../src/candidates/candidates.service';
import { InterviewsService } from '../../src/interviews/interviews.service';
import { EmailService } from '../../src/email/email.service';
import { TimelineService } from '../../src/timeline/timeline.service';
import { CandidateRepository } from '@/lib/repositories/candidate-repository';
import { InterviewRepository } from '@/lib/repositories/interview-repository';
import { EmailLogRepository } from '@/lib/repositories/email-log-repository';
import { TimelineRepository } from '@/lib/repositories/timeline-repository';
import { NotFoundException } from '@nestjs/common';
import { Candidate, Interview, EmailLog, TimelineEvent } from '@/lib/types';
import * as emailDomain from '@/lib/services/email-service';
import * as interviewDomain from '@/lib/services/interview-service';

describe('Phase 6.4 Candidate Workflow & Isolation Integration', () => {
  let candidatesService: CandidatesService;
  let interviewsService: InterviewsService;
  let emailService: EmailService;
  let timelineService: TimelineService;

  let mockCandidateRepo: any;
  let mockInterviewRepo: any;
  let mockEmailLogRepo: any;
  let mockTimelineRepo: any;

  const candidateA: Candidate = {
    id: 101,
    created_at: new Date().toISOString(),
    full_name: 'Alice Recruiter Test',
    email: 'alice@example.com',
    college: 'MIT',
    cgpa: 9.5,
    github: 'alice-github',
    status: 'Applied',
    ai_score: 88,
    branch: 'CS',
    best_ai_project: 'Autonomous Agent',
    research_work: 'NeurIPS 2025',
    resume_url: 'https://example.com/resumes/alice.pdf',
    resume_text: 'Extracted skills: Python, React, TypeScript',
    parsing_status: 'success',
    parsed_at: new Date().toISOString(),
    test_la: 90,
    test_code: 95,
    dataset_id: null,
    github_score: 92,
    github_summary: 'Prolific open-source contributor',
    github_languages: ['TypeScript', 'Python'],
    github_portfolio_verdict: 'Exceptional engineer',
    github_highlights: ['Core maintainer of open-source CLI'],
    github_strongest_repo: 'https://github.com/alice/project',
    github_last_analyzed: new Date().toISOString(),
    ai_evaluation: {
      score: 88,
      summary: 'Strong full-stack and systems engineering candidate.',
      strengths: ['Deep TypeScript experience', 'High coding score'],
      weaknesses: ['Limited Cloud DevOps depth'],
      recommendation: 'Advance to technical round immediately',
      interviewQuestions: ['Explain distributed state synchronization'],
    },
    ai_evaluated_at: new Date().toISOString(),
  };

  const interviewA: Interview = {
    id: 501,
    created_at: new Date().toISOString(),
    candidate_id: 101,
    interviewer_name: 'Lead Architect',
    scheduled_date: '2026-09-20T14:00:00.000Z',
    duration_minutes: 60,
    status: 'scheduled',
    calendar_event_id: 'cal-event-101',
    meet_link: 'https://meet.google.com/test-101',
    candidates: { full_name: 'Alice Recruiter Test', email: 'alice@example.com' },
  };

  const emailLogA: EmailLog = {
    id: 701,
    created_at: new Date().toISOString(),
    candidate_id: 101,
    email_type: 'assessment',
    recipient: 'alice@example.com',
    status: 'sent',
    error_message: null,
    sent_at: new Date().toISOString(),
  };

  const timelineEventsA: TimelineEvent[] = [
    { id: 1, created_at: new Date().toISOString(), candidate_id: 101, event_type: 'applied', details: 'Profile ingested' },
    { id: 2, created_at: new Date().toISOString(), candidate_id: 101, event_type: 'resume_parsed', details: 'Extracted text' },
    { id: 3, created_at: new Date().toISOString(), candidate_id: 101, event_type: 'github_analyzed', details: 'Score: 92' },
    { id: 4, created_at: new Date().toISOString(), candidate_id: 101, event_type: 'ai_evaluated', details: 'Score: 88' },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();

    mockCandidateRepo = {
      findAll: vi.fn(),
      findById: vi.fn().mockImplementation(async (id: number) => {
        if (id === 101) return candidateA;
        return null;
      }),
      findByIds: vi.fn().mockImplementation(async (ids: number[]) => {
        return ids.includes(101) ? [candidateA] : [];
      }),
      create: vi.fn(),
      createMany: vi.fn(),
      update: vi.fn(),
      updateStatus: vi.fn().mockImplementation(async (id: number, status: string) => {
        if (id === 101) return { ...candidateA, status };
        throw new Error('Candidate not found');
      }),
      updateByEmail: vi.fn(),
      delete: vi.fn(),
      deleteAll: vi.fn(),
    };

    mockInterviewRepo = {
      findAll: vi.fn().mockResolvedValue([interviewA]),
      findById: vi.fn().mockImplementation(async (id: number) => (id === 501 ? interviewA : null)),
      findByCandidateId: vi.fn().mockImplementation(async (candidateId: number) => {
        return candidateId === 101 ? [interviewA] : [];
      }),
      create: vi.fn().mockResolvedValue(interviewA),
      updateStatus: vi.fn().mockResolvedValue({ ...interviewA, status: 'completed' }),
      update: vi.fn(),
      delete: vi.fn(),
    };

    mockEmailLogRepo = {
      create: vi.fn().mockResolvedValue(emailLogA),
      markAsSent: vi.fn(),
      markAsFailed: vi.fn(),
      findSentCandidateIds: vi.fn().mockResolvedValue([]),
      findByCandidateId: vi.fn().mockImplementation(async (candidateId: number) => {
        return candidateId === 101 ? [emailLogA] : [];
      }),
      findByType: vi.fn(),
    };

    mockTimelineRepo = {
      create: vi.fn(),
      findByCandidateId: vi.fn().mockImplementation(async (candidateId: number) => {
        return candidateId === 101 ? timelineEventsA : [];
      }),
      findAll: vi.fn(),
      deleteByCandidateId: vi.fn(),
    };

    candidatesService = new CandidatesService(mockCandidateRepo as CandidateRepository);
    interviewsService = new InterviewsService(
      mockInterviewRepo as InterviewRepository,
      mockCandidateRepo as CandidateRepository
    );
    emailService = new EmailService(
      mockEmailLogRepo as EmailLogRepository,
      mockCandidateRepo as CandidateRepository
    );
    timelineService = new TimelineService(mockTimelineRepo as TimelineRepository);
  });

  describe('Hermetic End-to-End Candidate Lifecycle', () => {
    it('executes status change with domain integrity', async () => {
      const updated = await candidatesService.updateStatus(101, 'Reviewing');
      expect(updated.status).toBe('Reviewing');
      expect(mockCandidateRepo.updateStatus).toHaveBeenCalledWith(101, 'Reviewing');
    });

    it('schedules interview and queries candidate interviews correctly', async () => {
      vi.spyOn(interviewDomain, 'createInterview').mockResolvedValue(interviewA);

      const interview = await interviewsService.create({
        candidate_id: 101,
        interviewer_name: 'Lead Architect',
        scheduled_date: '2026-09-20T14:00:00.000Z',
        duration_minutes: 60,
      });
      expect(interview.id).toBe(501);

      const list = await interviewsService.findByCandidateId(101);
      expect(list).toHaveLength(1);
      expect(list[0].interviewer_name).toBe('Lead Architect');
    });

    it('dispatches assessment email and retrieves email logs', async () => {
      vi.spyOn(emailDomain, 'sendCandidateEmail').mockResolvedValue({ status: 'sent' });

      const emailResponse = await emailService.sendEmails({
        candidateIds: [101],
        type: 'assessment',
        assessmentTitle: 'System Design Test',
      });
      expect(emailResponse.sent).toBe(1);

      const logs = await emailService.getLogsByCandidateId(101);
      expect(logs).toHaveLength(1);
      expect(logs[0].email_type).toBe('assessment');
    });

    it('retrieves candidate timeline audit events in order', async () => {
      const events = await timelineService.findByCandidateId(101);
      expect(events).toHaveLength(4);
      expect(events.map((e) => e.event_type)).toEqual([
        'applied',
        'resume_parsed',
        'github_analyzed',
        'ai_evaluated',
      ]);
    });
  });

  describe('Cross-Candidate Isolation & Authorization Boundary Enforcement', () => {
    it('denies interview retrieval for non-existent / unauthorized candidate ID', async () => {
      await expect(interviewsService.findByCandidateId(999)).rejects.toThrow(
        NotFoundException
      );
    });

    it('denies email log retrieval for non-existent / unauthorized candidate ID', async () => {
      await expect(emailService.getLogsByCandidateId(999)).rejects.toThrow(
        NotFoundException
      );
    });

    it('returns empty list when candidate has no interviews instead of leaking other candidates', async () => {
      // Candidate exists but has no interviews
      mockCandidateRepo.findById.mockImplementation(async (id: number) => {
        if (id === 102) return { ...candidateA, id: 102, full_name: 'Bob' };
        return null;
      });

      const interviews = await interviewsService.findByCandidateId(102);
      expect(interviews).toEqual([]);
      expect(mockInterviewRepo.findByCandidateId).toHaveBeenCalledWith(102);
    });

    it('returns empty list when candidate has no email logs instead of leaking other candidates', async () => {
      mockCandidateRepo.findById.mockImplementation(async (id: number) => {
        if (id === 102) return { ...candidateA, id: 102, full_name: 'Bob' };
        return null;
      });

      const logs = await emailService.getLogsByCandidateId(102);
      expect(logs).toEqual([]);
      expect(mockEmailLogRepo.findByCandidateId).toHaveBeenCalledWith(102);
    });
  });

  describe('Comprehensive Cross-Phase Recruiter Acceptance (Phases 6.1 - 6.5)', () => {
    it('executes full recruiter journey from ingestion to interview, email, timeline and dashboard reflection', async () => {
      // 1. Ingestion / Initial state
      expect(candidateA.status).toBe('Applied');
      expect(candidateA.ai_score).toBe(88);
      expect(candidateA.github_score).toBe(92);

      // 2. Candidate status progression: Applied -> Reviewing
      const reviewingCandidate = await candidatesService.updateStatus(101, 'Reviewing');
      expect(reviewingCandidate.status).toBe('Reviewing');

      // 3. Shortlist candidate based on high AI fit & GitHub signals
      const shortlistedCandidate = await candidatesService.updateStatus(101, 'Shortlisted');
      expect(shortlistedCandidate.status).toBe('Shortlisted');

      // 4. Communication: Send technical assessment
      vi.spyOn(emailDomain, 'sendCandidateEmail').mockResolvedValue({ status: 'sent' });
      const emailResult = await emailService.sendEmails({
        candidateIds: [101],
        type: 'assessment',
        assessmentTitle: 'System Design Assessment',
      });
      expect(emailResult.sent).toBe(1);

      // 5. Candidate status progression: Assessment Sent
      const assessmentCandidate = await candidatesService.updateStatus(101, 'Assessment Sent');
      expect(assessmentCandidate.status).toBe('Assessment Sent');

      // 6. Interview scheduling: Schedule technical interview
      vi.spyOn(interviewDomain, 'createInterview').mockResolvedValue(interviewA);
      const scheduledInterview = await interviewsService.create({
        candidate_id: 101,
        interviewer_name: 'Lead Architect',
        scheduled_date: '2026-09-20T14:00:00.000Z',
        duration_minutes: 60,
      });
      expect(scheduledInterview.id).toBe(501);
      expect(scheduledInterview.status).toBe('scheduled');

      // 7. Complete interview & extend offer
      const completedInterview = await interviewsService.updateStatus(501, 'completed');
      expect(completedInterview.status).toBe('completed');

      const hiredCandidate = await candidatesService.updateStatus(101, 'Hired');
      expect(hiredCandidate.status).toBe('Hired');

      // 8. Verify timeline continuity
      const timeline = await timelineService.findByCandidateId(101);
      expect(timeline.length).toBeGreaterThanOrEqual(4);
      expect(timeline[0].event_type).toBe('applied');

      // 9. Verify candidate email history
      const emailHistory = await emailService.getLogsByCandidateId(101);
      expect(emailHistory).toHaveLength(1);
      expect(emailHistory[0].email_type).toBe('assessment');
    });
  });
});

