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

export type JobMatchSortField = 'match_percentage' | 'evaluated_at' | 'id';
export type JobMatchSortOrder = 'asc' | 'desc';

export interface JobMatchMetrics {
  totalMatches: number;
  highMatchCount: number;
  averageMatchScore: number | null;
}

export interface JobMatchFilters {
  search?: string;
  minScore?: number;
  status?: string;
  college?: string;
  sortBy?: JobMatchSortField;
  sortOrder?: JobMatchSortOrder;
  page?: number;
  limit?: number;
}

export interface JobMatchWithCandidate extends JobMatchResult {
  candidate: {
    id: number;
    full_name: string;
    email: string;
    college: string;
    branch: string | null;
    status: string;
    ai_score: number;
    resume_url: string | null;
    github: string | null;
  };
}

export interface PaginatedJobMatches {
  matches: JobMatchWithCandidate[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  metrics: JobMatchMetrics;
  candidateCount: number;
  totalMatchesForJob: number;
}

export interface JobMatchRepository {
  findByJobDescriptionId(jobDescriptionId: number): Promise<JobMatchResult[]>;
  findBestScoresPerCandidate(): Promise<Record<number, number>>;
  findPaginatedByJobId(
    jobDescriptionId: number,
    filters?: JobMatchFilters
  ): Promise<PaginatedJobMatches>;
  upsert(data: UpsertJobMatchData): Promise<JobMatchResult>;
}
