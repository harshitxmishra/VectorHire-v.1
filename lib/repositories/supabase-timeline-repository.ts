import { supabase } from '@/lib/supabase/client';
import { TimelineEvent } from '@/lib/types';
import {
  TimelineRepository,
  CreateTimelineEventData,
} from './timeline-repository';

export class SupabaseTimelineRepository implements TimelineRepository {
  async findByCandidateId(candidateId: number): Promise<TimelineEvent[]> {
    const { data, error } = await supabase
      .from('candidate_timeline')
      .select('*')
      .eq('candidate_id', candidateId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Database error fetching timeline for candidate ${candidateId}: ${error.message}`);
    }
    return data ?? [];
  }

  async create(input: CreateTimelineEventData): Promise<TimelineEvent> {
    const { data, error } = await supabase
      .from('candidate_timeline')
      .insert({
        candidate_id: input.candidate_id,
        event_type: input.event_type,
        details: input.details ?? null,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Database error creating timeline event: ${error.message}`);
    }
    return data;
  }

  async findDistinctCandidateIdsByEventType(eventType: string): Promise<number[]> {
    const { data, error } = await supabase
      .from('candidate_timeline')
      .select('candidate_id')
      .eq('event_type', eventType);

    if (error) {
      throw new Error(`Database error fetching candidates for event type ${eventType}: ${error.message}`);
    }
    return (data ?? []).map((row) => row.candidate_id);
  }
}
