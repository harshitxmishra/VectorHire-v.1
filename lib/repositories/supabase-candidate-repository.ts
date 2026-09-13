import { supabase } from '@/lib/supabase/client';
import { Candidate, PipelineStage } from '@/lib/types';
import {
  CandidateRepository,
  CandidateFilters,
  CandidateSortField,
  PaginatedCandidates,
  CreateCandidateData,
  UpdateCandidateData,
} from './candidate-repository';

export const CANDIDATE_DIRECTORY_COLUMNS =
  'id, full_name, email, college, branch, status, ai_score, test_code, test_la, resume_url, github, created_at';

const ALLOWED_SORTS: Record<CandidateSortField, string> = {
  ai_score: 'ai_score',
  created_at: 'created_at',
  full_name: 'full_name',
  test_code: 'test_code',
  id: 'id',
};

export class SupabaseCandidateRepository implements CandidateRepository {
  async findAll(filters?: CandidateFilters): Promise<Candidate[]> {
    let query = supabase
      .from('candidates')
      .select('*')
      .order('ai_score', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.college) {
      query = query.eq('college', filters.college);
    }
    if (filters?.minScore !== undefined) {
      query = query.gte('ai_score', filters.minScore);
    }
    if (filters?.maxScore !== undefined) {
      query = query.lte('ai_score', filters.maxScore);
    }
    if (filters?.search) {
      query = query.or(
        `full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,college.ilike.%${filters.search}%,branch.ilike.%${filters.search}%`
      );
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit ?? 10) - 1);
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(`Database error fetching candidates: ${error.message}`);
    }
    return data ?? [];
  }

  async findPaginated(filters?: CandidateFilters): Promise<PaginatedCandidates> {
    const page = filters?.page && filters.page > 0 ? filters.page : 1;
    const limit = filters?.limit && filters.limit > 0 ? Math.min(filters.limit, 100) : 20;
    const offset = filters?.offset !== undefined ? filters.offset : (page - 1) * limit;

    let query = supabase
      .from('candidates')
      .select(CANDIDATE_DIRECTORY_COLUMNS, { count: 'exact' });

    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }
    if (filters?.college && filters.college !== 'all') {
      query = query.eq('college', filters.college);
    }
    if (filters?.minScore !== undefined && filters.minScore > 0) {
      query = query.gte('ai_score', filters.minScore);
    }
    if (filters?.maxScore !== undefined) {
      query = query.lte('ai_score', filters.maxScore);
    }
    if (filters?.search && filters.search.trim()) {
      const s = filters.search.trim();
      query = query.or(
        `full_name.ilike.%${s}%,email.ilike.%${s}%,college.ilike.%${s}%,branch.ilike.%${s}%`
      );
    }

    // Sort configuration with allowlist
    const sortField =
      filters?.sortBy && ALLOWED_SORTS[filters.sortBy]
        ? ALLOWED_SORTS[filters.sortBy]
        : 'ai_score';
    const isAsc = filters?.sortOrder === 'asc';

    query = query.order(sortField, { ascending: isAsc });

    // Deterministic secondary sort
    if (sortField !== 'id') {
      query = query.order('id', { ascending: true });
    }

    // Range slicing
    query = query.range(offset, offset + limit - 1);

    const { data, count, error } = await query;
    if (error) {
      throw new Error(`Database error fetching paginated candidates: ${error.message}`);
    }

    const total = count ?? data?.length ?? 0;
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      candidates: (data as Candidate[]) ?? [],
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findById(id: number): Promise<Candidate | null> {
    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(`Database error fetching candidate ${id}: ${error.message}`);
    }
    return data;
  }

  async findByIds(ids: number[]): Promise<Candidate[]> {
    if (ids.length === 0) return [];

    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .in('id', ids);

    if (error) {
      throw new Error(`Database error fetching candidates: ${error.message}`);
    }
    return data ?? [];
  }

  async create(candidate: CreateCandidateData): Promise<Candidate> {
    const { data, error } = await supabase
      .from('candidates')
      .insert(candidate)
      .select()
      .single();

    if (error) {
      throw new Error(`Database error creating candidate: ${error.message}`);
    }
    return data;
  }

  async createMany(candidates: CreateCandidateData[]): Promise<Candidate[]> {
    if (candidates.length === 0) return [];

    const { data, error } = await supabase
      .from('candidates')
      .insert(candidates)
      .select();

    if (error) {
      throw new Error(`Database error bulk-inserting candidates: ${error.message}`);
    }
    return data ?? [];
  }

  async updateStatus(id: number, status: PipelineStage | string): Promise<Candidate> {
    const { data, error } = await supabase
      .from('candidates')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Database error updating candidate ${id} status: ${error.message}`);
    }
    return data;
  }

  async updateStatusMany(ids: number[], status: PipelineStage | string): Promise<Candidate[]> {
    if (ids.length === 0) return [];

    const { data, error } = await supabase
      .from('candidates')
      .update({ status })
      .in('id', ids)
      .select();

    if (error) {
      throw new Error(`Database error bulk-updating candidate statuses: ${error.message}`);
    }
    return data ?? [];
  }

  async update(id: number, patch: UpdateCandidateData): Promise<Candidate> {
    const { data, error } = await supabase
      .from('candidates')
      .update(patch)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Database error updating candidate ${id}: ${error.message}`);
    }
    return data;
  }

  async updateByEmail(email: string, patch: UpdateCandidateData): Promise<number[]> {
    const { data, error } = await supabase
      .from('candidates')
      .update(patch)
      .ilike('email', email)
      .select('id');

    if (error) {
      throw new Error(`Database error updating candidate by email: ${error.message}`);
    }
    return (data ?? []).map((row) => row.id);
  }

  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('candidates')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Database error deleting candidate ${id}: ${error.message}`);
    }
  }

  async deleteAll(): Promise<void> {
    const { error } = await supabase
      .from('candidates')
      .delete()
      .not('id', 'is', null);

    if (error) {
      throw new Error(`Database error clearing candidate table: ${error.message}`);
    }
  }
}
