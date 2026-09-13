import {
  Injectable,
  Inject,
  InternalServerErrorException,
} from '@nestjs/common';
import { DatasetUpload } from '@/lib/types';
import { DATASET_REPOSITORY } from './datasets.constants';
import { CANDIDATE_REPOSITORY } from '../candidates/candidates.constants';
import {
  DatasetRepository,
  CreateDatasetUploadData,
  AtomicDatasetImportInput,
  AtomicDatasetImportResult,
} from '@/lib/repositories/dataset-repository';
import { CandidateRepository } from '@/lib/repositories/candidate-repository';

@Injectable()
export class DatasetsService {
  constructor(
    @Inject(DATASET_REPOSITORY)
    private readonly datasetRepo: DatasetRepository,
    @Inject(CANDIDATE_REPOSITORY)
    private readonly candidateRepo: CandidateRepository,
  ) {}

  async getDatasets(): Promise<DatasetUpload[]> {
    try {
      return await this.datasetRepo.findAll();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load datasets';
      throw new InternalServerErrorException(message);
    }
  }

  async recordUpload(input: CreateDatasetUploadData): Promise<DatasetUpload> {
    try {
      return await this.datasetRepo.create(input);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to record dataset upload';
      throw new InternalServerErrorException(message);
    }
  }

  async clearCandidates(): Promise<void> {
    try {
      await this.candidateRepo.deleteAll();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to clear candidates';
      throw new InternalServerErrorException(message);
    }
  }

  async importDatasetAtomic(input: AtomicDatasetImportInput): Promise<AtomicDatasetImportResult> {
    try {
      return await this.datasetRepo.importAtomic(input);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to execute atomic dataset import';
      throw new InternalServerErrorException(message);
    }
  }
}
