import { supabase } from '@/lib/supabase/client';
import { Candidate, PipelineStage } from '@/lib/types';
import {
  CandidateRepository,
  CandidateFilters,
  CreateCandidateData,
  UpdateCandidateData,
} from './candidate-repository';

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
      query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
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
