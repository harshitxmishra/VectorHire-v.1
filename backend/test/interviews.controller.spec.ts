import 'reflect-metadata';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InterviewsController } from '../src/interviews/interviews.controller';
import { InterviewsService } from '../src/interviews/interviews.service';

describe('InterviewsController', () => {
  let controller: InterviewsController;
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

  const mockService = {
    findAll: vi.fn().mockResolvedValue([mockInterview]),
    findByCandidateId: vi.fn().mockResolvedValue([mockInterview]),
    create: vi.fn().mockResolvedValue(mockInterview),
    updateStatus: vi.fn().mockResolvedValue({ ...mockInterview, status: 'completed' }),
  };

  beforeEach(() => {
    service = mockService as unknown as InterviewsService;
    controller = new InterviewsController(service);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should list all interviews when candidateId is not provided (GET /api/v1/interviews)', async () => {
    const result = await controller.findAll();
    expect(result).toEqual([mockInterview]);
    expect(service.findAll).toHaveBeenCalled();
  });

  it('should list candidate interviews when candidateId is provided (GET /api/v1/interviews?candidateId=10)', async () => {
    const result = await controller.findAll('10');
    expect(result).toEqual([mockInterview]);
    expect(service.findByCandidateId).toHaveBeenCalledWith(10);
  });

  it('should throw BadRequestException when candidateId is invalid', async () => {
    await expect(controller.findAll('invalid-id')).rejects.toThrow(
      'Invalid candidateId. Must be a positive integer.'
    );
  });

  it('should create interview (POST /api/v1/interviews)', async () => {
    const dto = {
      candidate_id: 10,
      interviewer_name: 'Sarah Chen',
      scheduled_date: '2026-09-15T14:00:00.000Z',
      duration_minutes: 45,
    };
    const result = await controller.create(dto);
    expect(result).toEqual(mockInterview);
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('should update interview status (PATCH /api/v1/interviews/:id)', async () => {
    const result = await controller.updateStatus(1, { status: 'completed' });
    expect(result.status).toBe('completed');
    expect(service.updateStatus).toHaveBeenCalledWith(1, { status: 'completed' });
  });
});
