import { Module } from '@nestjs/common';
import { InterviewsController } from './interviews.controller';
import { InterviewsService } from './interviews.service';
import { INTERVIEW_REPOSITORY } from './interviews.constants';
import { SupabaseInterviewRepository } from '@/lib/repositories/supabase-interview-repository';
import { CANDIDATE_REPOSITORY } from '../candidates/candidates.constants';
import { SupabaseCandidateRepository } from '@/lib/repositories/supabase-candidate-repository';

@Module({
  controllers: [InterviewsController],
  providers: [
    InterviewsService,
    {
      provide: INTERVIEW_REPOSITORY,
      useClass: SupabaseInterviewRepository,
    },
    {
      provide: CANDIDATE_REPOSITORY,
      useClass: SupabaseCandidateRepository,
    },
  ],
  exports: [InterviewsService, INTERVIEW_REPOSITORY],
})
export class InterviewsModule {}
