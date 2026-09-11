import { supabase } from '@/lib/supabase/client';
import { JobMatchResult } from '@/lib/types';
import {
  JobMatchRepository,
  UpsertJobMatchData,
} from './job-match-repository';

export class SupabaseJobMatchRepository implements JobMatchRepository {
  async findByJobDescriptionId(jobDescriptionId: number): Promise<JobMatchResult[]> {
    const { data, error } = await supabase
      .from('job_match_results')
      .select('*')
      .eq('job_description_id', jobDescriptionId)
      .order('match_percentage', { ascending: false });

    if (error) {
      throw new Error(`Database error fetching job matches for JD ${jobDescriptionId}: ${error.message}`);
    }

    return data ?? [];
  }

  async findBestScoresPerCandidate(): Promise<Record<number, number>> {
    const { data, error } = await supabase
      .from('job_match_results')
      .select('candidate_id, match_percentage');

    if (error) {
      throw new Error(`Database error fetching best matches per candidate: ${error.message}`);
    }

    const best: Record<number, number> = {};
    (data ?? []).forEach((row) => {
      if (!(row.candidate_id in best) || row.match_percentage > best[row.candidate_id]) {
        best[row.candidate_id] = row.match_percentage;
      }
    });

    return best;
  }

  async upsert(input: UpsertJobMatchData): Promise<JobMatchResult> {
    const { data, error } = await supabase
      .from('job_match_results')
      .upsert(
        { ...input, evaluated_at: new Date().toISOString() },
        { onConflict: 'candidate_id,job_description_id' }
      )
      .select()
      .single();

    if (error) {
      throw new Error(`Database error upserting job match: ${error.message}`);
    }

    return data;
  }
}
