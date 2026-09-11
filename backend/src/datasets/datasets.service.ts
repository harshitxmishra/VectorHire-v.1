import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { getDatasetUploads, recordDatasetUpload, deleteAllCandidates } from '@/lib/services/dataset-service';
import { DatasetUpload } from '@/lib/types';

@Injectable()
export class DatasetsService {
  async getDatasets(): Promise<DatasetUpload[]> {
    try {
      return await getDatasetUploads();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load datasets';
      throw new InternalServerErrorException(message);
    }
  }

  async recordUpload(input: {
    dataset_name: string;
    uploaded_by: string | null;
    mode: 'replace' | 'append';
    total_candidates: number;
  }): Promise<DatasetUpload> {
    try {
      return await recordDatasetUpload(input);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to record dataset upload';
      throw new InternalServerErrorException(message);
    }
  }

  async clearCandidates(): Promise<void> {
    try {
      await deleteAllCandidates();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to clear candidates';
      throw new InternalServerErrorException(message);
    }
  }
}
