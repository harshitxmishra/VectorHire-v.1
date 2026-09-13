import 'reflect-metadata';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TimelineController } from '../src/timeline/timeline.controller';
import { TimelineService } from '../src/timeline/timeline.service';

describe('TimelineController', () => {
  let controller: TimelineController;
  let service: TimelineService;

  const mockTimelineEvent = {
    id: 1,
    candidate_id: 10,
    event_type: 'applied',
    details: 'Imported into dataset',
    created_at: '2026-09-11T10:00:00.000Z',
  };

  const mockService = {
    findByCandidateId: vi.fn().mockResolvedValue([mockTimelineEvent]),
  };

  beforeEach(() => {
    service = mockService as unknown as TimelineService;
    controller = new TimelineController(service);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return candidate timeline events (GET /api/v1/candidates/:id/timeline)', async () => {
    const result = await controller.getTimeline(10);
    expect(result).toEqual([mockTimelineEvent]);
    expect(service.findByCandidateId).toHaveBeenCalledWith(10);
  });
});

describe('TimelineFeedController', () => {
  let feedController: any;
  let service: any;

  const mockTimelineEvent = {
    id: 1,
    candidate_id: 10,
    event_type: 'applied',
    details: 'Imported into dataset',
    created_at: '2026-09-11T10:00:00.000Z',
  };

  const mockService = {
    findRecent: vi.fn().mockResolvedValue([mockTimelineEvent]),
  };

  beforeEach(async () => {
    const { TimelineFeedController } = await import('../src/timeline/timeline.controller');
    service = mockService;
    feedController = new TimelineFeedController(service);
  });

  it('should return recent timeline events with default limit', async () => {
    const result = await feedController.getRecentTimeline();
    expect(result).toEqual([mockTimelineEvent]);
    expect(service.findRecent).toHaveBeenCalledWith(20);
  });

  it('should return recent timeline events with custom limit', async () => {
    const result = await feedController.getRecentTimeline('10');
    expect(result).toEqual([mockTimelineEvent]);
    expect(service.findRecent).toHaveBeenCalledWith(10);
  });
});
