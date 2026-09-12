import { Controller, Get, Inject, Optional } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { QueueService, SystemQueueMetrics } from '../queue/queue.service';

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
    let redisStatus: 'ok' | 'unreachable' = 'unreachable';
    let queueMetrics: SystemQueueMetrics | null = null;

    if (this.queueService) {
      try {
        const redisHealth = await this.queueService.isRedisHealthy();
        if (redisHealth.status === 'healthy') {
          redisStatus = 'ok';
          queueMetrics = await this.queueService.getSystemQueueMetrics();
        } else {
          redisStatus = 'unreachable';
        }
      } catch {
        redisStatus = 'unreachable';
        queueMetrics = null;
      }
    }

    const isHealthy = redisStatus === 'ok';

    return {
      status: isHealthy ? 'ok' : 'degraded',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      redis: {
        status: redisStatus,
      },
      queues: isHealthy ? queueMetrics : null,
    };
  }
}
