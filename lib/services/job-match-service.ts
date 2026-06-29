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
