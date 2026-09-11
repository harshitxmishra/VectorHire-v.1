import { Module } from '@nestjs/common';
import { DatasetsController } from './datasets.controller';
import { DatasetsService } from './datasets.service';
import { DATASET_REPOSITORY } from './datasets.constants';
import { CANDIDATE_REPOSITORY } from '../candidates/candidates.constants';
import { SupabaseDatasetRepository } from '@/lib/repositories/supabase-dataset-repository';
import { SupabaseCandidateRepository } from '@/lib/repositories/supabase-candidate-repository';

@Module({
  controllers: [DatasetsController],
  providers: [
    DatasetsService,
    {
      provide: DATASET_REPOSITORY,
      useClass: SupabaseDatasetRepository,
    },
    {
      provide: CANDIDATE_REPOSITORY,
      useClass: SupabaseCandidateRepository,
    },
  ],
  exports: [DatasetsService],
})
export class DatasetsModule {}
