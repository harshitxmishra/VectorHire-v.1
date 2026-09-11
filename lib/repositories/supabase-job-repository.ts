import { supabase } from '@/lib/supabase/client';
import { JobDescription } from '@/lib/types';
import {
  JobRepository,
  CreateJobData,
  UpdateJobData,
} from './job-repository';

export class SupabaseJobRepository implements JobRepository {
  async findAll(): Promise<JobDescription[]> {
    const { data, error } = await supabase
      .from('job_descriptions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Database error fetching job descriptions: ${error.message}`);
    }
    return data ?? [];
  }

  async findById(id: number): Promise<JobDescription | null> {
    const { data, error } = await supabase
      .from('job_descriptions')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(`Database error fetching job description ${id}: ${error.message}`);
    }
    return data;
  }

  async create(input: CreateJobData): Promise<JobDescription> {
    const { data, error } = await supabase
      .from('job_descriptions')
      .insert(input)
      .select()
      .single();

    if (error) {
      throw new Error(`Database error creating job description: ${error.message}`);
    }
    return data;
  }

  async update(id: number, input: UpdateJobData): Promise<JobDescription> {
    const { data, error } = await supabase
      .from('job_descriptions')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Database error updating job description ${id}: ${error.message}`);
    }
    return data;
  }

  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('job_descriptions')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Database error deleting job description ${id}: ${error.message}`);
    }
  }
}
