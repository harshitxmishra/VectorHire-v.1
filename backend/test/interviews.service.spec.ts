import 'reflect-metadata';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InterviewsService } from '../src/interviews/interviews.service';
import * as interviewDomain from '@/lib/services/interview-service';

describe('InterviewsService (Application Layer)', () => {
  let service: InterviewsService;

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
    service = new InterviewsService();
    vi.restoreAllMocks();
  });

  it('findAll() delegates to getInterviews()', async () => {
    vi.spyOn(interviewDomain, 'getInterviews').mockResolvedValue([mockInterview]);
    const result = await service.findAll();
    expect(result).toEqual([mockInterview]);
    expect(interviewDomain.getInterviews).toHaveBeenCalled();
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
    expect(interviewDomain.createInterview).toHaveBeenCalledWith(dto);
  });

  it('updateStatus() delegates to updateInterviewStatus()', async () => {
    vi.spyOn(interviewDomain, 'updateInterviewStatus').mockResolvedValue({
      ...mockInterview,
      status: 'completed',
    });
    const result = await service.updateStatus(1, { status: 'completed' });
    expect(result.status).toBe('completed');
    expect(interviewDomain.updateInterviewStatus).toHaveBeenCalledWith(1, 'completed');
  });
});
