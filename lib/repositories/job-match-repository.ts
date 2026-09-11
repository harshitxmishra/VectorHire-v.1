import { JobMatchResult } from '@/lib/types';

export interface UpsertJobMatchData {
  candidate_id: number;
  job_description_id: number;
  match_percentage: number;
  matched_skills: string[];
  missing_skills: string[];
  experience_match: string;
  education_match: string;
  recommendation: string;
}

export interface JobMatchRepository {
  findByJobDescriptionId(jobDescriptionId: number): Promise<JobMatchResult[]>;
  findBestScoresPerCandidate(): Promise<Record<number, number>>;
  upsert(data: UpsertJobMatchData): Promise<JobMatchResult>;
}
