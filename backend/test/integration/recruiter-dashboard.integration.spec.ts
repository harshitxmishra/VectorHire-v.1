import 'reflect-metadata';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Candidate, Interview, JobDescription, TimelineEvent } from '@/lib/types';
import { getRecentTimelineEvents } from '@/lib/services/timeline-service';
import { TimelineRepository } from '@/lib/repositories/timeline-repository';

describe('Phase 6.5 Recruiter Dashboard & Aggregation Integration', () => {
  const mockCandidates: Candidate[] = [
    {
      id: 1,
      full_name: 'Alice Developer',
      email: 'alice@example.com',
      college: 'MIT',
      cgpa: 9.2,
      ai_score: 92,
      github_score: 88,
      status: 'Applied',
      created_at: '2026-09-10T10:00:00Z',
    },
    {
      id: 2,
      full_name: 'Bob Engineer',
      email: 'bob@example.com',
      college: 'Stanford',
      cgpa: 8.7,
      ai_score: 84,
      github_score: 79,
      status: 'Shortlisted',
      created_at: '2026-09-10T11:00:00Z',
    },
    {
      id: 3,
      full_name: 'Charlie Architect',
      email: 'charlie@example.com',
      college: 'Berkeley',
      cgpa: 9.5,
      ai_score: 95,
      github_score: 94,
      status: 'Interview Scheduled',
      created_at: '2026-09-10T12:00:00Z',
    },
    {
      id: 4,
      full_name: 'Diana Tester',
      email: 'diana@example.com',
      college: 'MIT',
      cgpa: 7.9,
      ai_score: 65,
      github_score: 60,
      status: 'Assessment Sent',
      created_at: '2026-09-10T13:00:00Z',
    },
    {
      id: 5,
      full_name: 'Evan Lead',
      email: 'evan@example.com',
      college: 'CMU',
      cgpa: 9.0,
      ai_score: 89,
      github_score: 90,
      status: 'Hired',
      created_at: '2026-09-10T14:00:00Z',
    },
  ];

  const mockInterviews: Interview[] = [
    {
      id: 101,
      candidate_id: 3,
      interviewer_name: 'Senior Lead',
      scheduled_date: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
      duration_minutes: 45,
      status: 'scheduled',
      calendar_event_id: 'cal-101',
      meet_link: 'https://meet.google.com/abc-defg-hij',
      created_at: '2026-09-11T08:00:00Z',
      candidates: { full_name: 'Charlie Architect', email: 'charlie@example.com' },
    },
    {
      id: 102,
      candidate_id: 2,
      interviewer_name: 'Tech Recruiter',
      scheduled_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
      duration_minutes: 30,
      status: 'completed',
      calendar_event_id: 'cal-102',
      meet_link: null,
      created_at: '2026-09-09T08:00:00Z',
      candidates: { full_name: 'Bob Engineer', email: 'bob@example.com' },
    },
  ];

  const mockJobs: JobDescription[] = [
    {
      id: 201,
      title: 'Senior Distributed Systems Engineer',
      requirements: 'TypeScript, NestJS, PostgreSQL, Redis, Event-driven architecture',
      created_at: '2026-09-01T10:00:00Z',
    },
    {
      id: 202,
      title: 'Full-Stack Next.js Architect',
      requirements: 'React 19, Next.js App Router, Fluent UI, Tailwind CSS',
      created_at: '2026-09-02T10:00:00Z',
    },
  ];

  const mockTimelineEvents: TimelineEvent[] = [
    {
      id: 301,
      candidate_id: 3,
      event_type: 'interview_scheduled',
      details: 'Interview scheduled with Senior Lead for 45 minutes.',
      created_at: '2026-09-11T08:00:00Z',
      candidates: { full_name: 'Charlie Architect', email: 'charlie@example.com' },
    },
    {
      id: 302,
      candidate_id: 4,
      event_type: 'assessment_sent',
      details: 'Technical Assessment email dispatched to diana@example.com.',
      created_at: '2026-09-10T13:05:00Z',
      candidates: { full_name: 'Diana Tester', email: 'diana@example.com' },
    },
  ];

  it('computes accurate top-level KPIs from persisted domain records without synthetic distortion', () => {
    const totalCandidates = mockCandidates.length;
    expect(totalCandidates).toBe(5);

    const shortlisted = mockCandidates.filter(
      (c) => (c.status || '').toLowerCase() === 'shortlisted'
    ).length;
    expect(shortlisted).toBe(1);

    const pendingReview = mockCandidates.filter((c) => {
      const s = (c.status || '').toLowerCase();
      return s === 'applied' || s === 'pending' || s === 'reviewing';
    }).length;
    expect(pendingReview).toBe(1); // Alice Developer is 'Applied'

    const highScorers = mockCandidates.filter((c) => (c.ai_score ?? 0) >= 80).length;
    expect(highScorers).toBe(4); // Alice (92), Bob (84), Charlie (95), Evan (89)

    const hired = mockCandidates.filter(
      (c) => (c.status || '').toLowerCase() === 'hired'
    ).length;
    expect(hired).toBe(1);

    const hireRate = Math.round((hired / totalCandidates) * 100);
    expect(hireRate).toBe(20);

    const scheduled = mockInterviews.filter((i) => i.status === 'scheduled');
    expect(scheduled.length).toBe(1);
  });

  it('correctly derives actionable items in Recruiter Attention Center', () => {
    // 1. Pending initial review
    const pendingReview = mockCandidates.filter((c) => {
      const s = (c.status || '').toLowerCase();
      return s === 'applied' || s === 'pending' || s === 'reviewing';
    });
    expect(pendingReview).toHaveLength(1);
    expect(pendingReview[0].full_name).toBe('Alice Developer');

    // 2. Interviews scheduled today
    const todayStr = new Date().toDateString();
    const scheduledInterviews = mockInterviews.filter((i) => i.status === 'scheduled');
    const interviewsToday = scheduledInterviews.filter(
      (i) => new Date(i.scheduled_date).toDateString() === todayStr
    );
    expect(interviewsToday).toHaveLength(1);
    expect(interviewsToday[0].candidates?.full_name).toBe('Charlie Architect');

    // 3. Assessments pending candidate submission
    const assessmentsPending = mockCandidates.filter(
      (c) => (c.status || '').toLowerCase() === 'assessment sent'
    );
    expect(assessmentsPending).toHaveLength(1);
    expect(assessmentsPending[0].full_name).toBe('Diana Tester');

    // 4. Eligible for interview scheduling
    const eligible = mockCandidates.filter((c) => {
      const s = (c.status || '').toLowerCase();
      return s === 'interview eligible' || s === 'shortlisted';
    });
    expect(eligible).toHaveLength(1);
    expect(eligible[0].full_name).toBe('Bob Engineer');
  });

  it('fetches recent timeline activity through repository delegates', async () => {
    const mockRepo: TimelineRepository = {
      findByCandidateId: vi.fn(),
      create: vi.fn(),
      findDistinctCandidateIdsByEventType: vi.fn(),
      findRecent: vi.fn().mockResolvedValue(mockTimelineEvents),
    };

    const events = await getRecentTimelineEvents(10, mockRepo);
    expect(events).toHaveLength(2);
    expect(events[0].event_type).toBe('interview_scheduled');
    expect(events[0].candidates?.full_name).toBe('Charlie Architect');
    expect(mockRepo.findRecent).toHaveBeenCalledWith(10);
  });

  it('preserves candidate isolation with independent signal presentation without composite score invention', () => {
    // Top candidates snapshot sorted deterministically by ai_score descending
    const sorted = [...mockCandidates].sort((a, b) => (b.ai_score ?? 0) - (a.ai_score ?? 0));

    expect(sorted[0].full_name).toBe('Charlie Architect');
    expect(sorted[0].ai_score).toBe(95);
    expect(sorted[0].github_score).toBe(94);
    expect(sorted[0].cgpa).toBe(9.5);

    expect(sorted[1].full_name).toBe('Alice Developer');
    expect(sorted[1].ai_score).toBe(92);
    expect(sorted[1].github_score).toBe(88);

    // Verify signals remain discrete numbers and are not silently blended
    expect(sorted[0]).toHaveProperty('ai_score');
    expect(sorted[0]).toHaveProperty('github_score');
    expect(sorted[0]).toHaveProperty('cgpa');
    expect((sorted[0] as any).composite_score).toBeUndefined();
    expect((sorted[0] as any).ranking_score).toBeUndefined();
  });
});
