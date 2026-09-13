import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { TimelineService } from './timeline.service';

@Controller('candidates/:id/timeline')
export class TimelineController {
  constructor(private readonly timelineService: TimelineService) {}

  @Get()
  async getTimeline(@Param('id', ParseIntPipe) id: number) {
    return this.timelineService.findByCandidateId(id);
  }
}

@Controller('timeline')
export class TimelineFeedController {
  constructor(private readonly timelineService: TimelineService) {}

  @Get('recent')
  async getRecentTimeline(@Query('limit') limit?: string) {
    const parsedLimit = limit ? Math.min(100, Math.max(1, Number(limit))) : 20;
    return this.timelineService.findRecent(parsedLimit);
  }
}
