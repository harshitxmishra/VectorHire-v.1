import {
  Injectable,
  Inject,
  InternalServerErrorException,
} from '@nestjs/common';
import { TimelineRepository } from '@/lib/repositories/timeline-repository';
import { TIMELINE_REPOSITORY } from './timeline.constants';
import {
  getTimeline,
  logTimelineEvent,
  getDistinctCandidateIdsForEvent,
} from '@/lib/services/timeline-service';
import { TimelineEvent } from '@/lib/types';

@Injectable()
export class TimelineService {
  constructor(
    @Inject(TIMELINE_REPOSITORY)
    private readonly timelineRepository: TimelineRepository,
  ) {}

  async findByCandidateId(candidateId: number): Promise<TimelineEvent[]> {
    try {
      return await getTimeline(candidateId, this.timelineRepository);
    } catch (error) {
      const message = error instanceof Error ? error.message : `Failed to fetch timeline for candidate ${candidateId}`;
      throw new InternalServerErrorException(message);
    }
  }

  async logEvent(candidateId: number, eventType: string, details?: string): Promise<void> {
    await logTimelineEvent(candidateId, eventType, details, this.timelineRepository);
  }

  async getDistinctCandidateIds(eventType: string): Promise<Set<number>> {
    try {
      return await getDistinctCandidateIdsForEvent(eventType, this.timelineRepository);
    } catch (error) {
      const message = error instanceof Error ? error.message : `Failed to fetch candidate IDs for event ${eventType}`;
      throw new InternalServerErrorException(message);
    }
  }
}
