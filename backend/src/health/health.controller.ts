import { Controller, Get, Inject, Optional } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { QueueService } from '../queue/queue.service';

@Controller('health')
export class HealthController {
  constructor(
    @Optional()
    @Inject(QueueService)
    private readonly queueService?: QueueService
  ) {}

  @Public()
  @Get()
  async getHealth() {
    const redisHealth = this.queueService
      ? await this.queueService.isRedisHealthy()
      : { status: 'unreachable' as const };

    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      redis: {
        status: redisHealth.status,
      },
    };
  }
}
