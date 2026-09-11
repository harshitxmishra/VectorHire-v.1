import { supabase } from '@/lib/supabase/client';
import { Interview } from '@/lib/types';
import {
  InterviewRepository,
  CreateInterviewData,
  UpdateInterviewData,
} from './interview-repository';

export class SupabaseInterviewRepository implements InterviewRepository {
  async findAll(): Promise<Interview[]> {
    const { data, error } = await supabase
      .from('interviews')
      .select('*, candidates(full_name, email)')
      .order('scheduled_date', { ascending: true });

    if (error) {
      throw new Error(`Database error fetching interviews: ${error.message}`);
    }
    return data ?? [];
  }

  async findById(id: number): Promise<Interview | null> {
    const { data, error } = await supabase
      .from('interviews')
      .select('*, candidates(full_name, email)')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(`Database error fetching interview ${id}: ${error.message}`);
    }
    return data;
  }

  async create(input: CreateInterviewData): Promise<Interview> {
    const { data, error } = await supabase
      .from('interviews')
      .insert(input)
      .select('*, candidates(full_name, email)')
      .single();

    if (error) {
      throw new Error(`Database error creating interview: ${error.message}`);
    }
    return data;
  }

  async updateStatus(id: number, status: 'completed' | 'cancelled'): Promise<Interview> {
    const { data, error } = await supabase
      .from('interviews')
      .update({ status })
      .eq('id', id)
      .select('*, candidates(full_name, email)')
      .single();

    if (error) {
      throw new Error(`Database error updating interview ${id} status: ${error.message}`);
    }
    return data;
  }

  async update(id: number, input: UpdateInterviewData): Promise<Interview> {
    const { data, error } = await supabase
      .from('interviews')
      .update(input)
      .eq('id', id)
      .select('*, candidates(full_name, email)')
      .single();

    if (error) {
      throw new Error(`Database error updating interview ${id}: ${error.message}`);
    }
    return data;
  }

  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('interviews')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Database error deleting interview ${id}: ${error.message}`);
    }
  }
}
