import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { QueueModule } from '../queue/queue.module';
import { AiEvaluationWorker } from '../queue/ai/ai-evaluation.worker';

@Module({
  imports: [QueueModule],
  controllers: [AiController],
  providers: [AiService, AiEvaluationWorker],
  exports: [AiService],
})
export class AiModule {}
