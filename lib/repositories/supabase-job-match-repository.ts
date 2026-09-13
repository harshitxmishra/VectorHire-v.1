import { supabase } from '@/lib/supabase/client';
import { JobMatchResult } from '@/lib/types';
import {
  JobMatchRepository,
  JobMatchSortField,
  JobMatchFilters,
  PaginatedJobMatches,
  JobMatchMetrics,
  UpsertJobMatchData,
} from './job-match-repository';

export const MATCH_DIRECTORY_COLUMNS =
  'id, created_at, candidate_id, job_description_id, match_percentage, matched_skills, missing_skills, experience_match, education_match, recommendation, evaluated_at, candidate:candidates!inner(id, full_name, email, college, branch, status, ai_score, resume_url, github)';

const ALLOWED_SORT_FIELDS: JobMatchSortField[] = [
  'match_percentage',
  'evaluated_at',
  'id',
];

export class SupabaseJobMatchRepository implements JobMatchRepository {
  async findByJobDescriptionId(jobDescriptionId: number): Promise<JobMatchResult[]> {
    const { data, error } = await supabase
      .from('job_match_results')
      .select('id, created_at, candidate_id, job_description_id, match_percentage, matched_skills, missing_skills, experience_match, education_match, recommendation, evaluated_at')
      .eq('job_description_id', jobDescriptionId)
      .order('match_percentage', { ascending: false })
      .order('id', { ascending: true });

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

  async findPaginatedByJobId(
    jobDescriptionId: number,
    filters?: JobMatchFilters
  ): Promise<PaginatedJobMatches> {
    const page = Math.max(1, filters?.page ?? 1);
    const limit = Math.max(1, Math.min(100, filters?.limit ?? 25));
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // 1. Fetch overall candidate count in database (to disambiguate empty states)
    const { count: totalCandidatesInDb, error: candidateCountError } = await supabase
      .from('candidates')
      .select('id', { count: 'exact', head: true });

    if (candidateCountError) {
      throw new Error(`Database error fetching candidate count: ${candidateCountError.message}`);
    }

    // 2. Fetch all matches for this JD to compute accurate whole-job summary metrics
    const { data: allJobMatches, error: allMatchesError } = await supabase
      .from('job_match_results')
      .select('match_percentage')
      .eq('job_description_id', jobDescriptionId);

    if (allMatchesError) {
      throw new Error(`Database error fetching job match metrics for JD ${jobDescriptionId}: ${allMatchesError.message}`);
    }

    const totalMatchesForJob = allJobMatches?.length ?? 0;
    const highMatchCount = allJobMatches?.filter((m) => Number(m.match_percentage) >= 80).length ?? 0;
    const averageMatchScore =
      totalMatchesForJob > 0
        ? Math.round(
            allJobMatches!.reduce((sum, m) => sum + Number(m.match_percentage), 0) /
              totalMatchesForJob
          )
        : null;

    const metrics: JobMatchMetrics = {
      totalMatches: totalMatchesForJob,
      highMatchCount,
      averageMatchScore,
    };

    // 3. Query filtered & paginated records with explicit projection
    let query = supabase
      .from('job_match_results')
      .select(MATCH_DIRECTORY_COLUMNS, { count: 'exact' })
      .eq('job_description_id', jobDescriptionId);

    if (typeof filters?.minScore === 'number' && filters.minScore > 0) {
      query = query.gte('match_percentage', filters.minScore);
    }

    if (filters?.status && filters.status !== 'all') {
      query = query.eq('candidates.status', filters.status.toLowerCase());
    }

    if (filters?.college && filters.college !== 'all') {
      query = query.eq('candidates.college', filters.college);
    }

    if (filters?.search && filters.search.trim().length > 0) {
      const sanitized = filters.search.trim().replace(/[%_]/g, '');
      if (sanitized.length > 0) {
        query = query.or(
          `full_name.ilike.%${sanitized}%,email.ilike.%${sanitized}%,college.ilike.%${sanitized}%,branch.ilike.%${sanitized}%`,
          { foreignTable: 'candidates' }
        );
      }
    }

    const sortField: JobMatchSortField =
      filters?.sortBy && ALLOWED_SORT_FIELDS.includes(filters.sortBy)
        ? filters.sortBy
        : 'match_percentage';
    const isAscending = filters?.sortOrder === 'asc';

    query = query
      .order(sortField, { ascending: isAscending })
      .order('id', { ascending: true })
      .range(from, to);

    const { data, count, error } = await query;

    if (error) {
      throw new Error(`Database error querying paginated job matches for JD ${jobDescriptionId}: ${error.message}`);
    }

    const total = count ?? (data?.length ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      matches: (data as any) ?? [],
      total,
      page,
      limit,
      totalPages,
      metrics,
      candidateCount: totalCandidatesInDb ?? 0,
      totalMatchesForJob,
    };
  }

  async upsert(input: UpsertJobMatchData): Promise<JobMatchResult> {
    const { data, error } = await supabase
      .from('job_match_results')
      .upsert(
        { ...input, evaluated_at: new Date().toISOString() },
        { onConflict: 'candidate_id,job_description_id' }
      )
      .select('id, created_at, candidate_id, job_description_id, match_percentage, matched_skills, missing_skills, experience_match, education_match, recommendation, evaluated_at')
      .single();

    if (error) {
      throw new Error(`Database error upserting job match: ${error.message}`);
    }

    return data;
  }
}
