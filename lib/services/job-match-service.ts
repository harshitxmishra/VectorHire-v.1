import { supabase } from '@/lib/supabase/client';
import { JobMatchResult } from '@/lib/types';

export async function getJobMatchesForJD(jobDescriptionId: number): Promise<JobMatchResult[]> {
  const { data, error } = await supabase
    .from('job_match_results')
    .select('*')
    .eq('job_description_id', jobDescriptionId)
    .order('match_percentage', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getBestMatchPerCandidate(): Promise<Record<number, number>> {
  const { data, error } = await supabase
    .from('job_match_results')
    .select('candidate_id, match_percentage');

  if (error) {
    throw new Error(error.message);
  }

  const best: Record<number, number> = {};
  (data ?? []).forEach((row) => {
    if (!(row.candidate_id in best) || row.match_percentage > best[row.candidate_id]) {
      best[row.candidate_id] = row.match_percentage;
    }
  });

  return best;
}

export interface UpsertJobMatchInput {
  candidate_id: number;
  job_description_id: number;
  match_percentage: number;
  matched_skills: string[];
  missing_skills: string[];
  experience_match: string;
  education_match: string;
  recommendation: string;
}

export async function upsertJobMatch(input: UpsertJobMatchInput): Promise<JobMatchResult> {
  const { data, error } = await supabase
    .from('job_match_results')
    .upsert(
      { ...input, evaluated_at: new Date().toISOString() },
      { onConflict: 'candidate_id,job_description_id' }
    )
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
