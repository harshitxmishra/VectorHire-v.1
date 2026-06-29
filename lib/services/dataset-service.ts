import { supabase } from '@/lib/supabase/client';
import { DatasetUpload } from '@/lib/types';

export async function getDatasetUploads(): Promise<DatasetUpload[]> {
  const { data, error } = await supabase
    .from('dataset_uploads')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function recordDatasetUpload(input: {
  dataset_name: string;
  uploaded_by: string | null;
  mode: 'replace' | 'append';
  total_candidates: number;
}): Promise<DatasetUpload> {
  const { data, error } = await supabase
    .from('dataset_uploads')
    .insert(input)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function deleteAllCandidates() {
  const { error } = await supabase.from('candidates').delete().not('id', 'is', null);

  if (error) {
    throw new Error(error.message);
  }
}
