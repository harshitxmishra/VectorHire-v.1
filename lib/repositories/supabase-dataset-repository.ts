import { supabase } from '@/lib/supabase/client';
import { DatasetUpload } from '@/lib/types';
import {
  DatasetRepository,
  CreateDatasetUploadData,
  AtomicDatasetImportInput,
  AtomicDatasetImportResult,
} from './dataset-repository';

export class SupabaseDatasetRepository implements DatasetRepository {
  async findAll(): Promise<DatasetUpload[]> {
    const { data, error } = await supabase
      .from('dataset_uploads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Database error fetching dataset uploads: ${error.message}`);
    }

    return data ?? [];
  }

  async findById(id: number): Promise<DatasetUpload | null> {
    const { data, error } = await supabase
      .from('dataset_uploads')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(`Database error fetching dataset upload ${id}: ${error.message}`);
    }

    return data;
  }

  async create(input: CreateDatasetUploadData): Promise<DatasetUpload> {
    const { data, error } = await supabase
      .from('dataset_uploads')
      .insert({
        dataset_name: input.dataset_name,
        uploaded_by: input.uploaded_by,
        mode: input.mode,
        total_candidates: input.total_candidates,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Database error creating dataset upload record: ${error.message}`);
    }

    return data;
  }

  async importAtomic(input: AtomicDatasetImportInput): Promise<AtomicDatasetImportResult> {
    if (!input.candidates || input.candidates.length === 0) {
      throw new Error('Candidates list cannot be empty for atomic import');
    }

    const { data, error } = await supabase.rpc('import_dataset_atomic', {
      p_dataset_name: input.dataset_name,
      p_uploaded_by: input.uploaded_by,
      p_mode: input.mode,
      p_candidates: input.candidates,
    });

    if (error) {
      throw new Error(`Database error during atomic dataset import: ${error.message}`);
    }

    return data as AtomicDatasetImportResult;
  }
}
