import 'reflect-metadata';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InterviewsService } from '../src/interviews/interviews.service';
import { InterviewRepository } from '@/lib/repositories/interview-repository';
import { CandidateRepository } from '@/lib/repositories/candidate-repository';
import * as interviewDomain from '@/lib/services/interview-service';

describe('InterviewsService (Application Layer)', () => {
  let service: InterviewsService;
  let mockInterviewRepo: InterviewRepository;
  let mockCandidateRepo: CandidateRepository;

  const mockInterview = {
    id: 1,
    candidate_id: 10,
    interviewer_name: 'Sarah Chen',
    scheduled_date: '2026-09-15T14:00:00.000Z',
    duration_minutes: 45,
    status: 'scheduled' as const,
    calendar_event_id: 'cal-123',
    meet_link: 'https://meet.google.com/abc-defg-hij',
    candidates: { full_name: 'Alice Johnson', email: 'alice@example.com' },
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    mockInterviewRepo = {
      findAll: vi.fn().mockResolvedValue([mockInterview]),
      findById: vi.fn().mockResolvedValue(mockInterview),
      create: vi.fn().mockResolvedValue(mockInterview),
      updateStatus: vi.fn().mockResolvedValue({ ...mockInterview, status: 'completed' }),
      update: vi.fn().mockResolvedValue(mockInterview),
      delete: vi.fn().mockResolvedValue(undefined),
    };
    mockCandidateRepo = {
      findAll: vi.fn(),
      findById: vi.fn(),
      findByIds: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
      update: vi.fn(),
      updateStatus: vi.fn(),
      updateByEmail: vi.fn(),
      delete: vi.fn(),
      deleteAll: vi.fn(),
    };
    service = new InterviewsService(mockInterviewRepo, mockCandidateRepo);
  });

  it('findAll() delegates to getInterviews()', async () => {
    vi.spyOn(interviewDomain, 'getInterviews').mockResolvedValue([mockInterview]);
    const result = await service.findAll();
    expect(result).toEqual([mockInterview]);
    expect(interviewDomain.getInterviews).toHaveBeenCalledWith(mockInterviewRepo);
  });

  it('create() delegates to createInterview()', async () => {
    vi.spyOn(interviewDomain, 'createInterview').mockResolvedValue(mockInterview);
    const dto = {
      candidate_id: 10,
      interviewer_name: 'Sarah Chen',
      scheduled_date: '2026-09-15T14:00:00.000Z',
      duration_minutes: 45,
    };
    const result = await service.create(dto);
    expect(result).toEqual(mockInterview);
    expect(interviewDomain.createInterview).toHaveBeenCalledWith(dto, mockInterviewRepo, mockCandidateRepo);
  });

  it('updateStatus() delegates to updateInterviewStatus()', async () => {
    vi.spyOn(interviewDomain, 'updateInterviewStatus').mockResolvedValue({
      ...mockInterview,
      status: 'completed',
    });
    const result = await service.updateStatus(1, { status: 'completed' });
    expect(result.status).toBe('completed');
    expect(interviewDomain.updateInterviewStatus).toHaveBeenCalledWith(1, 'completed', mockInterviewRepo, mockCandidateRepo);
  });
});
