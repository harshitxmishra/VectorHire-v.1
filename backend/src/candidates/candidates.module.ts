import { Module } from '@nestjs/common';
import { CandidatesController } from './candidates.controller';
import { CandidatesService } from './candidates.service';
import { CANDIDATE_REPOSITORY } from './candidates.constants';
import { SupabaseCandidateRepository } from '@/lib/repositories/supabase-candidate-repository';

@Module({
  controllers: [CandidatesController],
  providers: [
    CandidatesService,
    {
      provide: CANDIDATE_REPOSITORY,
      useClass: SupabaseCandidateRepository,
    },
  ],
  exports: [CandidatesService, CANDIDATE_REPOSITORY],
})
export class CandidatesModule {}
