import { Module } from '@nestjs/common';
import { MatchingController } from './matching.controller';
import { MatchingService } from './matching.service';
import { JOB_MATCH_REPOSITORY } from './matching.constants';
import { CANDIDATE_REPOSITORY } from '../candidates/candidates.constants';
import { JOB_REPOSITORY } from '../jobs/jobs.constants';
import { TIMELINE_REPOSITORY } from '../timeline/timeline.constants';
import { SupabaseJobMatchRepository } from '@/lib/repositories/supabase-job-match-repository';
import { SupabaseCandidateRepository } from '@/lib/repositories/supabase-candidate-repository';
import { SupabaseJobRepository } from '@/lib/repositories/supabase-job-repository';
import { SupabaseTimelineRepository } from '@/lib/repositories/supabase-timeline-repository';

@Module({
  controllers: [MatchingController],
  providers: [
    MatchingService,
    {
      provide: JOB_MATCH_REPOSITORY,
      useClass: SupabaseJobMatchRepository,
    },
    {
      provide: CANDIDATE_REPOSITORY,
      useClass: SupabaseCandidateRepository,
    },
    {
      provide: JOB_REPOSITORY,
      useClass: SupabaseJobRepository,
    },
    {
      provide: TIMELINE_REPOSITORY,
      useClass: SupabaseTimelineRepository,
    },
  ],
  exports: [MatchingService],
})
export class MatchingModule {}
