import { supabase } from '@/lib/supabase/client';
import { TimelineEvent } from '@/lib/types';

export async function logTimelineEvent(
  candidateId: number,
  eventType: string,
  details?: string
) {
  const { error } = await supabase
    .from('candidate_timeline')
    .insert({ candidate_id: candidateId, event_type: eventType, details: details ?? null });

  if (error) {
    // Timeline logging is best-effort and must never break the calling workflow.
    console.error('Failed to log timeline event:', error.message);
  }
}

export async function getTimeline(candidateId: number): Promise<TimelineEvent[]> {
  const { data, error } = await supabase
    .from('candidate_timeline')
    .select('*')
    .eq('candidate_id', candidateId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getDistinctCandidateIdsForEvent(eventType: string): Promise<Set<number>> {
  const { data, error } = await supabase
    .from('candidate_timeline')
    .select('candidate_id')
    .eq('event_type', eventType);

  if (error) {
    throw new Error(error.message);
  }

  return new Set((data ?? []).map((row) => row.candidate_id));
}
