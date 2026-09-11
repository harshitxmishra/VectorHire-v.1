import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { TimelineService } from './timeline.service';

@Controller('candidates/:id/timeline')
export class TimelineController {
  constructor(private readonly timelineService: TimelineService) {}

  @Get()
  async getTimeline(@Param('id', ParseIntPipe) id: number) {
    return this.timelineService.findByCandidateId(id);
  }
}
