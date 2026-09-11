import { Module } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { JOB_REPOSITORY } from './jobs.constants';
import { SupabaseJobRepository } from '@/lib/repositories/supabase-job-repository';

@Module({
  controllers: [JobsController],
  providers: [
    JobsService,
    {
      provide: JOB_REPOSITORY,
      useClass: SupabaseJobRepository,
    },
  ],
  exports: [JobsService, JOB_REPOSITORY],
})
export class JobsModule {}
