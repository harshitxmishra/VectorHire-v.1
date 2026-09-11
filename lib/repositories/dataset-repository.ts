import { DatasetUpload } from '@/lib/types';
import { CreateCandidateData } from './candidate-repository';

export type DatasetMode = 'replace' | 'append';

export interface CreateDatasetUploadData {
  dataset_name: string;
  uploaded_by: string | null;
  mode: DatasetMode;
  total_candidates: number;
}

export interface AtomicDatasetImportInput {
  dataset_name: string;
  uploaded_by: string | null;
  mode: DatasetMode;
  candidates: CreateCandidateData[];
}

export interface AtomicDatasetImportResult {
  dataset_id: number;
  dataset_name: string;
  mode: DatasetMode;
  total_candidates: number;
  success: boolean;
}

export interface DatasetRepository {
  findAll(): Promise<DatasetUpload[]>;
  findById(id: number): Promise<DatasetUpload | null>;
  create(data: CreateDatasetUploadData): Promise<DatasetUpload>;
  importAtomic(input: AtomicDatasetImportInput): Promise<AtomicDatasetImportResult>;
}
