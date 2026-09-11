import { Module, Global } from '@nestjs/common';
import { TimelineController } from './timeline.controller';
import { TimelineService } from './timeline.service';
import { TIMELINE_REPOSITORY } from './timeline.constants';
import { SupabaseTimelineRepository } from '@/lib/repositories/supabase-timeline-repository';

@Global()
@Module({
  controllers: [TimelineController],
  providers: [
    TimelineService,
    {
      provide: TIMELINE_REPOSITORY,
      useClass: SupabaseTimelineRepository,
    },
  ],
  exports: [TimelineService, TIMELINE_REPOSITORY],
})
export class TimelineModule {}
