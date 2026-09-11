import { TimelineEvent } from '@/lib/types';
import { TimelineRepository } from '@/lib/repositories/timeline-repository';
import { SupabaseTimelineRepository } from '@/lib/repositories/supabase-timeline-repository';

const defaultTimelineRepository: TimelineRepository = new SupabaseTimelineRepository();

export async function logTimelineEvent(
  candidateId: number,
  eventType: string,
  details?: string,
  repo: TimelineRepository = defaultTimelineRepository
): Promise<void> {
  try {
    await repo.create({
      candidate_id: candidateId,
      event_type: eventType,
      details: details ?? null,
    });
  } catch (error) {
    // Timeline logging is best-effort and must never break the calling workflow.
    const message = error instanceof Error ? error.message : String(error);
    console.error('Failed to log timeline event:', message);
  }
}

export async function getTimeline(
  candidateId: number,
  repo: TimelineRepository = defaultTimelineRepository
): Promise<TimelineEvent[]> {
  return repo.findByCandidateId(candidateId);
}

export async function getDistinctCandidateIdsForEvent(
  eventType: string,
  repo: TimelineRepository = defaultTimelineRepository
): Promise<Set<number>> {
  const ids = await repo.findDistinctCandidateIdsByEventType(eventType);
  return new Set(ids);
}
