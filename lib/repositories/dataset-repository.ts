import { DatasetUpload } from '@/lib/types';

export type DatasetMode = 'replace' | 'append';

export interface CreateDatasetUploadData {
  dataset_name: string;
  uploaded_by: string | null;
  mode: DatasetMode;
  total_candidates: number;
}

export interface DatasetRepository {
  findAll(): Promise<DatasetUpload[]>;
  findById(id: number): Promise<DatasetUpload | null>;
  create(data: CreateDatasetUploadData): Promise<DatasetUpload>;
}
