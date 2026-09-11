import { Module } from '@nestjs/common';
import { QueueService } from './queue.service';
import { DemonstratorWorker } from './demonstrator/demonstrator.worker';

@Module({
  providers: [QueueService, DemonstratorWorker],
  exports: [QueueService],
})
export class QueueModule {}
