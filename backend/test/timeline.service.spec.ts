import 'reflect-metadata';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TimelineService } from '../src/timeline/timeline.service';
import * as timelineDomain from '@/lib/services/timeline-service';

describe('TimelineService (Application Layer)', () => {
  let service: TimelineService;

  const mockTimelineEvent = {
    id: 1,
    candidate_id: 10,
    event_type: 'applied',
    details: 'Imported into dataset',
    created_at: '2026-09-11T10:00:00.000Z',
  };

  beforeEach(() => {
    service = new TimelineService();
    vi.restoreAllMocks();
  });

  it('findByCandidateId() delegates to getTimeline()', async () => {
    vi.spyOn(timelineDomain, 'getTimeline').mockResolvedValue([mockTimelineEvent]);
    const result = await service.findByCandidateId(10);
    expect(result).toEqual([mockTimelineEvent]);
    expect(timelineDomain.getTimeline).toHaveBeenCalledWith(10);
  });

  it('logEvent() delegates to logTimelineEvent()', async () => {
    const logSpy = vi.spyOn(timelineDomain, 'logTimelineEvent').mockResolvedValue(undefined as any);
    await service.logEvent(10, 'status_changed', 'Moved to Reviewing');
    expect(logSpy).toHaveBeenCalledWith(10, 'status_changed', 'Moved to Reviewing');
  });

  it('getDistinctCandidateIds() delegates to getDistinctCandidateIdsForEvent()', async () => {
    vi.spyOn(timelineDomain, 'getDistinctCandidateIdsForEvent').mockResolvedValue(new Set([10, 20]));
    const result = await service.getDistinctCandidateIds('assessment_sent');
    expect(result).toEqual(new Set([10, 20]));
    expect(timelineDomain.getDistinctCandidateIdsForEvent).toHaveBeenCalledWith('assessment_sent');
  });
});
