import { DatasetUpload } from '@/lib/types';
import {
  DatasetRepository,
  CreateDatasetUploadData,
  AtomicDatasetImportInput,
  AtomicDatasetImportResult,
} from '@/lib/repositories/dataset-repository';
import { SupabaseDatasetRepository } from '@/lib/repositories/supabase-dataset-repository';
import { CandidateRepository } from '@/lib/repositories/candidate-repository';
import { SupabaseCandidateRepository } from '@/lib/repositories/supabase-candidate-repository';

const defaultDatasetRepository = new SupabaseDatasetRepository();
const defaultCandidateRepository = new SupabaseCandidateRepository();

export async function getDatasetUploads(
  repo: DatasetRepository = defaultDatasetRepository
): Promise<DatasetUpload[]> {
  return repo.findAll();
}

export async function recordDatasetUpload(
  input: CreateDatasetUploadData,
  repo: DatasetRepository = defaultDatasetRepository
): Promise<DatasetUpload> {
  return repo.create(input);
}

export async function deleteAllCandidates(
  candidateRepo: CandidateRepository = defaultCandidateRepository
): Promise<void> {
  await candidateRepo.deleteAll();
}

export async function importDatasetAtomic(
  input: AtomicDatasetImportInput,
  repo: DatasetRepository = defaultDatasetRepository
): Promise<AtomicDatasetImportResult> {
  return repo.importAtomic(input);
}
