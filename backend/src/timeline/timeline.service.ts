import { Injectable, InternalServerErrorException } from '@nestjs/common';
import {
  getTimeline,
  logTimelineEvent,
  getDistinctCandidateIdsForEvent,
} from '@/lib/services/timeline-service';
import { TimelineEvent } from '@/lib/types';

@Injectable()
export class TimelineService {
  async findByCandidateId(candidateId: number): Promise<TimelineEvent[]> {
    try {
      return await getTimeline(candidateId);
    } catch (error) {
      const message = error instanceof Error ? error.message : `Failed to fetch timeline for candidate ${candidateId}`;
      throw new InternalServerErrorException(message);
    }
  }

  async logEvent(candidateId: number, eventType: string, details?: string): Promise<void> {
    await logTimelineEvent(candidateId, eventType, details);
  }

  async getDistinctCandidateIds(eventType: string): Promise<Set<number>> {
    try {
      return await getDistinctCandidateIdsForEvent(eventType);
    } catch (error) {
      const message = error instanceof Error ? error.message : `Failed to fetch candidate IDs for event ${eventType}`;
      throw new InternalServerErrorException(message);
    }
  }
}
