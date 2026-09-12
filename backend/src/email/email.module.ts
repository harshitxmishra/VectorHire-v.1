import { Module } from '@nestjs/common';
import { EmailController } from './email.controller';
import { EmailService } from './email.service';
import { EMAIL_LOG_REPOSITORY } from './email.constants';
import { CANDIDATE_REPOSITORY } from '../candidates/candidates.constants';
import { SupabaseEmailLogRepository } from '@/lib/repositories/supabase-email-log-repository';
import { SupabaseCandidateRepository } from '@/lib/repositories/supabase-candidate-repository';
import { QueueModule } from '../queue/queue.module';
import { EmailWorker } from '../queue/email/email.worker';

@Module({
  imports: [QueueModule],
  controllers: [EmailController],
  providers: [
    EmailService,
    EmailWorker,
    {
      provide: EMAIL_LOG_REPOSITORY,
      useClass: SupabaseEmailLogRepository,
    },
    {
      provide: CANDIDATE_REPOSITORY,
      useClass: SupabaseCandidateRepository,
    },
  ],
  exports: [EmailService],
})
export class EmailModule {}
