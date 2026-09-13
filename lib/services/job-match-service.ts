import { JobMatchResult } from '@/lib/types';
import {
  JobMatchRepository,
  UpsertJobMatchData,
  JobMatchFilters,
  PaginatedJobMatches,
} from '@/lib/repositories/job-match-repository';
import { SupabaseJobMatchRepository } from '@/lib/repositories/supabase-job-match-repository';

export type UpsertJobMatchInput = UpsertJobMatchData;

const defaultJobMatchRepository = new SupabaseJobMatchRepository();

export async function getJobMatchesForJD(
  jobDescriptionId: number,
  repo: JobMatchRepository = defaultJobMatchRepository
): Promise<JobMatchResult[]> {
  return repo.findByJobDescriptionId(jobDescriptionId);
}

export async function getJobMatchesPaginated(
  jobDescriptionId: number,
  filters?: JobMatchFilters,
  repo: JobMatchRepository = defaultJobMatchRepository
): Promise<PaginatedJobMatches> {
  return repo.findPaginatedByJobId(jobDescriptionId, filters);
}

export async function getBestMatchPerCandidate(
  repo: JobMatchRepository = defaultJobMatchRepository
): Promise<Record<number, number>> {
  return repo.findBestScoresPerCandidate();
}

export async function upsertJobMatch(
  input: UpsertJobMatchInput,
  repo: JobMatchRepository = defaultJobMatchRepository
): Promise<JobMatchResult> {
  return repo.upsert(input);
}
