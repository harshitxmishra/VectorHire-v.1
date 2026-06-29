import { supabase } from '@/lib/supabase/client';
import { JobDescription } from '@/lib/types';

export async function getJobDescriptions(): Promise<JobDescription[]> {
  const { data, error } = await supabase
    .from('job_descriptions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function createJobDescription(input: {
  title: string;
  requirements: string;
}): Promise<JobDescription> {
  const { data, error } = await supabase
    .from('job_descriptions')
    .insert(input)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function updateJobDescription(
  id: number,
  input: { title: string; requirements: string }
): Promise<JobDescription> {
  const { data, error } = await supabase
    .from('job_descriptions')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function deleteJobDescription(id: number) {
  const { error } = await supabase.from('job_descriptions').delete().eq('id', id);

  if (error) {
    throw new Error(error.message);
  }
}
