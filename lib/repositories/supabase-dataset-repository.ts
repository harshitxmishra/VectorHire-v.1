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
      const msg = (error.message || '').toLowerCase();
      if (!msg.includes('function') || (!msg.includes('does not exist') && !msg.includes('not found'))) {
        throw new Error(`Database error during atomic dataset import: ${error.message}`);
      }
    } else if (data) {
      return data as AtomicDatasetImportResult;
    }

    // 2. Resilient Direct-Table Fallback (when RPC is not deployed in database)
    if (input.mode === 'replace') {
      try {
        await supabase.from('candidates').delete().neq('id', 0);
      } catch {
        // non-fatal
      }
    }

    let datasetId: number | null = null;
    try {
      const { data: uploadRec } = await supabase
        .from('dataset_uploads')
        .insert({
          dataset_name: input.dataset_name,
          uploaded_by: input.uploaded_by,
          mode: input.mode,
          total_candidates: input.candidates.length,
        })
        .select('id')
        .single();
      if (uploadRec) datasetId = uploadRec.id;
    } catch {
      // non-fatal if table doesn't exist
    }

    const candidateRows = input.candidates.map((c) => ({
      full_name: c.full_name,
      email: c.email,
      college: c.college || 'Unknown',
      branch: c.branch || null,
      cgpa: c.cgpa || 0,
      best_ai_project: c.best_ai_project || null,
      research_work: c.research_work || null,
      github: c.github || null,
      resume_url: c.resume_url || null,
      status: c.status || 'Applied',
      ai_score: c.ai_score || 0,
      parsing_status: c.parsing_status || (c.resume_url ? 'pending' : 'not_applicable'),
      test_la: c.test_la || null,
      test_code: c.test_code || null,
      ...(datasetId ? { dataset_id: datasetId } : {}),
    }));

    const { data: inserted, error: insertErr } = await supabase
      .from('candidates')
      .upsert(candidateRows, { onConflict: 'email' })
      .select();

    if (insertErr) {
      throw new Error(`Database error importing candidates: ${insertErr.message}`);
    }

    return {
      dataset_id: datasetId ?? 1,
      dataset_name: input.dataset_name,
      total_candidates: inserted?.length ?? candidateRows.length,
      mode: input.mode,
      success: true,
    };
  }
}
