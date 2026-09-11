import { TimelineEvent } from '@/lib/types';

export type CreateTimelineEventData = {
  candidate_id: number;
  event_type: string;
  details?: string | null;
};

export interface TimelineRepository {
  findByCandidateId(candidateId: number): Promise<TimelineEvent[]>;
  create(data: CreateTimelineEventData): Promise<TimelineEvent>;
  findDistinctCandidateIdsByEventType(eventType: string): Promise<number[]>;
}
